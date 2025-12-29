import styles from './Home.module.css';
import ChatInterface from '../../components/ChatInterface/ChatInterface.jsx';

const Home = () => {
  return (
    <div className={styles.home}>
      <ChatInterface />
    </div>
  );
};

export default Home;
