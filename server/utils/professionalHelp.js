export function buildProfessionalHelp(parsed, context) {
  const risk = parsed?.riskLevel; // "נמוך" | "בינוני" | "גבוה"
  const category = (parsed?.category || "").trim();

  const isHigh = risk === "גבוה";
  const isMedium = risk === "בינוני";

  const feelings = Array.isArray(context?.feelings) ? context.feelings : [];
  const hasUrgentFeeling = feelings.some((f) => ["פחד", "סכנה", "חרדה"].includes(f));
  const hasEmotionalDistress = feelings.some((f) => ["עצב", "כעס", "מבולבלת"].includes(f));
  const isCalm = feelings.some((f) => ["רגועה", "תקווה"].includes(f));

  const cat = category.replace(/\s+/g, "");

  // =========================
  // Decide show + urgency
  // =========================
  const show = isHigh || (isMedium && (hasUrgentFeeling || hasEmotionalDistress));
  const urgency = isHigh || hasUrgentFeeling ? "urgent" : show ? "suggest" : "none";

  // =========================
  // Pick recommendedResources (1–2 max)
  // =========================
  const recommendedResources = [];

  const pushUnique = (key) => {
    if (!recommendedResources.includes(key)) recommendedResources.push(key);
  };

  if (cat.includes("איום") || cat.includes("סחיטה")) {
    if (isHigh) pushUnique("police100");
    pushUnique("moked105");
    if (!isHigh) pushUnique("eran");
  } else if (["גרומינג", "לחץמיני", "הטרדה"].some((k) => cat.includes(k))) {
    pushUnique("moked105");
    if (hasUrgentFeeling || hasEmotionalDistress || isMedium || isHigh) pushUnique("eran");
    if (isHigh) pushUnique("police100");
  } else {
    if (hasUrgentFeeling || hasEmotionalDistress) pushUnique("eran");
    pushUnique("moked105");
    if (isHigh) pushUnique("police100");
  }

  // Trim to 2 max
  const finalResources = recommendedResources.slice(0, 2);

  // =========================
  // Chatty message (first-person)
  // =========================
  let message = "";
  if (urgency === "urgent") {
    message =
      "מה שאת מתארת נשמע לא פשוט. אם את מרגישה לא בטוחה עכשיו, הייתי מערבת גורם מקצועי מיד. את לא לבד 💜";
  } else if (urgency === "suggest") {
    message =
      "אם זה ממשיך או מרגיש לך כבד - הייתי שוקלת לערב גורם מקצועי או מבוגר אחראי. את לא צריכה להתמודד עם זה לבד 💜";
  } else if (isCalm) {
    message =
      "אם תרצי רק להתייעץ או לקבל עוד תמיכה - אפשר גם לפנות לגורם מקצועי. אני כאן איתך 💜";
  } else {
    message =
      "אם תרצי תמיכה או התייעצות - אפשר לפנות גם לגורם מקצועי. את לא לבד 💜";
  }

  // If not showing, keep fields consistent
  if (!show) {
    return {
      show: false,
      urgency: "none",
      reasons: "לא זוהה צורך מיידי בקווי תמיכה לפי התוכן וההקשר.",
      recommendedResources: [],
      message: ""
    };
  }

  return {
    show: true,
    urgency,
    reasons: `risk=${risk}; feelings=${feelings.join(", ") || "none"}; category=${category || "none"}`,
    recommendedResources: finalResources,
    message
  };
}
