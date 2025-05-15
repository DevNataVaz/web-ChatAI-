// BotDashboard.jsx - Versão corrigida
import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './BotDashboard.module.css';
import { useApp } from '../../../context/AppContext';
import CreateAgentModal from '../Components/CreateAgentModal.jsx';
import BotDetail from '../Components/BotDetail/BotDetail.jsx';
import { socketService } from '../../../services/socketService.js';
import { Criptografar, Descriptografar } from '../../../Cripto/index.jsx';
import { toast } from 'react-toastify';
import LoadingScreen from '../../../components/loading/LoadingScreen.jsx'

// Bot platform icons
import { FaWhatsapp, FaInstagram, FaRobot } from 'react-icons/fa';
import { FiPlus, FiMessageCircle, FiRefreshCw } from 'react-icons/fi';

export default function BotDashboard() {
  const { user } = useApp();

  // Estados do componente
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [qrCodeData, setQRCodeData] = useState("");
  const [qrCodeLoading, setQrCodeLoading] = useState(false);
  const [currentQrProtocol, setCurrentQrProtocol] = useState(null);
  const [bots, setBots] = useState([]);
  const [selectedBot, setSelectedBot] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({});
  const [botLimit, setBotLimit] = useState(0);
  const [error, setError] = useState(null);

  // Refs para evitar stale closures e dependências cíclicas
  const connectionStatusRef = useRef({});
  const currentQrProtocolRef = useRef(null);
  const eventListenersSetRef = useRef(false);

  // Atualizar refs quando os estados mudarem
  useEffect(() => {
    connectionStatusRef.current = connectionStatus;
    currentQrProtocolRef.current = currentQrProtocol;
  }, [connectionStatus, currentQrProtocol]);

  // Fetch bots data com melhor tratamento de erros
  const fetchBots = useCallback(async () => {
    if (!user?.LOGIN) {
      setError("Usuário não identificado. Faça login novamente.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const get = {
        Code: '234645423654423465',
        Login: user.LOGIN,
      };

      socketService.emit('MeusRobos', Criptografar(JSON.stringify(get)));

      const handleBotsResponse = (data) => {
        try {
          const decryptedData = Descriptografar(data);
          const { Code, Dados, Limite } = JSON.parse(decryptedData);

          if (Code !== '6253442653442365') {
            throw new Error("Código de resposta inválido");
          }

          setBotLimit(Limite || 0);

          // Transform the data for frontend
          const botsData = Dados.map((item, index) => ({
            id: String(index + 1),
            name: item.DADOS[0]?.EMPRESA || 'Bot',
            platform: item.DADOS[0]?.REDE || '0',
            protocol: item.PROTOCOLO,
            login: item.DADOS[0]?.LOGIN
          }));

          setBots(botsData);
        } catch (err) {
          console.error("Erro ao processar dados de bots:", err);
          toast.error("Erro ao processar dados dos agentes");
          setBots([]);
        } finally {
          setIsLoading(false);
          setRefreshing(false);
        }
      };

      // Use once para evitar múltiplos handlers
      socketService.once('MeusRobosResponse', handleBotsResponse);
    } catch (error) {
      console.error("Erro ao buscar bots:", error);
      setError("Não foi possível carregar seus agentes.");
      toast.error("Falha ao carregar seus agentes");
      setIsLoading(true);
      setRefreshing(true);
    }
  }, [user]);

  // Refresh the bot list
  const refreshBots = useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);
    fetchBots();
  }, [refreshing, fetchBots]);

  // Check connection status for a specific bot
  const checkBotStatus = useCallback((protocol) => {
    if (!protocol) return;

    try {
      socketService.emit('StatusWhatsapp', {
        Code: Criptografar('7668566448964451'),
        Identificador: Criptografar(protocol),
      });
    } catch (error) {
      console.error(`Erro ao verificar status do bot ${protocol}:`, error);
    }
  }, []);

  // Setup event listeners only once
  useEffect(() => {
    if (!user?.LOGIN || eventListenersSetRef.current) return;

    // Setup QR Code event listener
    const handleQrCode = (data) => {
      try {
        if (!data || !data.Code || !data.QRCODE) return;

        const code = Descriptografar(data.Code);
        if (code === '129438921435') {
          const qrData = Descriptografar(data.QRCODE);
          setQRCodeData(qrData);
          setQrCodeLoading(false);
          console.log("QR Code recebido e decodificado");
        }
      } catch (error) {
        console.error("Erro ao processar QR Code:", error);
        setQrCodeLoading(false);
      }
    };

    // Setup WhatsApp response listener
    const handleWhatsappResponse = (data) => {
      try {
        if (!data || !data.Code) return;

        const code = Descriptografar(data.Code);
        if (code === '129438921435') {
          const titulo = data.Titulo ? Descriptografar(data.Titulo) : '';
          const mensagem = data.Mensagem ? Descriptografar(data.Mensagem) : '';

          if (mensagem.includes('pronta para atender') || titulo.includes('Ótimas Notícias')) {
            const currentProtocol = currentQrProtocolRef.current;
            if (currentProtocol) {
              setConnectionStatus(prev => ({
                ...prev,
                [currentProtocol]: true
              }));

              setShowQRModal(false);
              toast.success(mensagem || "WhatsApp conectado com sucesso!");
            }
          } else if (titulo.includes('Erro')) {
            toast.error(mensagem || "Erro ao conectar WhatsApp");
          }
        }
      } catch (error) {
        console.error("Erro ao processar resposta do WhatsApp:", error);
      }
    };

    // Setup connection status update listener
    const handleConnectionUpdate = (data) => {
      try {
        if (!data || !data.Code || !data.Dados) return;

        const code = Descriptografar(data.Code);
        if (code === '17326186765984') {
          const isConnected = Descriptografar(data.Dados) === 'true' || Descriptografar(data.Dados) === true;
          const currentProtocol = currentQrProtocolRef.current;

          if (currentProtocol) {
            // Use updater function para evitar dependências cíclicas
            setConnectionStatus(prev => {
              // Verificar se o estado vai realmente mudar para evitar re-renders desnecessários
              if (prev[currentProtocol] !== isConnected) {
                return { ...prev, [currentProtocol]: isConnected };
              }
              return prev;
            });
          }
        }
      } catch (error) {
        console.error("Erro ao processar atualização de conexão:", error);
      }
    };

    // Register event listeners
    socketService.on('WhatsappQR', handleQrCode);
    socketService.on('WhatsappResponse', handleWhatsappResponse);
    socketService.on('updatesWhatsapp', handleConnectionUpdate);

    // Marcar que os listeners foram configurados
    eventListenersSetRef.current = true;

    // Cleanup on unmount
    return () => {
      socketService.off('WhatsappQR', handleQrCode);
      socketService.off('WhatsappResponse', handleWhatsappResponse);
      socketService.off('updatesWhatsapp', handleConnectionUpdate);
      eventListenersSetRef.current = false;
    };
  }, [user]); // Apenas o user como dependência

  // Load initial data and check bot status
  useEffect(() => {
    if (user?.LOGIN) {
      const startTime = Date.now();

      fetchBots().finally(() => {
        const elapsed = Date.now() - startTime;
        const minDelay = 10500; 
        const remaining = minDelay - elapsed;

        if (remaining > 0) {
          setTimeout(() => setIsLoading(false), remaining);
        } else {
          setIsLoading(false);
        }
      });
    }
  }, [user, fetchBots]);

  
  useEffect(() => {
    if (bots.length > 0) {
      // Use setTimeout para evitar múltiplas chamadas em sequência rápida
      const timer = setTimeout(() => {
        bots.forEach(bot => {
          checkBotStatus(bot.protocol);
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [bots, checkBotStatus]);

  // AQUI ESTÁ A MUDANÇA IMPORTANTE - Handle starting a bot
  // Modificado para sempre mostrar o BotDetail, independente do status de conexão
  const handleStartBot = useCallback((bot) => {
    // Apenas navega para o detalhe do bot
    setSelectedBot(bot);

    // Definir o protocolo atual para uso futuro
    setCurrentQrProtocol(bot.protocol);
  }, []);

  // Handle QR Code timeout
  const handleQrTimeout = useCallback(() => {
    toast.info("QR Code expirado. Gere um novo para conectar.");
    setQRCodeData("");
    setQrCodeLoading(false);
  }, []);

  // Handle creating a new bot
  const handleCreateBot = useCallback(() => {
    if (bots.length >= botLimit) {
      toast.warning("Você atingiu o limite máximo de automações permitidas pelo seu plano atual.");
      return;
    }
    setShowCreateModal(true);
  }, [bots.length, botLimit]);

  // Handle bot creation success
  const handleBotCreated = useCallback(() => {
    setShowCreateModal(false);
    toast.success("Agente criado com sucesso!");
    fetchBots();
  }, [fetchBots]);

  // If we're viewing a specific bot's details
  if (selectedBot) {
    return (
      <BotDetail
        bot={selectedBot}
        isConnected={connectionStatus[selectedBot.protocol] || false}
        onBack={() => setSelectedBot(null)}
        onRefresh={refreshBots}
        socketService={socketService}
        user={user}
        // Passar props para QRCode
        showQRModal={showQRModal}
        setShowQRModal={setShowQRModal}
        qrCodeData={qrCodeData}
        setQRCodeData={setQRCodeData}
        qrCodeLoading={qrCodeLoading}
        setQrCodeLoading={setQrCodeLoading}
        handleQrTimeout={handleQrTimeout}
        currentQrProtocol={selectedBot.protocol}
      />
    );
  }

  // Render loading state
  // if (isLoading) {
  //   return (
  //     <div className={styles.loadingContainer}>
  //       <div className={styles.loadingSpinner}></div>
  //       <p>Carregando automações...</p>
  //     </div>
  //   );
  // }

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Render error state
  // if (error) {
  //   return (
  //     <div className={styles.errorContainer}>
  //       <div className={styles.errorIcon}>⚠️</div>
  //       <h2>Ops! Algo deu errado</h2>
  //       <p>{error}</p>
  //       <button 
  //         className={styles.retryButton}
  //         onClick={fetchBots}
  //       >
  //         Tentar novamente
  //       </button>
  //     </div>
  //   );
  // }

  // Render dashboard
  return (
    <div className={styles.mobileContainer}>
      <div className={styles.headerGradient}>
        <div className={styles.headerContent}>
          <h1>Minhas Automações</h1>
          <p>Gerencie seus bots</p>

          <div className={styles.botLimitBadge}>
            <span>{bots.length}/{botLimit} bots</span>
          </div>

          {/* <button
            className={styles.refreshButton}
            onClick={refreshBots}
            disabled={refreshing}
          >
            <FiRefreshCw size={18} className={refreshing ? styles.spinning : ''} />
          </button> */}
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
                data-protocol={bot.protocol}
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
                <div className={`${styles.statusBadge} ${connectionStatus[bot.protocol] ? styles.statusConnected : styles.statusDisconnected}`}>
                  {connectionStatus[bot.protocol] ? 'Conectado' : 'Desconectado'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <FaRobot size={60} className={styles.emptyIcon} />
            <p>Nenhuma automação encontrada.<br />
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

      {/* CreateAgentModal - Isso permanece no BotDashboard */}
      {showCreateModal && (
        <CreateAgentModal
          socketService={socketService}
          user={user}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleBotCreated}
        />
      )}
    </div>
  );
}