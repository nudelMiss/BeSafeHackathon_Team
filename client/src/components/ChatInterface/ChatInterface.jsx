import { useState, useEffect, useRef, useContext } from 'react';
import ChatBubble from '../ChatBubble/ChatBubble';
import ChipSelector from '../ChipSelector/ChipSelector';
import MusicPlayer from '../MusicPlayer/MusicPlayer';
import { AnalyzeContext } from '../../context/AnalyzeContext';
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
  
  // Track if we're in the follow-up phase (after initial response)
  const [showFollowUp, setShowFollowUp] = useState(false);
  
  // Reference to scroll to bottom of chat
  const messagesEndRef = useRef(null);

  // Define all questions we want to ask - MATCHED TO BACKEND REQUIREMENTS
  const questions = [
    {
      text: "שלום! אני כאן כדי לעזור לך. בואי נתחיל - איך את רוצה להיקרא? (כינוי)",
      type: "text",  // User will type their nickname
      key: "nickname"  // Required by backend
    },
    {
      text: "איך את מרגישה עכשיו? (אפשר לבחור כמה רגשות)",
      type: "chips",
      key: "feelings",  // Array of feelings - matches backend context.feelings
      multiple: true,  // Multiple selection - backend expects array
      options: ["מבולבלת", "פחד", "עצב", "כעס", "חרדה", "תקווה", "אחר"]
    },
    {
      text: "מה קרה? ספרי לי בקצרה על האירוע או ההודעה שקיבלת.",
      type: "text",  // User will type their answer - maps to messageText
      key: "messageText"  // Matches backend messageText
    },
    {
      text: "איפה זה קרה?",
      type: "chips",
      key: "channel",  // Maps to backend context.channel (Hebrew values)
      options: [
        { label: "שיחה פרטית", value: "פרטי" },
        { label: "קבוצה/צ'אט קבוצתי", value: "קבוצה" }
      ]
    },
    {
      text: "מי שלח את ההודעה?",
      type: "chips",
      key: "senderType",  // Maps to backend context.senderType (Hebrew values)
      options: [
        { label: "מישהו שאני לא מכירה", value: "זר" },
        { label: "מישהו שאני מכירה", value: "מוכר" }
      ]
    }
  ];

  // Resource options will come from backend replyOptions

  // Auto-scroll to bottom when new messages appear
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat with welcome message when component loads
  useEffect(() => {
    const welcomeMessage = questions[0].text;
    setMessages([{ text: welcomeMessage, isUser: false }]);
    // First question is text input (nickname), not chips
    setShowChips(false);
    setAllowMultipleSelection(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // questions is stable, no need to include in deps

  // Handle when user submits text input
  const handleTextSubmit = (text) => {
    if (!text.trim()) return;  // Don't submit empty text

    // Add user's message to chat
    const userMessage = { text: text.trim(), isUser: true };
    setMessages(prev => [...prev, userMessage]);
    
    // Save the answer in userData object
    const currentQuestion = questions[currentQuestionIndex];
    setUserData(prev => ({ ...prev, [currentQuestion.key]: text.trim() }));

    // Move to next question
    moveToNextQuestion();
  };

  // Handle when user clicks a chip
  const handleChipSelect = (value) => {
    const currentQuestion = questions[currentQuestionIndex];
    
    // Find the option object if it exists (for label/value pairs)
    const optionObj = currentQuestion.options.find(opt => 
      typeof opt === 'object' ? (opt.label === value || opt.value === value) : opt === value
    );
    
    // For multiple selection (feelings array)
    if (currentQuestion.multiple) {
      const currentSelections = Array.isArray(userData[currentQuestion.key]) 
        ? userData[currentQuestion.key] 
        : [];
      const actualValue = typeof optionObj === 'object' ? optionObj.value : value;
      const isSelected = currentSelections.includes(actualValue);
      
      let newSelections;
      if (isSelected) {
        // Remove from selection
        newSelections = currentSelections.filter(item => item !== actualValue);
      } else {
        // Add to selection
        newSelections = [...currentSelections, actualValue];
      }
      
      setUserData(prev => ({ ...prev, [currentQuestion.key]: newSelections }));
      
      // Show updated selection as message
      const displayText = newSelections.length > 0 
        ? newSelections.join(', ') 
        : 'לא נבחר';
      const userMessage = { text: displayText, isUser: true };
      setMessages(prev => {
        // Remove previous selection message if exists, add new one
        const filtered = prev.filter((msg, idx) => 
          !(msg.isUser && idx === prev.length - 1 && prev.length > 1)
        );
        return [...filtered, userMessage];
      });
    } else {
      // Single selection (channel, senderType)
      const actualValue = typeof optionObj === 'object' ? optionObj.value : value;
      setUserData(prev => ({ ...prev, [currentQuestion.key]: actualValue }));

      // Show user's selection as a message (display label if object, otherwise value)
      const displayText = typeof optionObj === 'object' ? optionObj.label : value;
      const userMessage = { text: displayText, isUser: true };
      setMessages(prev => [...prev, userMessage]);
      
      // Hide chips and move to next question
      setShowChips(false);
      moveToNextQuestion();
    }
  };

  // Handle when user is done with multiple selection
  const handleMultipleSelectionDone = () => {
    setShowChips(false);
    moveToNextQuestion();
  };

  // Move to next question or submit data if all questions answered
  const moveToNextQuestion = () => {
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
      submitData();
    }
  };

  // Send collected data to backend using AnalyzeContext
  const submitData = async () => {
    setShowChips(false);
    
    // Show loading message
    setMessages(prev => [...prev, { text: "אני מעבדת את המידע שלך...", isUser: false, isTyping: true }]);

    try {
      // Prepare request body matching backend API structure
      const requestBody = {
        nickname: userData.nickname,  // Required by backend
        messageText: userData.messageText,  // The incident text
        context: {
          channel: userData.channel,  // "פרטי" or "קבוצה" (Hebrew)
          senderType: userData.senderType,  // "זר" or "מוכר" (Hebrew)
          feelings: Array.isArray(userData.feelings) ? userData.feelings : []  // Array of feelings (Hebrew)
        }
      };

      // Call backend API using AnalyzeContext
      await analyzeMessage(requestBody);
      
      // Wait for response (analyzeLoading will be false when done)
      // The response will be in analyzeResponse
      
    } catch (error) {
      console.error('Error submitting data:', error);
      // Remove typing indicator and show error
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isTyping);
        return [...filtered, { text: "סליחה, הייתה שגיאה. נסי שוב מאוחר יותר.", isUser: false }];
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
        return [...filtered, { text: "סליחה, הייתה שגיאה. נסי שוב מאוחר יותר.", isUser: false }];
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyzeResponse, analyzeLoading, analyzeError]); // displayResponseInChunks and showFollowUpResources are stable

  // Display backend response in chunks to simulate live chat
  const displayResponseInChunks = async (fullResponse) => {
    // Split response into sentences
    const chunks = fullResponse.split(/[.!?]\s+/).filter(chunk => chunk.trim());
    
    // Display each chunk with a delay (like someone is typing)
    for (let i = 0; i < chunks.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5 seconds
      setMessages(prev => [...prev, { 
        text: chunks[i].trim() + (i < chunks.length - 1 ? '.' : ''), 
        isUser: false 
      }]);
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
  const showTextInput = currentQuestion && currentQuestion.type === "text" && !analyzeLoading;

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
        {showFollowUp && userData.feelings && Array.isArray(userData.feelings) && userData.feelings.length > 0 && (
          <MusicPlayer feeling={userData.feelings[0]} />
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

