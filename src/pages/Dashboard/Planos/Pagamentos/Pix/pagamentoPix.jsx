import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './PagamentoPix.module.css';
import { socketService } from '../../../../../services/socketService';
import { Descriptografar, Criptografar } from '../../../../../Cripto/index';
import { useApp } from '../../../../../context/AppContext';
import SuccessModal from '../ModalSucesso/SuccessModal';
import { Check, Copy, ShoppingBag, Shield, AlertTriangle } from 'react-feather';

function PixPayment() {
  const { planoId } = useParams();
  const { user, planos, refreshUserData } = useApp();
  const navigate = useNavigate();
  const [plano, setPlano] = useState(null);
  const [qrCode, setQrCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState('pending'); // pending, approved, rejected
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null); // Armazenar dados do pagamento
  const [assinaturaId, setAssinaturaId] = useState(null); // ID da assinatura
  
  // Referência para o timeout
  const timeoutRef = useRef(null);
  
  // Referência para controlar se o componente está montado
  const isMounted = useRef(true);
  
  // Referência para contagem de tentativas de verificação
  const verificationAttempts = useRef(0);
  
  // Referência para controlar se uma requisição já foi enviada
  const requestSent = useRef(false);

  // Logger personalizado para depuração
  const logDebug = (message, data) => {
    if (process.env.NODE_ENV !== 'production') {
      // console.log(`[PixPayment] ${message}`, data);
    }
  };

  // Função para buscar ID da assinatura do usuário
  const fetchAssinaturaId = async () => {
    try {
      // Buscar a assinatura diretamente do banco
      const [assinatura] = await this.db.query('SELECT * FROM assinatura WHERE ID_CLIENTE = ?', [user.ID]);
      
      if (assinatura && assinatura.ID) {
        logDebug('ID da assinatura encontrado:', assinatura.ID);
        return assinatura.ID;
      }
      
      // Fallback para o ID do usuário apenas se necessário
      logDebug('ID da assinatura não encontrado, usando ID do usuário como fallback:', user.ID);
      return user.ID;
    } catch (err) {
      // console.error('Erro ao buscar ID da assinatura:', err);
      return user.ID;
    }
  };

  // Handler para a resposta do PIX - usando useCallback para manter a referência consistente
  const handlePixResponse = useCallback((data) => {
    // Limpar o timeout assim que receber a resposta
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // IMPORTANTE: Se o pagamento já foi aprovado, ignorar completamente novos códigos PIX
    if (status === 'approved') {
      logDebug('Ignorando nova resposta PIX pois o pagamento já foi aprovado');
      return;
    }
    
    logDebug('Resposta do PIX recebida:', data);
    
    try {
      // Desbloquear a possibilidade de enviar outra requisição apenas em caso de erro
      requestSent.current = false;
      
      // Tratamento do QR code
      let result;
      try {
        result = Descriptografar(data);
        
        if (typeof result === 'string') {
          try {
            result = JSON.parse(result);
          } catch (parseErr) {
            logDebug('Erro ao fazer parse JSON:', parseErr);
            // Se falhar, tenta usar a string diretamente
          }
        }
        
        // Se result for um objeto, serializa para garantir consistência
        if (typeof result === 'object' && result !== null) {
          const serialized = JSON.stringify(result);
          result = JSON.parse(serialized);
        }
        
        logDebug('Resposta do PIX decodificada:', result);
      } catch (parseErr) {
        logDebug('Erro ao decodificar resposta:', parseErr);
        // Mesmo em caso de erro, tenta continuar com a extração do QR code
        result = data; // Usa o dado original
      }
      
      // MÉTODO SIMPLIFICADO DE EXTRAÇÃO DO CÓDIGO PIX
      // Primeiro tenta encontrar no objeto de resposta
      let pixCode = '';
      
      // Se já temos um QR code e já não estamos carregando, não precisamos
      // de outro, a menos que estejamos tentando gerar um novo explicitamente
      if (qrCode && !loading) {
        logDebug('QR code já existente, ignorando nova resposta');
        return;
      }
      
      if (typeof result === 'object' && result !== null) {
        // Verificar apenas propriedades principais conhecidas
        if (result.qrCode) {
          pixCode = result.qrCode;
        } else if (result.qr_code) {
          pixCode = result.qr_code;
        } else if (result.qr_code_base64) {
          pixCode = result.qr_code_base64;
        } else if (result.qrCodeText) {
          pixCode = result.qrCodeText;
        } else if (result.point_of_interaction?.transaction_data?.qr_code) {
          pixCode = result.point_of_interaction.transaction_data.qr_code;
        } else {
          // Procurar em todas as propriedades somente se as principais não funcionarem
          for (const key of Object.keys(result)) {
            if (typeof result[key] === 'string' && 
                result[key].includes('br.gov.bcb.pix') && 
                result[key].length > 20) {
              pixCode = result[key];
              break;
            }
          }
        }
      }
      
      // Se não encontrou no objeto, tenta extrair da string com regex (apenas uma tentativa)
      if (!pixCode) {
        try {
          const responseStr = typeof data === 'string' ? data : JSON.stringify(data);
          const pixMatch = responseStr.match(/00020126580014br\.gov\.bcb\.pix[0-9a-zA-Z.-]+/);
          
          if (pixMatch && pixMatch[0]) {
            pixCode = pixMatch[0];
          }
        } catch (regexErr) {
          logDebug('Erro ao tentar extrair código via regex:', regexErr);
        }
      }
      
      // Se encontrou um código PIX válido
      if (pixCode && isMounted.current) {
        logDebug('Código PIX extraído com sucesso:', pixCode);
        
        // Verificar se o código é diferente do atual antes de atualizar
        if (pixCode !== qrCode) {
          setQrCode(pixCode);
          setLoading(false);
          
          // Use os dados armazenados para verificar o status
          if (paymentData) {
            // Pequeno delay para garantir que o backend tenha tempo de registrar o QR code
            setTimeout(() => {
              if (isMounted.current && status !== 'approved') {
                checkPixStatus(pixCode, paymentData);
              }
            }, 2000);
          }
        } else {
          logDebug('QR code recebido é idêntico ao atual, ignorando');
          setLoading(false);
        }
      } else if (isMounted.current) {
        setError('Código PIX não encontrado na resposta');
        setStatus('error');
        setLoading(false);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(`Erro ao processar resposta: ${err.message}`);
        setStatus('error');
        setLoading(false);
      }
    }
  }, [loading, paymentData, qrCode, status]);

  // Handler para a resposta de verificação do PIX - usando useCallback para manter a referência consistente
  const handleVerifyResponse = useCallback((data) => {
    logDebug('Resposta da verificação do PIX recebida:', data);
    
    try {
      // Tratar caso de data ser null/undefined
      if (!data) {
        logDebug('Dados da verificação vazios');
        return;
      }
      
      // Tratar com segurança a decodificação para evitar erros
      let result;
      try {
        result = Descriptografar(data.Dados || data);
        
        // Garantir que o resultado é um objeto
        if (typeof result === 'string') {
          try {
            result = JSON.parse(result);
          } catch (parseErr) {
            logDebug('Erro ao fazer parse do resultado da verificação:', parseErr);
            // Se não conseguir fazer o parse, tente determinar o status a partir da string
            if (result.includes('approved') || result.includes('APPROVED')) {
              result = { status: 'approved' };
            } else if (result.includes('pending') || result.includes('PENDING')) {
              result = { status: 'pending' };
            } else {
              // Caso não seja possível determinar o status, mantenha o atual
              return;
            }
          }
        }
      } catch (decryptErr) {
        // Se falhar ao descriptografar, tente extrair informações da string original
        logDebug('Erro ao descriptografar resposta da verificação:', decryptErr);
        const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
        
        if (dataStr.includes('approved') || dataStr.includes('APPROVED')) {
          result = { status: 'approved' };
        } else if (dataStr.includes('pending') || dataStr.includes('PENDING')) {
          result = { status: 'pending' };
        } else {
          // Se não for possível extrair o status, não atualize o estado
          return;
        }
      }
      
      logDebug('Resultado da verificação do PIX processado:', result);
      
      const statusValue = result?.status || 'pending';
      
      if (isMounted.current) {
        // Importante: ao confirmar aprovação, impedir novas requisições
        if (statusValue === 'approved') {
          // Bloqueamos permanentemente novas requisições quando aprovado
          requestSent.current = true;
          setStatus('approved');
          setModalVisible(true);
          
          // Limpar verificações automáticas
          verificationAttempts.current = 0;
          
          // Desconectar o socket para evitar novos eventos
          try {
            const socket = socketService.socket;
            if (socket) {
              socket.off('ResponsePagamentosPix');
              socket.off('ResponseVerificaPix');
            }
          } catch (socketErr) {
            logDebug('Erro ao desconectar socket:', socketErr);
          }
          
          // Adicionar um evento para recarregar os dados do usuário no contexto
          // antes de navegar para o dashboard
          setTimeout(async () => {
            if (isMounted.current) {
              try {
                // Recarregar dados do usuário após aprovação do pagamento
                // Isso garantirá que o dashboard exiba os dados atualizados
                await refreshUserData();
                
                // Navegar para o dashboard
                navigate('/dashboard');
              } catch (refreshErr) {
                // console.error('Erro ao atualizar dados do usuário:', refreshErr);
                // Navegar mesmo com erro, o dashboard deve recarregar os dados
                navigate('/dashboard');
              }
            }
          }, 100);
        } else if (statusValue === 'pending' && status !== 'approved' && verificationAttempts.current < 5) {
          // Só atualizar o status se ainda não estiver aprovado
          if (status !== 'approved') {
            setStatus('pending');
          }
          
          // Tentar verificar novamente até 5 vezes (apenas se não estiver aprovado)
          verificationAttempts.current += 1;
          setTimeout(() => {
            if (isMounted.current && status !== 'approved' && qrCode && paymentData) {
              checkPixStatus(qrCode, paymentData);
            }
          }, 10000);
        }
      }
    } catch (err) {
      // console.error('Erro ao verificar PIX:', err);
      if (isMounted.current) {
        setError(`Erro ao verificar pagamento: ${err.message}`);
      }
    }
  }, [navigate, refreshUserData, status]);

  // Efeito para controlar o ciclo de vida do componente
  useEffect(() => {
    // Configurar o sinalizador de montagem
    isMounted.current = true;
    
    // Limpar o timeout ao desmontar o componente
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Efeito principal - com dependências reduzidas ao mínimo necessário
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Limpar qualquer timeout existente ao refazer a busca
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Resetar o estado de requisição enviada
    requestSent.current = false;

    // Buscar ID da assinatura - CRÍTICO para a atualização correta do plano
    fetchAssinaturaId().then(id => {
      if (!isMounted.current) return;
      
      setAssinaturaId(id);
      logDebug('ID da assinatura obtido:', id);
      
      // Procurar o plano selecionado
      const selectedPlano = planos.find(p => p.ID === parseInt(planoId));
      logDebug('Plano selecionado:', selectedPlano);
      
      if (selectedPlano) {
        setPlano(selectedPlano);
        
        // Armazenar os dados de pagamento - CRUCIAL para a atualização do plano
        const paymentDataObj = {
          Code: '546546546546645',
          transaction_amount: parseFloat(selectedPlano.PRECO_MES.replace(',', '.')),
          description: `Assinatura ${selectedPlano.PLANO}`,
          payment_method_id: 'pix',
          payer: {
            email: user.EMAIL || user.LOGIN + '@gmail.com',
          },
          Login: user.LOGIN,
          Nome: selectedPlano.PLANO,     // Nome exato do plano
          Id: id,                        // ID da assinatura (não o ID do plano)
          ASSUNTO: 'PLANO',              // Tipo de transação
          Qtd_Mensagens: selectedPlano.MENSAGENS || 0
        };
        
        logDebug('Dados de pagamento configurados:', paymentDataObj);
        setPaymentData(paymentDataObj);
        generatePix(paymentDataObj);
      } else {
        setError('Plano não encontrado');
        setLoading(false);
      }
    });

    // Limpar ao desmontar
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [planoId, user, navigate, planos]); // Manter apenas as dependências essenciais

  // Efeito separado para configurar os ouvintes de socket - independente dos dados
  useEffect(() => {
    // Setup socket listeners
    const socket = socketService.connect();
    
    // Garantir que os listeners não sejam duplicados
    socket.off('ResponsePagamentosPix');
    socket.off('ResponseVerificaPix');
    
    socket.on('ResponsePagamentosPix', handlePixResponse);
    socket.on('ResponseVerificaPix', handleVerifyResponse);

    // Verificar se o socket está conectado
    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      // Remover listeners ao desmontar
      socket.off('ResponsePagamentosPix', handlePixResponse);
      socket.off('ResponseVerificaPix', handleVerifyResponse);
    };
  }, [handlePixResponse, handleVerifyResponse]);

  const generatePix = (data) => {
    if (!isMounted.current) return;
    
    // Evitar múltiplas requisições
    if (requestSent.current) {
      logDebug('Requisição já enviada, ignorando chamada duplicada');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const socket = socketService.socket;
      
      if (!socket || !socket.connected) {
        setError('Erro de conexão com o servidor');
        setLoading(false);
        return;
      }

      // Marcar que uma requisição foi enviada
      requestSent.current = true;

      // Garantir que os dados estão em string antes de criptografar
      const dataToSend = typeof data === 'string' ? data : JSON.stringify(data);
      logDebug('Enviando solicitação de PIX:', data);
      socket.emit('PagamentosPix', Criptografar(dataToSend));
      
      // Definir um timeout mais longo para caso não receba resposta
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        // Verificar se ainda não recebemos o QR code
        if (isMounted.current && loading && !qrCode) {
          // Permitir nova tentativa
          requestSent.current = false;
          
          // Verificar primeiro se o socket ainda está conectado
          if (!socket.connected) {
            socket.connect();
            setTimeout(() => {
              if (isMounted.current && loading && !qrCode) {
                setError('Erro de conexão com o servidor. Tente novamente.');
                setStatus('error');
                setLoading(false);
              }
            }, 5000);
          } else {
            setError('Tempo limite excedido ao gerar código PIX. Tente novamente.');
            setStatus('error');
            setLoading(false);
          }
        }
      }, 30000); // 30 segundos
    } catch (err) {
      logDebug('Erro ao gerar PIX:', err);
      requestSent.current = false; // Permitir nova tentativa em caso de erro
      
      if (isMounted.current) {
        setError(`Erro ao gerar PIX: ${err.message}`);
        setStatus('error');
        setLoading(false);
      }
    }
  };

  const checkPixStatus = (qrCode, configData) => {
    if (!isMounted.current) return;
    
    // IMPORTANTE: Se o pagamento já foi aprovado, não fazer mais verificações
    if (status === 'approved') {
      logDebug('Ignorando verificação de PIX pois pagamento já foi aprovado');
      return;
    }
    
    try {
      // Garantir que estamos usando EXATAMENTE os mesmos dados enviados inicialmente
      const data = {
        Code: '6534453456544653514343132516325',
        Dados: qrCode,
        Id_Assinatura: configData.Id, 
        Nome: configData.Nome,        
        Qtd_Mensagens: String(configData.Qtd_Mensagens || "0"),
        ASSUNTO: 'PLANO',
        Login: configData.Login  
      };
      console.log(configData)
      // Log detalhado para depuração
      logDebug('Dados para verificação do PIX:', data);
      
      // Converter para string antes de criptografar
      const dataStr = JSON.stringify(data);
      
      // Verificar se o socket está conectado antes de emitir
      const socket = socketService.socket;
      if (!socket || !socket.connected) {
        logDebug('Socket não conectado, reconectando...');
        socketService.connect();
        
        // Pequeno delay para dar tempo de reconectar
        setTimeout(() => {
          if (isMounted.current && status !== 'approved') {
            socketService.socket.emit('VerificaPix', Criptografar(dataStr));
          }
        }, 100);
      } else {
        socket.emit('VerificaPix', Criptografar(dataStr));
      }
    } catch (err) {
      logDebug('Erro ao verificar PIX:', err);
      if (isMounted.current) {
        setError(`Erro ao verificar pagamento: ${err.message}`);
      }
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
        setTimeout(() => {
          if (isMounted.current) {
            setCopied(false);
          }
        }, 3000);
      })
      .catch(err => {
        setError('Não foi possível copiar o código');
      });
  };

  const handleVerification = () => {
    if (!isMounted.current) return;
    
    setLoading(true);
    setError(null);
    
    if (!qrCode) {
      setError('Nenhum código PIX disponível para verificar');
      setLoading(false);
      return;
    }
    
    // Resetar contagem de tentativas
    verificationAttempts.current = 0;
    
    // Usar os dados armazenados para verificação manual
    checkPixStatus(qrCode, paymentData);
    setTimeout(() => {
      if (isMounted.current) {
        setLoading(false);
      }
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
              onClick={() => {
                requestSent.current = false; // Reset do bloqueio de requisição
                generatePix(paymentData);
              }}
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
        paymentData={paymentData}
      />
    </div>
  );
}

export default PixPayment;