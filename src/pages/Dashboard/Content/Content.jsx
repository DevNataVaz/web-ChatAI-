// Content.jsx
import React, { useState, useEffect, useCallback } from 'react';
import styles from './Content.module.css';
import { useApp } from '../../../context/AppContext';
import { useAgentMetrics } from '../../../hooks/useAgentMetrics';
import QRCodeModal from '../QRCode/QrCode.jsx';
import CreateAgentModal from '../Components/CreateAgentModal.jsx';
import BotDetail from '../Components/BotDetail/BotDetail.jsx';
import { socketService } from '../../../services/socketService.js';
import { Criptografar, Descriptografar } from '../../../Cripto';

// Bot platform icons
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';
import { FiPlus, FiSettings, FiPlay } from 'react-icons/fi';

export default function Content() {
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const { user } = useApp();
  
  const [showQRModal, setShowQRModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [qrCodeData, setQRCodeData] = useState("");
  const [bots, setBots] = useState([]);
  const [selectedBot, setSelectedBot] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({});
  const [botLimit, setBotLimit] = useState(0);

  // Fetch bots data
  const fetchBots = useCallback(async () => {
    setIsLoadingContent(true);
    
    try {
      // Adapt this to your actual API/Socket implementation
      const get = {
        Code: '234645423654423465',
        Login: user?.LOGIN, // Use your context's user login
      };
      
      Socket.socket.emit('MeusRobos', Criptografar(JSON.stringify(get)));

      Socket.socket.once('MeusRobosResponse', (data) => {
        const {Code, Dados, Limite} = JSON.parse(Descriptografar(data));
        
        if (Code !== '6253442653442365') return;
        
        setBotLimit(Limite);
        
        // Transform the data to match our frontend needs
        const botsData = Dados.map((item, index) => ({
          id: String(index + 1),
          name: item.DADOS[0]?.EMPRESA || 'Bot',
          platform: item.DADOS[0]?.REDE || '0',
          protocol: item.PROTOCOLO,
          login: item.DADOS[0]?.LOGIN,
          connected: false // Default to disconnected
        }));
        
        setBots(botsData);
        setIsLoadingContent(false);
      });
    } catch (error) {
      console.error("Error fetching bots:", error);
      setIsLoadingContent(false);
    }
  }, [user]);

  // Check bot connection status
  const checkBotStatus = useCallback((protocol) => {
    Socket.socket.emit('StatusWhatsapp', {
      Code: Criptografar('7668566448964451'),
      Identificador: Criptografar(protocol),
    });

    // Listen for updates
    Socket.socket.on(`updatesWhatsapp`, (data) => {
      if (Descriptografar(data.Code) !== '17326186765984') return;
      
      const isConnected = Descriptografar(data.Dados) === 'true' || Descriptografar(data.Dados) === true;
      
      setConnectionStatus(prev => ({
        ...prev,
        [protocol]: isConnected
      }));
      
      // Close QR modal if bot is connected
      if (isConnected && selectedBot?.protocol === protocol) {
        setShowQRModal(false);
      }
    });
  }, [selectedBot]);

  // Handle QR Code generation
  useEffect(() => {
    Socket.socket.on(`WhatsappQR`, (data) => {
      if (Descriptografar(data.Code) === '129438921435') {
        setQRCodeData(Descriptografar(data.QRCODE));
        setShowQRModal(true);
      }
    });

    return () => {
      Socket.socket.off(`WhatsappQR`);
    };
  }, []);

  // Load bot data on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchBots();
    }
  }, [fetchBots, user]);

  // Check connection status for all bots
  useEffect(() => {
    bots.forEach(bot => {
      checkConnectionStatus(bot.protocol);
    });
    
    return () => {
      Socket.socket.off(`updatesWhatsapp`);
    };
  }, [bots, checkConnectionStatus]);

  // Handle saving bot behavior
  // Start or connect bot
  const handleStartBot = (bot) => {
    setSelectedBot(bot);
    
    // If already connected, navigate to management
    if (connectionStatus[bot.protocol]) {
      // Just navigate to management view
      console.log("Already connected, navigate to management");
    } else {
      // Request QR Code
      Socket.socket.emit('Whatsapp', {
        code: Criptografar('2544623544284'),
        conta: Criptografar(user?.LOGIN),
        Identificador: Criptografar(bot.protocol),
      });
    }
  };

  // Handle creating a new bot
  const handleCreateBot = () => {
    if (bots.length >= botLimit) {
      alert("Você atingiu o limite máximo de automações permitidas pelo seu plano atual.");
      return;
    }
    setShowCreateModal(true);
  };

  // Handle successful bot creation
  const handleBotCreated = () => {
    setShowCreateModal(false);
    fetchBots(); // Refresh bot list
  };

  // Platform-specific icon renderer
  const renderPlatformIcon = (platform) => {
    switch(platform) {
      case BOT_TYPES.WHATSAPP:
        return <FaWhatsapp className={styles.botPlatformIcon} />;
      case BOT_TYPES.INSTAGRAM:
        return <FaInstagram className={styles.botPlatformIcon} />;
      default:
        return <FaWhatsapp className={styles.botPlatformIcon} />;
    }
  };

  // Platform name renderer
  const getPlatformName = (platform) => {
    switch(platform) {
      case BOT_TYPES.WHATSAPP:
        return 'WhatsApp';
      case BOT_TYPES.INSTAGRAM:
        return 'Instagram';
      default:
        return 'Aplicativo';
    }
  };

  // Render Content for the bots dashboard (main view)
  const renderBotsDashboard = () => {
    if (isLoadingContent) {
      return (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Carregando bots...</p>
        </div>
      );
    }

    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.dashboardHeader}>
          <div className={styles.dashboardTitle}>
            <h1>Minhas Automações</h1>
            <p>Gerencie seus bots</p>
          </div>
          <div className={styles.dashboardActions}>
            <div className={styles.botLimitBadge}>
              <span>{bots.length}/{botLimit} bots</span>
            </div>
          </div>
        </div>

        <div className={styles.botsGrid}>
          {bots.length > 0 ? (
            bots.map(bot => (
              <div 
                key={bot.id} 
                className={styles.botCard}
                onClick={() => handleStartBot(bot)}
              >
                <div className={styles.botIconContainer}>
                  <div className={`${styles.botIcon} ${connectionStatus[bot.protocol] ? styles.connected : ''}`}>
                    {renderPlatformIcon(bot.platform)}
                  </div>
                </div>
                <div className={styles.botInfo}>
                  <h3>{bot.name}</h3>
                  <div className={styles.botPlatform}>
                    {renderPlatformIcon(bot.platform)}
                    <span>{getPlatformName(bot.platform)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Nenhuma automação encontrada</h3>
              <p>Clique no botão + para criar sua primeira automação.</p>
            </div>
          )}
        </div>

        <button 
          className={styles.createBotButton}
          onClick={handleCreateBot}
          disabled={bots.length >= botLimit}
        >
          <FiPlus size={24} />
        </button>
      </div>
    );
  };

  // Render Content for a specific agent's configuration (after selecting a bot)
  const renderBotConfiguration = () => {
    if (!selectedBot || isLoadingContent) {
      return (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Carregando configurações...</p>
        </div>
      );
    }

    return (
      <BotDetail
        bot={selectedBot}
        onBack={() => setSelectedBot(null)}
        socket={Socket.socket}
      />
    );
  };

  // If we're viewing a specific bot's details
  if (selectedBot) {
    return renderBotConfiguration();
  }

  // If we're loading content
  if (isLoadingContent) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Carregando automações...</p>
      </div>
    );
  }

  // Otherwise, show the bots dashboard (main view)
  return (
    <div className={styles.mobileContainer}>
      <div className={styles.headerGradient}>
        <div className={styles.headerContent}>
          <h1>Minhas Automações</h1>
          <p>Gerencie seus bots</p>
          
          <div className={styles.botLimitBadge}>
            <span>{bots.length}/{botLimit} bots</span>
          </div>
        </div>
      </div>

      <div className={styles.botsContainer}>
        {bots.length > 0 ? (
          <div className={styles.botsGrid}>
            {bots.map(bot => (
              <div 
                key={bot.id} 
                className={styles.botCard}
                onClick={() => handleStartBot(bot)}
              >
                <div className={styles.botIconContainer}>
                  <div className={`${styles.botIconCircle} ${connectionStatus[bot.protocol] ? styles.connected : ''}`}>
                    {bot.platform === '0' ? (
                      <FaWhatsapp className={styles.botIcon} />
                    ) : (
                      <FaInstagram className={styles.botIcon} />
                    )}
                  </div>
                </div>
                <div className={styles.botName}>{bot.name}</div>
                <div className={styles.botPlatform}>
                  <FiMessageCircle size={12} />
                  <span>
                    {bot.platform === '0' ? 'WhatsApp' : 'Instagram'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <FaRobot size={60} className={styles.emptyIcon} />
            <p>Nenhuma automação encontrada.<br/>
            Clique no botão + para criar sua primeira automação.</p>
          </div>
        )}
      </div>

      <button 
        className={styles.addButton}
        onClick={handleCreateBot}
        disabled={bots.length >= botLimit}
      >
        <FiPlus size={24} />
      </button>

      {/* QR Code Modal */}
      {showQRModal && selectedBot && (
        <QRCodeModal 
          visible={showQRModal}
          qrCodeData={qrCodeData}
          onClose={() => setShowQRModal(false)}
        />
      )}

      {/* Create Agent Modal */}
      {showCreateModal && (
        <CreateAgentModal 
          socket={Socket.socket}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleBotCreated}
        />
      )}
    </div>
  );
}