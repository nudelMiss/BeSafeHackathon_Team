import { useState, useEffect, useRef } from 'react';
import ChatBubble from '../ChatBubble/ChatBubble';
import ChipSelector from '../ChipSelector/ChipSelector';
import styles from './ChatInterface.module.css';
import axiosInstance from '../../services/api';

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
  
  // Reference to scroll to bottom of chat
  const messagesEndRef = useRef(null);

  // Define all questions we want to ask
  const questions = [
    {
      text: "שלום! אני כאן כדי לעזור לך. בואי נתחיל - מה קרה? ספרי לי בקצרה על האירוע שחווית.",
      type: "text",  // User will type their answer
      key: "incident"  // Save answer under this key in userData
    },
    {
      text: "איפה זה קרה?",
      type: "chips",  // User will select from chips
      key: "location",
      options: ["רשתות חברתיות", "אפליקציות הודעות", "אתר אינטרנט", "משחקים מקוונים", "אחר"]
    },
    {
      text: "איך את מרגישה עכשיו?",
      type: "chips",
      key: "feeling",
      options: ["מבולבלת", "פחד", "עצב", "כעס", "חרדה", "אחר"]
    },
    {
      text: "האם את רוצה שנעזור לך לטפל בזה?",
      type: "chips",
      key: "wantsHelp",
      options: ["כן, אני רוצה עזרה", "אני לא בטוחה", "לא כרגע"]
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
    const welcomeMessage = "שלום! אני כאן כדי לעזור לך. בואי נתחיל - מה קרה? ספרי לי בקצרה על האירוע שחווית.";
    setMessages([{ text: welcomeMessage, isUser: false }]);
    setShowChips(false);
  }, []);

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
    const userMessage = { text: value, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setShowChips(false);  // Hide chips after selection

    // Move to next question
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

    try {
      // Send userData to backend endpoint
      // NOTE: You need to create this endpoint in your backend!
      const response = await axiosInstance.post('/incidents', userData);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => !msg.isTyping));
      
      // If backend returns a message, display it in chunks
      if (response.data && response.data.message) {
        await displayResponseInChunks(response.data.message);
      }
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
              onSelect={handleChipSelect}
              selectedValue={userData[currentQuestion?.key]}
            />
          </div>
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

