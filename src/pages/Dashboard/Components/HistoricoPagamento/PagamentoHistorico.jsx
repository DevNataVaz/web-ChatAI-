import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoCheckmarkCircleOutline, IoTimeOutline, IoCloseCircleOutline, IoHourglassOutline, IoArrowBack, IoClipboard } from 'react-icons/io5';
import { socketService } from '../../../../services/socketService';
import { Criptografar, Descriptografar } from '../../../../Cripto/index';
import { useApp } from '../../../../context/AppContext';
import styles from './PagamentoHistorico.module.css';

// Cores inspiradas no Nubank
const COLORS = {
  primary: '#8A63FF',
  primaryLight: '#A478FF', 
  primaryDark: '#6B4EE6',
  secondary: '#FFFFFF',
  background: '#0A0C1B',
  backgroundSecondary: '#0F1228',
  card: 'rgba(255, 255, 255, 0.05)',
  cardHover: 'rgba(255, 255, 255, 0.08)',
  text: '#FFFFFF',
  textSecondary: '#A1A8C3',
  textMuted: '#6B7280',
  shadow: 'rgba(138, 99, 255, 0.15)',
  success: '#10D876',
  warning: '#FFB800',
  danger: '#FF4757',
  neutral: '#64748B',
  successLight: 'rgba(16, 216, 118, 0.15)',
  warningLight: 'rgba(255, 184, 0, 0.15)',
  dangerLight: 'rgba(255, 71, 87, 0.15)',
  neutralLight: 'rgba(100, 116, 139, 0.15)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  neon: '#00F5FF',
};
const PagamentoHistorico = () => {
  const [faturasPendentes, setFaturasPendentes] = useState(true);
  const [historico, setHistorico] = useState([]);
  const [total, setTotal] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const { user, socketConnected } = useApp();

  // Função para obter o status dos pagamentos
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return COLORS.success;
      case 'pending':
      case 'in_process':
        return COLORS.warning;
      case 'rejected':
        return COLORS.danger;
      default:
        return COLORS.neutral;
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'approved':
        return COLORS.successLight;
      case 'pending':
      case 'in_process':
        return COLORS.warningLight;
      case 'rejected':
        return COLORS.dangerLight;
      default:
        return COLORS.neutralLight;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <IoCheckmarkCircleOutline size={24} color={getStatusColor(status)} />;
      case 'pending':
      case 'in_process':
        return <IoTimeOutline size={24} color={getStatusColor(status)} />;
      case 'rejected':
        return <IoCloseCircleOutline size={24} color={getStatusColor(status)} />;
      default:
        return <IoHourglassOutline size={24} color={getStatusColor(status)} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Pago';
      case 'pending':
      case 'in_process':
        return 'Processando';
      case 'rejected':
        return 'Rejeitado';
      default:
        return 'Cancelado';
    }
  };

  // Estados para controlar o status do socket
  const [socketError, setSocketError] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(0);

// Simplify this function
const checkSocketAvailability = useCallback(() => {
  // Check if we have a working socket connection
  const isConnected = socketService && 
                      socketService.socket && 
                      socketConnected;
  
  setSocketError(!isConnected);
  return isConnected;
}, [socketConnected]);

 // Modify the enviar function to be more resilient to connection issues
