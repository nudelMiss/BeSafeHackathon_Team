// ChatInterface.jsx
import { useState, useEffect, useRef, useContext } from 'react';
import ChatBubble from '../ChatBubble/ChatBubble';
import ChipSelector from '../ChipSelector/ChipSelector';
import MusicPlayer from '../MusicPlayer/MusicPlayer';
import { AnalyzeContext } from '../../context/AnalyzeContext';
import api from '../../services/api';
import styles from './ChatInterface.module.css';

const ChatInterface = () => {
  // Use AnalyzeContext for backend API calls
  const { analyzeMessage, response: analyzeResponse, loading: analyzeLoading, error: analyzeError } = useContext(AnalyzeContext);

  // State for managing messages in the chat
  const [messages, setMessages] = useState([]);

  // Track which question we're currently on (0 = first question)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Store all user answers in an object
  const [userData, setUserData] = useState({});

  // Control whether to show chip buttons or text input
  const [showChips, setShowChips] = useState(false);

  // Store the options for current chip question
  const [currentOptions, setCurrentOptions] = useState([]);

  // Track if current question allows multiple selection
  const [allowMultipleSelection, setAllowMultipleSelection] = useState(false);

  // Track special interaction modes
  const [isParentConsentPrompt, setIsParentConsentPrompt] = useState(false);
  const [isToneSelection, setIsToneSelection] = useState(false);
  const [isContinuationPrompt, setIsContinuationPrompt] = useState(false);
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const [replyOptionsData, setReplyOptionsData] = useState(null);
  const [isWaitingForEmailInput, setIsWaitingForEmailInput] = useState(false);

  // ✅ NEW: support choice flow (steps 1–4)
  const [isSupportChoicePrompt, setIsSupportChoicePrompt] = useState(false);
  const [pendingProfessionalHelp, setPendingProfessionalHelp] = useState(null);

  // Store severity from backend (for resource selection)
  // eslint-disable-next-line no-unused-vars
  const [severity, setSeverity] = useState(null); // Stored for potential future use
  const severityRef = useRef('mild');

  // Reference to scroll to bottom of chat
  const messagesEndRef = useRef(null);

  // Helper function to show typing indicator, then message (used in multiple places)
  const showMessageWithTyping = async (messageText, delay = 1000, isEmailBadge = false, typingVerb = "חושבת") => {
    // Show typing indicator with verb
    setMessages(prev => [...prev, {
      text: "",
      isUser: false,
      isTyping: true,
      typingText: typingVerb
    }]);

    // Wait for typing animation
    await new Promise(resolve => setTimeout(resolve, delay));

    // Remove typing indicator and show actual message
    setMessages(prev => {
      const filtered = prev.filter(msg => !msg.isTyping);
      return [...filtered, {
        text: messageText,
        isUser: false,
        isEmailBadge: isEmailBadge
      }];
    });
  };

  // Define all questions we want to ask - MATCHED TO BACKEND REQUIREMENTS
  const questions = [
    {
      text: "שלום, אני האחות הדיגיטלית שלך ברשת. אני כאן כדי לעזור לך להתמודד עם אירועים לא נעימים שחווית ברשת. אני שמחה שהחלטת לפנות אליי, בואי ננסה להבין מה קרה.",
      type: "chips",
      key: "openingAck",
      multiple: false,
      options: ["אוקי, בואי נתחיל"]
    },
    {
      text: "איך היית רוצה שאני אקרא לך? את יכולה לתת את השם שלך או כל כינוי שתבחרי.",
      type: "text",
      key: "userIdentifier"
    },
    {
      text: "היי, מה שלומך? איך את מרגישה עכשיו? (אפשר לבחור כמה רגשות)", // Will be personalized with nickname if available
      type: "chips",
      key: "feeling",
      multiple: true,
      options: ["מבולבלת", "מבוכה", "סכנה", "פחד", "עצב", "כעס", "חרדה", "רגועה", "תקווה", "אחר"]
    },
    {
      text: "אם יש דבר שמעורר דאגה, אנחנו אולי נרצה ליצור קשר עם מבוגר אחראי שנוכל לסמוך עליו.",
      type: "chips",
      key: "trustedAdultEmail",
      multiple: false,
      options: ["אזין מייל של מבוגר אחראי", "מעדיפה לא לתת מייל"]
    },
    {
      text: "בואי נבין מה קרה. את יכולה לכתוב לי את ההודעה שקיבלת, ואני אעזור לך להבין מה לעשות.",
      type: "text",
      key: "messageText"
    },
    {
      text: "באיזה ערוץ זה קרה?",
      type: "chips",
      key: "channel",
      multiple: false,
      options: ["רשתות חברתיות", "קבוצה", "פרטי"]
    },
    {
      text: "מי שלח זאת - מישהו שאת מכירה או זר?",
      type: "chips",
      key: "senderType",
      multiple: false,
      options: ["מישהו שאני מכירה", "זר"]
    }
  ];

  // Auto-scroll to bottom when new messages appear
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat with welcome message when component loads
  useEffect(() => {
    const firstQuestion = questions[0];
    setMessages([{ text: firstQuestion.text, isUser: false }]);
    setShowChips(true);
    setCurrentOptions(firstQuestion.options);
    setAllowMultipleSelection(firstQuestion.multiple || false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle when user submits text input
  const handleTextSubmit = (text) => {
    if (!text.trim()) return;  // Don't submit empty text

    // Add user's message to chat
    const userMessage = { text: text.trim(), isUser: true };
    setMessages(prev => [...prev, userMessage]);

    // If we were waiting for email input, handle it specially
    if (isWaitingForEmailInput) {
      setUserData(prev => ({ ...prev, trustedAdultEmail: text.trim() }));
      setIsWaitingForEmailInput(false);
      moveToNextQuestion('trustedAdultEmail', text.trim());
      return;
    }

    // Save the answer in userData object
    const currentQuestion = questions[currentQuestionIndex];
    console.log('Saving text input - Question:', currentQuestion.text, 'Key:', currentQuestion.key, 'Value:', text.trim());
    setUserData(prev => {
      const updated = { ...prev, [currentQuestion.key]: text.trim() };
      console.log('Updated userData:', updated);
      return updated;
    });

    // Move to next question, passing the current answer to handle last question
    moveToNextQuestion(currentQuestion.key, text.trim());
  };

  // ✅ Made async because we await showMessageWithTyping in support-choice flow
  const handleChipSelect = async (value) => {
    // ✅ NEW (Step 4): Support choice flow - handle FIRST
    if (isSupportChoicePrompt) {
      setMessages(prev => [...prev, { text: value, isUser: true }]);
      setShowChips(false);
      setIsSupportChoicePrompt(false);

      if (value === "קווי תמיכה" && pendingProfessionalHelp) {
      const { message } = pendingProfessionalHelp;

        if (message) {
          await showMessageWithTyping(message, 1200, false, "מקלידה");
        }

      if (Array.isArray(pendingProfessionalHelp.recommendedResources)) {
        const map = {
          eran: "ער״ן (1201) – שיחה אנונימית 24/7",
          police100: "משטרה (100) – במקרה חירום מיידי",
          moked105: "מוקד 105 – פגיעה ודיווח ברשת"
        };

        const text = pendingProfessionalHelp.recommendedResources
          .map(key => map[key])
          .filter(Boolean)
          .join(" או ");

        if (text) {
          await showMessageWithTyping(
            `כרגע הייתי מתחילה עם ${text}.`,
            1500,
            false,
            "מקלידה"
          );
        }
      }

      }

      // In both cases continue to tone selection
      startToneSelection(replyOptionsData);
      return;
    }

    // Continuation prompt flow - check this FIRST
    if (isContinuationPrompt) {
      handleContinuationChoice(value);
      return;
    }

    // Tone selection flow - check this SECOND
    if (isToneSelection) {
      const toneKeyByLabel = {
        "תגובה עדינה": "gentle",
        "תגובה נחרצת": "assertive",
        "לא להגיב": "noReply",
      };
      const selectedKey = toneKeyByLabel[value];
      const replyText = replyOptionsData?.[selectedKey];
      const riskLevel = analyzeResponse?.riskLevel;

      // Show user's choice
      setMessages(prev => [...prev, { text: value, isUser: true }]);

      // Clear all states to prevent any lingering input states
      setIsWaitingForEmailInput(false);
      setIsToneSelection(false);
      setShowChips(false);

      // Show suggested reply from server with a delay
      if (replyText && selectedKey !== "noReply") {
        setTimeout(async () => {
          // Show pre-sentence
          await showMessageWithTyping("את יכולה להגיב ב", 1200, false, "מקלידה");

          // Show the reply text
          await showMessageWithTyping(replyText, 1500, false, "מקלידה");

          // Show explanation for why this tone fits the situation
          let explanationText = "";
          if (selectedKey === "gentle") {
            explanationText = riskLevel === "גבוה"
              ? "תגובה עדינה יכולה לעזור לך להציב גבול בלי להסלים את המצב, במיוחד כשמדובר ברמת סיכון גבוהה."
              : "תגובה עדינה מאפשרת לך להציב גבול בצורה מכבדת, בלי ליצור עימות מיותר.";
          } else if (selectedKey === "assertive") {
            explanationText = riskLevel === "גבוה"
              ? "תגובה נחרצת חשובה כשמדובר ברמת סיכון גבוהה - היא מבהירה שהתנהגות כזו לא מקובלת עלייך."
              : "תגובה נחרצת עוזרת לך להבהיר את הגבולות שלך בצורה ברורה וחד-משמעית.";
          }

          if (explanationText) {
            await showMessageWithTyping(explanationText, 1500, false, "חושבת");
          }

          // After showing everything, show continuation prompt
          setTimeout(() => {
            showContinuationPrompt();
          }, 800);
        }, 500);
      } else if (selectedKey === "noReply") {
        // If user chose not to reply, show acknowledgment and explanation
        setTimeout(async () => {
          await showMessageWithTyping("הבנתי, זה בסדר גמור לא להגיב.", 1200, false, "מקלידה");
          await showMessageWithTyping("לפעמים הדבר הכי טוב שאפשר לעשות זה פשוט לא להגיב, לחסום ולדווח. זה לא אומר שאת לא חזקה - זה אומר שאת יודעת להגן על עצמך.", 1500, false, "חושבת");
          setTimeout(() => {
            showContinuationPrompt();
          }, 800);
        }, 500);
      } else {
        // If no reply text available, show continuation prompt directly
        setTimeout(() => {
          showContinuationPrompt();
        }, 500);
      }

      return;
    }

    const currentQuestion = questions[currentQuestionIndex];

    // Handle email question chip selection (only if not in continuation prompt)
    if (currentQuestion && currentQuestion.key === 'trustedAdultEmail' && !isContinuationPrompt) {
      const displayText = Array.isArray(value) ? value.join(', ') : value;
      setMessages(prev => [...prev, { text: displayText, isUser: true }]);

      if (value === "מעדיפה לא לתת מייל") {
        // User chose not to provide email
        setUserData(prev => ({ ...prev, trustedAdultEmail: "" }));
        setShowChips(false);
        moveToNextQuestion('trustedAdultEmail', "");
      } else {
        // User wants to enter email - show text input
        setShowChips(false);
        setIsWaitingForEmailInput(true);
        setTimeout(() => {
          setMessages(prev => [...prev, { text: "מצוין! איזה מייל תרצי שאני אשלח אליו?", isUser: false }]);
        }, 500);
      }
      return;
    }

    // Parent consent prompt flow (high-risk)
    if (isParentConsentPrompt) {
      const displayText = Array.isArray(value) ? value.join(', ') : value;
      setMessages(prev => [...prev, { text: displayText, isUser: true }]);

      const affirmative = value.includes('כן');
      if (affirmative) {
        setMessages(prev => [...prev, { text: "אוקיי, אני שולחת", isUser: false }]);
      } else {
        setMessages(prev => [...prev, { text: "הבנתי, לא אשלח מייל", isUser: false }]);
      }

      setIsParentConsentPrompt(false);
      setShowChips(false);
      // Proceed to tone selection
      startToneSelection(replyOptionsData);
      return;
    }

    // Save the selected value in userData
    setUserData(prev => ({ ...prev, [currentQuestion.key]: value }));

    // For single selection, show message immediately and move to next question
    // For multiple selection, don't show message yet - wait for "done" button
    if (!currentQuestion.multiple) {
      // Show user's selection as a message
      const displayText = Array.isArray(value) ? value.join(', ') : value;
      const userMessage = { text: displayText, isUser: true };
      setMessages(prev => [...prev, userMessage]);

      setShowChips(false);
      moveToNextQuestion();
    }
    // If multiple selection, chips stay visible - user can add more selections
  };

  // Start tone selection stage
  const startToneSelection = async (replyOptions) => {
    const options = replyOptions || replyOptionsData;
    if (!options) return;

    // Prompt for tone choice
    setMessages(prev => [...prev, { text: "חשבתי על כמה תגובות שתוכלי לשלוח. באיזה סגנון תרצי להשתמש?", isUser: false }]);

    setCurrentOptions(["תגובה עדינה", "תגובה נחרצת", "לא להגיב"]);
    setShowChips(true);
    setAllowMultipleSelection(false);
    setIsToneSelection(true);
  };

  // Handle when user is done with multiple selection
  const handleMultipleSelectionDone = () => {
    // Get the current question and all selected values
    const currentQuestion = questions[currentQuestionIndex];
    const selectedValues = userData[currentQuestion.key];

    // Add single combined message with all selections
    if (selectedValues && Array.isArray(selectedValues) && selectedValues.length > 0) {
      const displayText = selectedValues.join(', ');
      setMessages(prev => [...prev, { text: displayText, isUser: true }]);
    }

    setShowChips(false);
    moveToNextQuestion();
  };

  // Move to next question or submit data if all questions answered
  const moveToNextQuestion = (lastQuestionKey = null, lastQuestionValue = null) => {
    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < questions.length) {
      // There are more questions
      setCurrentQuestionIndex(nextIndex);
      const nextQuestion = questions[nextIndex];

      // Show next question after a short delay (feels more natural)
      setTimeout(() => {
        // Special handling for feeling question - use nickname
        let questionText = nextQuestion.text;
        if (nextQuestion.key === 'feeling') {
          const nickname = (lastQuestionKey === 'userIdentifier' && lastQuestionValue)
            ? lastQuestionValue
            : userData.userIdentifier;

          if (nickname) {
            questionText = `היי ${nickname}, מה שלומך? איך את מרגישה עכשיו? (אפשר לבחור כמה רגשות)`;
          } else {
            questionText = "היי, מה שלומך? איך את מרגישה עכשיו? (אפשר לבחור כמה רגשות)";
          }
        }

        setMessages(prev => [...prev, { text: questionText, isUser: false }]);

        // If next question uses chips, show them
        if (nextQuestion.type === "chips") {
          const chipOptions = nextQuestion.options.map(opt =>
            typeof opt === 'string' ? opt : opt.label
          );
          setCurrentOptions(chipOptions);
          setShowChips(true);
          setAllowMultipleSelection(nextQuestion.multiple || false);
        } else {
          setAllowMultipleSelection(false);
        }
      }, 500);
    } else {
      // All questions answered
      submitData(lastQuestionKey, lastQuestionValue);
    }
  };

  // Send collected data to backend
  const submitData = async (lastQuestionKey = null, lastQuestionValue = null) => {
    setShowChips(false);

    // Show loading message with typing indicator
    setMessages(prev => [...prev, { text: "מנתחת את ההודעה שלך...", isUser: false, isTyping: true, typingText: "מנתחת" }]);

    try {
      const completeUserData = lastQuestionKey && lastQuestionValue
        ? { ...userData, [lastQuestionKey]: lastQuestionValue }
        : userData;

      console.log('Complete userData object:', completeUserData);

      const messageText = completeUserData.messageText || "unspecified";

      const channelMap = {
        "רשתות חברתיות": "קבוצה",
        "קבוצה": "קבוצה",
        "פרטי": "פרטי"
      };

      const senderTypeMap = {
        "מישהו שאני מכירה": "מוכר",
        "זר": "זר"
      };

      const feelings = Array.isArray(completeUserData.feeling)
        ? completeUserData.feeling.filter(f => f && f.trim())
        : (completeUserData.feeling ? [completeUserData.feeling] : []);

      const context = {
        channel: channelMap[completeUserData.channel] || "קבוצה",
        senderType: senderTypeMap[completeUserData.senderType] || "זר",
        feelings: feelings
      };

      const requestPayload = {
        nickname: completeUserData.userIdentifier || "anonymous",
        messageText,
        context,
        ResponsibleAdultEmail: completeUserData.trustedAdultEmail?.trim() || undefined
      };

      if (!requestPayload.ResponsibleAdultEmail) {
        delete requestPayload.ResponsibleAdultEmail;
      }

      console.log('trustedAdultEmail value:', completeUserData.trustedAdultEmail);
      console.log('Sending JSON to server:', JSON.stringify(requestPayload, null, 2));

      console.log('Making POST request to /api/reports...');
      await analyzeMessage(requestPayload);
    } catch (error) {
      console.error('❌ Error submitting data:', error);

      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isTyping);

        let errorMsg = "סליחה, הייתה שגיאה בחיבור לשרת. ";

        if (error.response) {
          errorMsg += `השרת החזיר שגיאה (קוד ${error.response.status}).`;
        } else if (error.request) {
          errorMsg += "השרת לא הגיב. אנא ודאי שהשרת פועל.";
        } else {
          errorMsg += "שגיאה לא צפויה. פרטים בקונסול.";
        }

        return [...filtered, {
          text: errorMsg,
          isUser: false
        }];
      });
    }
  };

  // Handle backend response when it arrives
  useEffect(() => {
    if (analyzeResponse && !analyzeLoading) {
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => !msg.isTyping));

      // Backend returns: { riskLevel, category, explanation, replyOptions, supportLine, userId, nickname, reportId, createdAt, emailReport, professionalHelp }
      const { riskLevel, explanation, replyOptions, supportLine, emailReport, professionalHelp } = analyzeResponse;

      // Reset support choice state for new analysis
      setIsSupportChoicePrompt(false);
      setPendingProfessionalHelp(null);

      // Log email report status if available
      if (emailReport) {
        console.log('Email report status:', emailReport);
        if (emailReport.sent) {
          console.log('✅ Email sent successfully to responsible adult');
        } else if (emailReport.error) {
          console.warn('⚠️ Email failed to send:', emailReport.error);
        }
      }

      // Save reply options for tone selection
      setReplyOptionsData(replyOptions || null);

      // Map riskLevel to severity for resource selection
      const sev = (riskLevel === "גבוה" || riskLevel === "בינוני") ? "severe" : "mild";
      setSeverity(sev);
      severityRef.current = sev;

      const displayResponseMessages = async () => {
        const nickname = userData.userIdentifier || "יקרה";

        // 1. Support line
        if (supportLine) {
          const personalizedSupportLine = `אני כאן בשבילך ${nickname}`;
          await showMessageWithTyping(`${personalizedSupportLine} 💗`, 1500, false, "מקלידה");
        }

        // 2. Explanation
        if (explanation) {
          await showMessageWithTyping(explanation, 1800, false, "מקלידה");
        }

        // 3. Risk level + category
        if (riskLevel || analyzeResponse.category) {
          let combinedText = "זיהיתי ";
          const parts = [];
          if (riskLevel) {
            const riskText = riskLevel === "גבוה" ? "רמת סיכון גבוהה" : riskLevel === "בינוני" ? "רמת סיכון בינונית" : "רמת סיכון נמוכה";
            parts.push(riskText);
          }
          if (analyzeResponse.category) {
            parts.push(`זה נראה כמו ${analyzeResponse.category}`);
          }
          combinedText += parts.join(" ו");
          combinedText += ".";
          await showMessageWithTyping(combinedText, 1500, false, "חושבת");
        }

        // ✅ NEW (Steps 1–3): Do NOT dump professional help immediately
        if (professionalHelp && (professionalHelp.message ||
            (Array.isArray(professionalHelp.recommendedResources) &&
              professionalHelp.recommendedResources.length > 0))) {

          setPendingProfessionalHelp(professionalHelp);

          await showMessageWithTyping(
            "מצאתי גם כמה אפשרויות תמיכה שיכולות לעזור במצב כזה. מה תרצי לעשות עכשיו? ",
            1500,
            false,
            "מקלידה"
          );

          setCurrentOptions(["קווי תמיכה", "שליחת תגובה"]);
          setShowChips(true);
          setAllowMultipleSelection(false);
          setIsSupportChoicePrompt(true);

          return; // ⛔ stop here – wait for user choice
        }

        // Email result (sent or failed)
        if (emailReport) {
          if (emailReport.sent === true) {
            await showMessageWithTyping("✅ נשלח מייל למבוגר אחראי", 1200, true, "מקלידה");
          } else if (emailReport.error) {
            await showMessageWithTyping("לא הצלחתי לשלוח את המייל כרגע, אבל נמשיך הלאה. את יכולה לנסות שוב מאוחר יותר.", 1500, false, "מקלידה");
          }
        }

        // Proceed to tone selection
        setTimeout(() => {
          startToneSelection(replyOptions);
        }, 800);
      };

      console.log("professionalHelp from server:", analyzeResponse.professionalHelp);

      displayResponseMessages();
    }

    if (analyzeError && !analyzeLoading) {
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isTyping);

        let errorMsg = "סליחה, הייתה שגיאה בחיבור לשרת. ";

        if (analyzeError.response) {
          errorMsg += `השרת החזיר שגיאה (קוד ${analyzeError.response.status}).`;
        } else if (analyzeError.request) {
          errorMsg += "השרת לא הגיב. אנא ודאי שהשרת פועל.";
        } else {
          errorMsg += "שגיאה לא צפויה. פרטים בקונסול.";
        }

        return [...filtered, {
          text: errorMsg,
          isUser: false
        }];
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyzeResponse, analyzeLoading, analyzeError]);

  // Show continuation prompt after user selects reply option
  const showContinuationPrompt = () => {
    const currentEmailReport = analyzeResponse?.emailReport;

    if (userData.trustedAdultEmail && userData.trustedAdultEmail.trim() !== "") {
      if (currentEmailReport) {
        if (currentEmailReport.sent === true) {
          setMessages(prev => [...prev, {
            text: "📧 סיכום: נשלח מייל למבוגר אחראי עם פרטי הדיווח",
            isUser: false,
            isEmailBadge: true
          }]);
        } else if (currentEmailReport.error) {
          setMessages(prev => [...prev, {
            text: "📧 סיכום: לא הצלחתי לשלוח את המייל למבוגר אחראי. את יכולה לנסות שוב מאוחר יותר.",
            isUser: false
          }]);
        } else {
          setMessages(prev => [...prev, {
            text: "📧 סיכום: המייל לא נשלח כי רמת הסיכון לא הייתה גבוהה מספיק. אם את מרגישה שצריך עזרה, את יכולה לפנות שוב.",
            isUser: false
          }]);
        }
      } else {
        setMessages(prev => [...prev, {
          text: "📧 סיכום: המייל לא נשלח. אם את מרגישה שצריך עזרה, את יכולה לפנות שוב.",
          isUser: false
        }]);
      }
    }

    setTimeout(() => {
      setMessages(prev => [...prev, {
        text: "מה תרצי שנעשה מכאן?",
        isUser: false
      }]);

      setCurrentOptions(["לראות סיכום הדיווחים שלי", "לסיים לעת עתה"]);
      setShowChips(true);
      setAllowMultipleSelection(false);
      setIsContinuationPrompt(true);
    }, 1000);
  };

  // Fetch and display user's report history
  const showReportsHistory = async () => {
    try {
      const userNickname = userData.userIdentifier || "anonymous";
      const displayNickname = userData.userIdentifier || "יקרה";

      setMessages(prev => [...prev, {
        text: "אני בודקת את הדיווחים שלך...",
        isUser: false,
        isTyping: true,
        typingText: "בודקת"
      }]);

      const response = await api.get(`/api/reports?nickname=${encodeURIComponent(userNickname)}`);
      const reports = response.data.reports || [];

      setMessages(prev => prev.filter(msg => !msg.isTyping));

      if (reports.length === 0) {
        setMessages(prev => [...prev, {
          text: `${displayNickname}, זה הדיווח הראשון שלך אצלנו. אני כאן כדי לעזור לך בכל פעם שתצטרכי 💗`,
          isUser: false
        }]);
      } else {
        setMessages(prev => [...prev, {
          text: `מצאתי ${reports.length} דיווח${reports.length > 1 ? 'ים' : ''} קודמ${reports.length > 1 ? 'ים' : ''} שלך. הנה סיכום:`,
          isUser: false
        }]);

        for (let i = 0; i < Math.min(reports.length, 3); i++) {
          const report = reports[i];
          const date = new Date(report.createdAt);
          const dateStr = date.toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          const riskLevel = report.analysis?.riskLevel || 'לא זוהה';
          const category = report.analysis?.category || 'לא זוהה';
          const explanation = report.analysis?.explanation || '';

          let summary = `${dateStr}\n`;
          summary += `זיהיתי ${riskLevel === 'גבוה' ? 'רמת סיכון גבוהה' : riskLevel === 'בינוני' ? 'רמת סיכון בינונית' : 'רמת סיכון נמוכה'}`;
          if (category !== 'לא זוהה') {
            summary += ` וזה נראה כמו ${category}`;
          }
          if (explanation) {
            summary += `.\n${explanation}`;
          }

          await showMessageWithTyping(summary, 1200, false, "מקלידה");
        }

        if (reports.length > 3) {
          await showMessageWithTyping(`ועוד ${reports.length - 3} דיווח${reports.length - 3 > 1 ? 'ים' : ''} נוספים.`, 1000, false, "מקלידה");
        }

        await new Promise(resolve => setTimeout(resolve, 800));
        await showMessageWithTyping(`את לא לבד ${displayNickname} 💗`, 1500, false, "חושבת");
      }

      setTimeout(() => {
        setMessages(prev => [...prev, {
          text: "זה בסדר גמור. אני כאן מתי שתרצי לחזור 💙",
          isUser: false
        }]);
        setShowMusicPlayer(true);
      }, 500);

    } catch (error) {
      console.error('Error fetching reports:', error);
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isTyping);
        return [...filtered, {
          text: "סליחה, לא הצלחתי לטעון את הדיווחים כרגע. אבל אני כאן כדי לעזור לך 💗",
          isUser: false
        }];
      });

      setTimeout(() => {
        setMessages(prev => [...prev, {
          text: "זה בסדר גמור. אני כאן מתי שתרצי לחזור 💙",
          isUser: false
        }]);
        setShowMusicPlayer(true);
      }, 1000);
    }
  };

  // Handle continuation choice
  const handleContinuationChoice = (choice) => {
    const userMessage = { text: choice, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setShowChips(false);
    setIsContinuationPrompt(false);

    if (choice === "לסיים לעת עתה") {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          text: "זה בסדר גמור. אני כאן מתי שתרצי לחזור 💙",
          isUser: false
        }]);
        setShowMusicPlayer(true);
      }, 500);
    } else if (choice === "לראות סיכום הדיווחים שלי") {
      setTimeout(() => {
        showReportsHistory();
      }, 500);
    }
  };

  // Handle text input
  const [inputText, setInputText] = useState('');

  // Submit on Enter key press
  const handleInputKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit(inputText);
      setInputText('');
    }
  };

  // Determine what to show: text input or chips
  const currentQuestion = questions[currentQuestionIndex];
  const showTextInput = !isToneSelection && !isContinuationPrompt && !isSupportChoicePrompt &&
    ((currentQuestion && currentQuestion.type === "text" && !analyzeLoading) || isWaitingForEmailInput);

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messagesContainer}>
        {/* Display all messages */}
        {messages.map((msg, index) => (
          <div key={index} className={styles.messageWrapper}>
            <ChatBubble
              message={msg.text}
              isUser={msg.isUser}
              isTyping={msg.isTyping}
              isEmailBadge={msg.isEmailBadge}
              typingText={msg.typingText || "חושבת"}
            />
          </div>
        ))}

        {/* Show chips if current question uses them */}
        {showChips && currentOptions.length > 0 && (
          <div className={styles.chipWrapper}>
            <ChipSelector
              options={currentOptions}
              onSelect={handleChipSelect}
              selectedValue={(userData[currentQuestion?.key] || (allowMultipleSelection ? [] : null))}
              multiple={allowMultipleSelection}
            />
            {/* Show "Done" button for multiple selection */}
            {allowMultipleSelection && Array.isArray(userData[currentQuestion?.key]) && userData[currentQuestion?.key].length > 0 && (
              <button
                onClick={handleMultipleSelectionDone}
                className={styles.doneButton}
              >
                סיימתי ✓
              </button>
            )}
          </div>
        )}

        {/* Show music player when user chooses to close chat - for relaxation support */}
        {showMusicPlayer && userData.feeling && (
          <MusicPlayer feeling={userData.feeling} />
        )}

        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Show text input if current question needs text */}
      {showTextInput && (
        <div className={styles.inputContainer}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleInputKeyPress}
            placeholder="כתבי כאן..."
            className={styles.textInput}
            disabled={analyzeLoading}
          />
          <button
            onClick={() => {
              handleTextSubmit(inputText);
              setInputText('');
            }}
            className={styles.sendButton}
            disabled={analyzeLoading || !inputText.trim()}
          >
            שלחי
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;

