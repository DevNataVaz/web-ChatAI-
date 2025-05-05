import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Calendar, ArrowUp } from 'lucide-react';
import styles from './FaturasPendentes.module.css';

const COLORS = {
  primary: '#8A05BE',
  primaryLight: '#9928C3',
  primaryDark: '#6D0499',
  primaryGradient: ['#8A05BE', '#9928C3', '#AB3FE5'],
  secondary: '#FFFFFF',
  background: '#F5F5FA',
  card: '#FFFFFF',
  text: '#333333',
  textSecondary: '#777777',
  shadow: '#000000',
  success: '#00a650',
  danger: '#f23d4f',
  warning: '#ff7733',
  successLight: '#e0f7e8',
  dangerLight: '#fce0e3'
};

const FaturasPendentes = () => {
  const [faturas, setFaturas] = useState([]);
  const [loop, setLoop] = useState(0);

  useEffect(() => {
    const interval = setTimeout(() => {
      setLoop(loop + 1);
    }, 2000);

    Faturas();

    return () => clearTimeout(interval);
  }, [loop]);

  const Faturas = async () => {
    // Simulação de socket para demonstração
    const mockData = {
      NOME_PLANO: 'Pro',
      STATUS: 'ativo',
      VALOR: '99.90',
      VENCIMENTO: '31/12/2024',
      FREQUENCIA: '1',
      ID_ASSINATURA: '123456',
      DATA: '2024-01-01',
      LIMITE_MENSAGEM: 20000,
      ATUAL_MENSAGENS: 15000
    };

    setFaturas([{
      id_assinatura: mockData.ID_ASSINATURA,
      data: mockData.DATA,
      ASSUNTO: 'FATURA',
      LIMITE_MENSAGEM: mockData.LIMITE_MENSAGEM,
      ATUAL_MENSAGENS: mockData.ATUAL_MENSAGENS
    }]);
  };

  const getUsagePercentage = (item) => {
    const remainingPercentage = ((item.LIMITE_MENSAGEM - item.ATUAL_MENSAGENS) / item.LIMITE_MENSAGEM * 100);
    return remainingPercentage < 0 ? 0 : remainingPercentage.toFixed(2);
  };

  const getUsageProgress = (item) => {
    const progress = (item.LIMITE_MENSAGEM - item.ATUAL_MENSAGENS) / item.LIMITE_MENSAGEM;
    return progress < 0 ? 0 : progress > 1 ? 1 : progress;
  };

  const handleNavigation = (route, params) => {
    console.log(`Navigating to ${route}`, params);
  };

  const renderPlanCard = (item, index) => {
    const isActive = item.status === 'ativo';
    const statusColor = isActive ? COLORS.success : COLORS.danger;
    const statusBgColor = isActive ? COLORS.successLight : COLORS.dangerLight;
    
    return (
      <div 
        className={styles.cardWrapper}
        style={{ animationDelay: `${index * 100}ms` }}
        key={item.id}
      >
        <button 
          onClick={() => isActive ? console.log('buum') : handleNavigation('/detalhe-fatura', { fatura: item })}
          className={styles.cardContainer}
        >
          <div 
            className={styles.statusIndicator} 
            style={{ backgroundColor: statusColor }}
          />
          
          <div className={styles.cardContent}>
            {/* Plan Header */}
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.planName}>{item.nome_plano}</h3>
                <p className={styles.planPrice}>
                  R$ {item.valor.toFixed(2)}{item.frequencia === '1' ? '/mês' : '/ano'}
                </p>
              </div>
              
              <div className={styles.statusBadge} style={{ backgroundColor: statusBgColor }}>
                {isActive ? (
                  <CheckCircle size={18} color={statusColor} />
                ) : (
                  <XCircle size={18} color={statusColor} />
                )}
                <span className={styles.statusText} style={{ color: statusColor }}>
                  {isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
            
            {/* Expiration Date */}
            <div className={styles.expirationContainer}>
              <Calendar size={14} color={COLORS.textSecondary} />
              <span className={styles.expirationText}>Vencimento: {item.vencimento}</span>
            </div>
            
            {/* Usage Section */}
            <div className={styles.usageContainer}>
              <div className={styles.usageInfo}>
                <p className={styles.usageText}>{item.ATUAL_MENSAGENS} de {item.LIMITE_MENSAGEM} Mensagens</p>
                
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ 
                        width: `${getUsageProgress(item) * 100}%`,
                        backgroundColor: COLORS.primary 
                      }}
                    />
                  </div>
                  <span className={styles.percentageText}>
                    {getUsagePercentage(item)}% disponível
                  </span>
                </div>
              </div>
              
              {/* Upgrade Button */}
              {item.nome_plano !== 'Starter' && (
                <button 
                  className={styles.upgradeButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigation('/adicionais');
                  }}
                  style={{ 
                    background: `linear-gradient(to bottom right, ${COLORS.primaryGradient.join(', ')})` 
                  }}
                >
                  <span className={styles.upgradeBtnText}>Upgrade</span>
                </button>
              )}
            </div>
          </div>
        </button>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerGradient}>
        <div className={styles.headerContent}>
          <button 
            onClick={() => handleNavigation(-1)}
            className={styles.backButton}
          >
            <ArrowLeft size={24} color={COLORS.secondary} />
          </button>
          
          <h1 className={styles.headerTitle}>Meus Planos</h1>
          
          <div className={styles.iconPlaceholder} />
        </div>
      </div>
      
      {/* Content */}
      <div className={styles.content}>
        <div className={styles.titleContainer}>
          <h2 className={styles.title}>Atualize suas faturas</h2>
          <p className={styles.subtitle}>Pague suas faturas de maneira fácil e ágil</p>
        </div>
        
        {faturas.length > 0 ? (
          <div className={styles.listContainer}>
            {faturas.map((item, index) => renderPlanCard(item, index))}
          </div>
        ) : (
          <div className={styles.emptyContainer}>
            <div className={styles.emptyIcon}>
              <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <p className={styles.emptyText}>Nenhum plano encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaturasPendentes;