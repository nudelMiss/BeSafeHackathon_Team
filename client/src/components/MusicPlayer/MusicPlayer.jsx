import styles from './MusicPlayer.module.css';

// Music URLs mapped to feelings (these are example YouTube embed URLs)
// In production, your team can replace these with actual feeling-specific music
const feelingMusicMap = {
  "מבולבלת": "https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=0", // Lofi hip hop
  "פחד": "https://www.youtube.com/embed/5qap5aO4i9A?autoplay=0", // Calming music
  "עצב": "https://www.youtube.com/embed/Dx5qFachd3A?autoplay=0", // Peaceful piano
  "כעס": "https://www.youtube.com/embed/1ZYbU82GVz4?autoplay=0", // Nature sounds
  "חרדה": "https://www.youtube.com/embed/1ZYbU82GVz4?autoplay=0", // Meditation music
  "אחר": "https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=0", // Default calming
};

const MusicPlayer = ({ feeling }) => {
  // Get music URL based on feeling, or default
  const musicUrl = feelingMusicMap[feeling] || feelingMusicMap["אחר"];

  return (
    <div className={styles.musicContainer}>
      <p className={styles.musicLabel}>🎵 מוזיקה מרגיעה עבורך:</p>
      <div className={styles.videoWrapper}>
        <iframe
          src={musicUrl}
          title="Relaxing Music"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className={styles.musicPlayer}
        ></iframe>
      </div>
      <p className={styles.musicNote}>את יכולה לשלוט במוזיקה - לנגן, להשהות או לעצור</p>
    </div>
  );
};

export default MusicPlayer;

