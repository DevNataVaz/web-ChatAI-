import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../Planos/Pagamentos/pagamento.module.css';
import { useApp } from '../../../context/AppContext';

function Assinatura() {
  const { user, assinatura, isLoading, refreshSubscriptionInfo } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Buscar informações atualizadas da assinatura
    refreshSubscriptionInfo();
  }, [user, navigate, refreshSubscriptionInfo]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'ativo':
        return '#4CAF50';
      case 'desativado':
        return '#ff4444';
      default:
        return '#aaa';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando informações da assinatura...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.assinaturaContainer}>
        <h1>Minha Assinatura</h1>
        
        {assinatura && (
          <div className={styles.assinaturaCard}>
            <div className={styles.assinaturaHeader}>
              <h2>Plano {assinatura.NOME_PLANO}</h2>
              <span 
                className={styles.status}
                style={{ color: getStatusColor(assinatura.STATUS) }}
              >
                {assinatura.STATUS.toUpperCase()}
              </span>
            </div>

            <div className={styles.assinaturaInfo}>
              <div className={styles.infoItem}>
                <label>Valor Mensal:</label>
                <p>R$ {assinatura.VALOR}</p>
              </div>

              <div className={styles.infoItem}>
                <label>Data de Vencimento:</label>
                <p>{formatDate(assinatura.VENCIMENTO)}</p>
              </div>

              <div className={styles.infoItem}>
                <label>Mensagens Disponíveis:</label>
                <p>{assinatura.ATUAL_MENSAGENS} / {assinatura.LIMITE_MENSAGEM}</p>
              </div>

              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ 
                    width: `${(assinatura.ATUAL_MENSAGENS / assinatura.LIMITE_MENSAGEM) * 100}%` 
                  }}
                ></div>
              </div>
            </div>

            <div className={styles.acoes}>
              {assinatura.STATUS === 'desativado' && (
                <button 
                  onClick={handlePagarFatura}
                  className={styles.pagarButton}
                >
                  Pagar Fatura
                </button>
              )}
              
              <button 
                onClick={handleAtualizar}
                className={styles.atualizarButton}
              >
                Atualizar Plano
              </button>
            </div>
          </div>
        )}

        <div className={styles.historicoSection}>
          <h2>Histórico de Pagamentos</h2>
          {/* Implementar histórico de pagamentos aqui */}
        </div>
      </div>
    </div>
  );
}

export default Assinatura;