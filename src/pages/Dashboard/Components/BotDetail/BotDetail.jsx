// BotDetail.jsx - Versão com Modal de Assinatura
import React, { useState, useEffect, useCallback } from 'react';
import styles from './BotDetail.module.css';
import { FiSettings, FiPlay, FiPause, FiEdit2, FiCopy, FiArrowLeft } from 'react-icons/fi';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';
import { Criptografar, Descriptografar } from '../../../../Cripto/index';
import { useApp } from '../../../../context/AppContext';
import { toast } from 'react-toastify';
import QRCodeModal from '../../QRCode/QrCode.jsx';
import ConfigModal from '../BotDetail/Config/ConfigModal.jsx';
import SubscriptionExpiredModal from './Modal/ModalVencida.jsx';

export default function BotDetail({
  bot,
  onBack,
  socketService,
  user,
  isConnected: initialIsConnected = false,
  // Novas props para QRCode
  showQRModal,
  setShowQRModal,
  qrCodeData,
  setQRCodeData,
  qrCodeLoading,
  setQrCodeLoading,
  handleQrTimeout,
  currentQrProtocol,
  // Nova prop para atualizar o BotDashboard
  onRefresh
}) {
  const [isConnected, setIsConnected] = useState(initialIsConnected);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [botName, setBotName] = useState(bot?.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [botInfo, setBotInfo] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Estados para o modal de assinatura
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);

  // Get platform-specific icon
  const getPlatformIcon = () => {
    switch (bot?.platform) {
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
    switch (bot?.platform) {
      case '0':
        return 'WhatsApp';
      case '2':
        return 'Instagram';
      default:
        return 'Bot';
    }
  };
const checkSubscriptionStatus = useCallback(() => {
  if (!socketService || !user?.LOGIN) return;

  // Usar um evento já existente para verificar status geral do usuário
  // que pode incluir informações sobre assinatura
  socketService.emit('StatusUsuario', {
    Code: Criptografar('7668566448967'), // Código para verificar dados do usuário
    Login: Criptografar(user.LOGIN)
  });

}, [socketService, user?.LOGIN]);

// Função auxiliar para verificar se pode iniciar o bot
const canStartBot = useCallback(() => {
  return !subscriptionExpired && !isStarting && !isStopping;
}, [subscriptionExpired, isStarting, isStopping]);

// Versão simplificada - verificação apenas quando tentar iniciar
const toggleBotStatus = () => {
  if (isConnected) {
    // Parar o bot (não precisa verificar assinatura para parar)
    setIsStopping(true);
    socketService.emit('Whatsapp', {
      code: Criptografar('2544623544284'),
      conta: Criptografar(user?.LOGIN),
      Identificador: Criptografar(bot.protocol),
    });

    // Temporizador de segurança para não deixar travado no "Parando..."
    const safetyTimer = setTimeout(() => {
      if (isStopping) {
        setIsStopping(false);
        setIsConnected(false);
        toast.info("Automação desconectada");

        // Forçar atualização do status no BotDashboard
        socketService.emit('StatusWhatsapp', {
          Code: Criptografar('7668566448964451'),
          Identificador: Criptografar(bot.protocol),
        });
      }
    }, 5000);

    return () => clearTimeout(safetyTimer);
  } else {
    // Como não podemos verificar assinatura via backend,
    // vamos assumir que se o backend conseguir gerar QR code, a assinatura está ativa
    // Se não conseguir, o backend já deve retornar erro
    
    setIsStarting(true);
    setQRCodeData("");
    setQrCodeLoading(true);
    setShowQRModal(true);

    try {
      // Solicitar inicialização do WhatsApp e geração de QR code
      socketService.emit('Whatsapp', {
        code: Criptografar('2544623544284'),
        conta: Criptografar(user?.LOGIN),
        Identificador: Criptografar(bot.protocol),
      });

      console.log(`Solicitação de inicialização enviada para o bot ${bot.name}`);

      // Temporizador de segurança para "Iniciando..."
      const safetyTimer = setTimeout(() => {
        if (isStarting && !isConnected) {
          setIsStarting(false);
          toast.warning("Tempo de conexão excedido. Tente novamente.");
          setShowQRModal(false);
        }
      }, 60000); // 1 minuto para timeout

      return () => clearTimeout(safetyTimer);
    } catch (error) {
      console.error("Erro ao iniciar bot:", error);
      toast.error("Não foi possível iniciar o bot. Tente novamente.");
      setShowQRModal(false);
      setQrCodeLoading(false);
      setIsStarting(false);
    }
  }
};

  // Check connection status
  const checkConnectionStatus = useCallback(() => {
    socketService.emit('StatusWhatsapp', {
      Code: Criptografar('7668566448964451'),
      Identificador: Criptografar(bot.protocol),
    });

    const handleConnectionUpdate = (data) => {
      if (!data || !data.Code || !data.Dados) return;

      try {
        const code = Descriptografar(data.Code);
        if (code === '17326186765984') {
          const status = Descriptografar(data.Dados) === 'true' || Descriptografar(data.Dados) === true;
          setIsConnected(status);
        }
      } catch (error) {
        // console.error("Erro ao processar status de conexão:", error);
      }
    };

    socketService.on('updatesWhatsapp', handleConnectionUpdate);

    return () => {
      socketService.off('updatesWhatsapp', handleConnectionUpdate);
    };
  }, [bot.protocol, socketService]);

  // Load bot information
  useEffect(() => {
    const getBotInfo = async () => {
      // Você normalmente buscaria essas informações do servidor
      // Este é um placeholder para demonstração
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
    checkSubscriptionStatus(); // Verificar assinatura ao carregar

    // Configurar listener para respostas WhatsApp
    const handleWhatsappResponse = (data) => {
      try {
        if (!data || !data.Code) return;

        const code = Descriptografar(data.Code);
        if (code === '129438921435') {
          const titulo = data.Titulo ? Descriptografar(data.Titulo) : '';
          const mensagem = data.Mensagem ? Descriptografar(data.Mensagem) : '';

          if (mensagem.includes('pronta para atender') || titulo.includes('Ótimas Notícias')) {
            setIsConnected(true);
            setShowQRModal(false);
            setIsStarting(false);
            toast.success(mensagem || "WhatsApp conectado com sucesso!");

            // Atualizar o dashboard após conexão bem-sucedida
            if (onRefresh) onRefresh();

          } else if (titulo.includes('Erro')) {
            setIsStarting(false);
            toast.error(mensagem || "Erro ao conectar WhatsApp");
          } else if (mensagem.includes('desligada com Sucesso')) {
            setIsConnected(false);
            setIsStopping(false);
            toast.success("Bot desconectado com sucesso");

            // Atualizar o dashboard após desconexão bem-sucedida
            if (onRefresh) onRefresh();
          }
        }
      } catch (error) {
        // console.error("Erro ao processar resposta do WhatsApp:", error);
        setIsStarting(false);
        setIsStopping(false);
      }
    };

    socketService.on('WhatsappResponse', handleWhatsappResponse);

    // Configurar listener para QR Code
    const handleQrCode = (data) => {
      try {
        if (!data || !data.Code || !data.QRCODE) return;

        const code = Descriptografar(data.Code);
        if (code === '129438921435') {
          const qrData = Descriptografar(data.QRCODE);
          setQRCodeData(qrData);
          setQrCodeLoading(false);
          // console.log("QR Code recebido e decodificado");
        }
      } catch (error) {
        // console.error("Erro ao processar QR Code:", error);
        setQrCodeLoading(false);
      }
    };

    socketService.on('WhatsappQR', handleQrCode);

    // Configurar listener para atualizações de status
    const handleStatusUpdate = (data) => {
      try {
        if (!data || !data.Code || !data.Dados) return;

        const code = Descriptografar(data.Code);
        if (code === '17326186765984') {
          const status = Descriptografar(data.Dados) === 'true' || Descriptografar(data.Dados) === true;

          // Verificar se é o bot atual
          if (data.Identificador) {
            const botId = Descriptografar(data.Identificador);
            if (botId === bot.protocol) {
              setIsConnected(status);
              setIsStopping(false); // Garantir que não fique em "Parando..."

              // Atualizar o dashboard quando o status mudar
              if (onRefresh) onRefresh();
            }
          }
        }
      } catch (error) {
        // console.error("Erro ao processar atualização de status:", error);
      }
    };

    socketService.on('updatesWhatsapp', handleStatusUpdate);

    // Cleanup
    return () => {
      socketService.off('WhatsappResponse', handleWhatsappResponse);
      socketService.off('WhatsappQR', handleQrCode);
      socketService.off('updatesWhatsapp', handleStatusUpdate);
    };
  }, [bot, checkConnectionStatus, checkSubscriptionStatus, isConnected, onRefresh, setQRCodeData, setQrCodeLoading, setShowQRModal, socketService]);

  // Nova versão do método para iniciar/parar o bot com verificação de assinatura
  // const toggleBotStatus = () => {
  //   if (isConnected) {
  //     // Parar o bot
  //     setIsStopping(true);
  //     socketService.emit('Whatsapp', {
  //       code: Criptografar('2544623544284'),
  //       conta: Criptografar(user?.LOGIN),
  //       Identificador: Criptografar(bot.protocol),
  //     });

  //     // Temporizador de segurança para não deixar travado no "Parando..."
  //     // Caso o servidor não responda em 5 segundos
  //     const safetyTimer = setTimeout(() => {
  //       if (isStopping) {
  //         setIsStopping(false);
  //         setIsConnected(false);
  //         toast.info("Automação desconectada");

  //         // Forçar atualização do status no BotDashboard
  //         socketService.emit('StatusWhatsapp', {
  //           Code: Criptografar('7668566448964451'),
  //           Identificador: Criptografar(bot.protocol),
  //         });
  //       }
  //     }, 5000);

  //     // Armazenar o temporizador para limpeza
  //     // Não precisa limpar explicitamente pois iremos verificar isStopping antes de executar
  //     return () => clearTimeout(safetyTimer);
  //   } else {
  //     // Verificar assinatura antes de iniciar o bot
  //     if (subscriptionExpired) {
  //       setShowSubscriptionModal(true);
  //       return;
  //     }

  //     // Iniciar o bot - Mostrar QR Code se não estiver conectado
  //     setIsStarting(true);
  //     setQRCodeData("");
  //     setQrCodeLoading(true);
  //     setShowQRModal(true);

  //     try {
  //       // Solicitar inicialização do WhatsApp e geração de QR code
  //       socketService.emit('Whatsapp', {
  //         code: Criptografar('2544623544284'),
  //         conta: Criptografar(user?.LOGIN),
  //         Identificador: Criptografar(bot.protocol),
  //       });

  //       // console.log(`Solicitação de inicialização enviada para o bot ${bot.name}`);

  //       // Temporizador de segurança para "Iniciando..."
  //       const safetyTimer = setTimeout(() => {
  //         if (isStarting && !isConnected) {
  //           setIsStarting(false);
  //           toast.warning("Tempo de conexão excedido. Tente novamente.");
  //           setShowQRModal(false);
  //         }
  //       }, 60000); // 1 minuto para timeout

  //       return () => clearTimeout(safetyTimer);
  //     } catch (error) {
  //       // console.error("Erro ao iniciar bot:", error);
  //       toast.error("Não foi possível iniciar o bot. Tente novamente.");
  //       setShowQRModal(false);
  //       setQrCodeLoading(false);
  //       setIsStarting(false);
  //     }
  //   }
  // };

  // Copy bot ID to clipboard
  const copyBotId = () => {
    navigator.clipboard.writeText(bot.protocol);
    toast.info("ID copiado para a área de transferência");
  };

  // Save bot name
  const saveBotName = () => {
    // Emit event to update bot name
    // Isso é um placeholder para sua implementação real
    socketService.emit('UpdateBotName', {
      Code: Criptografar('1234567890'),
      Login: Criptografar(user?.LOGIN),
      Protocolo: Criptografar(bot.protocol),
      Nome: Criptografar(botName)
    });

    setIsEditing(false);
    toast.success("Nome do bot atualizado");
  };

  // Handlers para o modal de assinatura
  const handleSubscriptionModalClose = () => {
    setShowSubscriptionModal(false);
  };

  const handleAcknowledge = () => {
    setShowSubscriptionModal(false);
    toast.info("Renovação necessária para ativar automações");
  };

  const handleRenew = () => {
    setShowSubscriptionModal(false);
    // Aqui você pode redirecionar para a página de pagamento ou abrir uma nova aba
    // window.open('/subscription/renew', '_blank');
    toast.info("Redirecionando para renovação...");
    
    // Exemplo de redirecionamento
    // window.location.href = '/subscription/renew';
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
        <button className={styles.settingsButton}
        onClick={() => setShowSettingsModal(true)}>
          
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
              <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18457 2.99721 7.13633 4.39828 5.49707C5.79935 3.85782 7.69279 2.71538 9.79619 2.24015C11.8996 1.76491 14.1003 1.98234 16.07 2.86" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 4L12 14.01L9 11.01" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#F44336" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 16V12" stroke="#F44336" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 8H12.01" stroke="#F44336" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <p className={styles.instructionText}>
          {isConnected
            ? 'Automação conectada e funcionando. Use o botão "Configurações" para personalizar seu bot.'
            : subscriptionExpired 
              ? 'Sua assinatura expirou. Renove para ativar suas automações.'
              : 'Clique no botão "Iniciar" para conectar e ativar a automação.'}
        </p>
      </div>

      {/* QR Code Modal - Agora está dentro do BotDetail */}
      <QRCodeModal
        visible={showQRModal}
        qrCodeData={qrCodeData}
        isLoading={qrCodeLoading}
        onClose={() => {
          setShowQRModal(false);
          setIsStarting(false);
        }}
        onTimeout={handleQrTimeout}
        onRetry={() => {
          setQrCodeLoading(true);
          setQRCodeData("");
          socketService.emit('Whatsapp', {
            code: Criptografar('2544623544284'),
            conta: Criptografar(user?.LOGIN),
            Identificador: Criptografar(bot.protocol),
          });
        }}
      />

      {/* Modal de Configurações */}
      {ConfigModal && (
        <ConfigModal
          visible={showSettingsModal}
          bot={bot}
          onClose={() => setShowSettingsModal(false)}
          socketService={socketService}
          user={user}
          onRefresh={onRefresh} // Para atualizar o dashboard após alterações
        />
      )}

      {/* Modal de Assinatura Vencida */}
      <SubscriptionExpiredModal
        visible={showSubscriptionModal}
        onClose={handleSubscriptionModalClose}
        onAcknowledge={handleAcknowledge}
        onRenew={handleRenew}
      />
    </div>
  );
}