import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './Pagamento.module.css';
import { Shield, CreditCard, Cpu } from 'react-feather';
import { useApp } from '../../../../../context/AppContext';

function PaymentMethod() {
  const navigate = useNavigate();
  const { planoId } = useParams();
  const { planos } = useApp();
  const [plano, setPlano] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Buscar o plano com base no planoId da URL
    if (planos && planos.length > 0) {
      const selectedPlano = planos.find(p => p.ID === parseInt(planoId));
      if (selectedPlano) {
        setPlano(selectedPlano);
      }
    }
    setLoading(false);
  }, [planoId, planos]);

  const handleMethodSelect = (method) => {
    if (method === 'card') {
      navigate(`/pagamento/cartao/${planoId}`);
    } else if (method === 'pix') {
      navigate(`/pagamento/pix/${planoId}`);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Carregando detalhes do plano...</p>
        </div>
      </div>
    );
  }

  if (!plano) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p>Plano não encontrado. Por favor, selecione um plano válido.</p>
          <button 
            className={styles.returnButton}
            onClick={() => navigate('/planos')}
          >
            Voltar para planos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {/* <button 
          className={styles.backButton} 
          onClick={() => navigate('/planos')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 19L5 12L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button> */}
        <h1>Pagamento de Plano</h1>
      </div>

      <div className={styles.content}>
        <h2>Detalhes do plano</h2>
        
        <div className={styles.planCard}>
          <div className={styles.planIcon}>
            <Shield size={32} color="#8A05BE" />
          </div>
          <div className={styles.planDetails}>
            <h3>{plano.PLANO}</h3>
            <div className={styles.planPrice}>
              <h2>R$ {parseFloat(plano.PRECO_MES).toFixed(2)}</h2>
              <span>ID fatura: {plano.ID}</span>
            </div>
            
            <div className={styles.planFeatures}>
              <div className={styles.featureItem}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="#8A05BE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="#8A05BE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="#8A05BE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.55231C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="#8A05BE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{plano.ATENDENTES} atendentes simultâneos</span>
              </div>
              <div className={styles.featureItem}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="#8A05BE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{plano.MENSAGENS} mensagens por mês</span>
              </div>
            </div>
          </div>
        </div>

        <h2>Métodos de pagamento</h2>
        
        <div className={styles.paymentMethods}>
          <div 
            className={styles.paymentMethod}
            onClick={() => handleMethodSelect('card')}
          >
            <div className={styles.methodIcon}>
              <CreditCard size={24} color="#8A05BE" />
            </div>
            <div className={styles.methodInfo}>
              <h4>Cartão de crédito ou débito</h4>
              <p>Agilize seu pagamento com seu cartão</p>
            </div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="#8A05BE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <div 
            className={styles.paymentMethod}
            onClick={() => handleMethodSelect('pix')}
          >
            <div className={styles.methodIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L6.5 11H17.5L12 2Z" fill="#8A05BE" />
                <path d="M17.5 22L23 13H12L17.5 22Z" fill="#8A05BE" />
                <path d="M6.5 22L1 13H12L6.5 22Z" fill="#8A05BE" />
              </svg>
            </div>
            <div className={styles.methodInfo}>
              <h4>Pix</h4>
              <p>Agilize seu pagamento com pix</p>
            </div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="#8A05BE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div className={styles.securityInfo}>
          <Shield size={16} color="#8A05BE" />
          <p>Suas informações de pagamento são protegidas com criptografia de ponta a ponta</p>
        </div>
      </div>
    </div>
  );
}

export default PaymentMethod;