import { useState, useEffect, useRef, useContext } from 'react';
import ChatBubble from '../ChatBubble/ChatBubble';
import ChipSelector from '../ChipSelector/ChipSelector';
import MusicPlayer from '../MusicPlayer/MusicPlayer';
import { AnalyzeContext } from '../../context/AnalyzeContext';
import styles from './ChatInterface.module.css';
import axiosInstance from '../../services/api';

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
  const [showFollowUp, setShowFollowUp] = useState(false);
  // Track special interaction modes
  const [isParentConsentPrompt, setIsParentConsentPrompt] = useState(false);
  const [isToneSelection, setIsToneSelection] = useState(false);
  const [replyOptionsData, setReplyOptionsData] = useState(null);
  const [isWaitingForEmailInput, setIsWaitingForEmailInput] = useState(false);
  
  // Store severity from backend (for resource selection)
  // eslint-disable-next-line no-unused-vars
  const [severity, setSeverity] = useState(null); // Stored for potential future use
  const severityRef = useRef('mild');
  
  // Reference to scroll to bottom of chat
  const messagesEndRef = useRef(null);

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
      text: "שלום! אני כאן כדי לעזור לך. בואי נתחיל - איך את מרגישה עכשיו?",
      type: "chips",
      key: "feeling",
      multiple: false,
      options: ["מבולבלת", "מבוכה", "סכנה", "פחד", "עצב", "כעס", "חרדה", "רגועה", "תקווה", "אחר"]
    },
    {
      text: "כתבי כאן את ההודעה שקיבלת שאת רוצה שאני אנתח",
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
    },
    {
      text: "אם יש דבר שמעורר דאגה, אנחנו אולי נרצה ליצור קשר עם מבוגר אחראי שנוכל לסמוך עליו.",
      type: "chips",
      key: "trustedAdultEmail",
      multiple: false,
      options: ["אזין מייל של מבוגר אחראי", "מעדיפה לא לתת מייל"]
    }
  ];

  // Resource options based on severity
  const resourceOptions = {
    mild: [
      "עזרה עצמית - טכניקות הרגעה",
      "משאבים מקוונים",
      "קהילת תמיכה",
      "טיפים להתמודדות"
    ],
    severe: [
      "עזרה מקצועית - פניה למטפל",
      "קווי חירום",
      "תמיכה מיידית",
      "ליווי מקצועי"
    ]
  };

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

  // Handle when user clicks a chip
  const handleChipSelect = (value) => {
    const currentQuestion = questions[currentQuestionIndex];
    
    // Handle email question chip selection
    if (currentQuestion.key === 'trustedAdultEmail') {
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
          setMessages(prev => [...prev, { text: "אוקיי, הזיני את המייל:", isUser: false }]);
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

    // Tone selection flow
    if (isToneSelection) {
      const toneKeyByLabel = {
        "תגובה עדינה": "gentle",
        "תגובה נחרצת": "assertive",
        "לא להגיב": "noReply",
      };
      const selectedKey = toneKeyByLabel[value];
      const replyText = replyOptionsData?.[selectedKey];

      // Show user's choice
      setMessages(prev => [...prev, { text: value, isUser: true }]);

      // Clear any lingering email input state
      setIsWaitingForEmailInput(false);
      
      // Show suggested reply from server with a delay
      if (replyText && selectedKey !== "noReply") {
        setTimeout(() => {
          setMessages(prev => [...prev, { 
            text: replyText, 
            isUser: false 
          }]);
          // After showing the reply, proceed to follow-up resources
          setTimeout(() => {
            showFollowUpResources(severityRef.current);
          }, 1000);
        }, 500);
      } else if (selectedKey === "noReply") {
        // If user chose not to reply, show acknowledgment and proceed
        setTimeout(() => {
          setMessages(prev => [...prev, { 
            text: "הבנתי, זה בסדר גמור לא להגיב.", 
            isUser: false 
          }]);
          setTimeout(() => {
            showFollowUpResources(severityRef.current);
          }, 1000);
        }, 500);
      } else {
        // If no reply text available, proceed directly
        showFollowUpResources(severityRef.current);
      }

      setIsToneSelection(false);
      setShowChips(false);
      return;
    }

    // Save the selected value in userData
    setUserData(prev => ({ ...prev, [currentQuestion.key]: value }));

    // Show user's selection as a message
    // For multiple selection, show array as comma-separated
    const displayText = Array.isArray(value) ? value.join(', ') : value;
    const userMessage = { text: displayText, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    
    // For single selection, hide chips and move to next question
    // For multiple selection, keep chips visible until user is done
    if (!currentQuestion.multiple) {
      setShowChips(false);
      moveToNextQuestion();
    }
    // If multiple selection, chips stay visible - user can add more or we wait for "done" button
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
        setMessages(prev => [...prev, { text: nextQuestion.text, isUser: false }]);
        
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
    setIsLoading(true);
    setShowChips(false);
    
    // Show loading message
    setMessages(prev => [...prev, { text: "אני מעבדת את המידע שלך...", isUser: false, isTyping: true }]);

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
      
      // Map channel values to English
      const channelMap = {
        "רשתות חברתיות": "social_media",
        "קבוצה": "group",
        "פרטי": "private"
      };
      
      // Map senderType values to English
      const senderTypeMap = {
        "מישהו שאני מכירה": "known",
        "זר": "unknown"
      };
      
      const context = {
        channel: channelMap[completeUserData.channel] || "group",
        senderType: senderTypeMap[completeUserData.senderType] || "unknown",
        feeling: completeUserData.feeling || "unknown"
      };
      
      // Build request payload as JSON
      const requestPayload = {
        nickname: completeUserData.userIdentifier || "anonymous",
        messageText,
        context,
        trustedAdultEmail: completeUserData.trustedAdultEmail?.trim() || null
      };
      
      console.log('trustedAdultEmail value:', completeUserData.trustedAdultEmail);
      console.log('Sending JSON to server:', JSON.stringify(requestPayload, null, 2));
      
      // Send userData to backend endpoint
      console.log('Making POST request to /reports...');
      const response = await axiosInstance.post('/reports', requestPayload);
      
      console.log('✅ Response received successfully!');
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Response data type:', typeof response.data);
      console.log('Response data keys:', Object.keys(response.data || {}));
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => !msg.isTyping));
      
      console.log('Full response from server:', JSON.stringify(response.data, null, 2));
      console.log('Response explanation:', response.data?.explanation);
      console.log('Response supportLine:', response.data?.supportLine);
      console.log('Response riskLevel:', response.data?.riskLevel);
      console.log('Response category:', response.data?.category);
      
      // ==========================================
      // MAP SERVER RESPONSE TO CLIENT SEVERITY LEVELS
      // ==========================================
      // Server returns Hebrew riskLevel values
      // Map to client severity: "severe" | "mild"
      // Save reply options for tone selection
      setReplyOptionsData(response.data?.replyOptions || null);

      // Define high-risk: Hebrew "גבוה"
      const isHighRisk = response.data?.riskLevel === "גבוה";
      const responseSeverity = isHighRisk ? "severe" : "mild";
      setSeverity(responseSeverity);
      severityRef.current = responseSeverity;
      
      // ==========================================
      // DISPLAY SERVER RESPONSE
      // ==========================================
      // Display explanation and supportLine as separate messages for better readability
      if (response.data?.explanation) {
        console.log('Adding explanation message to chat');
        setMessages(prev => [...prev, { 
          text: response.data.explanation, 
          isUser: false 
        }]);
        
        // Add support line as a separate message if it exists
        if (response.data.supportLine) {
          await new Promise(resolve => setTimeout(resolve, 800));
          console.log('Adding support line message to chat');
          setMessages(prev => [...prev, { 
            text: response.data.supportLine, 
            isUser: false 
          }]);
        }
      } else {
        console.error('No explanation in response!');
        setMessages(prev => [...prev, { 
          text: "קיבלתי את המידע שלך, אבל הייתה בעיה בעיבוד. נסי שוב או פני לעזרה מקצועית.", 
          isUser: false 
        }]);
      }
      
      // ==========================================
      // PROCEED TO TONE SELECTION
      // ==========================================
      // Proceed directly to tone selection
      await startToneSelection(response.data?.replyOptions);
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
      
      // Backend returns: { riskLevel, category, explanation, replyOptions, supportLine, userId, nickname, reportId, createdAt }
      const { riskLevel, explanation, replyOptions, supportLine } = analyzeResponse;
      
      // Map riskLevel to severity for resource selection
      // Backend returns Hebrew: "גבוה"/"בינוני"/"נמוך"
      // High/Medium = severe, Low = mild
      const severity = (riskLevel === "גבוה" || riskLevel === "בינוני") ? "severe" : "mild";
      
      // Display explanation as main response
      if (explanation) {
        displayResponseInChunks(explanation).then(() => {
          // Show support line after explanation
          if (supportLine) {
            setTimeout(async () => {
              await displayResponseInChunks(supportLine);
              // After response, show follow-up with music and reply options
              await showFollowUpResources(severity, replyOptions);
            }, 2000);
          } else {
            // If no supportLine, still show follow-up
            setTimeout(async () => {
              await showFollowUpResources(severity, replyOptions);
            }, 2000);
          }
        });
      } else {
        // If no explanation, show follow-up directly
        setTimeout(async () => {
          await showFollowUpResources(severity, replyOptions);
        }, 1000);
      }
    }
    
    if (analyzeError) {
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
    } finally {
      setIsLoading(false);
    }
  };

  // Show follow-up with music and resources (replyOptions from backend)
  const showFollowUpResources = async (severityLevel, replyOptions) => {
    // Wait a bit after the response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Show message about reply options
    setMessages(prev => [...prev, { 
      text: "בואי נחשוב יחד על איך להגיב. יש כאן כמה אפשרויות:", 
      isUser: false 
    }]);
    
    // Enable follow-up phase
    setShowFollowUp(true);
    
    // Convert replyOptions object to array of options
    if (replyOptions) {
      const options = [
        { label: `תגובה עדינה: ${replyOptions.gentle}`, value: "gentle" },
        { label: `תגובה תקיפה: ${replyOptions.assertive}`, value: "assertive" },
        { label: `לא להגיב: ${replyOptions.noReply}`, value: "noReply" }
      ];
      const chipOptions = options.map(opt => opt.label);
      setCurrentOptions(chipOptions);
      setShowChips(true);
      setAllowMultipleSelection(false);
    }
  };

  // Handle resource selection
  const handleResourceSelect = (resource) => {
    const userMessage = { text: resource, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setShowChips(false);
    
    // Show confirmation message
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        text: "מצוין! אני כאן אם תצטרכי עוד עזרה. זכרי - את לא לבד 💙", 
        isUser: false 
      }]);
      setShowFollowUp(false);
    }, 500);
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
  const showTextInput = !showFollowUp && !isToneSelection && ((currentQuestion && currentQuestion.type === "text" && !isLoading) || isWaitingForEmailInput);

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
            />
          </div>
        ))}
        
        {/* Show chips if current question uses them */}
        {showChips && currentOptions.length > 0 && (
          <div className={styles.chipWrapper}>
            <ChipSelector
              options={currentOptions}
              onSelect={showFollowUp ? handleResourceSelect : handleChipSelect}
              selectedValue={showFollowUp ? null : (userData[currentQuestion?.key] || (allowMultipleSelection ? [] : null))}
              multiple={allowMultipleSelection && !showFollowUp}
            />
            {/* Show "Done" button for multiple selection */}
            {allowMultipleSelection && !showFollowUp && Array.isArray(userData[currentQuestion?.key]) && userData[currentQuestion?.key].length > 0 && (
              <button
                onClick={handleMultipleSelectionDone}
                className={styles.doneButton}
              >
                סיימתי ✓
              </button>
            )}
          </div>
        )}

        {/* Show music player in follow-up phase */}
        {showFollowUp && userData.feeling && (
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

