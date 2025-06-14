import React, { useState, useEffect } from 'react';
import { FiX, FiRefreshCw } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import styles from './QrCode.module.css';

const QRCodeModal = ({ 
  visible, 
  qrCodeData, 
  isLoading, 
  onClose, 
  onTimeout, 
  onRetry 
}) => {
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Start timer when QR code data is available
  useEffect(() => {
    if (qrCodeData && visible) {
      setTimeLeft(60);
      setIsTimerActive(true);
    } else {
      setIsTimerActive(false);
    }
  }, [qrCodeData, visible]);

  // Timer effect
  useEffect(() => {
    let timerId;

    if (isTimerActive && timeLeft > 0) {
      timerId = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
      if (onTimeout) onTimeout();
    }

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [isTimerActive, timeLeft, onTimeout]);

  // Format time as mm:ss
  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className={`${styles.modalBackdrop} ${visible ? styles.visible : ''}`} 
      onClick={handleBackdropClick}
    >
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2>Conectar WhatsApp</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.qrCodeContainer}>
            {isLoading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Gerando QR Code...</p>
              </div>
            ) : qrCodeData ? (
              <>
                <div className={styles.qrCodeWrapper}>
                  <QRCodeSVG 
                    value={qrCodeData}
                    size={250}
                    level={"H"}
                    renderAs={"svg"}
                    includeMargin={true}
                  />
                  
                  <div className={styles.timerOverlay}>
                    <div className={styles.timerCircle}>
                      <svg width="40" height="40" viewBox="0 0 40 40">
                        <circle 
                          cx="20" cy="20" r="18" 
                          fill="none" 
                          stroke="#444444" 
                          strokeWidth="2" 
                        />
                        <circle 
                          cx="20" cy="20" r="18" 
                          fill="none" 
                          stroke="#8A05BE" 
                          strokeWidth="2" 
                          strokeDasharray={`${2 * Math.PI * 18}`}
                          strokeDashoffset={`${2 * Math.PI * 18 * (1 - timeLeft / 60)}`}
                          transform="rotate(-90 20 20)"
                        />
                      </svg>
                      <span>{formatTime()}</span>
                    </div>
                  </div>
                </div>
                
                <div className={styles.qrCodeInstructions}>
                  <p>Escaneie o código QR com seu WhatsApp para conectar</p>
                  <ol>
                    <li>Abra o WhatsApp no seu celular</li>
                    <li>Toque em <strong>Menu</strong> ou <strong>Configurações</strong></li>
                    <li>Toque em <strong>Aparelhos vinculados</strong></li>
                    <li>Toque em <strong>Vincular um aparelho</strong></li>
                    <li>Aponte a câmera do seu celular para esta tela</li>
                  </ol>
                </div>
              </>
            ) : (
              <div className={styles.expiredContainer}>
                <img 
                  src="/assets/qr-expired.svg" 
                  alt="QR Code expirado" 
                  className={styles.expiredImage}
                />
                <h3>QR Code expirado</h3>
                <p>O QR Code expirou ou ocorreu um erro na geração.</p>
                <button 
                  className={styles.refreshButton}
                  onClick={onRetry}
                >
                  <FiRefreshCw size={16} />
                  <span>Gerar novo QR Code</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;