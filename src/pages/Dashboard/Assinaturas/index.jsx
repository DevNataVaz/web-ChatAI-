import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Assinatura.module.css';
import { useApp } from '../../../context/AppContext';

function Assinatura() {
  const { 
    user, 
    assinatura, 
    isLoading, 
    error, 
    socketConnected,
    loadSubscription 
  } = useApp();
  
  const [localError, setLocalError] = useState(null);
  const navigate = useNavigate();

  // Função para atualizar informações da assinatura
  const refreshSubscriptionInfo = () => {
    if (!user || !user.LOGIN) return;
    
    // Verifica se o socket está conectado
    if (!socketConnected) {
      setLocalError("Aguardando conexão com o servidor...");
      // Tentar novamente em 2 segundos se não estiver conectado
      const timer = setTimeout(() => refreshSubscriptionInfo(), 2000);
      return () => clearTimeout(timer);
    }
    
    // Carrega informações da assinatura
    try {
      loadSubscription(user.LOGIN);
    } catch (err) {
      setLocalError("Não foi possível carregar informações da assinatura");
      console.error("Erro ao carregar assinatura:", err);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Buscar informações atualizadas da assinatura
    refreshSubscriptionInfo();
    
    // Configurar um intervalo para atualizar periodicamente
    const refreshInterval = setInterval(() => {
      refreshSubscriptionInfo();
    }, 60000); // Atualiza a cada minuto
    
    return () => clearInterval(refreshInterval);
  }, [user, navigate, socketConnected]);

  // Resetar erro local quando o erro global mudar
  useEffect(() => {
    if (error) {
      setLocalError(error);
    }
  }, [error]);

  // Reset local error when socket connects
  useEffect(() => {
    if (socketConnected && localError === "Aguardando conexão com o servidor...") {
      setLocalError(null);
      refreshSubscriptionInfo();
    }
  }, [socketConnected, localError]);

  const getStatusColor = (status) => {
    if (!status) return '#aaa';
    
    switch (status.toLowerCase()) {
      case 'ativo':
        return '#4CAF50';
      case 'desativado':
      case 'inativo':
        return '#ff4444';
      case 'pendente':
        return '#FFA500';
      default:
        return '#aaa';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não disponível';
    
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };

  const handlePagarFatura = () => {
    if (assinatura) {
      // Redireciona para pagamento da fatura com ID da assinatura
      navigate(`/pagamento/1`, {
        state: {
          assinaturaId: assinatura.ID_ASSINATURA,
          valor: assinatura.VALOR,
          tipo: 'FATURA'
        }
      });
    }
  };

  const handleAtualizar = () => {
    navigate('/planos');
  };

  const handleTentarNovamente = () => {
    setLocalError(null);
    refreshSubscriptionInfo();
  };

  // Renderiza estado de carregamento
  if (isLoading && !assinatura) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Carregando informações da assinatura...</p>
        </div>
      </div>
    );
  }

  // Renderiza erro
  if (localError && !assinatura) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2>Erro ao carregar assinatura</h2>
          <p>{localError}</p>
          <button 
            onClick={handleTentarNovamente}
            className={styles.retryButton}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Renderiza quando não há assinatura
  if (!assinatura) {
    return (
      <div className={styles.container}>
        <div className={styles.noAssinaturaContainer}>
          <h2>Você não possui uma assinatura ativa</h2>
          <p>Escolha um plano para começar a usar nossa plataforma.</p>
          <button 
            onClick={handleAtualizar}
            className={styles.escolherPlanoButton}
          >
            Ver planos disponíveis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.assinaturaContainer}>
        <h1>Minha Assinatura</h1>
        
        {localError && (
          <div className={styles.alertError}>
            <p>{localError}</p>
            <button onClick={handleTentarNovamente}>Tentar Novamente</button>
          </div>
        )}
        
        {assinatura && (
          <div className={styles.assinaturaCard}>
            <div className={styles.assinaturaHeader}>
              <h2>Plano {assinatura.NOME_PLANO || 'Padrão'}</h2>
              <span 
                className={styles.status}
                style={{ 
                  color: getStatusColor(assinatura.STATUS),
                  backgroundColor: `${getStatusColor(assinatura.STATUS)}20` 
                }}
              >
                {assinatura.STATUS ? assinatura.STATUS.toUpperCase() : 'STATUS DESCONHECIDO'}
              </span>
            </div>

            <div className={styles.assinaturaInfo}>
              <div className={styles.infoItem}>
                <label>Valor Mensal:</label>
                <p>R$ {assinatura.VALOR || '0,00'}</p>
              </div>

              <div className={styles.infoItem}>
                <label>Data de Vencimento:</label>
                <p>{formatDate(assinatura.VENCIMENTO)}</p>
              </div>

              {isLoading && (
                <div className={styles.refreshIndicator}>
                  <small>Atualizando informações...</small>
                </div>
              )}

              <div className={styles.infoItem}>
                <label>Mensagens Disponíveis:</label>
                <p>
                  {assinatura.ATUAL_MENSAGENS || 0} / {assinatura.LIMITE_MENSAGEM || 0}
                </p>
              </div>

              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ 
                    width: `${assinatura.LIMITE_MENSAGEM ? (assinatura.ATUAL_MENSAGENS / assinatura.LIMITE_MENSAGEM) * 100 : 0}%`,
                    backgroundColor: assinatura.ATUAL_MENSAGENS > assinatura.LIMITE_MENSAGEM * 0.8 ? '#ff4444' : '#4CAF50'
                  }}
                ></div>
              </div>
              
              {assinatura.ATUAL_MENSAGENS > assinatura.LIMITE_MENSAGEM * 0.8 && (
                <div className={styles.limitWarning}>
                  <p>Você está se aproximando do limite de mensagens!</p>
                </div>
              )}
            </div>

            <div className={styles.acoes}>
              {(assinatura.STATUS === 'desativado' || assinatura.STATUS === 'inativo') && (
                <button 
                  onClick={handlePagarFatura}
                  className={styles.pagarButton}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processando...' : 'Pagar Fatura'}
                </button>
              )}
              
              <button 
                onClick={handleAtualizar}
                className={styles.atualizarButton}
                disabled={isLoading}
              >
                {isLoading ? 'Processando...' : 'Atualizar Plano'}
              </button>
              
              <button 
                onClick={refreshSubscriptionInfo}
                className={styles.refreshButton}
                disabled={isLoading}
              >
                {isLoading ? 'Atualizando...' : 'Atualizar Dados'}
              </button>
            </div>
          </div>
        )}

        <div className={styles.historicoSection}>
          <h2>Histórico de Pagamentos</h2>
          
          <div className={styles.historicoEmpty}>
            <p>Histórico de pagamentos não disponível no momento.</p>
          </div>
          
        
          <div className={styles.historicoTable}>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Método</th>
                </tr>
              </thead>
              <tbody>
                {/* Dados de histórico viriam aqui */}
              </tbody>
            </table>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default Assinatura;