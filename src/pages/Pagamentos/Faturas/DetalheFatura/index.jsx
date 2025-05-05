import React from 'react';
import { ArrowLeft, CreditCard, Shield, ChevronRight, Box, Users, MessageSquare } from 'lucide-react';
import styles from './DetalheFatura.module.css';

// Ícone PIX customizado
const PixIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
    <path d="M3 3h6v6H3V3zm6 6h6V3h-6v6zm6 0h6V3h-6v6zM3 15h6V9H3v6zm6 0h6V9h-6v6zm-6 6h6v-6H3v6zm6 0h6v-6H9v6zm6-6h6V9h-6v6zm0 6h6v-6h-6v6z"/>
  </svg>
);

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
};

const DetalheFatura = ({ fatura }) => {
  // Para demonstração, usando um objeto fatura mock
  const mockFatura = fatura || {
    nome_plano: 'Pro',
    PLANO: 'Pro',
    PRECO_MES: 99.90,
    valor: 99.90,
    data: '2024-01-01',
    protocolo: '123456',
    id_assinatura: '123456',
    ATENDENTES: '10',
    MENSAGENS: '20.000'
  };

  const handleNavigation = (route, params) => {
    console.log(`Navegating to ${route}`, params);
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
          
          <h1 className={styles.headerTitle}>Pagamento de Plano</h1>
          
          <div style={{ width: 24 }} />
        </div>
      </div>
      
      {/* Content Container */}
      <div className={styles.contentContainer}>
        {/* Plan Summary */}
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>Detalhes do plano</h2>
          
          <div className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <div className={styles.iconContainer}>
                <div className={styles.iconGradient}>
                  <Box size={20} color={COLORS.secondary} />
                </div>
              </div>
              
              <div className={styles.summaryInfo}>
                <div className={styles.planNameContainer}>
                  <span className={styles.planName}>
                    {mockFatura.nome_plano || mockFatura.PLANO}
                  </span>
                  <div className={styles.dateBadge}>
                    <span className={styles.dateText}>
                      {mockFatura.data}
                    </span>
                  </div>
                </div>
                
                <span className={styles.summaryLabel}>
                  Total a pagar
                </span>
                <span className={styles.summaryAmount}>
                  R$ {((mockFatura.PRECO_MES || mockFatura.valor) || 0).toFixed(2)}
                </span>
                <span className={styles.summaryId}>
                  ID fatura: {mockFatura.protocolo || mockFatura.id_assinatura}
                </span>
              </div>
            </div>
            
            {/* Plan Features Summary */}
            <div className={styles.divider} />
            
            <div className={styles.featuresContainer}>
              <div className={styles.featureRow}>
                <Users 
                  size={16} 
                  color={COLORS.primary} 
                  className={styles.featureIcon}
                />
                <span className={styles.featureText}>
                  {mockFatura.ATENDENTES} atendentes simultâneos
                </span>
              </div>
              
              <div className={styles.featureRow}>
                <MessageSquare 
                  size={16} 
                  color={COLORS.primary} 
                  className={styles.featureIcon}
                />
                <span className={styles.featureText}>
                  {mockFatura.MENSAGENS} mensagens por mês
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Payment Methods Section */}
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>Métodos de pagamento</h2>
          
          {/* Credit Card Option */}
          <div className={styles.paymentOptionWrapper}>
            <button 
              onClick={() => handleNavigation('card', { fatura: mockFatura })}
              className={styles.paymentOption}
            >
              <div className={styles.paymentIconContainer}>
                <div className={styles.paymentIconBackground}>
                  <CreditCard size={22} color={COLORS.primary} />
                </div>
              </div>
              
              <div className={styles.paymentTextContainer}>
                <span className={styles.paymentTitle}>
                  Cartão de crédito ou débito
                </span>
                <span className={styles.paymentDescription}>
                  Agilize seu pagamento com seu cartão
                </span>
              </div>
              
              <ChevronRight size={22} color={COLORS.primary} />
            </button>
          </div>
          
          {/* PIX Option */}
          <div className={styles.paymentOptionWrapper}>
            <button 
              onClick={() => handleNavigation('pix', { fatura: mockFatura })}
              className={styles.paymentOption}
            >
              <div className={styles.paymentIconContainer}>
                <div className={styles.paymentIconBackground}>
                  <PixIcon />
                </div>
              </div>
              
              <div className={styles.paymentTextContainer}>
                <span className={styles.paymentTitle}>
                  Pix
                </span>
                <span className={styles.paymentDescription}>
                  Agilize seu pagamento com pix
                </span>
              </div>
              
              <ChevronRight size={22} color={COLORS.primary} />
            </button>
          </div>
        </div>
        
        {/* Security Note */}
        <div className={styles.securityNoteContainer}>
          <Shield size={16} color={COLORS.textSecondary} />
          <span className={styles.securityNoteText}>
            Suas informações de pagamento são protegidas com criptografia de ponta a ponta
          </span>
        </div>
      </div>
    </div>
  );
};

export default DetalheFatura;