const enviar = useCallback(async () => {
  if (!user) return;

  const userLogin = user.login || user.LOGIN;
  if (!userLogin) {
    // console.log('Login não disponível');
    setIsLoading(false);
    return;
  }

  // Only proceed if socket is connected
  if (!socketService || !socketService.socket || !socketConnected) {
    // console.log('Socket não está conectado. Tentando reconectar...');
    setSocketError(true);
    
    // Try to reconnect if possible
    // if (socketService && !socketService.socket) {
    //   try {
    //     socketService.connect();
    //   } catch (error) {
    //     // console.error('Erro ao reconectar:', error);
    //   }
    // }
    
    setIsLoading(false);
    return;
  }

  // setIsLoading(true);

  try {
    // Clean up any existing listeners
    socketService.socket.off('responseHistoricoPagamentos');
    
    // Set up the response handler first
    const responsePromise = new Promise((resolve, reject) => {
      // Increase timeout from 10s to 20s
      const timeoutId = setTimeout(() => {
        socketService.socket.off('responseHistoricoPagamentos');
        reject(new Error('Timeout ao aguardar resposta'));
      }, 20000); // Increased to 20 seconds
      
      socketService.socket.once('responseHistoricoPagamentos', (dados) => {
        clearTimeout(timeoutId);
        resolve(dados);
      });
    });
    
    // Send the request
    socketService.socket.emit('HistoricoPagamentos', {
      dados: Criptografar(JSON.stringify({ Login: userLogin }))
    });
    
    // Wait for response
    const result = await responsePromise;
    
    // Process the result
    if (result) {
      try {
        const { debito, pagamentos } = JSON.parse(Descriptografar(result));
        setFaturasPendentes(debito === 1 ? false : true);
        
        const novoHistorico = Array.isArray(pagamentos) ? pagamentos.map((item, index) => ({
          id: index + 1,
          titulo: item.PRODUTO,
          data: item.DATA ? item.DATA.split('T')[0] : 'N/A',
          hora: item.HORA || 'N/A',
          valor: item.VALOR ? parseFloat(item.VALOR).toFixed(2) : '0.00',
          forma: item.FORMA_PAGAMENTO || 'N/A',
          estado: item.ESTADO || 'N/A'
        })) : [];
        
        setHistorico(novoHistorico);
        setTotal(novoHistorico);
        setSocketError(false);
      } catch (parseError) {
        // console.error('Erro ao processar resposta:', parseError);
        setSocketError(true);
      }
    }
  } catch (error) {
    // console.error('Erro ao enviar solicitação:', error);
    setSocketError(true);
  } finally {
    setIsLoading(false);
  }
}, [user, socketConnected]);

 useEffect(() => {
  if (!user?.login && !user?.LOGIN) return;
  
  let reconnectInterval;
  
  const setupConnection = () => {
    if (checkSocketAvailability()) {
      // Connected - make initial request
      enviar();
      
      // Set periodic update
      const updateInterval = setInterval(() => {
        if (checkSocketAvailability()) {
          enviar();
        } else {
          clearInterval(updateInterval);
          // Start reconnection attempts
          reconnectInterval = setInterval(setupConnection, 5000);
        }
      }, 60000); // Check every minute
      
      return () => clearInterval(updateInterval);
    } else if (!reconnectInterval) {
      // Not connected - start reconnection attempts
      reconnectInterval = setInterval(setupConnection, 5000);
      return () => clearInterval(reconnectInterval);
    }
  };
  
  const cleanup = setupConnection();
  
  return () => {
    if (cleanup) cleanup();
    if (reconnectInterval) clearInterval(reconnectInterval);
    
    // Remove event listeners
    if (socketService?.socket) {
      socketService.socket.off('responseHistoricoPagamentos');
    }
  };
}, [user, enviar, checkSocketAvailability]);

  // Função para navegar para a tela de detalhes do pagamento
  const handlePaymentClick = (payment) => {
    navigate(`/comprovante/${payment.id}`, {
      state: {
        estado: payment.estado,
        titulo: payment.titulo,
        valor: payment.valor,
        tipo: payment.forma,
        data: payment.data,
        hora: payment.hora
      }
    });
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        {/* <div className={styles.headerContent}>


          <h1 className={styles.headerTitle}>Minha Assinatura</h1>

          <div className={styles.iconContainer}>
            <IoClipboard size={20} color="#FFFFFF" />
          </div>
        </div> */}
      </header>

      {/* Status Card */}
      <div className={styles.mainContent}>
        <div className={styles.statusCardContainer}>
          <div className={styles.statusCard}>
            <div className={styles.statusLeftSection}>
              {faturasPendentes ? (
                <div className={styles.warningAnimation}>
                  <IoTimeOutline size={60} color={COLORS.warning} />
                </div>
              ) : (
                <div className={styles.successAnimation}>
                  <IoCheckmarkCircleOutline size={60} color={COLORS.success} />
                </div>
              )}
            </div>

            <div className={styles.statusRightSection}>
              <h2 className={styles.statusTitle}>
                {faturasPendentes ? 'Plano Vencido' : 'Tudo certo'}
              </h2>
              <p className={styles.statusSubtitle}>
                {faturasPendentes ? 'Pendência encontrada' : 'Com seus planos!'}
              </p>

              {faturasPendentes && (
                <Link to="/faturas" className={styles.resolveButton}>
                  Resolver pendência
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className={styles.sectionTitleContainer}>
          <h2 className={styles.sectionTitle}>Meus Pagamentos</h2>
        </div>

        {/* Payment List */}
        <div className={styles.paymentListContainer}>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Carregando...</p>
            </div>
          ) : socketError ? (
            <div className={styles.errorContainer || styles.emptyContainer}>
              <div className={styles.errorIcon || styles.emptyIcon}>
                <IoCloseCircleOutline size={60} color={COLORS.danger} />
              </div>
              <p className={styles.errorText || styles.emptyText}>
                Não foi possível conectar ao servidor.
              </p>
              {socketConnected === false && (
                <p className={styles.errorSubtext || styles.emptyText} style={{ fontSize: '0.9em' }}>
                  Aguardando conexão com o servidor...
                </p>
              )}
              <button
                className={styles.retryButton || styles.resolveButton}
                onClick={() => {
                  setSocketError(false);
                  setIsLoading(true);
                  // Tentativa de reenviar após pequeno delay
                  setTimeout(() => {
                    if (checkSocketAvailability()) {
                      enviar();
                    } else {
                      setIsLoading(false);
                    }
                  }, 1000);
                }}
              >
                Tentar novamente
              </button>
            </div>
          ) : total.length !== 0 ? (
            <div className={styles.paymentList}>
              {total.map((item) => (
                <div
                  key={item.id}
                  className={styles.paymentItem}
                  onClick={() => handlePaymentClick(item)}
                >
                  <div className={styles.paymentLeftSection}>
                    <div className={styles.statusIconContainer} style={{ backgroundColor: getStatusBgColor(item.estado) }}>
                      {getStatusIcon(item.estado)}
                    </div>

                    <div className={styles.paymentInfoContainer}>
                      <h3 className={styles.paymentTitle}>
                        {item.titulo}
                      </h3>
                      <p className={styles.paymentAmount} style={{ color: getStatusColor(item.estado) }}>
                        R$ {item.valor}
                      </p>
                      <p className={styles.paymentMethod}>
                        {item.forma}
                      </p>
                    </div>
                  </div>

                  <div className={styles.paymentRightSection}>
                    <p className={styles.paymentDate}>
                      {item.data}
                    </p>
                    <p className={styles.paymentTime}>
                      {item.hora}
                    </p>
                    <p className={styles.paymentStatus} style={{ color: getStatusColor(item.estado) }}>
                      {getStatusText(item.estado)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyContainer}>
              <div className={styles.emptyIcon}>
                <IoClipboard size={70} color={COLORS.primary} style={{ opacity: 0.5 }} />
              </div>
              <p className={styles.emptyText}>
                Nenhum pagamento por aqui.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PagamentoHistorico;