import React, { useState, useEffect } from 'react';
import { useApp } from '../../../../context/AppContext';
import { QRCodeImage } from './QRCode'; // Importar o componente QR Code real
import styles from './Pagamento.module.css';
import { toast } from 'react-toastify';
import { 
  FiX, 
  FiCreditCard, 
  FiSmartphone,
  FiCopy,
  FiCheck,
  FiClock,
  FiAlertCircle,
  FiRefreshCw
} from 'react-icons/fi';

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  paymentData, 
  onPaymentSuccess 
}) => {
  const { socketService, user, socketConnected } = useApp();
  
  const [activeTab, setActiveTab] = useState('pix');
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState(null);
  const [cardData, setCardData] = useState({
    number: '',
    holder: '',
    expiry: '',
    cvv: '',
    installments: 1
  });
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [paymentId, setPaymentId] = useState(null);
  const [countdown, setCountdown] = useState(900); // 15 minutos
  const [copied, setCopied] = useState(false);

  // Reset modal when opening
  useEffect(() => {
    if (isOpen) {
      setPixData(null);
      setPaymentStatus('pending');
      setPaymentId(null);
      setCountdown(900);
      setCopied(false);
      setCardData({
        number: '',
        holder: '',
        expiry: '',
        cvv: '',
        installments: 1
      });
    }
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0 && pixData && paymentStatus === 'pending') {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown, pixData, paymentStatus]);

  // Payment status checker
  useEffect(() => {
    let interval;
    if (paymentId && paymentStatus === 'pending') {
      interval = setInterval(async () => {
        try {
          const status = await socketService.verifyPaymentStatus(paymentId);
          if (status?.status === 'approved') {
            setPaymentStatus('approved');
            toast.success('Pagamento aprovado com sucesso!');
            if (onPaymentSuccess) onPaymentSuccess();
            setTimeout(() => onClose(), 2000);
          } else if (status?.status === 'rejected') {
            setPaymentStatus('rejected');
            toast.error('Pagamento foi rejeitado. Tente novamente.');
          }
        } catch (error) {
          console.error('Erro ao verificar status do pagamento:', error);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [paymentId, paymentStatus, socketService, onPaymentSuccess, onClose]);

  // Format countdown time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle PIX payment
  const handlePixPayment = async () => {
    if (!user?.LOGIN || !socketConnected || !paymentData) return;

    setLoading(true);
    try {
      const response = await socketService.createSubscriptionPixPayment({
        login: user.LOGIN,
        produto: paymentData.produto,
        valor: paymentData.valor,
        assunto: paymentData.assunto,
        assinatura: paymentData.assinatura,
        mensagens: paymentData.mensagens
      });

      if (response?.qr_code || response?.pix_code) {
        setPixData({
          qrCode: response.qr_code || response.pix_code,
          pixKey: response.pix_key || response.codigo_pix,
          amount: paymentData.valor,
          expiration: response.expiration_date
        });
        setPaymentId(response.payment_id || response.id);
        toast.success('QR Code PIX gerado com sucesso!');
      } else {
        throw new Error('Erro ao gerar QR Code PIX');
      }
    } catch (error) {
      console.error('Erro ao processar pagamento PIX:', error);
      toast.error('Erro ao gerar pagamento PIX. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Handle card payment
  const handleCardPayment = async () => {
    if (!user?.LOGIN || !socketConnected || !paymentData) return;

    // Validate card data
    if (!cardData.number || !cardData.holder || !cardData.expiry || !cardData.cvv) {
      toast.error('Preencha todos os campos do cartão');
      return;
    }

    setLoading(true);
    try {
      const response = await socketService.createSubscriptionCardPayment({
        login: user.LOGIN,
        produto: paymentData.produto,
        valor: paymentData.valor,
        assunto: paymentData.assunto,
        assinatura: paymentData.assinatura,
        mensagens: paymentData.mensagens,
        cardNumber: cardData.number.replace(/\s/g, ''),
        cardHolder: cardData.holder,
        cardExpiry: cardData.expiry,
        cardCvv: cardData.cvv,
        installments: cardData.installments
      });

      if (response?.status === 'approved') {
        setPaymentStatus('approved');
        toast.success('Pagamento aprovado com sucesso!');
        if (onPaymentSuccess) onPaymentSuccess();
        setTimeout(() => onClose(), 2000);
      } else if (response?.status === 'pending') {
        setPaymentStatus('processing');
        setPaymentId(response.payment_id || response.id);
        toast.info('Pagamento sendo processado...');
      } else {
        throw new Error(response?.message || 'Erro no pagamento');
      }
    } catch (error) {
      console.error('Erro ao processar pagamento com cartão:', error);
      toast.error(error.message || 'Erro ao processar pagamento. Verifique os dados do cartão.');
    } finally {
      setLoading(false);
    }
  };

  // Copy PIX code
  const copyPixCode = () => {
    if (pixData?.pixKey) {
      navigator.clipboard.writeText(pixData.pixKey);
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Format card number
  const formatCardNumber = (value) => {
    return value
      .replace(/\s/g, '')
      .replace(/(.{4})/g, '$1 ')
      .trim()
      .substring(0, 19);
  };

  // Format expiry date
  const formatExpiry = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .substring(0, 5);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2>Finalizar Pagamento</h2>
            <p>{paymentData?.produto}</p>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <FiX />
          </button>
        </div>

        {/* Payment Summary */}
        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span>Produto:</span>
            <span>{paymentData?.produto}</span>
          </div>
          <div className={styles.summaryItem}>
            <span>Valor:</span>
            <span className={styles.amount}>R$ {paymentData?.valor?.toFixed(2)}</span>
          </div>
          {paymentData?.description && (
            <div className={styles.summaryItem}>
              <span>Descrição:</span>
              <span>{paymentData.description}</span>
            </div>
          )}
        </div>

        {/* Payment Status */}
        {paymentStatus !== 'pending' && (
          <div className={`${styles.status} ${styles[paymentStatus]}`}>
            {paymentStatus === 'approved' && (
              <>
                <FiCheck />
                <span>Pagamento Aprovado!</span>
              </>
            )}
            {paymentStatus === 'processing' && (
              <>
                <FiClock />
                <span>Processando Pagamento...</span>
              </>
            )}
            {paymentStatus === 'rejected' && (
              <>
                <FiAlertCircle />
                <span>Pagamento Rejeitado</span>
              </>
            )}
          </div>
        )}

        {/* Payment Tabs */}
        {paymentStatus === 'pending' && (
          <>
            <div className={styles.tabs}>
              <button 
                className={`${styles.tab} ${activeTab === 'pix' ? styles.active : ''}`}
                onClick={() => setActiveTab('pix')}
              >
                <FiSmartphone />
                PIX
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'card' ? styles.active : ''}`}
                onClick={() => setActiveTab('card')}
              >
                <FiCreditCard />
                Cartão
              </button>
            </div>

            {/* PIX Payment */}
            {activeTab === 'pix' && (
              <div className={styles.pixContent}>
                {!pixData ? (
                  <div className={styles.pixInitial}>
                    <div className={styles.pixInfo}>
                      <FiSmartphone size={48} />
                      <h3>Pagamento via PIX</h3>
                      <p>Forma mais rápida e segura de pagar</p>
                      <ul>
                        <li>Aprovação instantânea</li>
                        <li>Disponível 24/7</li>
                        <li>Sem taxas adicionais</li>
                      </ul>
                    </div>
                    <button 
                      className={styles.generatePixButton}
                      onClick={handlePixPayment}
                      disabled={loading}
                    >
                      {loading ? <FiRefreshCw className={styles.spinning} /> : 'Gerar QR Code PIX'}
                    </button>
                  </div>
                ) : (
                  <div className={styles.pixGenerated}>
                    <div className={styles.pixTimer}>
                      <FiClock />
                      <span>Expira em: {formatTime(countdown)}</span>
                    </div>
                    
                    <div className={styles.qrCodeContainer}>
                      <QRCodeImage 
                        value={pixData.qrCode} 
                        size={200}
                        onLoad={() => console.log('QR Code carregado')}
                        onError={(err) => console.error('Erro no QR Code:', err)}
                      />
                    </div>

                    <div className={styles.pixInstructions}>
                      <h4>Como pagar:</h4>
                      <ol>
                        <li>Abra o app do seu banco</li>
                        <li>Escaneie o QR Code acima</li>
                        <li>Confirme o pagamento</li>
                      </ol>
                    </div>

                    <div className={styles.pixCode}>
                      <label>Ou copie o código PIX:</label>
                      <div className={styles.codeContainer}>
                        <input 
                          type="text" 
                          value={pixData.pixKey || ''} 
                          readOnly 
                        />
                        <button 
                          className={styles.copyButton}
                          onClick={copyPixCode}
                        >
                          {copied ? <FiCheck /> : <FiCopy />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Card Payment */}
            {activeTab === 'card' && (
              <div className={styles.cardContent}>
                <div className={styles.cardForm}>
                  <div className={styles.formGroup}>
                    <label>Número do Cartão</label>
                    <input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      value={cardData.number}
                      onChange={(e) => setCardData(prev => ({
                        ...prev,
                        number: formatCardNumber(e.target.value)
                      }))}
                      maxLength={19}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Nome no Cartão</label>
                    <input
                      type="text"
                      placeholder="Nome como no cartão"
                      value={cardData.holder}
                      onChange={(e) => setCardData(prev => ({
                        ...prev,
                        holder: e.target.value.toUpperCase()
                      }))}
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Validade</label>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        value={cardData.expiry}
                        onChange={(e) => setCardData(prev => ({
                          ...prev,
                          expiry: formatExpiry(e.target.value)
                        }))}
                        maxLength={5}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>CVV</label>
                      <input
                        type="text"
                        placeholder="000"
                        value={cardData.cvv}
                        onChange={(e) => setCardData(prev => ({
                          ...prev,
                          cvv: e.target.value.replace(/\D/g, '').substring(0, 4)
                        }))}
                        maxLength={4}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Parcelas</label>
                    <select
                      value={cardData.installments}
                      onChange={(e) => setCardData(prev => ({
                        ...prev,
                        installments: parseInt(e.target.value)
                      }))}
                    >
                      <option value={1}>1x de R$ {paymentData?.valor?.toFixed(2)} (sem juros)</option>
                      <option value={2}>2x de R$ {(paymentData?.valor / 2)?.toFixed(2)} (sem juros)</option>
                      <option value={3}>3x de R$ {(paymentData?.valor / 3)?.toFixed(2)} (sem juros)</option>
                      <option value={6}>6x de R$ {(paymentData?.valor / 6)?.toFixed(2)} (sem juros)</option>
                      <option value={12}>12x de R$ {(paymentData?.valor / 12)?.toFixed(2)} (sem juros)</option>
                    </select>
                  </div>

                  <button 
                    className={styles.payButton}
                    onClick={handleCardPayment}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <FiRefreshCw className={styles.spinning} />
                        Processando...
                      </>
                    ) : (
                      `Pagar R$ ${paymentData?.valor?.toFixed(2)}`
                    )}
                  </button>
                </div>

                <div className={styles.cardSecurity}>
                  <FiAlertCircle />
                  <span>Seus dados estão protegidos com criptografia SSL</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;