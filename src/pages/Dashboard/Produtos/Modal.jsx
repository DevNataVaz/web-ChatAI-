import React, { useEffect, useRef } from 'react';
import styles from './Modal.module.css';

const Modal = ({ children, onClose }) => {
  const modalRef = useRef(null);
  
  // Fechar o modal ao clicar fora dele
  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };
  
  // Adicionar evento de ESC para fechar o modal
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscKey);
    
    // Impedir o scroll do body quando o modal estiver aberto
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} ref={modalRef}>
        <button 
          className={styles.closeButton} 
          onClick={onClose}
          aria-label="Fechar"
        >
          <i className="fas fa-times"></i>
        </button>
        <div className={styles.modalBody}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;