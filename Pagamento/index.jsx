// PixPayment.jsx
import React, { useState, useEffect } from 'react';
import styles from './pagamento.module.css';

const PixPayment = ({ fatura = {}, onBack }) => {
  const [countdown, setCountdown] = useState(900); // 15 minutos em segundos
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, success, expired
  
  // Gera um código PIX fictício
  const pixCode = "00020126580014BR.GOV.BCB.PIX0136a629534e-7693-4846-b028-f142082d7d5a5204000053039865802BR5913Animus ChatPro6008Brasilia62070503***6304E2CA";
  
  // Formata o valor da fatura para exibição
  const formattedValue = fatura && fatura.valor 
    ? parseFloat(fatura.valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })
    : "R$ 0,00";
  
  // Efeito para o contador regressivo
  useEffect(() => {
    if (countdown > 0 && paymentStatus === 'pending') {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (countdown === 0 && paymentStatus === 'pending') {
      setPaymentStatus('expired');
    }
  }, [countdown, paymentStatus]);
  
  // Formatar o tempo restante
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Simular uma verificação de pagamento
  useEffect(() => {
    if (paymentStatus === 'pending') {
      const checkInterval = setInterval(() => {
        // Aqui você implementaria a lógica real para verificar o status do pagamento
        // Por enquanto, apenas uma simulação aleatória de sucesso (10% de chance a cada 5 segundos)
        if (Math.random() < 0.1) {
          setPaymentStatus('success');
          clearInterval(checkInterval);
        }
      }, 5000);
      
      return () => clearInterval(checkInterval);
    }
  }, [paymentStatus]);
  
  // Copiar código PIX para a área de transferência
  const handleCopyPixCode = () => {
    navigator.clipboard.writeText(pixCode)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      })
      .catch(err => {
        console.error('Erro ao copiar: ', err);
      });
  };
  
  // Simulação do QR Code (em produção você usaria uma biblioteca real de QR code)
  const QRCodePlaceholder = () => (
    <div className={styles.qrCodePlaceholder}>
      <div className={styles.qrCodeFrame}>
        <div className={styles.qrCodeInner}></div>
      </div>
    </div>
  );
  
  return (
    <div className={styles.dashboardContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>Animus ChatPro</h1>
          <div className={styles.profileSection}>
            <div className={styles.profileIcon}>
              <span>US</span>
            </div>
            <span className={styles.username}>{fatura && fatura.login ? fatura.login : 'Usuário'}</span>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.paymentContainer}>
          <button className={styles.backButton} onClick={onBack}>
            <i className="material-icons">arrow_back</i>
            Voltar ao Dashboard
          </button>
          
          {paymentStatus === 'pending' && (
            <>
              <div className={styles.paymentHeader}>
                <h2>Pagamento via PIX</h2>
                <p>Escaneie o QR code ou copie o código PIX abaixo para realizar o pagamento</p>
              </div>
              
              <div className={styles.paymentInfo}>
                <div className={styles.planDetails}>
                  <h3>Detalhes da Compra</h3>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Plano:</span>
                    <span className={styles.detailValue}>{fatura && fatura.nome_plano ? fatura.nome_plano : 'Não informado'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Mensagens:</span>
                    <span className={styles.detailValue}>{fatura && fatura.QTD_MENSAGENS ? `${fatura.QTD_MENSAGENS} mensagens/mês` : 'Não informado'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Valor:</span>
                    <span className={styles.detailValue}>{formattedValue}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Data:</span>
                    <span className={styles.detailValue}>{fatura && fatura.data ? fatura.data : new Date().toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                
                <div className={styles.qrCodeContainer}>
                  <QRCodePlaceholder />
                  <div className={styles.timer}>
                    <i className="material-icons">timer</i>
                    <span>Expira em: {formatTime(countdown)}</span>
                  </div>
                </div>
              </div>
              
              <div className={styles.pixCodeSection}>
                <h3>Código PIX para cópia</h3>
                <div className={styles.pixCodeContainer}>
                  <div className={styles.pixCode}>{pixCode}</div>
                  <button 
                    className={styles.copyButton} 
                    onClick={handleCopyPixCode}
                  >
                    <i className="material-icons">{copied ? 'check' : 'content_copy'}</i>
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
              
              <div className={styles.paymentInstructions}>
                <h3>Como pagar com PIX</h3>
                <ol className={styles.instructionsList}>
                  <li>Abra o aplicativo do seu banco</li>
                  <li>Acesse a área PIX</li>
                  <li>Escaneie o QR code ou cole o código copiado</li>
                  <li>Confira as informações e confirme o pagamento</li>
                  <li>Aguarde a confirmação (pode levar até 1 minuto)</li>
                </ol>
              </div>
            </>
          )}
          
          {paymentStatus === 'success' && (
            <div className={styles.successContainer}>
              <div className={styles.successIcon}>
                <i className="material-icons">check_circle</i>
              </div>
              <h2>Pagamento Confirmado!</h2>
              <p>Seu plano {fatura && fatura.nome_plano ? fatura.nome_plano : 'selecionado'} foi ativado com sucesso.</p>
              <div className={styles.successDetails}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Mensagens disponíveis:</span>
                  <span className={styles.detailValue}>{fatura && fatura.QTD_MENSAGENS ? fatura.QTD_MENSAGENS : 'Plano Ativado'}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Valor pago:</span>
                  <span className={styles.detailValue}>{formattedValue}</span>
                </div>
              </div>
              <button className={styles.returnButton} onClick={onBack}>
                Voltar ao Dashboard
              </button>
            </div>
          )}
          
          {paymentStatus === 'expired' && (
            <div className={styles.expiredContainer}>
              <div className={styles.expiredIcon}>
                <i className="material-icons">error</i>
              </div>
              <h2>Tempo de Pagamento Expirado</h2>
              <p>O tempo para realizar o pagamento expirou. Por favor, tente novamente.</p>
              <button className={styles.returnButton} onClick={onBack}>
                Voltar ao Dashboard
              </button>
            </div>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Animus ChatPro - Todos os direitos reservados</p>
      </footer>
    </div>
  );
};

export default PixPayment;