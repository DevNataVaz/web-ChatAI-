import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './PagamentoPix.module.css';
import { socketService } from '../../../../../services/socketService';
import { safeDescriptografar, Criptografar } from '../../../../../Cripto/index';
import { useApp } from '../../../../../context/AppContext';
import SuccessModal from '../ModalSucesso/SuccessModal';
import { Check, Copy, ShoppingBag, Shield, AlertTriangle } from 'react-feather';

function PixPayment() {
  const { planoId } = useParams();
  const { user, planos } = useApp();
  const navigate = useNavigate();
  const [plano, setPlano] = useState(null);
  const [qrCode, setQrCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState('pending'); // pending, approved, rejected
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Find selected plan
    const selectedPlano = planos.find(p => p.ID === parseInt(planoId));
    if (selectedPlano) {
      setPlano(selectedPlano);
      generatePix(selectedPlano);
    }

    // Setup socket listeners
    const socket = socketService.connect();
    
    socket.on('ResponsePagamentosPix', (data) => {
      try {
        const result = safeDescriptografar(data);
        if (result && result.Code === '6556464556446536143562') {
          setQrCode(result.Dados);
          setLoading(false);
          checkPixStatus(result.Dados);
        } else if (result && result.Code === '65564645564465361435621') {
          setStatus('error');
          setLoading(false);
        }
      } catch (err) {
        console.error('Erro ao processar resposta PIX:', err);
        setStatus('error');
        setLoading(false);
      }
    });

    socket.on('ResponseVerificaPix', (data) => {
      try {
        const result = safeDescriptografar(data.Dados || data);
        setStatus(result.status);
        
        if (result.status === 'approved') {
          setModalVisible(true);
          setTimeout(() => {
            navigate('/dashboard');
          }, 5000);
        }
      } catch (err) {
        console.error('Erro ao verificar PIX:', err);
      }
    });

    return () => {
      socket.off('ResponsePagamentosPix');
      socket.off('ResponseVerificaPix');
    };
  }, [user, planoId, navigate, planos]);

  const generatePix = (plano) => {
    const data = {
      Code: '546546546546645',
      transaction_amount: parseFloat(plano.PRECO_MES.replace(',', '.')),
      description: `Assinatura ${plano.PLANO}`,
      payment_method_id: 'pix',
      payer: {
        email: user.EMAIL || user.LOGIN + '@gmail.com',
      },
      Login: user.LOGIN,
      Nome: plano.PLANO,
      Id: plano.ID,
      ASSUNTO: 'PLANO',
      Qtd_Mensagens: plano.MENSAGENS || 0
    };

    socketService.socket.emit('PagamentosPix', Criptografar(JSON.stringify(data)));
  };

  const checkPixStatus = (qrCode) => {
    const data = {
      Code: '6534453456544653514343132516325',
      Dados: qrCode,
      Id_Assinatura: user.ID || plano.ID,
      Nome: plano?.PLANO,
      Qtd_Mensagens: plano?.MENSAGENS || 0
    };

    socketService.socket.emit('VerificaPix', Criptografar(JSON.stringify(data)));
  };

  const copyQrCode = () => {
    navigator.clipboard.writeText(qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleVerification = () => {
    setLoading(true);
    checkPixStatus(qrCode);
    setTimeout(() => {
      setLoading(false);
    }, 3000);
  };

  if (!plano) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Carregando detalhes do plano...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {/* <button 
          className={styles.backButton} 
          onClick={() => navigate(`/pagamento/${planoId}`)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 19L5 12L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button> */}
        <div className={styles.headerCircle}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L6.5 11H17.5L12 2Z" fill="white" />
            <path d="M17.5 22L23 13H12L17.5 22Z" fill="white" />
            <path d="M6.5 22L1 13H12L6.5 22Z" fill="white" />
          </svg>
        </div>
      </div>

      <div className={styles.content}>
        <h1>Para concluir o pagamento, copie o código Pix e pague R$ {plano.PRECO_MES}</h1>
        <p className={styles.subText}>Use a opção Pix Copia e Cola no seu banco.</p>

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Gerando código Pix...</p>
          </div>
        ) : status === 'error' ? (
          <div className={styles.errorContainer}>
            <AlertTriangle size={48} color="#f23d4f" />
            <h2>Erro ao gerar o código Pix</h2>
            <p>Não foi possível gerar o código Pix. Por favor, tente novamente mais tarde.</p>
            <button 
              className={styles.retryButton}
              onClick={() => generatePix(plano)}
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            <div className={styles.pixCodeCard}>
              <div className={styles.pixCodeHeader}>
                <div className={styles.pixIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L6.5 11H17.5L12 2Z" fill="#916bfb" />
                    <path d="M17.5 22L23 13H12L17.5 22Z" fill="#916bfb" />
                    <path d="M6.5 22L1 13H12L6.5 22Z" fill="#916bfb" />
                  </svg>
                </div>
                <div className={styles.pixCodeInfo}>
                  <span className={styles.pixCodeLabel}>Código Pix</span>
                  <div className={styles.pixCodeValue}>{qrCode}</div>
                </div>
              </div>
              <button 
                className={styles.copyButton} 
                onClick={copyQrCode}
              >
                {copied ? (
                  <>
                    <Check size={20} color="white" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={20} color="white" />
                    <span>Copiar código Pix Copia e Cola</span>
                  </>
                )}
              </button>
            </div>

            <div className={styles.detailsCard}>
              <div className={styles.detailsItem}>
                <div className={styles.detailsIcon}>
                  <ShoppingBag size={20} color="#916bfb" />
                </div>
                <div className={styles.detailsInfo}>
                  <h4>Descrição</h4>
                  <p>Animus ChatPro Point</p>
                </div>
              </div>
            </div>

            <div className={styles.detailsCard}>
              <div className={styles.detailsItem}>
                <div className={styles.detailsIcon}>
                  <Shield size={20} color="#916bfb" />
                </div>
                <div className={styles.detailsInfo}>
                  <h4>Plano {plano.PLANO}</h4>
                  <p>{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <button 
              className={styles.verifyButton}
              onClick={handleVerification}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className={styles.buttonSpinner}></div>
                  <span>Verificando pagamento...</span>
                </>
              ) : (
                <span>Pronto, Fiz o Pagamento</span>
              )}
            </button>
          </>
        )}
      </div>

      <SuccessModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)}
        status={status}
        plano={plano}
      />
    </div>
  );
}

export default PixPayment;