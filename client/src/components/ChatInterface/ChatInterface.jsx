import { useState, useEffect, useRef } from 'react';
import ChatBubble from '../ChatBubble/ChatBubble';
import ChipSelector from '../ChipSelector/ChipSelector';
import MusicPlayer from '../MusicPlayer/MusicPlayer';
import styles from './ChatInterface.module.css';
// import axiosInstance from '../../services/api'; // Uncomment when backend is ready

const ChatInterface = () => {
  // State for managing messages in the chat
  const [messages, setMessages] = useState([]);
  
  // Track which question we're currently on (0 = first question)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Store all user answers in an object
  const [userData, setUserData] = useState({});
  
  // Track if we're waiting for backend response
  const [isLoading, setIsLoading] = useState(false);
  
  // Control whether to show chip buttons or text input
  const [showChips, setShowChips] = useState(false);
  
  // Store the options for current chip question
  const [currentOptions, setCurrentOptions] = useState([]);
  
  // Track if current question allows multiple selection
  const [allowMultipleSelection, setAllowMultipleSelection] = useState(false);
  
  // Track if we're in the follow-up phase (after initial response)
  const [showFollowUp, setShowFollowUp] = useState(false);
  
  // Store severity from backend (for resource selection)
  // eslint-disable-next-line no-unused-vars
  const [severity, setSeverity] = useState(null); // Stored for potential future use
  
  // Reference to scroll to bottom of chat
  const messagesEndRef = useRef(null);

  // Define all questions we want to ask
  const questions = [
    {
      text: "שלום! אני כאן כדי לעזור לך. בואי נתחיל - איך את מרגישה עכשיו? (אפשר לבחור כמה רגשות)",
      type: "chips",
      key: "feelings",  // Changed to plural - will be an array
      multiple: true,  // Allow multiple selection
      options: ["מבולבלת", "פחד", "עצב", "כעס", "חרדה", "תקווה", "אחר"]
    },
    {
      text: "מה קרה? ספרי לי בקצרה על האירוע שחווית.",
      type: "text",  // User will type their answer
      key: "incident"
    },
    {
      text: "איפה זה קרה?",
      type: "chips",
      key: "location",
      options: ["רשתות חברתיות", "אפליקציות הודעות", "אתר אינטרנט", "משחקים מקוונים", "אחר"]
    },
    {
      text: "האם את רוצה שנעזור לך לטפל בזה?",
      type: "chips",
      key: "wantsHelp",
      options: ["כן, אני רוצה עזרה", "אני לא בטוחה", "לא כרגע"]
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
    const welcomeMessage = "שלום! אני כאן כדי לעזור לך. בואי נתחיל - איך את מרגישה עכשיו? (אפשר לבחור כמה רגשות)";
    setMessages([{ text: welcomeMessage, isUser: false }]);
    setShowChips(true);
    setCurrentOptions(questions[0].options);
    setAllowMultipleSelection(questions[0].multiple || false);
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
          setCurrentOptions(nextQuestion.options);
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

  // Send collected data to backend
  const submitData = async () => {
    setIsLoading(true);
    setShowChips(false);
    
    // Show loading message
    setMessages(prev => [...prev, { text: "אני מעבדת את המידע שלך...", isUser: false, isTyping: true }]);

    // ============================================
    // TEMPORARY MOCK FOR TESTING - REMOVE WHEN BACKEND IS READY
    // ============================================
    // TODO: Replace this mock with actual backend call:
    // const response = await axiosInstance.post('/incidents', userData);
    
    // Simulate backend delay (like real API call)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Remove typing indicator
    setMessages(prev => prev.filter(msg => !msg.isTyping));
    
    // MOCK RESPONSE - This is temporary for testing UI
    // In real backend, severity will be calculated based on userData
    // Backend should return: { success: true, severity: "mild"|"severe", message: "..." }
    
    // Simulate severity assessment (backend will do this properly)
    const feelings = Array.isArray(userData.feelings) ? userData.feelings : [];
    const severeFeelings = ["פחד", "חרדה", "כעס"];
    const hasSevereFeeling = feelings.some(f => severeFeelings.includes(f));
    const mockSeverity = hasSevereFeeling ? "severe" : "mild";
    
    // Create contextual response based on severity (subtle signals - not showing severity directly)
    let severitySignal = "";
    if (mockSeverity === "severe") {
      severitySignal = "אני רואה שזה משפיע עלייך מאוד. חשוב שתדעי שיש עזרה מקצועית זמינה עבורך.";
    } else {
      severitySignal = "יש לך כלים להתמודד עם זה, ואנחנו כאן כדי לתמוך בך.";
    }
    
    const mockResponse = {
      data: {
        success: true,
        severity: mockSeverity,  // Backend should return this (not shown to user directly)
        message: `[MOCK RESPONSE - FOR TESTING ONLY] תודה ששיתפת אותי. זה לא קל לדבר על דברים כאלה, ואני גאה בך שהגעת לכאן. ${severitySignal} מה שקרה לך לא בסדר, ואת לא אשמה. בואי נחשוב יחד על דרכים להתמודד עם זה. יש לך תמיכה כאן. זכרי - את לא לבד.`
      }
    };
    
    // Extract severity from response (backend will provide this)
    const responseSeverity = mockResponse.data.severity || mockSeverity;
    setSeverity(responseSeverity);
    
    // Display mock response in chunks
    if (mockResponse.data && mockResponse.data.message) {
      await displayResponseInChunks(mockResponse.data.message);
    }
    
    // After response, show follow-up with music and resources
    await showFollowUpResources(responseSeverity);
    
    setIsLoading(false);
    
    // ============================================
    // END OF TEMPORARY MOCK
    // ============================================
    
    /* ORIGINAL BACKEND CODE (commented out for now):
    try {
      // Send userData to backend endpoint
      const response = await axiosInstance.post('/incidents', userData);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => !msg.isTyping));
      
      // Extract severity from backend response (backend calculates this)
      const responseSeverity = response.data?.severity || "mild";
      setSeverity(responseSeverity);
      
      // If backend returns a message, display it in chunks
      if (response.data && response.data.message) {
        await displayResponseInChunks(response.data.message);
      }
      
      // After response, show follow-up with music and resources
      const feelings = Array.isArray(userData.feelings) ? userData.feelings : [];
      const primaryFeeling = feelings[0] || "אחר";
      await showFollowUpResources(responseSeverity, primaryFeeling);
    } catch (error) {
      console.error('Error submitting data:', error);
      // Remove typing indicator and show error
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isTyping);
        return [...filtered, { text: "סליחה, הייתה שגיאה. נסי שוב מאוחר יותר.", isUser: false }];
      });
    } finally {
      setIsLoading(false);
    }
    */
  };

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

  // Show follow-up with music and resources
  const showFollowUpResources = async (severityLevel) => {
    // Wait a bit after the response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Show message about resources
    setMessages(prev => [...prev, { 
      text: "בואי נחשוב יחד על מה שיכול לעזור לך. יש כאן כמה אפשרויות:", 
      isUser: false 
    }]);
    
    // Enable follow-up phase
    setShowFollowUp(true);
    setCurrentOptions(resourceOptions[severityLevel] || resourceOptions.mild);
    setShowChips(true);
    setAllowMultipleSelection(false);
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
  const showTextInput = currentQuestion && currentQuestion.type === "text" && !isLoading;

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
            disabled={isLoading}
          />
          <button
            onClick={() => {
              handleTextSubmit(inputText);
              setInputText('');
            }}
            className={styles.sendButton}
            disabled={isLoading || !inputText.trim()}
          >
            שלחי
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;

