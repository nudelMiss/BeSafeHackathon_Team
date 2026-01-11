import styles from './ChatBubble.module.css';

const ChatBubble = ({ message, isUser = false, isTyping = false, isEmailBadge = false }) => {
  return (
    <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.botBubble} ${isTyping ? styles.typing : ''} ${isEmailBadge ? styles.emailBadge : ''}`}>
      <p className={styles.messageText}>{message}</p>
      {isTyping && <span className={styles.typingIndicator}>...</span>}
    </div>
  );
};

export default ChatBubble;

