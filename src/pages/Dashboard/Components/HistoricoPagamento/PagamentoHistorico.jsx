import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoCheckmarkCircleOutline, IoTimeOutline, IoCloseCircleOutline, IoHourglassOutline, IoArrowBack, IoClipboard } from 'react-icons/io5';
import socketService from '../../../../services/socketService';
import { Criptografar, Descriptografar } from '../../../../Cripto/index';
import { useApp } from '../../../../context/AppContext';
import styles from './PagamentoHistorico.module.css';

// Cores inspiradas no Nubank
const COLORS = {
  primary: '#8A05BE',       // Roxo principal
  primaryLight: '#9928C3',  // Roxo mais claro
  primaryDark: '#6D0499',   // Roxo mais escuro
  primaryGradient: ['#8A05BE', '#9928C3', '#AB3FE5'], // Gradiente roxo
  secondary: '#FFFFFF',     // Branco
  background: '#F5F5FA',    // Fundo claro
  card: '#FFFFFF',          // Fundo do cartão
  text: '#333333',          // Texto primário
  textSecondary: '#777777', // Texto secundário
  shadow: '#000000',        // Cor da sombra
  success: '#00a650',       // Verde de sucesso
  warning: '#ff7733',       // Laranja de alerta
  danger: '#f23d4f',        // Vermelho de perigo
  neutral: '#8E8E8E',       // Cinza neutro
  successLight: '#e3fff0',  // Fundo verde claro
  warningLight: '#fceae0',  // Fundo laranja claro
  dangerLight: '#fce0e3',   // Fundo vermelho claro
  neutralLight: '#e3e3e3',  // Fundo cinza claro
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
    switch(status) {
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
    switch(status) {
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
    switch(status) {
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
    switch(status) {
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
  
  // Função para verificar se o socket está disponível
  const checkSocketAvailability = useCallback(() => {
    // Evitar verificações muito frequentes
    const now = Date.now();
    if (now - lastCheckTime < 1000) { // Evita verificar mais de uma vez por segundo
      return false;
    }
    setLastCheckTime(now);
    
    // Verifica se o socket está disponível
    if (socketService && socketService.socket && socketConnected) {
      console.log('Socket está disponível');
      setSocketError(false);
      return true;
    } else {
      console.log('Socket não está disponível no momento');
      // Só define erro se não estiver em processo de conexão
      if (socketConnected === false) {
        setSocketError(true);
      }
      return false;
    }
  }, [socketConnected, lastCheckTime]);

  // Função para buscar os pagamentos
  const enviar = useCallback(async () => {
    if (!user) return;
    
    // Verifica disponibilidade do socket
    const isSocketAvailable = checkSocketAvailability();
    if (!isSocketAvailable) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    const dados = {
      Login: user.login
    };
    
    try {
      // Remover listeners antigos para evitar duplicações
      socketService.socket.off('responseHistoricoPagamentos');
      
      // Enviar a solicitação para o servidor
      socketService.socket.emit('HistoricoPagamentos', {
        dados: Criptografar(JSON.stringify(dados))
      });

      // Configurar o listener para a resposta com timeout
      const timeoutId = setTimeout(() => {
        console.warn('Timeout ao esperar resposta do servidor');
        setIsLoading(false);
        socketService.socket.off('responseHistoricoPagamentos');
        setSocketError(true);
      }, 10000); // 10 segundos de timeout
      
      socketService.socket.once('responseHistoricoPagamentos', (dados) => {
        clearTimeout(timeoutId); // Limpa o timeout quando recebemos resposta
        
        try {
          const { debito, pagamentos } = JSON.parse(Descriptografar(dados));
          setFaturasPendentes(debito === 1 ? false : true);

          // Em vez de manipular diretamente o historico, crie um novo array
          const novoHistorico = Array.isArray(pagamentos) ? pagamentos.map((item, index) => ({
            id: index + 1, 
            titulo: item.PRODUTO, 
            data: item.DATA.split('T')[0], 
            hora: item.HORA, 
            valor: parseFloat(item.VALOR).toFixed(2), 
            forma: item.FORMA_PAGAMENTO, 
            estado: item.ESTADO 
          })) : [];

          // Atualize os estados uma única vez
          setHistorico(novoHistorico);
          setTotal(novoHistorico);
          setSocketError(false);
        } catch (error) {
          console.error('Erro ao processar resposta:', error);
          setSocketError(true);
        } finally {
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      setSocketError(true);
      setIsLoading(false);
    }
  }, [user, checkSocketAvailability]);

  // Efeito para carregar os dados iniciais e configurar a atualização periódica
  useEffect(() => {
    if (!user) return;
    
    let updateInterval;
    let checkSocketInterval;
    
    // Função para verificar o socket e enviar dados se disponível
    const checkAndSend = () => {
      if (checkSocketAvailability()) {
        // Se o socket está disponível, podemos enviar a solicitação
        enviar();
        
        // Limpa o intervalo de verificação se estiver definido
        if (checkSocketInterval) {
          clearInterval(checkSocketInterval);
          checkSocketInterval = null;
        }
        
        // Configura um intervalo para atualização periódica quando o socket está ok
        if (!updateInterval) {
          updateInterval = setInterval(() => {
            if (checkSocketAvailability()) {
              enviar();
            } else {
              // Se o socket ficar indisponível durante a atualização, limpa o intervalo
              clearInterval(updateInterval);
              updateInterval = null;
              // Inicia o intervalo de verificação novamente
              if (!checkSocketInterval) {
                checkSocketInterval = setInterval(checkAndSend, 3000);
              }
            }
          }, 60000); // Atualiza a cada 1 minuto
        }
      } else {
        // Se o socket não está disponível, configura um intervalo para verificar
        if (!checkSocketInterval) {
          checkSocketInterval = setInterval(checkAndSend, 3000); // Verifica a cada 3 segundos
        }
      }
    };
    
    // Inicia o processo
    checkAndSend();
    
    // Limpeza quando o componente é desmontado
    return () => {
      if (updateInterval) clearInterval(updateInterval);
      if (checkSocketInterval) clearInterval(checkSocketInterval);
      
      // Remover listeners se o socket estiver disponível
      if (socketService && socketService.socket) {
        try {
          socketService.socket.off('responseHistoricoPagamentos');
        } catch (error) {
          console.error('Erro ao remover listener:', error);
        }
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
        <div className={styles.headerContent}>
          
          
          <h1 className={styles.headerTitle}>Minha Assinatura</h1>
          
          <div className={styles.iconContainer}>
            <IoClipboard size={20} color="#FFFFFF" />
          </div>
        </div>
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