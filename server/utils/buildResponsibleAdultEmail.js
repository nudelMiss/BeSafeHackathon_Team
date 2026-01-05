
export function buildResponsibleAdultEmail(analysisResults) {
    const subject = "BeSafe – התראה בטיחותית בנוגע למשתמשת";

    const body = `
שלום,

הודעה זו נשלחה אליך בעקבות זיהוי אוטומטי של תוכן שעלול להצביע על סיכון למשתמשת בהקשר של בטיחות ברשת.

רמת סיכון: ${analysisResults.riskLevel}
קטגוריה: ${analysisResults.category}

הסבר:
${analysisResults.explanation}

המלצה כללית:
${analysisResults.supportLine}

מומלץ לשוחח עם המשתמשת ולבחון האם נדרשת פנייה לגורם מקצועי או מבוגר אחראי נוסף.

הודעה זו נשלחה בהסכמת המשתמשת כחלק ממנגנון בטיחות.

בברכה,  
My Digital Sister
`.trim();

    return { subject, body };
}