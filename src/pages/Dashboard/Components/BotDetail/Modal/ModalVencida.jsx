import React from 'react';
import styles from './ModalVencida.module.css';
import { FiX, FiCreditCard, FiAlertTriangle } from 'react-icons/fi';

export default function SubscriptionExpiredModal({ visible, onClose, onRenew, onAcknowledge }) {
  if (!visible) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <button className={styles.closeButton} onClick={onClose}>
          <FiX size={20} />
        </button>

        <div className={styles.modalHeader}>
          <div className={styles.iconContainer}>
            <FiAlertTriangle size={32} />
          </div>
          <h2 className={styles.modalTitle}>Assinatura Vencida</h2>
        </div>

        <div className={styles.modalContent}>
          <div className={styles.warningBadge}>
            <span>Acesso Expirado</span>
          </div>
          
          <p className={styles.description}>
            Sua assinatura mensal expirou e você não pode ativar automações no momento. 
            Para continuar usando nossos serviços, renove sua assinatura agora.
          </p>

          <div className={styles.benefitsList}>
            <div className={styles.benefitItem}>
              <div className={styles.benefitIcon}>✓</div>
              <span>Automações ilimitadas</span>
            </div>
            <div className={styles.benefitItem}>
              <div className={styles.benefitIcon}>✓</div>
              <span>Suporte prioritário</span>
            </div>
            <div className={styles.benefitItem}>
              <div className={styles.benefitIcon}>✓</div>
              <span>Relatórios avançados</span>
            </div>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button 
            className={styles.acknowledgeButton} 
            onClick={onAcknowledge}
          >
            Estou Ciente
          </button>
          
          <button 
            className={styles.renewButton} 
            onClick={onRenew}
          >
            <FiCreditCard size={18} />
            Renovar Assinatura
          </button>
        </div>
      </div>
    </div>
  );
}