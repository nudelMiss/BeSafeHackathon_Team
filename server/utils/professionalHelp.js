export function buildProfessionalHelp(parsed, context) {
  const risk = parsed?.riskLevel; // "נמוך" | "בינוני" | "גבוה"
  const category = (parsed?.category || "").trim();

  const isHigh = risk === "גבוה";
  const isMedium = risk === "בינוני";

  // ✅ feelings from context (Hebrew chips)
  const feelings = Array.isArray(context?.feelings) ? context.feelings : [];

  const hasUrgentFeeling = feelings.some((f) => ["פחד", "סכנה", "חרדה"].includes(f));
  const hasEmotionalDistress = feelings.some((f) => ["עצב", "כעס", "מבולבלת"].includes(f));
  const isCalm = feelings.some((f) => ["רגועה", "תקווה"].includes(f));

  const resources = [];
  const addUnique = (name, details) => {
    if (!resources.some((r) => r.name === name)) {
      resources.push({ name, details });
    }
  };

  const cat = category.replace(/\s+/g, "");

  // ✅ category-based resources
  if (["גרומינג", "לחץמיני", "הטרדה"].some((k) => cat.includes(k))) {
    addUnique("מוקד 105 – המטה הלאומי להגנה על ילדים ברשת", "105");
    addUnique('ער״ן – עזרה ראשונה נפשית', "1201 (24/7, אנונימי)");
    if (isHigh) addUnique("משטרה (במקרה חירום)", "100");
  } else if (cat.includes("איום") || cat.includes("סחיטה")) {
    if (isHigh) addUnique("משטרה (במקרה חירום)", "100");
    addUnique("מוקד 105 – דיווח ופגיעה ברשת", "105");
    addUnique('ער״ן – עזרה ראשונה נפשית', "1201 (24/7, אנונימי)");
  } else {
    addUnique('ער״ן – עזרה ראשונה נפשית', "1201 (24/7, אנונימי)");
    addUnique("מוקד 105 – אם מדובר בפגיעה ברשת", "105");
    if (isHigh) addUnique("משטרה (במקרה חירום)", "100");
  }

  // ✅ Reorder resources: 
  if (hasUrgentFeeling || hasEmotionalDistress) {
    resources.sort((a, b) => {
      const aIsEran = a.name.includes('ער״ן');
      const bIsEran = b.name.includes('ער״ן');
      return (bIsEran ? 1 : 0) - (aIsEran ? 1 : 0);
    });
  }

  // ✅ message tuned by feelings + risk
  let message;
  if (hasUrgentFeeling || isHigh) {
    message =
      "מה שאת מתארת נשמע לא פשוט, ואם את מרגישה לא בטוחה — חשוב לפנות עכשיו לגורם מקצועי. את לא לבד 💜";
  } else if (hasEmotionalDistress || isMedium) {
    message =
      "אם זה ממשיך או משפיע עליך רגשית, שווה לערב גורם מקצועי או מבוגר אחראי. את לא צריכה להתמודד עם זה לבד 💜";
  } else if (isCalm) {
    message =
      "אם תרצי רק להתייעץ או לקבל תמיכה נוספת — אפשר לפנות גם לגורם מקצועי. אני כאן איתך 💜";
  } else {
    message =
      "אם תרצי תמיכה או התייעצות — אפשר לפנות לגורם מקצועי. את לא לבד 💜";
  }

  return { message, resources };
}
