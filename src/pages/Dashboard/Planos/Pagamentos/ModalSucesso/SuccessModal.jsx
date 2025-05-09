import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SuccessModal.module.css';
import { CheckCircle, AlertTriangle, Clock } from 'react-feather';

function SuccessModal({ visible, onClose, status, plano, paymentData = {} }) {
  const navigate = useNavigate();

  if (!visible) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={48} color="#00a650" />;
      case 'rejected':
        return <AlertTriangle size={48} color="#f23d4f" />;
      case 'in_process':
      case 'pending':
        return <Clock size={48} color="#ff7733" />;
      default:
        return <AlertTriangle size={48} color="#8A05BE" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'approved':
        return '#00a650';
      case 'rejected':
        return '#f23d4f';
      case 'in_process':
      case 'pending':
        return '#ff7733';
      default:
        return '#8A05BE';
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'approved':
        return 'Seu pagamento foi aprovado';
      case 'rejected':
        return 'Não foi possível processar seu pagamento';
      case 'in_process':
      case 'pending':
        return 'Estamos processando seu pagamento';
      default:
        return 'Status do pagamento';
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case 'pending':
      case 'in_process':
        return 'Não se preocupe, em poucos minutos vamos reconhecer seu pagamento.';
      default:
        return '';
    }
  };

  const getButtonText = () => {
    switch (status) {
      case 'rejected':
        return 'Escolher outro meio de pagamento';
      default:
        return 'Voltar ao dashboard';
    }
  };

  const handleButtonClick = () => {
    if (status === 'rejected') {
      navigate(`/pagamento/${plano.ID}`);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div 
          className={styles.modalHeader}
          style={{ backgroundColor: getStatusColor() }}
        >
          <div className={styles.statusIcon}>
            {getStatusIcon()}
          </div>
        </div>
        
        <div className={styles.modalBody}>
          <h2>{getStatusMessage()}</h2>
          
          {getStatusDescription() && (
            <p className={styles.statusDescription}>{getStatusDescription()}</p>
          )}
          
          <div className={styles.paymentDetails}>
            <div className={styles.detailsItem}>
              <div className={styles.detailsIcon}>
                <img 
                  src="/assets/mercadopago.png" 
                  alt="Mercado Pago" 
                  className={styles.mpLogo}
                />
              </div>
              <div className={styles.detailsInfo}>
                <h3>R$ {plano.PRECO_MES}</h3>
                <p>Pago pelo Mercado Pago</p>
              </div>
            </div>
          </div>
          
          <div className={styles.paymentDetails}>
            <div className={styles.detailsItem}>
              <div className={styles.detailsIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 12V22H4V12" stroke="#8A05BE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 7H2V12H22V7Z" stroke="#8A05BE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 22V7" stroke="#8A05BE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 7H16.5C17.163 7 17.7989 6.73661 18.2678 6.26777C18.7366 5.79893 19 5.16304 19 4.5C19 3.83696 18.7366 3.20107 18.2678 2.73223C17.7989 2.26339 17.163 2 16.5 2C13 2 12 7 12 7Z" stroke="#8A05BE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 7H7.5C6.83696 7 6.20107 6.73661 5.73223 6.26777C5.26339 5.79893 5 5.16304 5 4.5C5 3.83696 5.26339 3.20107 5.73223 2.73223C6.20107 2.26339 6.83696 2 7.5 2C11 2 12 7 12 7Z" stroke="#8A05BE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className={styles.detailsInfo}>
                <h3>Descrição</h3>
                <p>Animus ChatPro Point</p>
              </div>
            </div>
          </div>
          
          <div className={styles.paymentDetails}>
            <div className={styles.detailsItem}>
              <div className={styles.detailsIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#8A05BE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 16V12" stroke="#8A05BE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8H12.01" stroke="#8A05BE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className={styles.detailsInfo}>
                <h3>Plano {plano.PLANO}</h3>
                <p>{paymentData.DATA ? `${paymentData.DATA} às ${paymentData.HORA} h.` : new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          
          <button 
            className={styles.actionButton}
            onClick={handleButtonClick}
          >
            {getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SuccessModal;