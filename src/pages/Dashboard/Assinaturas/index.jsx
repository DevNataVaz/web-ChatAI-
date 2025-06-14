import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../../context/AppContext';
import PaymentModal from './Pagamento/Pagamento';
import styles from './Assinatura.module.css';
import { toast } from 'react-toastify';
import { 
  FiCalendar, 
  FiMessageSquare, 
  FiTrendingUp, 
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiRefreshCw,
  FiArrowUp
} from 'react-icons/fi';

const Subscription = () => {
  const {
    user,
    socketService,
    socketConnected
  } = useApp();

  // Estados principais
  const [faturaData, setFaturaData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  // Buscar dados da fatura (baseado no componente mobile)
  const buscarFatura = useCallback(async () => {
    if (!user?.LOGIN || !socketConnected || loading) return;

    setLoading(true);
    try {
      const response = await socketService.getFaturas(user.LOGIN);
      
      if (response?.Dados) {
        const dados = JSON.parse(response.Dados);
        
        // Estrutura similar ao mobile
        const faturaFormatada = {
          id: '1',
          nome_plano: dados.NOME_PLANO,
          status: dados.STATUS,
          valor: parseFloat(dados.VALOR),
          vencimento: dados.VENCIMENTO,
          frequencia: dados.FREQUENCIA,
          id_assinatura: dados.ID_ASSINATURA,
          data: dados.DATA,
          limite_mensagem: dados.LIMITE_MENSAGEM,
          atual_mensagens: dados.ATUAL_MENSAGENS
        };
        
        setFaturaData(faturaFormatada);
      }
    } catch (error) {
      console.error('Erro ao buscar fatura:', error);
      toast.error('Erro ao carregar dados da assinatura');
    } finally {
      setLoading(false);
    }
  }, [user?.LOGIN, socketConnected, loading, socketService]);

  // Calcular dias restantes
  const calcularDiasRestantes = useCallback((vencimento) => {
    if (!vencimento) return 0;
    
    const hoje = new Date();
    const dataVencimento = new Date(vencimento);
    const diffTime = dataVencimento - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }, []);

  // Calcular progresso das mensagens
  const calcularProgressoMensagens = useCallback(() => {
    if (!faturaData) return { usadas: 0, total: 1, restantes: 0, percentual: 0 };
    
    const usadas = faturaData.atual_mensagens || 0;
    const total = faturaData.limite_mensagem || 1;
    const restantes = Math.max(0, total - usadas);
    const percentual = Math.min(100, Math.round((usadas / total) * 100));
    
    return { usadas, total, restantes, percentual };
  }, [faturaData]);

  // Formatar data para exibição
  const formatarData = useCallback((data) => {
    if (!data) return 'N/A';
    return new Date(data).toLocaleDateString('pt-BR');
  }, []);

  // Handle upgrade
  const handleUpgrade = useCallback(() => {
    if (!faturaData) return;
    
    // Definir dados do upgrade baseado no plano atual
    let upgradeData = null;
    
    if (faturaData.nome_plano === 'Starter') {
      upgradeData = {
        produto: 'Professional',
        valor: 49.90,
        assunto: 'PLANO',
        assinatura: faturaData.id_assinatura,
        description: 'Upgrade para Professional'
      };
    } else if (faturaData.nome_plano === 'Professional') {
      upgradeData = {
        produto: 'Enterprise',
        valor: 99.90,
        assunto: 'PLANO',
        assinatura: faturaData.id_assinatura,
        description: 'Upgrade para Enterprise'
      };
    }
    
    if (upgradeData) {
      setPaymentData(upgradeData);
      setShowPaymentModal(true);
    } else {
      toast.info('Você já possui o plano mais avançado!');
    }
  }, [faturaData]);

  // Handle pagamento bem-sucedido
  const handlePaymentSuccess = useCallback(async () => {
    toast.success('Upgrade realizado com sucesso!');
    setShowPaymentModal(false);
    setPaymentData(null);
    
    // Recarregar dados
    setTimeout(() => {
      buscarFatura();
    }, 2000);
  }, [buscarFatura]);

  // Carregar dados quando componente montar
  useEffect(() => {
    if (user?.LOGIN && socketConnected) {
      buscarFatura();
    }
  }, [user?.LOGIN, socketConnected]);

  // Auto-refresh a cada 30 segundos (como no mobile)
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.LOGIN && socketConnected && !loading) {
        buscarFatura();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.LOGIN, socketConnected, loading, buscarFatura]);

  if (!user?.LOGIN) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <FiAlertCircle size={48} />
          <h3>Faça login para ver sua assinatura</h3>
          <p>Você precisa estar logado para acessar esta página</p>
        </div>
      </div>
    );
  }

  if (!socketConnected) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <FiRefreshCw size={48} className={styles.spinning} />
          <h3>Conectando ao servidor...</h3>
          <p>Aguarde enquanto estabelecemos a conexão</p>
        </div>
      </div>
    );
  }

  const progressoMensagens = calcularProgressoMensagens();
  const diasRestantes = calcularDiasRestantes(faturaData?.vencimento);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Minha Assinatura</h1>
          <p>Atualize suas informações de plano de maneira fácil e ágil</p>
        </div>
        <button 
          className={styles.refreshButton}
          onClick={buscarFatura}
          disabled={loading}
        >
          <FiRefreshCw className={loading ? styles.spinning : ''} />
          {loading ? 'Carregando...' : 'Atualizar'}
        </button>
      </div>

      {/* Card Principal da Assinatura */}
      <div className={styles.subscriptionCard}>
        {faturaData ? (
          <>
            {/* Indicador de Status */}
            <div className={`${styles.statusBar} ${faturaData.status === 'ativo' ? styles.active : styles.inactive}`} />
            
            <div className={styles.cardContent}>
              {/* Informações principais */}
              <div className={styles.planHeader}>
                <div className={styles.planInfo}>
                  <h2>{faturaData.nome_plano}</h2>
                  <div className={styles.planPrice}>
                    R$ {faturaData.valor?.toFixed(2)}
                    <span>/{faturaData.frequencia === '1' ? 'mês' : 'ano'}</span>
                  </div>
                </div>
                
                <div className={styles.statusIndicator}>
                  {faturaData.status === 'ativo' ? (
                    <FiCheckCircle className={styles.iconActive} />
                  ) : (
                    <FiAlertCircle className={styles.iconInactive} />
                  )}
                  <span className={faturaData.status === 'ativo' ? styles.textActive : styles.textInactive}>
                    {faturaData.status}
                  </span>
                </div>
              </div>

              {/* Detalhes da assinatura */}
              <div className={styles.subscriptionDetails}>
                <div className={styles.detailItem}>
                  <FiCalendar className={styles.detailIcon} />
                  <div className={styles.detailContent}>
                    <span className={styles.detailLabel}>Vencimento</span>
                    <span className={styles.detailValue}>
                      {formatarData(faturaData.vencimento)}
                    </span>
                  </div>
                </div>

                <div className={styles.detailItem}>
                  <FiClock className={styles.detailIcon} />
                  <div className={styles.detailContent}>
                    <span className={styles.detailLabel}>Dias restantes</span>
                    <span className={styles.detailValue}>
                      {diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progresso das mensagens */}
              <div className={styles.messagesSection}>
                <div className={styles.messagesHeader}>
                  <FiMessageSquare className={styles.messagesIcon} />
                  <span className={styles.messagesTitle}>
                    {progressoMensagens.usadas.toLocaleString()} Mensagens utilizadas
                  </span>
                </div>
                
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ width: `${progressoMensagens.percentual}%` }}
                    />
                  </div>
                  <div className={styles.progressInfo}>
                    <span className={styles.progressText}>
                      {progressoMensagens.restantes.toLocaleString()} restantes de {progressoMensagens.total.toLocaleString()}
                    </span>
                    <span className={styles.progressPercent}>
                      {progressoMensagens.percentual}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className={styles.actions}>
                {faturaData.nome_plano !== 'Enterprise' && faturaData.status === 'ativo' && (
                  <button 
                    className={styles.upgradeButton}
                    onClick={handleUpgrade}
                    disabled={loading}
                  >
                    <FiTrendingUp />
                    Fazer Upgrade
                  </button>
                )}
                
                {faturaData.status !== 'ativo' && (
                  <button 
                    className={styles.reactivateButton}
                    onClick={() => toast.info('Entre em contato para reativar sua assinatura')}
                  >
                    <FiArrowUp />
                    Reativar Plano
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className={styles.loadingCard}>
            <FiRefreshCw size={32} className={styles.spinning} />
            <h3>Carregando informações...</h3>
            <p>Buscando dados da sua assinatura</p>
          </div>
        )}
      </div>

      {/* Informações adicionais */}
      {faturaData && (
        <div className={styles.additionalInfo}>
          <div className={styles.infoCard}>
            <h3>Benefícios do seu plano</h3>
            <ul className={styles.benefitsList}>
              <li><FiCheckCircle /> {faturaData.limite_mensagem?.toLocaleString()} mensagens por mês</li>
              <li><FiCheckCircle /> Suporte técnico especializado</li>
              <li><FiCheckCircle /> Relatórios detalhados de uso</li>
              <li><FiCheckCircle /> API de integração</li>
              {faturaData.nome_plano !== 'Starter' && (
                <>
                  <li><FiCheckCircle /> Suporte prioritário</li>
                  <li><FiCheckCircle /> Recursos avançados</li>
                </>
              )}
            </ul>
          </div>
          
          {diasRestantes < 7 && faturaData.status === 'ativo' && (
            <div className={styles.warningCard}>
              <FiAlertCircle />
              <div>
                <h4>Atenção: Renovação próxima</h4>
                <p>Sua assinatura vence em {diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'}. 
                   Certifique-se de que há saldo suficiente para renovação automática.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
        </div>
      )}

      {/* Modal de Pagamento */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPaymentData(null);
        }}
        paymentData={paymentData}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default Subscription;