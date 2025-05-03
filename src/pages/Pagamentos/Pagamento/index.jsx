// Pagamento.jsx
import React, { useState } from 'react';
import PixPayment from '../Pix/index'
import styles from './Pagamento.module.css';

const Pagamento = () => {
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  // Sample plans data
  const plans = [
    {
      id: 'basic',
      nome_plano: 'Básico',
      valor: '29.90',
      ASSUNTO: 'Assinatura Básica ChatPro',
      QTD_MENSAGENS: 300,
      features: ['300 mensagens/mês', 'Suporte por e-mail', 'Acesso básico']
    },
    {
      id: 'standard',
      nome_plano: 'Padrão',
      valor: '59.90',
      ASSUNTO: 'Assinatura Padrão ChatPro',
      QTD_MENSAGENS: 750,
      features: ['750 mensagens/mês', 'Suporte prioritário', 'Acesso a recursos exclusivos']
    },
    {
      id: 'premium',
      nome_plano: 'Premium',
      valor: '99.90',
      ASSUNTO: 'Assinatura Premium ChatPro',
      QTD_MENSAGENS: 2000,
      features: ['2000 mensagens/mês', 'Suporte 24/7', 'Acesso completo a todos recursos']
    }
  ];
  
  // Helper function to get user login - fixed implementation
  const getUserLogin = () => {
    // In a real app, you would get this from your auth system
    // For now, return a default value to prevent errors
    return localStorage.getItem('userLogin') || 'user123';
  };
  
  const handlePaymentClick = (plan) => {
    // Create a complete fatura object with all required properties
    const fatura = {
      valor: plan.valor,                     // Required! Must be a string like "99.90"
      nome_plano: plan.nome_plano,           // Required! Name of the plan
      id_assinatura: `${plan.id}_${Date.now()}`,  // Generate a unique ID
      data: new Date().toLocaleDateString('pt-BR'),
      login: getUserLogin(),                 // Now this function is defined
      ASSUNTO: plan.ASSUNTO || `Assinatura ${plan.nome_plano}`,
      QTD_MENSAGENS: plan.QTD_MENSAGENS || 0
    };
    
    // Debug log to verify fatura object
    console.log('Selected plan for payment:', fatura);
    
    // Store fatura in state and show payment screen
    setSelectedPlan(fatura);
    setShowPayment(true);
  };
  
  const handleBackToDashboard = () => {
    setShowPayment(false);
    setSelectedPlan(null);
  };
  
  // Show the payment screen if a plan is selected
  if (showPayment && selectedPlan) {
    return <PixPayment fatura={selectedPlan} onBack={handleBackToDashboard} />;
  }
  
  // Otherwise show the dashboard
  return (
    <div className={styles.dashboardContainer}>
      {/* Dashboard Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>Animus ChatPro</h1>
          <div className={styles.profileSection}>
            <div className={styles.profileIcon}>
              <span>US</span>
            </div>
            <span className={styles.username}>{getUserLogin()}</span>
          </div>
        </div>
      </header>
      
      {/* Dashboard Content */}
      <main className={styles.mainContent}>
        <section className={styles.welcomeSection}>
          <h2>Bem-vindo ao seu Dashboard</h2>
          <p>Escolha um plano para continuar usando nossos serviços</p>
        </section>
        
        {/* Plans Section */}
        <section className={styles.plansSection}>
          <h3 className={styles.sectionTitle}>Planos Disponíveis</h3>
          
          <div className={styles.planCards}>
            {plans.map((plan) => (
              <div key={plan.id} className={styles.planCard}>
                <div className={styles.planHeader}>
                  <h4 className={styles.planName}>{plan.nome_plano}</h4>
                  <p className={styles.planPrice}>
                    <span className={styles.currency}>R$</span>
                    <span className={styles.amount}>{parseFloat(plan.valor).toFixed(2)}</span>
                    <span className={styles.period}>/mês</span>
                  </p>
                </div>
                
                <div className={styles.planFeatures}>
                  {plan.features.map((feature, index) => (
                    <div key={index} className={styles.featureItem}>
                      <i className="material-icons">check_circle</i>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                
                <button 
                  className={styles.paymentButton}
                  onClick={() => handlePaymentClick(plan)}
                >
                  Assinar Plano
                </button>
              </div>
            ))}
          </div>
        </section>
        
        {/* Usage Stats Section */}
        <section className={styles.statsSection}>
          <h3 className={styles.sectionTitle}>Estatísticas de Uso</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <i className="material-icons">message</i>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>0/300</span>
                <span className={styles.statLabel}>Mensagens Usadas</span>
              </div>
            </div>
            
            <div className={styles.statCard}>
              <i className="material-icons">calendar_today</i>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>Grátis</span>
                <span className={styles.statLabel}>Plano Atual</span>
              </div>
            </div>
            
            <div className={styles.statCard}>
              <i className="material-icons">access_time</i>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>3 dias</span>
                <span className={styles.statLabel}>Restantes</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Dashboard Footer */}
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Animus ChatPro - Todos os direitos reservados</p>
      </footer>
    </div>
  );
};

export default Pagamento;