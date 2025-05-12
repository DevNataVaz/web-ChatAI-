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
  const [error, setError] = useState(null);

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
    } else {
      setError('Plano não encontrado');
      setLoading(false);
    }

    // Setup socket listeners
    const socket = socketService.connect();
    
    socket.on('ResponsePagamentosPix', (data) => {
      try {
        console.log('Resposta PIX recebida:', data);
        
        // PRIMEIRO PROBLEMA: Garantir que estamos recebendo um objeto JavaScript
        let result;
        try {
          // Tenta descriptografar
          result = safeDescriptografar(data);
          console.log('Resposta PIX descriptografada (objeto original):', result);
          
          // Se o resultado for uma string, tenta converter para objeto
          if (typeof result === 'string') {
            console.log('Convertendo string para objeto...');
            result = JSON.parse(result);
          }
          
          // Força a serialização e deserialização para garantir um objeto limpo
          const serialized = JSON.stringify(result);
          result = JSON.parse(serialized);
          console.log('Resposta PIX normalizada:', result);
          console.log('Código realmente existe?', 'Code' in result);
          console.log('Propriedades do objeto:', Object.keys(result));
        } catch (parseErr) {
          console.error('Erro ao processar JSON:', parseErr);
          setError('Erro ao processar resposta do servidor');
          setStatus('error');
          setLoading(false);
          return;
        }
        
        // SOLUÇÃO ALTERNATIVA: Extrair o código PIX diretamente usando expressões regulares
        // Isso ignora a estrutura do objeto e procura diretamente pelo padrão do código PIX
        let pixCode = '';
        
        if (typeof result === 'object' && result !== null) {
          // Tenta todas as propriedades possíveis que poderiam conter o código
          const possibleKeys = ['Dados', 'dados', 'data', 'pixCode', 'code', 'value'];
          
          for (const key of Object.keys(result)) {
            if (typeof result[key] === 'string' && 
                result[key].includes('br.gov.bcb.pix') && 
                result[key].length > 20) {
              console.log('Encontrado código PIX na propriedade:', key);
              pixCode = result[key];
              break;
            }
          }
        }
        
        // Se encontrou um código PIX válido
        if (pixCode) {
          console.log('Código PIX extraído com sucesso:', pixCode);
          setQrCode(pixCode);
          setLoading(false);
          checkPixStatus(pixCode);
        } else {
          // Tenta extrair o código diretamente da string de resposta
          const responseStr = typeof data === 'string' ? data : JSON.stringify(data);
          const pixMatch = responseStr.match(/00020126580014br\.gov\.bcb\.pix[0-9a-zA-Z.-]+/);
          
          if (pixMatch && pixMatch[0]) {
            console.log('Código PIX extraído da resposta bruta:', pixMatch[0]);
            setQrCode(pixMatch[0]);
            setLoading(false);
            checkPixStatus(pixMatch[0]);
          } else {
            console.error('Não foi possível extrair o código PIX de nenhuma fonte');
            setError('Código PIX não encontrado na resposta');
            setStatus('error');
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Erro ao processar resposta PIX:', err);
        
        // SOLUÇÃO DE EMERGÊNCIA: Tenta extrair o código PIX diretamente da string de erro
        try {
          const errorStr = err.toString();
          const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
          const combinedStr = errorStr + dataStr;
          
          // Procura por padrões de código PIX em qualquer parte da string
          const pixMatch = combinedStr.match(/00020126580014br\.gov\.bcb\.pix[0-9a-zA-Z.-]+/);
          
          if (pixMatch && pixMatch[0]) {
            console.log('Código PIX extraído da mensagem de erro:', pixMatch[0]);
            setQrCode(pixMatch[0]);
            setLoading(false);
            checkPixStatus(pixMatch[0]);
            return;
          }
        } catch (extractErr) {
          console.error('Erro ao tentar extrair código da mensagem de erro:', extractErr);
        }
        
        setError(`Erro ao processar resposta: ${err.message}`);
        setStatus('error');
        setLoading(false);
      }
    });

    socket.on('ResponseVerificaPix', (data) => {
      try {
        console.log('Resposta verificação PIX recebida:', data);
        const result = safeDescriptografar(data.Dados || data);
        console.log('Resposta verificação PIX descriptografada:', result);
        
        setStatus(result.status);
        
        if (result.status === 'approved') {
          setModalVisible(true);
          setTimeout(() => {
            navigate('/dashboard');
          }, 5000);
        }
      } catch (err) {
        console.error('Erro ao verificar PIX:', err);
        setError(`Erro ao verificar pagamento: ${err.message}`);
      }
    });

    // Verificar se o socket está conectado
    if (!socket.connected) {
      console.log('Socket desconectado. Tentando reconectar...');
      socket.connect();
    }

    return () => {
      socket.off('ResponsePagamentosPix');
      socket.off('ResponseVerificaPix');
    };
  }, [user, planoId, navigate, planos]);

  const generatePix = (plano) => {
    setLoading(true);
    setError(null);
    
    try {
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

      const socket = socketService.socket;
      
      if (!socket || !socket.connected) {
        console.error('Socket não está conectado');
        setError('Erro de conexão com o servidor');
        setLoading(false);
        return;
      }

      console.log('Enviando solicitação PIX:', data);
      socket.emit('PagamentosPix', Criptografar(JSON.stringify(data)));
      
      // Definir um timeout para caso não receba resposta
      setTimeout(() => {
        if (loading && !qrCode) {
          setError('Tempo limite excedido ao gerar código PIX');
          setStatus('error');
          setLoading(false);
        }
      }, 15000);
    } catch (err) {
      console.error('Erro ao gerar PIX:', err);
      setError(`Erro ao gerar PIX: ${err.message}`);
      setStatus('error');
      setLoading(false);
    }
  };

  const checkPixStatus = (qrCode) => {
    try {
      const data = {
        Code: '6534453456544653514343132516325',
        Dados: qrCode,
        Id_Assinatura: user.ID || plano.ID,
        Nome: plano?.PLANO,
        Qtd_Mensagens: plano?.MENSAGENS || 0
      };

      console.log('Verificando status PIX:', data);
      socketService.socket.emit('VerificaPix', Criptografar(JSON.stringify(data)));
    } catch (err) {
      console.error('Erro ao verificar PIX:', err);
      setError(`Erro ao verificar pagamento: ${err.message}`);
    }
  };

  const copyQrCode = () => {
    if (!qrCode) {
      setError('Nenhum código PIX disponível para copiar');
      return;
    }
    
    navigator.clipboard.writeText(qrCode)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      })
      .catch(err => {
        console.error('Erro ao copiar:', err);
        setError('Não foi possível copiar o código');
      });
  };

  const handleVerification = () => {
    setLoading(true);
    setError(null);
    
    if (!qrCode) {
      setError('Nenhum código PIX disponível para verificar');
      setLoading(false);
      return;
    }
    
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

        {error && (
          <div className={styles.errorMessage}>
            <AlertTriangle size={20} color="#f23d4f" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Gerando código Pix...</p>
          </div>
        ) : status === 'error' ? (
          <div className={styles.errorContainer}>
            <AlertTriangle size={48} color="#f23d4f" />
            <h2>Erro ao gerar o código Pix</h2>
            <p>{error || 'Não foi possível gerar o código Pix. Por favor, tente novamente mais tarde.'}</p>
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
                  <div className={styles.pixCodeValue} style={{ wordBreak: 'break-all', overflowWrap: 'break-word', maxHeight: '150px', overflow: 'auto' }}>
                    {qrCode ? (
                      <code>{qrCode}</code>
                    ) : (
                      'Código não disponível'
                    )}
                  </div>
                </div>
              </div>
              <button 
                className={styles.copyButton} 
                onClick={copyQrCode}
                disabled={!qrCode}
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
              disabled={loading || !qrCode}
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