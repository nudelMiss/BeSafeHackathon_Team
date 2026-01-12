import { getOpenAIClient } from "./openAI.js";
import crypto from "crypto";
import {
  addReport,
  getReportsByUser,
  getOrCreateUserByNickname,
} from "../services/reportStore.js";
import {buildResponsibleAdultEmail} from "../utils/buildResponsibleAdultEmail.js";
import {sendResponsibleAdultEmail} from "../services/ResponsibleAdultEmailService.js";

export const analyzeMessage = async (req, res) => {
  try {
    const { nickname, messageText, context, ResponsibleAdultEmail, extraContext } = req.body;

    if (!messageText || !context) {
      return res.status(400).json({ responseText: "חסר messageText או context" });
    }

    if (!nickname || typeof nickname !== "string" || !nickname.trim()) {
      return res.status(400).json({ responseText: "חסר nickname" });
    }

    // The client sends a nickname; the server resolves/creates a unique userId for it
    const user = await getOrCreateUserByNickname(nickname.trim()); // { id, nickname }

    // Minimal support for feelings[] (expects Hebrew context from the client)
    const feelings = Array.isArray(context?.feelings)
      ? context.feelings
          .filter((f) => typeof f === "string" && f.trim())
          .map((f) => f.trim())
      : [];

    const contextWithFeelings = {
      ...context,
      feelings,
    };

    // Load user history for tone adjustment (non-blocking)
    let reportCount = 0;
    let lastCategories = [];

    try {
      const previousReports = await getReportsByUser(user.id);
      reportCount = previousReports.length;
      lastCategories = previousReports
        .slice(-2)
        .map((r) => r?.analysis?.category)
        .filter(Boolean);
    } catch (e) {
      console.error("Failed to load history (non-blocking):", e);
    }

    // Tone adjustments based on history
    let toneInstruction = "";
    if (reportCount >= 1) {
      toneInstruction = `
הערה חשובה: זו אינה הפעם הראשונה שהמשתמשת משתמשת במערכת.
יש להתאים את התשובות כך שיהיו פחות מתנצלות ויותר ברורות ומגינות.
- gentle: עדיין מנומס, אבל מציב גבול חד.
- assertive: חד, קצר, לא משאיר מקום למשא ומתן.
- noReply: הנחיה פעולה ברורה (לחסום/לדווח/לשמור תיעוד).
- supportLine: משפט מחזק בסגנון "את לא אשמה / מותר לך לעצור את זה".
`.trim();
    }

    if (reportCount >= 3) {
      toneInstruction += `

נוסף: זוהה דפוס חוזר (כמה דיווחים קודמים).
מותר להיות חד-משמעית יותר ולהמליץ על צעדים ברורים (חסימה/דיווח/שיתוף אדם מבוגר/גורם אחראי אם מתאים).
`.trim();
    }

    const openai = getOpenAIClient();

    const systemPrompt = `
את עוזרת דיגיטלית לבטיחות ברשת.
נתון: messageText + context { channel: "פרטי"|"קבוצה", senderType: "זר"|"מוכר", feelings: string[] }.
שדה feelings הוא רשימת רגשות בעברית (יכול להיות רגש אחד או יותר).

החזירי JSON בלבד (בלי טקסט מסביב, בלי markdown) בפורמט המדויק:
{
  "riskLevel": "נמוך" | "בינוני" | "גבוה",
  "category": string,
  "explanation": string,
  "replyOptions": {
    "gentle": string,
    "assertive": string,
    "noReply": string
  },
  "supportLine": string
}

כללים:
- חשוב: יש להשתמש גם ב-context (פרטי/קבוצה, זר/מוכר, feelings) כדי לקבוע riskLevel,
  גם אם messageText קצר, מרומז או "לא נשמע" אלים/בוטה.

- riskLevel:
  - גבוה: סודיות, מניפולציה, בקשות לתוכן אינטימי, איומים, סחיטה או גרומינג ברור.
  - בינוני: לחץ, חציית גבולות, הטרדה מתמשכת, תוכן מיני מרומז או התנהגות מטרידה.
  - נמוך: חוסר נעימות, שיימינג, עקיצות או שיפוטיות ללא איום ישיר.

- category: תווית קצרה בעברית, אחת מהאפשרויות (או דומה מאוד):
  גרומינג, לחץ מיני, שיימינג, הטרדה, איום, ספאם, אחר

- explanation: 1–2 משפטים בעברית שמסבירים למה זה מסוכן/בעייתי, ללא הטפה.

- replyOptions:
  - gentle: משפט אחד מכבד שמציב גבול.
  - assertive: משפט אחד חד וברור.
  - noReply: הנחיה קצרה מה לעשות בלי להגיב (לדוגמה: "לא להגיב, לחסום ולדווח.").

- supportLine: משפט תמיכה קצר בעברית.

- התאימי את הניסוח לרגשות ב-feelings (למשל: מפוחדת / לחוצה / מובכת / לא נעים).
  אם יש כמה רגשות, התייחסי לרגש הדומיננטי (כמו מפוחדת/לחוצה) והשתמשי בשאר כדי לכוון את הטון.

אם אין סכנה ברורה:
- riskLevel = "נמוך"
- category = "אחר"
- explanation = "לא זוהתה סכנה מיידית, אך מומלץ לשמור על גבולות ופרטיות."
- עדיין למלא replyOptions ו-supportLine.

${toneInstruction}
`.trim();

    // Build the user prompt with messageText and optional extraContext
    let messageSection = `messageText:\n"""${messageText}"""`;
    
    // If extraContext is provided, attach it after the messageText as additional information
    if (extraContext && extraContext.trim()) {
      messageSection += `\n\nמידע נוסף על ההודעהשתמשת שיתפה:\n"""${extraContext.trim()}"""`;
    }
    
    const userPrompt = `
${messageSection}

context:
${JSON.stringify(contextWithFeelings)}

userHistorySummary:
{
  "reportCount": ${reportCount},
  "lastCategories": ${JSON.stringify(lastCategories)}
}
`.trim();

    const aiResponse = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    });

    const rawText = aiResponse.output_text?.trim() || "";

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return res.status(200).json({
        responseText: rawText || "לא הצלחתי לנתח את ההודעה כרגע.",
      });
    }


      let emailReport = null;
      // Backend returns Hebrew riskLevel: "גבוה" | "בינוני" | "נמוך"
      const shouldReport = ResponsibleAdultEmail && parsed.riskLevel === "גבוה";

      if (shouldReport) {
          try {
              const emailContent = buildResponsibleAdultEmail(parsed, user.nickname || "המשתמשת");
              await sendResponsibleAdultEmail(ResponsibleAdultEmail, emailContent.subject, emailContent.body)
              emailReport = {sent : true} ;
          } catch (error) {
              console.error("Failed to send responsible adult email: " , error);
              emailReport = { sent: false, error: error.message };
          }
      }
    
    const report = {
      id: crypto.randomUUID(),
      userId: user.id,
      nickname: user.nickname,
      messageText,
      context: contextWithFeelings,
      analysis: parsed,
      createdAt: new Date().toISOString().replace("T", " ").split(".")[0],
    };
    
    // Add extraContext only if provided
    if (extraContext && extraContext.trim()) {
      report.extraContext = extraContext.trim();
      console.log('✅ Saved extraContext in report:', report.extraContext);
    }

    try {
      await addReport(user.id, report);
    } catch (e) {
      console.error("Failed to save report:", e);
    }

    return res.status(200).json({
      ...parsed,
      userId: user.id,
      nickname: user.nickname,
      reportId: report.id,
      createdAt: report.createdAt,
      emailReport,
    });

  } catch (error) {
    console.error("Analyze error:", error);
    return res.status(500).json({
      responseText: "שגיאה בשרת בזמן ניתוח ההודעה",
    });
  }
};
