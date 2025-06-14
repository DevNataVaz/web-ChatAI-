import React, { useState } from 'react';
import styles from './SideBar.module.css';
import { useApp } from '../../../context/AppContext';
import { useCredits } from '../../../hooks/useCredits';
import CreateAgentModal from '../Components/CreateAgenteModal/CreateAgenteModal';
import { socketService } from '../../../services/socketService';
import Logo from '../../../assets/logo-3.png';

export default function Sidebar({ activeView, setContentView }) {
  // Definindo "metricas" como a navegação inicial ativa
  const [activeNav, setActiveNav] = useState('metricas');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { agents, currentAgent, selectAgent, user, logout } = useApp();
  const credits = useCredits();

  const creditsPercentage = credits.total > 0
    ? ((credits.current / credits.total) * 100).toFixed(1)
    : 0;

  const handleAgentClick = (event) => {
    event.preventDefault();
    setActiveNav('agentes');
    setContentView('agents');
  };

  const handleBalancoClick = () => {
    setActiveNav('balanco');
    setContentView('balanco');
  };

  const handleConversationsClick = () => {
    setActiveNav('conversas');
    setContentView('conversations');
  };

  const handleGatilhoClick = () => {
    setActiveNav('gatilhos');
    setContentView('gatilho');
  };

  const handleDisparoClick = () => {
    setActiveNav('disparos');
    setContentView('disparos');
  };

  const handleMetricsClick = () => {
    setActiveNav('metricas');
    setContentView('metricas');
  };

  const handleAssinaturaClick = () => {
    setActiveNav('assinatura');
    setContentView('assinatura');
  };

  const handlePaymentClick = () => {
    setActiveNav('payment');
    setContentView('payment');
  };

  // Nova função para manipular o clique em Campanhas
  const handleCampaignsClick = () => {
    setActiveNav('campanhas');
    setContentView('campaigns');
  };

  const handleCreateAgentClick = () => {
    setShowCreateModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
  };

  const handleAgentCreated = () => {
    setShowCreateModal(false);
    // Optionally refresh agents list or show success message
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <aside className={styles.sidebar}>
        <div className={styles.logoContainer}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>
              <img src={Logo} alt="logo" />
            </span>
            <span className={styles.logoName}>Animus Chat Pro</span>
          </div>
        </div>

        {/* Profile section replacing the dropdown */}
        <div className={styles.profileSection}>
          <div className={styles.profileAvatar}>
            {user?.EMPRESA ? user.EMPRESA.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className={styles.profileInfo}>
            <div className={styles.profileName}>{user?.EMPRESA || 'Usuário'}</div>
            <div className={styles.profileType}>Conta Empresarial</div>
          </div>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navSection}>
            {/* <span className={styles.navTitle}>CRM</span> */}
            <ul>
              <li
                className={activeNav === 'conversas' ? styles.active : ''}
                onClick={handleConversationsClick}
                data-tooltip="Conversas"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0034 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92176 4.44061 8.37485 5.27072 7.03255C6.10083 5.69025 7.28825 4.6056 8.7 3.9C9.87812 3.30493 11.1801 2.99656 12.5 3H13C15.0843 3.11499 17.053 3.99476 18.5291 5.47086C20.0052 6.94696 20.885 8.91565 21 11V11.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Conversas</span>
              </li>

              <li
                className={activeNav === 'metricas' ? styles.active : ''}
                onClick={handleMetricsClick}
                data-tooltip="Métricas"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6 20V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Métricas</span>
              </li>
               <li
                className={activeNav === 'campanhas' ? styles.active : ''}
                onClick={handleCampaignsClick}
                data-tooltip="Campanhas"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 18V3H8C6.89543 3 6 3.89543 6 5V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9" cy="18" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 18H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Campanhas</span>
              </li>
                <li
                className={activeNav === 'balanco' ? styles.active : ''}
                onClick={handleBalancoClick}
                data-tooltip="Balanço"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1V23M1 12H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M17 8.5C16 6.5 14 6.5 12 8.5C9 10.5 15 11.5 12 13.5C10 15.5 8 15.5 7 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Balanço</span>
              </li>
            </ul>
          </div>

          <div className={styles.navSection}>
            {/* <span className={styles.navTitle}>AUTOMAÇÃO</span> */}
            <ul>
             
            </ul>
          </div>

          <div className={styles.navSection}>
            {/* <span className={styles.navTitle}>FINANCEIRO</span> */}
            <ul>
            
            </ul>
          </div>
        </nav>

        <div className={styles.credits}>
          <div className={styles.creditsInfo}>
            <div className={styles.creditsTitle}>Mensagens</div>
            {credits.isLoading && !credits.lastUpdated ? (
              <div className={styles.creditsLoading}>Carregando...</div>
            ) : (
              <>
                <div className={styles.creditsValue}>{credits.current} / {credits.total}</div>
                <div className={styles.creditsProgress}>
                  <div
                    className={styles.creditsProgressBar}
                    style={{ width: `${credits.percentage}%` }}
                  ></div>
                </div>
                {credits.error && (
                  <div className={styles.creditsErrorHint} title={credits.error}>
                    <small>Usando dados em cache</small>
                  </div>
                )}
              </>
            )}
          </div>
          <div className={styles.buttonGroup}>
            <button
              className={styles.upgradeButton}
              onClick={() => window.location.href = '/planos'}
            >
              <span>Upgrade</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              className={styles.logoutButton}
              onClick={handleLogout}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {showCreateModal && (
        <CreateAgentModal
          socketService={socketService}
          onClose={handleModalClose}
          onSuccess={handleAgentCreated}
        />
      )}
    </>
  );
}