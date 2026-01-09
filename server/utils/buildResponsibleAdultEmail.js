
export function buildResponsibleAdultEmail(analysisResults, userName) {
    const subject = "BeSafe – התראה בטיחותית בנוגע למשתמשת";

    const body = `
שלום רב,

הודעה זו נשלחה אליך בעקבות זיהוי אוטומטי של תוכן שעלול להצביע על סיכון ל${userName} בהקשר של בטיחות ברשת.

רמת סיכון: ${analysisResults.riskLevel}
קטגוריה: ${analysisResults.category}

הסבר:
${analysisResults.explanation}

המלצה:
${analysisResults.supportLine}

מומלץ לשוחח עם ${userName} ולבחון האם נדרשת פנייה לגורם מקצועי או מבוגר אחראי נוסף.

הודעה זו נשלחה בהסכמת ${userName} כחלק ממנגנון בטיחות.

בברכה,  
צוות My Digital Sister
`.trim();

    return { subject, body };
}