// import styles from './Home.module.css';
// import RandomDuck from '../../components/RandomDuck/RandomDuck.jsx';


// const Home = () => {
//   return (
//     <div className={styles.home}>
//       <h1 className={styles.headline}>Duck It</h1>
//       <RandomDuck />
//     </div>
//   );
// };

// export default Home;


import styles from "./Home.module.css";
import AnalyzeMessage from "../../components/AnalyzeMessage/AnalyzeMessage.jsx";

const Home = () => {
  return (
    <div className={styles.home}>
      <h1 className={styles.headline}>Analyze</h1>
      <AnalyzeMessage />
    </div>
  );
};

export default Home;
