import { getOpenAIClient } from "./openAI.js";
import crypto from "crypto";
import { addReport, getReportsByUser } from "../services/reportStore.js";

export const analyzeMessage = async (req, res) => {
  try {
    const { user, messageText, context } = req.body;

    if (!messageText || !context) {
      return res.status(400).json({
        responseText: "חסר messageText או context",
      });
    }

    if (!user?.id) {
      return res.status(400).json({
        responseText: "חסר user.id",
      });
    }

    // Advanced context: export history (for tone adjustment from second message)
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
נתון: messageText + context { channel: "private"|"group", senderType: "stranger"|"known", feeling: string }.

החזירי JSON בלבד (בלי טקסט מסביב, בלי markdown) בפורמט המדויק:
{
  "riskLevel": "Low" | "Medium" | "High",
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
- riskLevel:
  - High: סודיות, מניפולציה, בקשות לתוכן אינטימי, איומים, סחיטה או גרומינג ברור.
  - Medium: לחץ, חציית גבולות, הטרדה מתמשכת, תוכן מיני מרומז או התנהגות מטרידה.
  - Low: חוסר נעימות, שיימינג, עקיצות או שיפוטיות ללא איום ישיר.
- category: תווית קצרה באנגלית ב-CamelCase (למשל: Grooming, SexualPressure, Shaming, Harassment, Threat, Spam, Other).
- explanation: 1–2 משפטים בעברית שמסבירים למה זה מסוכן/בעייתי, ללא הטפה.
- replyOptions:
  - gentle: משפט אחד מכבד שמציב גבול.
  - assertive: משפט אחד חד וברור.
  - noReply: הנחיה קצרה מה לעשות בלי להגיב (לדוגמה: "לא להגיב, לחסום ולדווח.").
- supportLine: משפט תמיכה קצר בעברית.
- התאימי את הניסוח ל-feeling (למשל scared / pressured / embarrassed).

אם אין סכנה ברורה:
- riskLevel = "Low"
- category = "Other"
- explanation = "לא זוהתה סכנה מיידית, אך מומלץ לשמור על גבולות ופרטיות."
- עדיין למלא replyOptions ו-supportLine.

${toneInstruction}
`.trim();

    const userPrompt = `
messageText:
"""${messageText}"""

context:
${JSON.stringify(context)}

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

    const report = {
      id: crypto.randomUUID(),
      userId: user.id,
      nickname: user.nickname || null,
      messageText,
      context,
      analysis: parsed,
      createdAt: new Date().toISOString().replace("T", " ").split(".")[0],
    };

    try {
      await addReport(report);
    } catch (e) {
      console.error("Failed to save report:", e);
    }

    return res.status(200).json(parsed);
  } catch (error) {
    console.error("Analyze error:", error);
    return res.status(500).json({
      responseText: "שגיאה בשרת בזמן ניתוח ההודעה",
    });
  }
};
