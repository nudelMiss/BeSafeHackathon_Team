import { BrowserRouter, Routes, Route } from 'react-router'
import Home from './pages/HomePage/HomePage';
import { AnalyzeProvider } from './context/AnalyzeContext';
import styles from './styles/App.module.css';

import projectLogo from './assets/logo.png'

function App() {
  return (
    <AnalyzeProvider>
    <BrowserRouter>
      <div className={styles.app}>
        <header className={styles.appHeader}>
          <img src={projectLogo} alt="Logo" className={styles.appLogo} />
          <h1 className={styles.appTitle}>My Digital Sister</h1>
        </header>
        <main className={styles.main}>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </main>
        <footer className={styles.footer}>
          <p>My Digital Sister &copy; 2026</p>
        </footer>
      </div>
    </BrowserRouter>
    </AnalyzeProvider>
  );
}

export default App;
