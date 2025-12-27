import { getOpenAIClient } from "./openAI.js";

export const analyzeMessage = async (req, res) => {
  try {
    const { messageText, context } = req.body;

    if (!messageText || !context) {
      return res.status(400).json({ responseText: "חסר messageText או context" });
    }

    const openai = getOpenAIClient();

    const systemPrompt = `
את עוזרת דיגיטלית לבטיחות ברשת.
החזירי JSON בלבד בפורמט:
{
  "riskLevel": "low" | "medium" | "high",
  "category": "harassment" | "manipulation" | "spam" | "unclear" | "safe",
  "responseText": "string",
  "why": ["string", "string"]
}
responseText: 2–3 משפטים בעברית, בטון אסרטיבי-מכבד.
why: 2–4 נקודות קצרות.
`.trim();

    const userPrompt = `
messageText:
"""${messageText}"""

context:
${JSON.stringify(context)}
`.trim();

    const ai = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    });

    const raw = ai.output_text?.trim() || "";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(200).json({ responseText: raw || "לא הצלחתי לנתח כרגע." });
    }

    return res.status(200).json({
      responseText: parsed.responseText,
      riskLevel: parsed.riskLevel,
      category: parsed.category,
      why: parsed.why,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ responseText: "שגיאה בשרת בזמן ניתוח ההודעה" });
  }
};
