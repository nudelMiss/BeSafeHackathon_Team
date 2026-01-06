import { getOpenAIClient } from "./openAI.js";
import {buildResponsibleAdultEmail} from "../utils/buildResponsibleAdultEmail.js";
import {sendResponsibleAdultEmail} from "../services/ResponsibleAdultEmailService.js";

export const analyzeMessage = async (req, res) => {
  try {
    const { messageText, context, ResponsibleAdultEmail } = req.body;

    if (!messageText || !context) {
      return res.status(400).json({
        responseText: "חסר messageText או context",
      });
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
`.trim();

    const userPrompt = `
messageText:
"""${messageText}"""

context:
${JSON.stringify(context)}
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

      let report = false;
      const shouldReport = ResponsibleAdultEmail && parsed.riskLevel === "High";

      if (shouldReport) {
          try {
              const emailContent = buildResponsibleAdultEmail(parsed, context.nickName || "המשתמשת");
              await sendResponsibleAdultEmail(ResponsibleAdultEmail, emailContent.body)
              report = {sent : true} ;
          } catch (error) {
              console.error("Failed to send responsible adult email: " , error);
              report = { sent: false, error: error.message };
          }
      }

      return res.status(200).json({...parsed, report});
    
  } catch (error) {
    console.error("Analyze error:", error);
    return res.status(500).json({
      responseText: "שגיאה בשרת בזמן ניתוח ההודעה",
    });
  }
};
