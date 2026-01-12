import styles from './ChatBubble.module.css';

const ChatBubble = ({ message, isUser = false, isTyping = false, isEmailBadge = false, typingText = "חושבת", avatar = null, showAvatar = false }) => {
  // Handle line breaks in message text
  const formatMessage = (text) => {
    if (!text) return '';
    return text.split('\n').map((line, index, array) => (
      <span key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div className={`${styles.bubbleWrapper} ${isUser ? styles.userBubbleWrapper : styles.botBubbleWrapper}`}>
      {!isUser && showAvatar && avatar && (
        <img src={avatar} alt="Bot" className={styles.avatar} />
      )}
      {!isUser && !showAvatar && (
        <div className={styles.avatarPlaceholder} />
      )}
      <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.botBubble} ${isTyping ? styles.typing : ''} ${isEmailBadge ? styles.emailBadge : ''}`}>
        {isTyping ? (
          <span className={styles.typingIndicator}>{typingText}...</span>
        ) : (
          <p className={styles.messageText}>{formatMessage(message)}</p>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;

