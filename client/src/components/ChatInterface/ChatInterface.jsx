import { useState, useEffect, useRef, useContext } from 'react';
import ChatBubble from '../ChatBubble/ChatBubble';
import ChipSelector from '../ChipSelector/ChipSelector';
import MusicPlayer from '../MusicPlayer/MusicPlayer';
import { AnalyzeContext } from '../../context/AnalyzeContext';
import api from '../../services/api';
import styles from './ChatInterface.module.css';
import logo from '../../assets/logo.png';

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
  
  // Track if we're in the follow-up phase (after initial response)
  // Track special interaction modes
  const [isParentConsentPrompt, setIsParentConsentPrompt] = useState(false);
  const [isToneSelection, setIsToneSelection] = useState(false);
  const [isContinuationPrompt, setIsContinuationPrompt] = useState(false);
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const [replyOptionsData, setReplyOptionsData] = useState(null);
  const [isWaitingForEmailInput, setIsWaitingForEmailInput] = useState(false);
  const [isExtraContextQuestion, setIsExtraContextQuestion] = useState(false);
  const [isNewReportPrompt, setIsNewReportPrompt] = useState(false);
  
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

  // Display response text in chunks (simulates live typing)
  // const displayResponseInChunks = async (fullText) => {
  //   // Split text into sentences (by periods, exclamation marks, question marks)
  //   const sentences = fullText.split(/([.!?]\s+)/).filter(s => s.trim());
    
  //   for (let i = 0; i < sentences.length; i++) {
  //     const sentence = sentences[i].trim();
  //     if (sentence) {
  //       setMessages(prev => [...prev, { 
  //         text: sentence, 
  //         isUser: false 
  //       }]);
  //       // Wait 1.5 seconds between sentences
  //       if (i < sentences.length - 1) {
  //         await new Promise(resolve => setTimeout(resolve, 1500));
  //       }
  //     }
  //   }
  // };

  // Define all questions we want to ask - MATCHED TO BACKEND REQUIREMENTS
  const questions = [
    {
      text: "היי… אני האחות הדיגיטלית שלך כאן ברשת, אני כאן כדי להקשיב לך ולעזור לך להתמודד עם משהו שלא היה לך נעים. שמחה שפנית אליי 💗",
      type: "chips",
      key: "openingAck",
      multiple: false,
      options: ["בואי נתחיל"]
    },
    {
      text: "איך היית רוצה שאקרא לך? את יכולה לתת את השם שלך או כל כינוי שנוח לך",
      type: "text",
      key: "userIdentifier"
    },
    {
      text: "איך את מרגישה עכשיו? את יכולה לבחור כמה רגשות שמתאימים למה שעובר עלייך",
      type: "chips",
      key: "feeling",
      multiple: true,
      options: ["מבולבלת", "מבוכה", "סכנה", "פחד", "עצב", "כעס", "חרדה", "רגועה", "תקווה", "אחר"]
    },
    {
      text: "לפעמים עוזר לערב מבוגר אחראי שאפשר לסמוך עליו. את רוצה לשתף מייל של מישהו כזה?",
      type: "chips",
      key: "trustedAdultEmail",
      multiple: false,
      options: ["אכניס מייל של מבוגר אחראי", "מעדיפה לא לשתף כרגע"]
    },
    {
      text: "כתבי כאן את ההודעה שקיבלת, ואני כאן איתך בזה 😊",
      type: "text",
      key: "messageText"
    },
    {
      text: "איפה זה קרה?",
      type: "chips",
      key: "channel",
      multiple: false,
      options: ["רשתות חברתיות", "קבוצה", "פרטי"]
    },
    {
      text: "מי שלח לך את ההודעה?",
      type: "chips",
      key: "senderType",
      multiple: false,
      options: ["מישהו שאני מכירה", "זר"]
    },
    {
      text: "אם יש משהו נוסף שתרצי לשתף בהקשר להודעה – זה המקום. אם לא, פשוט לחצי על 'המשיכי' 💗",
      type: "text",
      key: "extraContext"
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
    const currentQuestion = questions[currentQuestionIndex];
    
    // For extraContext, allow empty text (it's optional)
    if (!text.trim() && currentQuestion?.key !== 'extraContext') {
      return;  // Don't submit empty text for other questions
    }

    // Add user's message to chat (only if text is not empty)
    if (text.trim()) {
      const userMessage = { text: text.trim(), isUser: true };
      setMessages(prev => [...prev, userMessage]);
    }
    
    // If we were waiting for email input, handle it specially
    if (isWaitingForEmailInput) {
      setUserData(prev => ({ ...prev, trustedAdultEmail: text.trim() }));
      setIsWaitingForEmailInput(false);
      moveToNextQuestion('trustedAdultEmail', text.trim());
      return;
    }
    
    // Save the answer in userData object (empty string is allowed for extraContext)
    const valueToSave = text.trim() || '';
    console.log('Saving text input - Question:', currentQuestion.text, 'Key:', currentQuestion.key, 'Value:', valueToSave);
    setUserData(prev => {
      const updated = { ...prev, [currentQuestion.key]: valueToSave };
      console.log('Updated userData:', updated);
      return updated;
    });

    // Reset extraContext question flag
    if (currentQuestion?.key === 'extraContext') {
      setIsExtraContextQuestion(false);
    }

    // Move to next question, passing the current answer to handle last question
    moveToNextQuestion(currentQuestion.key, valueToSave);
  };
  
  // Handle when user clicks a chip
  const handleChipSelect = (value) => {
    // New report prompt flow - check this FIRST
    if (isNewReportPrompt) {
      handleNewReportChoice(value);
      return;
    }
    
    // Continuation prompt flow - check this SECOND
    if (isContinuationPrompt) {
      handleContinuationChoice(value);
      return;
    }
    
    // Handle "המשיכי" chip for extraContext question
    if (isExtraContextQuestion && value === "המשיכי") {
      setMessages(prev => [...prev, { text: "המשיכי", isUser: true }]);
      setUserData(prev => ({ ...prev, extraContext: "" }));
      setIsExtraContextQuestion(false);
      setShowChips(false);
      moveToNextQuestion('extraContext', "");
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
          await showMessageWithTyping("הבנתי 💗 זה לגמרי בסדר לבחור לא להגיב", 1200, false, "מקלידה");
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
      
      if (value === "מעדיפה לא לשתף כרגע") {
        // User chose not to provide email
        setUserData(prev => ({ ...prev, trustedAdultEmail: "" }));
        setShowChips(false);
        moveToNextQuestion('trustedAdultEmail', "");
      } else {
        // User wants to enter email - show text input
        setShowChips(false);
        setIsWaitingForEmailInput(true);
        setTimeout(() => {
          setMessages(prev => [...prev, { text: "מעולה, איזה מייל תרצי שאני אשלח אליו?", isUser: false }]);
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
    setMessages(prev => [...prev, { text: "חשבתי על כמה תגובות שתוכלי לשלוח, באיזה סגנון תרצי להשתמש?", isUser: false }]);

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
        // Use the question text as-is (no special personalization needed)
        let questionText = nextQuestion.text;
        if (nextQuestion.key === 'feeling') {
          const nickname = (lastQuestionKey === 'userIdentifier' && lastQuestionValue) 
            ? lastQuestionValue 
            : userData.userIdentifier;
          
          if (nickname) {
            questionText = `היי ${nickname} איך את מרגישה עכשיו? את יכולה לבחור כמה רגשות שמתאימים למה שעובר עלייך `;
          } else {
            // Fallback if nickname not available yet
            questionText = "איך את מרגישה עכשיו? את יכולה לבחור כמה רגשות שמתאימים למה שעובר עלייך";
          }
        }
        
        setMessages(prev => [...prev, { text: questionText, isUser: false }]);
        
        // If next question uses chips, show them
        if (nextQuestion.type === "chips") {
          // Handle both string arrays and object arrays
          const chipOptions = nextQuestion.options.map(opt => 
            typeof opt === 'string' ? opt : opt.label
          );
          setCurrentOptions(chipOptions);
          setShowChips(true);
          setAllowMultipleSelection(nextQuestion.multiple || false);
        } else {
          setAllowMultipleSelection(false);
          // For extraContext question, show "המשיכי" chip option
          if (nextQuestion.key === 'extraContext') {
            setIsExtraContextQuestion(true);
            setCurrentOptions(["המשיכי"]);
            setShowChips(true);
          }
        }
      }, 500);
    } else {
      // All questions answered! Send data to backend
      // Pass the last answer to ensure it's included
      submitData(lastQuestionKey, lastQuestionValue);
    }
  };

  // Send collected data to backend
  const submitData = async (lastQuestionKey = null, lastQuestionValue = null) => {
    setShowChips(false);
    
    // Show loading message with typing indicator
    setMessages(prev => [...prev, { text: "מנתחת את ההודעה שלך...", isUser: false, isTyping: true, typingText: "מנתחת" }]);

    // ============================================
    // SEND DATA TO BACKEND AS JSON
    // ============================================
    try {
      // Include the last answer if provided (fixes state timing issue)
      const completeUserData = lastQuestionKey && lastQuestionValue 
        ? { ...userData, [lastQuestionKey]: lastQuestionValue }
        : userData;
      
      // Debug: Log the entire userData object
      console.log('Complete userData object:', completeUserData);
      
      // Prepare data in the format the backend expects
      const messageText = completeUserData.messageText || "unspecified";
      
      // Backend expects Hebrew values for channel and senderType
      // Map channel values to Hebrew (backend expects: "פרטי" | "קבוצה")
      const channelMap = {
        "רשתות חברתיות": "קבוצה",  // Default to קבוצה for social media
        "קבוצה": "קבוצה",
        "פרטי": "פרטי"
      };
      
      // Map senderType values to Hebrew (backend expects: "זר" | "מוכר")
      const senderTypeMap = {
        "מישהו שאני מכירה": "מוכר",
        "זר": "זר"
      };
      
      // Backend expects feelings as array (Hebrew strings)
      // feeling is already an array if multiple selection was used
      const feelings = Array.isArray(completeUserData.feeling) 
        ? completeUserData.feeling.filter(f => f && f.trim())  // Already an array, filter empty values
        : (completeUserData.feeling ? [completeUserData.feeling] : []);  // Single value, convert to array
      
      const context = {
        channel: channelMap[completeUserData.channel] || "קבוצה",
        senderType: senderTypeMap[completeUserData.senderType] || "זר",
        feelings: feelings  // Array of Hebrew feeling strings
      };
      
      // Build request payload as JSON
      const requestPayload = {
        nickname: completeUserData.userIdentifier || "anonymous",
        messageText,
        context,
        ResponsibleAdultEmail: completeUserData.trustedAdultEmail?.trim() || undefined,  // Backend expects this field name
        extraContext: completeUserData.extraContext?.trim() || undefined  // Optional extra context
      };
      
      // Remove undefined fields
      if (!requestPayload.ResponsibleAdultEmail) {
        delete requestPayload.ResponsibleAdultEmail;
      }
      if (!requestPayload.extraContext) {
        delete requestPayload.extraContext;
      }
      
      console.log('trustedAdultEmail value:', completeUserData.trustedAdultEmail);
      console.log('Sending JSON to server:', JSON.stringify(requestPayload, null, 2));
      
      // Send userData to backend endpoint using AnalyzeContext
      console.log('Making POST request to /api/reports...');
      await analyzeMessage(requestPayload);
      
      // Response will be handled by useEffect hook that watches analyzeResponse
    } catch (error) {
      console.error('❌ Error submitting data:', error);
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      console.error('Error request:', error.request);
      console.error('Error config:', error.config);
      
      // Remove typing indicator and show error
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isTyping);
        
        // Create detailed error message
        let errorMsg = "סליחה, הייתה שגיאה בחיבור לשרת. ";
        
        if (error.response) {
          // Server responded with error
          errorMsg += `השרת החזיר שגיאה (קוד ${error.response.status}).`;
        } else if (error.request) {
          // Request made but no response
          errorMsg += "השרת לא הגיב. אנא ודאי שהשרת פועל.";
        } else {
          // Something else happened
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
      
      // Backend returns: { riskLevel, category, explanation, replyOptions, supportLine, userId, nickname, reportId, createdAt, emailReport }
      const { riskLevel, explanation, replyOptions, supportLine, emailReport } = analyzeResponse;
      
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
      // Backend returns Hebrew: "גבוה"/"בינוני"/"נמוך"
      // High/Medium = severe, Low = mild
      const severity = (riskLevel === "גבוה" || riskLevel === "בינוני") ? "severe" : "mild";
      setSeverity(severity);
      severityRef.current = severity;
      
      // Async function to display all messages with typing indicators
      const displayResponseMessages = async () => {
        const nickname = userData.userIdentifier || "יקרה";
        
        // 1. Display support line FIRST with pink heart emoji and nickname
        if (supportLine) {
          // Format: "אני כאן בשבילך [nickname]"
          const personalizedSupportLine = `אני כאן בשבילך ${nickname}`;
          await showMessageWithTyping(`${personalizedSupportLine} 💗`, 1500, false, "מקלידה");
        }
        
        // 2. Display explanation SECOND with natural typing
        if (explanation) {
          await showMessageWithTyping(explanation, 1800, false, "מקלידה");
        }
        
        // 3. Display risk level and category THIRD in humane tone
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
        
        // Display email result (sent or failed) with typing indicator
        if (emailReport) {
          if (emailReport.sent === true) {
            // Email sent successfully
            await showMessageWithTyping("✅ נשלח מייל למבוגר אחראי", 1200, true, "מקלידה");
          } else if (emailReport.error) {
            // Email failed to send - show message and continue flow
            await showMessageWithTyping("לא הצלחתי לשלוח את המייל כרגע, אבל נמשיך הלאה. את יכולה לנסות שוב מאוחר יותר.", 1500, false, "מקלידה");
          }
        }
        
        // Proceed to tone selection (reply options)
        setTimeout(() => {
          startToneSelection(replyOptions);
        }, 800);
      };
      
      // Call the async function
      displayResponseMessages();
    }
    
    if (analyzeError && !analyzeLoading) {
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isTyping);
        
        // Create detailed error message
        let errorMsg = "סליחה, הייתה שגיאה בחיבור לשרת. ";
        
        if (analyzeError.response) {
          // Server responded with error
          errorMsg += `השרת החזיר שגיאה (קוד ${analyzeError.response.status}).`;
        } else if (analyzeError.request) {
          // Request made but no response
          errorMsg += "השרת לא הגיב. אנא ודאי שהשרת פועל.";
        } else {
          // Something else happened
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
    // Show email status summary before continuation prompt if email was requested
    // Get emailReportStatus from analyzeResponse if available
    const currentEmailReport = analyzeResponse?.emailReport;
    
    if (userData.trustedAdultEmail && userData.trustedAdultEmail.trim() !== "") {
      // User provided an email, show status
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
          // Email was not sent (e.g., risk level was not high enough)
          setMessages(prev => [...prev, { 
            text: "📧 סיכום: המייל לא נשלח כי רמת הסיכון לא הייתה גבוהה מספיק. אם את מרגישה שצריך עזרה, את יכולה לפנות שוב.", 
            isUser: false 
          }]);
        }
      } else {
        // Email report status not available (shouldn't happen, but handle gracefully)
        setMessages(prev => [...prev, { 
          text: "📧 סיכום: המייל לא נשלח. אם את מרגישה שצריך עזרה, את יכולה לפנות שוב.", 
          isUser: false 
        }]);
      }
    }
    
    // Small delay before showing continuation prompt
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        text: "מה תרצי שנעשה מכאן?", 
        isUser: false 
      }]);
      
      // Set continuation options
      setCurrentOptions(["לראות סיכום הדיווחים שלי", "לדווח על משהו נוסף", "לסיים לעת עתה"]);
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
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => !msg.isTyping));
      
      if (reports.length === 0) {
        setMessages(prev => [...prev, { 
          text: `${displayNickname}, זה הדיווח הראשון שלך אצלנו. אני כאן כדי לעזור לך בכל פעם שתצטרכי 💗`, 
          isUser: false 
        }]);
      } else {
        // Show summary message
        setMessages(prev => [...prev, { 
          text: `מצאתי ${reports.length} דיווח${reports.length > 1 ? 'ים' : ''} קודמ${reports.length > 1 ? 'ים' : 'ם'} שלך. הנה סיכום:`, 
          isUser: false 
        }]);
        
        // Display each report in human tone
        for (let i = 0; i < Math.min(reports.length, 3); i++) { // Show max 3 reports
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
          
          // Create human-readable summary without calendar emoji
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
        
        // Support line at the end with nickname - add delay before showing
        await new Promise(resolve => setTimeout(resolve, 800));
        await showMessageWithTyping(`את לא לבד ${displayNickname} 💗`, 1500, false, "חושבת");
      }
      
      // After showing reports history, ask if they want to submit another report
      setTimeout(() => {
        showNewReportPrompt();
      }, 1500);
      
    } catch (error) {
      console.error('Error fetching reports:', error);
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isTyping);
        return [...filtered, { 
          text: "סליחה, לא הצלחתי לטעון את הדיווחים כרגע. אבל אני כאן כדי לעזור לך 💗", 
          isUser: false 
        }];
      });
      
      // After error, ask if they want to submit another report
      setTimeout(() => {
        showNewReportPrompt();
      }, 1500);
    }
  };

  // Show prompt asking if user wants to submit another report
  const showNewReportPrompt = () => {
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        text: "רוצה לדווח על משהו נוסף שקרה? או שאת מעדיפה לסיים לעת עתה?", 
        isUser: false 
      }]);
      
      setCurrentOptions(["כן, לדווח על משהו נוסף", "לסיים לעת עתה"]);
      setShowChips(true);
      setAllowMultipleSelection(false);
      setIsNewReportPrompt(true);
    }, 1000);
  };

  // Handle new report prompt choice
  const handleNewReportChoice = (choice) => {
    const userMessage = { text: choice, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setShowChips(false);
    setIsNewReportPrompt(false);
    
    if (choice === "לסיים לעת עתה") {
      // User wants to close chat - show closing message and music player
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          text: "זה בסדר גמור. אני כאן מתי שתרצי לחזור 💙", 
          isUser: false 
        }]);
        // Show music player based on the feeling they selected
        setShowMusicPlayer(true);
      }, 500);
    } else if (choice === "כן, לדווח על משהו נוסף") {
      // User wants to make another report - restart from messageText question
      setTimeout(() => {
        startNewReport();
      }, 500);
    }
  };

  // Start a new report flow (skip opening, nickname, feeling, email - restart from messageText)
  const startNewReport = () => {
    // Reset only the report-specific data, keep userIdentifier (nickname) and feeling
    setUserData(prev => ({
      userIdentifier: prev.userIdentifier, // Keep the nickname
      feeling: prev.feeling, // Keep the feeling for music player
      // Clear report-specific fields
      messageText: undefined,
      channel: undefined,
      senderType: undefined,
      extraContext: undefined,
      trustedAdultEmail: undefined
    }));
    
    // Start from messageText question (index 4 in questions array)
    setCurrentQuestionIndex(4);
    
    // Show messageText question
    setTimeout(() => {
      const messageQuestion = questions[4];
      setMessages(prev => [...prev, { 
        text: messageQuestion.text, 
        isUser: false 
      }]);
      
      // Show text input for messageText
      setShowChips(false);
      setAllowMultipleSelection(false);
    }, 500);
  };

  // Handle continuation choice
  const handleContinuationChoice = (choice) => {
    const userMessage = { text: choice, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setShowChips(false);
    setIsContinuationPrompt(false);
    
    if (choice === "לסיים לעת עתה") {
      // User wants to close chat - ask if they want to submit another report
      setTimeout(() => {
        showNewReportPrompt();
      }, 500);
    } else if (choice === "לראות סיכום הדיווחים שלי") {
      // User wants to see reports history
      setTimeout(() => {
        showReportsHistory();
      }, 500);
    } else if (choice === "לדווח על משהו נוסף") {
      // User wants to report another thing - start new report flow
      setTimeout(() => {
        startNewReport();
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
      const showTextInput = !isToneSelection && !isContinuationPrompt && !isNewReportPrompt && ((currentQuestion && currentQuestion.type === "text" && !analyzeLoading) || isWaitingForEmailInput);

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messagesContainer}>
        {/* Display all messages */}
        {messages.map((msg, index) => {
          // Determine if this is the first bot message in a sequence
          const isPreviousUserMessage = index === 0 || messages[index - 1].isUser;
          const showAvatarForThisMessage = !msg.isUser && isPreviousUserMessage;
          
          return (
            <div key={index} className={styles.messageWrapper}>
              <ChatBubble 
                message={msg.text} 
                isUser={msg.isUser} 
                isTyping={msg.isTyping}
                isEmailBadge={msg.isEmailBadge}
                typingText={msg.typingText || "חושבת"}
                avatar={logo}
                showAvatar={showAvatarForThisMessage}
              />
            </div>
          );
        })}
        
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
            disabled={analyzeLoading || (!inputText.trim() && !isExtraContextQuestion)}
          >
            שלחי
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;


