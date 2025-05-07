// SideBar/SideBar.js
import React, { useState } from 'react';
import styles from './Sidebar.module.css';
import { useApp } from '../../../context/AppContext';
// import { useCredits } from '../../../hooks/useCredits';

export default function Sidebar({ activeView, setContentView }) {
  const [activeNav, setActiveNav] = useState('agentes');
  const { agents, currentAgent, selectAgent, user } = useApp();
  // const credits = useCredits();
  
  // Calculate credits percentage
  // const creditsPercentage = credits.total > 0 
  //   ? ((credits.current / credits.total) * 100).toFixed(1) 
  //   : 0;

  const handleAgentClick = (event) => {
    event.preventDefault();
    setActiveNav('agentes');
    setContentView('agents');
  };

  const handleBalanceClick = () => {
    setActiveNav('balance');
    setContentView('balance');
  };

  const handleConversationsClick = () => {
    setActiveNav('conversas');
    setContentView('conversations');
  };

  const handleFunnelClick = () => {
    setActiveNav('funil');
    setContentView('funnel');
  };

  const handleLeadsClick = () => {
    setActiveNav('leads');
    setContentView('leads');
  };

  const handleMetricsClick = () => {
    setActiveNav('metricas');
    setContentView('metrics');
  };

  const handleProductsClick = () => {
    setActiveNav('produtos');
    setContentView('products');
  };

  const handlePaymentClick = () => {
    setActiveNav('payment');
    setContentView('payment');
  };
  
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#8A63FF" />
              <path d="M2 17L12 22L22 17" stroke="#8A63FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="#8A63FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>AnimusIA</span>
        </div>
      </div>
      
      <div className={styles.accountSelector}>
        <select className={styles.select}>
          <option>Conta agência</option>
          <option>Conta pessoal</option>
          <option>Conta empresarial</option>
        </select>
      </div>
      
      <button className={styles.createButton}>
        <span className={styles.plusIcon}>+</span>
        <span>Criar Agente AI</span>
      </button>

      <nav className={styles.nav}>
        <div className={styles.navSection}>
          <span className={styles.navTitle}>CRM</span>
          <ul>
            <li 
              className={activeNav === 'conversas' ? styles.active : ''} 
              onClick={handleConversationsClick}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0034 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92176 4.44061 8.37485 5.27072 7.03255C6.10083 5.69025 7.28825 4.6056 8.7 3.9C9.87812 3.30493 11.1801 2.99656 12.5 3H13C15.0843 3.11499 17.053 3.99476 18.5291 5.47086C20.0052 6.94696 20.885 8.91565 21 11V11.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Ver conversas</span>
            </li>
            <li 
              className={activeNav === 'funil' ? styles.active : ''} 
              onClick={handleFunnelClick}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Ver funil</span>
            </li>
            <li 
              className={activeNav === 'leads' ? styles.active : ''} 
              onClick={handleLeadsClick}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.55231C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Ver leads</span>
            </li>
            <li 
              className={activeNav === 'metricas' ? styles.active : ''} 
              onClick={handleMetricsClick}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 20V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Ver métricas</span>
            </li>
          </ul>
        </div>
        
        <div className={styles.navSection}>
          <span className={styles.navTitle}>FUNCIONÁRIOS AI</span>
          <ul>
            <li 
              className={activeNav === 'agentes' ? styles.active : ''} 
              onClick={handleAgentClick}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Seus Agentes AI ({agents.length})</span>
            </li>
          </ul>
        </div>

        <div className={styles.navSection}>
          <span className={styles.navTitle}>PRODUTOS E VENDAS</span>
          <ul>
            <li 
              className={activeNav === 'produtos' ? styles.active : ''} 
              onClick={handleProductsClick}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="3" width="15" height="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="16" y1="3" x2="16" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="1" y1="7" x2="16" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="16" x2="12" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="18" y1="16" x2="18" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="6" y1="16" x2="6" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Gerenciar Produtos</span>
            </li>
          </ul>
        </div>

        <div className={styles.navSection}>
          <span className={styles.navTitle}>FINANCEIRO</span>
          <ul>
            <li 
              className={activeNav === 'balance' ? styles.active : ''} 
              onClick={handleBalanceClick}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1V23M1 12H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M17 8.5C16 6.5 14 6.5 12 8.5C9 10.5 15 11.5 12 13.5C10 15.5 8 15.5 7 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Saldo</span>
            </li>
          </ul>
        </div>
      </nav>

      {/* <div className={styles.credits}>
        <div className={styles.creditsInfo}>
          <div className={styles.creditsTitle}>Créditos</div>
          <div className={styles.creditsValue}>{credits.current} / {credits.total}</div>
          <div className={styles.creditsProgress}>
            <div className={styles.creditsProgressBar} style={{width: `${creditsPercentage}%`}}></div>
          </div>
        </div>
        <button 
          className={styles.upgradeButton} 
          onClick={handlePaymentClick}
        >
          <span>Scale Up</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div> */}
    </aside>
  );
}