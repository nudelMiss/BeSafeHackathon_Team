import express from "express";
// const express = require("express");
// const router = express.Router();

// router.post("/", (req, res) => {
//   const { messageText, context } = req.body;

//   if (!messageText) {
//     return res.status(400).json({ error: "messageText is required" });
//   }

//   // hard-coded responses
//   const responses = {
//     scared: {
//       riskLevel: "High",
//       category: "Grooming",
//       explanation:
//         "ההודעה כוללת ניסיון ליצירת קשר פרטי, בקשה לסודיות ומחמאות שמטרתן לבנות אמון.",
//       replyOptions: {
//         gentle: "לא נוח לי עם השיחה הזו, אני מעדיפה להפסיק כאן.",
//         assertive: "תפסיק לפנות אליי. אני חוסמת ומדווחת.",
//         noReply: "לא להגיב, לחסום ולדווח."
//       },
//       supportLine: "זה לא באשמתך. פנית לעזרה וזה צעד חזק ונכון."
//     }
//   };

//   const result =
//     responses[context?.feeling] ??
//     {
//       riskLevel: "Low",
//       category: "Other",
//       explanation: "לא זוהתה סכנה מיידית.",
//       replyOptions: {
//         gentle: "אני מעדיפה לא להמשיך את השיחה.",
//         assertive: "בבקשה תכבד גבולות.",
//         noReply: "לא להגיב."
//       },
//       supportLine: "את לא לבד."
//     };

//   res.json(result);
// });

// export default router;

// const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  const { messageText, context } = req.body;

  if (!messageText) {
    return res.status(400).json({ error: "messageText is required" });
  }

  const responses = {
    scared: {
      riskLevel: "High",
      category: "Grooming",
      explanation:
        "ההודעה כוללת ניסיון ליצירת קשר פרטי, בקשה לסודיות ומחמאות שמטרתן לבנות אמון.",
      replyOptions: {
        gentle: "לא נוח לי עם השיחה הזו, אני מעדיפה להפסיק כאן.",
        assertive: "תפסיק לפנות אליי. אני חוסמת ומדווחת.",
        noReply: "לא להגיב, לחסום ולדווח.",
      },
      supportLine: "זה לא באשמתך. פנית לעזרה וזה צעד חזק ונכון.",
    },
  };

  const result =
    responses[context?.feeling] ?? {
      riskLevel: "Low",
      category: "Other",
      explanation: "לא זוהתה סכנה מיידית.",
      replyOptions: {
        gentle: "אני מעדיפה לא להמשיך את השיחה.",
        assertive: "בבקשה תכבד גבולות.",
        noReply: "לא להגיב.",
      },
      supportLine: "את לא לבד.",
    };

  res.json(result);
});

export default router;