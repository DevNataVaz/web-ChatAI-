// BotDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import styles from './BotDetail.module.css';
import { FiSettings, FiPlay, FiPause, FiEdit2, FiCopy, FiArrowLeft } from 'react-icons/fi';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';
import { Criptografar, Descriptografar } from '../../../../Cripto/index';
import { useApp } from '../../../../context/AppContext';

export default function BotDetail({ bot, onBack, socket }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [botName, setBotName] = useState(bot?.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [botInfo, setBotInfo] = useState(null);
  const { user } = useApp();

  // Get platform-specific icon
  const getPlatformIcon = () => {
    switch(bot?.platform) {
      case '0':
        return <FaWhatsapp size={24} className={styles.botTypeIcon} />;
      case '2':
        return <FaInstagram size={24} className={styles.botTypeIcon} />;
      default:
        return <FaWhatsapp size={24} className={styles.botTypeIcon} />;
    }
  };

  // Get platform name
  const getPlatformName = () => {
    switch(bot?.platform) {
      case '0':
        return 'WhatsApp';
      case '2':
        return 'Instagram';
      default:
        return 'Bot';
    }
  };

  // Check connection status
  const checkConnectionStatus = useCallback(() => {
    socket.emit('StatusWhatsapp', {
      Code: Criptografar('7668566448964451'),
      Identificador: Criptografar(bot.protocol),
    });

    socket.on(`updatesWhatsapp`, (data) => {
      if (Descriptografar(data.Code) !== '17326186765984') return;
      
      const status = Descriptografar(data.Dados) === 'true' || Descriptografar(data.Dados) === true;
      setIsConnected(status);
    });

    return () => {
      socket.off(`updatesWhatsapp`);
    };
  }, [bot, socket]);

  // Load bot information
  useEffect(() => {
    const getBotInfo = async () => {
      // You would normally fetch this information from your server
      // This is a placeholder for demonstration
      const botDetails = {
        name: bot.name,
        platform: bot.platform,
        protocol: bot.protocol,
        createdAt: new Date().toLocaleDateString(),
        status: isConnected ? 'active' : 'inactive'
      };
      
      setBotInfo(botDetails);
      setBotName(botDetails.name);
    };
    
    getBotInfo();
    checkConnectionStatus();
  }, [bot, checkConnectionStatus, isConnected]);

  // Start/Stop bot
// BotDetail.jsx - Atualização do método toggleBotStatus()
const toggleBotStatus = () => {
  if (isConnected) {
    setIsStopping(true);
    // Emitir evento de desconexão
    socket.emit('Whatsapp', {
      code: Criptografar('2544623544284'),  // Mesmo código para iniciar/parar
      conta: Criptografar(user?.LOGIN),
      Identificador: Criptografar(bot.protocol),
    });
    
    // Configurar listener para resposta
    socket.once('WhatsappResponse', (data) => {
      try {
        const code = Descriptografar(data.Code);
        if (code === '129438921435') {
          const mensagem = Descriptografar(data.Mensagem || '');
          
          if (mensagem.includes('desligada com Sucesso')) {
            setIsConnected(false);
            toast.success("Bot desconectado com sucesso");
          } else {
            toast.warning(mensagem || "Status do bot alterado");
          }
        }
      } catch (error) {
        console.error("Erro ao processar resposta:", error);
        toast.error("Erro ao desconectar bot");
      } finally {
        setIsStopping(false);
      }
    });
  } else {
    // Iniciar o bot (navegar de volta e clicar em iniciar)
    onBack(); // Volta para a lista de bots
    // Use setTimeout para permitir que a renderização ocorra antes de tentar iniciar o bot
    setTimeout(() => {
      const botElement = document.querySelector(`[data-protocol="${bot.protocol}"]`);
      if (botElement) {
        botElement.click();
      }
    }, 100);
  }
};
  // Copy bot ID to clipboard
  const copyBotId = () => {
    navigator.clipboard.writeText(bot.protocol);
    // You could show a toast notification here
  };

  // Save bot name
  const saveBotName = () => {
    // Emit event to update bot name
    // This is a placeholder for your actual implementation
    socket.emit('UpdateBotName', {
      Code: Criptografar('1234567890'),
      Login: Criptografar(user?.LOGIN),
      Protocolo: Criptografar(bot.protocol),
      Nome: Criptografar(botName)
    });
    
    setIsEditing(false);
  };

  return (
    <div className={styles.botDetailContainer}>
      <div className={styles.botDetailHeader}>
        <button className={styles.backButton} onClick={onBack}>
          <FiArrowLeft size={20} />
          <span>Voltar</span>
        </button>
        
        <div className={styles.botIcon}>
          {getPlatformIcon()}
        </div>
        
        <div className={styles.botInfo}>
          {isEditing ? (
            <div className={styles.editNameContainer}>
              <input
                type="text"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                className={styles.editNameInput}
                autoFocus
              />
              <button className={styles.saveNameButton} onClick={saveBotName}>
                Salvar
              </button>
            </div>
          ) : (
            <div className={styles.botName}>
              <h2>{botName}</h2>
              <button 
                className={styles.editNameButton} 
                onClick={() => setIsEditing(true)}
                aria-label="Editar nome"
              >
                <FiEdit2 size={16} />
              </button>
            </div>
          )}
          
          <p className={styles.botType}>
            {getPlatformIcon()} {getPlatformName()} Automation
          </p>
        </div>
        
        <div className={`${styles.connectionStatus} ${isConnected ? styles.connected : styles.disconnected}`}>
          <div className={styles.statusIndicator}></div>
          <span>{isConnected ? 'Conectado' : 'Desconectado'}</span>
        </div>
      </div>
      
      <div className={styles.botControls}>
        <button className={styles.settingsButton}>
          <FiSettings size={22} />
          <span>Configurações</span>
        </button>
        
        <button 
          className={`${styles.actionButton} ${isConnected ? styles.stopButton : styles.startButton}`}
          onClick={toggleBotStatus}
          disabled={isStarting || isStopping}
        >
          {isStarting || isStopping ? (
            <div className={styles.buttonSpinner}></div>
          ) : (
            isConnected ? <FiPause size={22} /> : <FiPlay size={22} />
          )}
          <span>{isStarting ? 'Iniciando...' : isStopping ? 'Parando...' : isConnected ? 'Parar' : 'Iniciar'}</span>
        </button>
      </div>
      
      <div className={styles.botDetailsSection}>
        <div className={styles.botIdContainer}>
          <div className={styles.detailLabel}>ID da Automação:</div>
          <div className={styles.botIdValue}>
            <span className={styles.idHash}># {bot.protocol}</span>
            <button className={styles.copyButton} onClick={copyBotId} aria-label="Copiar ID">
              <FiCopy size={16} />
            </button>
          </div>
        </div>
        
        {botInfo && (
          <div className={styles.botStatsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Plataforma</div>
              <div className={styles.statValue}>{getPlatformName()}</div>
            </div>
            
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Criado em</div>
              <div className={styles.statValue}>{botInfo.createdAt}</div>
            </div>
            
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Status</div>
              <div className={`${styles.statValue} ${styles.statusValue} ${isConnected ? styles.activeStatus : styles.inactiveStatus}`}>
                {isConnected ? 'Ativo' : 'Inativo'}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className={styles.instructionContainer}>
        <div className={styles.instructionIcon}>
          {isConnected ? (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18457 2.99721 7.13633 4.39828 5.49707C5.79935 3.85782 7.69279 2.71538 9.79619 2.24015C11.8996 1.76491 14.1003 1.98234 16.07 2.86" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 4L12 14.01L9 11.01" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#F44336" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 16V12" stroke="#F44336" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8H12.01" stroke="#F44336" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <p className={styles.instructionText}>
          {isConnected 
            ? 'Automação conectada e funcionando. Use o botão "Configurações" para personalizar seu bot.' 
            : 'Clique no botão "Iniciar" para conectar e ativar a automação.'}
        </p>
      </div>
    </div>
  );
}