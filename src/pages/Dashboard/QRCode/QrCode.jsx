// QRCode.jsx - Versão melhorada
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import styles from './QRCode.module.css';
import { FaWhatsapp } from 'react-icons/fa';
import { FiX, FiRefreshCw } from 'react-icons/fi';

export default function QRCodeModal({ visible, qrCodeData, isLoading, onClose, onTimeout, onRetry }) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [expired, setExpired] = useState(false);
  
  // Contagem regressiva quando temos um QR code válido
  useEffect(() => {
    if (!visible || !qrCodeData || expired) return;
    
    setTimeLeft(60);
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setExpired(true);
          if (onTimeout) onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [visible, qrCodeData, expired, onTimeout]);
  
  // Reset do estado quando o modal é aberto
  useEffect(() => {
    if (visible) {
      setExpired(false);
    }
  }, [visible]);
  
  if (!visible) return null;
  
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Fechar">
          <FiX size={24} />
        </button>
        
        <div className={styles.modalHeader}>
          <FaWhatsapp size={32} className={styles.whatsappIcon} />
          <h2>Conectar WhatsApp</h2>
        </div>
        
        <div className={styles.qrCodeContainer}>
          {expired ? (
            <div className={styles.expiredMessage}>
              <p>QR Code expirado</p>
              <button 
                className={styles.refreshButton}
                onClick={() => {
                  setExpired(false);
                  if (onRetry) onRetry();
                }}
              >
                <FiRefreshCw size={18} />
                <span>Gerar novo QR Code</span>
              </button>
            </div>
          ) : isLoading ? (
            <div className={styles.loading}>
              <div className={styles.loadingSpinner}></div>
              <p>Gerando QR Code...</p>
            </div>
          ) : qrCodeData ? (
            <>
              <QRCodeSVG 
                value={qrCodeData} 
                size={256} 
                level="H"
                includeMargin={true}
                className={styles.qrCode}
              />
              <div className={styles.timer}>
                <div className={styles.timeLeftText}>Expira em: {timeLeft}s</div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${(timeLeft / 60) * 100}%` }}
                  ></div>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.waiting}>
              <p>Aguardando QR Code...</p>
              <div className={styles.loadingDots}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
        </div>
        
        <div className={styles.instructions}>
          <h3>Como conectar:</h3>
          <ol>
            <li>Abra o WhatsApp no seu celular</li>
            <li>Toque em <strong>Menu</strong> ou <strong>Configurações</strong></li>
            <li>Selecione <strong>WhatsApp Web</strong></li>
            <li>Aponte a câmera para este QR Code</li>
          </ol>
          <p className={styles.securityNote}>
            <small>Mantenha seu celular conectado e com o WhatsApp aberto para manter a conexão ativa.</small>
          </p>
        </div>
      </div>
    </div>
  );
}