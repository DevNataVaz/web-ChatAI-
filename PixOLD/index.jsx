// PixPayment.jsx
import React, { useEffect, useState } from 'react';
//import { Clipboard } from './clipboard-polyfill'; // You'll need to implement this or use a library
import io from 'socket.io-client'; // For Socket.io functionality
//import { Criptografar, Descriptografar } from '../../../Cripto'; // Import your encryption functions
// import Loading from './loading';
// import Verifica from './verificar';
// import Resultado from './resultado';
import styles from './PixPayment.module.css';
import Variaveis from '../../../../Variaveis.json';

// Socket setup - you would need to configure this

 
// const Socket = io(`${Variaveis.ENDERECO}`, {
//     transports: ['websocket'],
//     withCredentials: true,
//     extraHeaders: {
//       "my-custom-header": "value"
//     }
//   })


  const Clipboard = {
    writeText: async (text) => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          return navigator.clipboard.writeText(text);
        }
        
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        return success ? Promise.resolve() : Promise.reject(new Error('Unable to copy to clipboard'));
      } catch (err) {
        return Promise.reject(err);
      }
    }
  };
  
  
  const Socket = {
    socket: {
      emit: (event, data) => console.log(`Emitting ${event}`),
      once: (event, callback) => {
        
        if (event === 'ResponsePagamentosPix') {
          setTimeout(() => {
            callback(JSON.stringify({
              Dados: 'PIX00020126580014BR.GOV.BCB.PIX0136b76aa9ff-3ec5-4c42-a5ac-297db0be3f5a5204000053039865802BR5925ANIMUS TECNOLOGIA LTDA ME6009SAO PAULO62070503***6304E2CA',
              Code: '6556464556446536143562'
            }));
          }, 500);
        }
        
        // Simulate verification response
        if (event === 'ResponseVerificaPix') {
          setTimeout(() => {
            callback({
              Dados: JSON.stringify({
                status: true,
                data: new Date().toLocaleDateString('pt-BR'),
                hora: new Date().toLocaleTimeString('pt-BR'),
                valor: '99.90',
                nome: 'João da Silva'
              })
            });
          }, 500);
        }
      },
      off: (event) => console.log(`Removing listener for ${event}`)
    }
  };
  
  // Mock encryption functions
  const Criptografar = (data) => data;
  const Descriptografar = (data) => data;
  
  // Mock Loading component
  const Loading = ({ visible, Mensagem }) => {
    if (!visible) return null;
    
    return (
      <div className={styles.loadingOverlay}>
        <div className={styles.spinner}></div>
        <div className={styles.loadingMessage}>{Mensagem}</div>
      </div>
    );
  };
  
  // Mock Verifica component
  const Verifica = {
    showAlert: (title, message) => {
      alert(`${title}\n\n${message}`);
    }
  };
  
  // Mock Resultado component
  const Resultado = ({ dados }) => {
    if (!dados.Visible) return null;
    
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <h3 className={styles.modalTitle}>
            Pagamento {dados.Compra ? 'Confirmado' : 'Pendente'}
          </h3>
          
          {dados.Compra ? (
            <div className={styles.confirmationContent}>
              <div className={styles.statusIconSuccess}>
                <i className="material-icons">check</i>
              </div>
              <p className={styles.infoRow}>Data: {dados.Data}</p>
              <p className={styles.infoRow}>Hora: {dados.Hora}</p>
              <p className={styles.infoRow}>Valor: R$ {dados.Valor && dados.Valor.toFixed(2)}</p>
              <p className={styles.infoRow}>Pagante: {dados.Nome}</p>
              <button className={styles.closeButton}>
                Fechar
              </button>
            </div>
          ) : (
            <div className={styles.confirmationContent}>
              <div className={styles.statusIconPending}>
                <i className="material-icons">timer</i>
              </div>
              <p className={styles.pendingText}>Aguardando a confirmação do pagamento...</p>
              <button className={styles.closeButton}>
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Main PixPayment Component
  const PixPayment = ({ fatura, onBack }) => {
      // Add prop validation check at the beginning
      if (!fatura || typeof fatura !== 'object') {
          console.error('No fatura data provided to PixPayment component');
          return (
              <div className={styles.errorContainer}>
                  <h2>Erro ao carregar dados do pagamento</h2>
                  <p>Os dados necessários para o pagamento não foram encontrados.</p>
                  <button 
                      onClick={onBack} 
                      className={styles.errorButton}
                  >
                      Voltar
                  </button>
              </div>
          );
      }
      
      // Destructure fatura with default values to prevent undefined errors
      const {
          valor = '0.00',
          nome_plano = 'Plano',
          id_assinatura = `temp_${Date.now()}`,
          data = new Date().toLocaleDateString('pt-BR'),
          login = 'user',
          ASSUNTO = 'Pagamento',
          QTD_MENSAGENS = 0
      } = fatura;
      
      const [result, setResult] = useState({ 
        Visible: false, 
        Compra: null, 
        Chave: '', 
        Hora: '', 
        Data: '', 
        Valor: null, 
        Nome: '' 
      });
      const [alerta, setAlerta] = useState('Copiar código Pix Copia e Cola');
      const [loading, setLoading] = useState(false);
  
      const copyToClipboard = async () => {
          try {
              await Clipboard.writeText(result.Chave);
              setAlerta("Copiado!");
              
              // Reset the text after 3 seconds
              setTimeout(() => {
                  setAlerta("Copiar código Pix Copia e Cola");
              }, 3000);
          } catch (err) {
              console.error('Failed to copy text: ', err);
          }
      };
  
      useEffect(() => {
          console.log('PixPayment mounted with fatura:', fatura);
          handlePayment();
          
          // Cleanup function to remove socket listeners
          return () => {
              Socket.socket.off('ResponsePagamentosPix');
              Socket.socket.off('ResponseVerificaPix');
          };
      }, []);
  
      const handlePayment = async () => {
          try {
              // In a web app, you would retrieve this from localStorage
              const loginInicial = localStorage.getItem('LoginInicial') || login;
              
              const paymentData = {
                  Code: '5645345656874689877997849',
                  transaction_amount: valor,
                  description: ASSUNTO,
                  payment_method_id: 'pix',
                  payer: {
                      email: `${login}@gmail.com`,
                  },
                  Login: loginInicial,
                  Nome: nome_plano,
                  Id: id_assinatura,
                  ASSUNTO: ASSUNTO,
                  Qtd_Mensagens: QTD_MENSAGENS
              };
              
              console.log('Sending payment data:', paymentData);
              Socket.socket.emit('PagamentosPix', Criptografar(JSON.stringify(paymentData)));
  
              Socket.socket.once('ResponsePagamentosPix', ((data) => {
                  try {
                      const {Dados, Code} = JSON.parse(Descriptografar(data));
  
                      if(Code === '6556464556446536143562'){
                          setResult((prev) => ({ ...prev, Chave: Dados }));
                      }
                      if(Code === '65564645564465361435621'){
                          Verifica.showAlert('Ops, algo deu errado', 'Serviço temporariamente indisponível. Por favor, tente novamente mais tarde.');
                      }
                  } catch (error) {
                      console.error('Error processing PIX response:', error);
                  }
              }));
  
          } catch (error) {
              console.error('Error processing payment:', error);
              alert('Error processing payment. Please try again later.');
          }
      };
  
      const handlerVerificarPix = () => {
          setLoading(true);
  
          setTimeout(() => {
              setLoading(false);
  
              const dados = {
                  Code: '6534453456544653514343132516325',
                  Dados: result.Chave,
                  Id_Assinatura: id_assinatura,
                  Nome: nome_plano,
                  Qtd_Mensagens: QTD_MENSAGENS
              };
              
              console.log('Verifying payment:', dados);
              Socket.socket.emit('VerificaPix', Criptografar(JSON.stringify(dados)));
      
              Socket.socket.once('ResponseVerificaPix', (dados) => {
                  try {
                      const responseData = JSON.parse(Descriptografar(dados.Dados));
                      const { status, data, hora, valor: valorPago, nome } = responseData;
                      
                      setResult((prev) => ({ 
                          ...prev, 
                          Compra: status, 
                          Visible: true, 
                          Data: data, 
                          Hora: hora, 
                          Valor: parseFloat(valorPago), 
                          Nome: nome 
                      }));
                  } catch (error) {
                      console.error('Error processing verification response:', error);
                      Verifica.showAlert('Erro na verificação', 'Houve um erro ao verificar o pagamento. Tente novamente mais tarde.');
                  }
              });
          }, 1000); // Reduced from 5000 for demo purposes
      };
  
      return (
          <div className={styles.container}>
              {loading && <Loading visible={loading} Mensagem={'VERIFICANDO PAGAMENTO...'} />}
              
              {/* Header with Gradient */}
              <div className={styles.header}>
                  <button 
                      onClick={onBack}
                      className={styles.backButton}
                  >
                      <i className="material-icons">arrow_back</i>
                  </button>
                  
                  <div className={styles.pixIconWrapper}>
                      <div className={styles.pixIcon}>
                          <i className="material-icons">pix</i>
                      </div>
                  </div>
              </div>
              
              <div className={styles.content}>
                  <div className={styles.headerText}>
                      <p className={styles.instructionText}>
                          Para concluir o pagamento, copie o código Pix e pague
                      </p>
                      <p className={styles.valueText}>
                          R$ {parseFloat(valor).toFixed(2)}
                      </p>
                      <p className={styles.helperText}>
                          Use a opção Pix Copia e Cola no seu banco.
                      </p>
                  </div>
                  
                  {/* Pix Code Card */}
                  <div className={styles.card}>
                      <div className={styles.cardContent}>
                          <div className={styles.codeRow}>
                              <div className={styles.iconContainer}>
                                  <img 
                                      src="/api/placeholder/30/30"
                                      alt="PIX Icon"
                                      className={styles.pixLogo}
                                  />
                              </div>
                              <div className={styles.codeInfo}>
                                  <p className={styles.codeLabel}>
                                      Código Pix
                                  </p>
                                  <p className={styles.codeValue}>
                                      {result.Chave || 'Gerando código...'}
                                  </p>
                              </div>
                          </div>
                          
                          <button 
                              onClick={copyToClipboard}
                              className={styles.copyButton}
                              disabled={!result.Chave}
                          >
                              <i className="material-icons">content_copy</i>
                              <span className={styles.buttonText}>
                                  {alerta}
                              </span>
                          </button>
                      </div>
                  </div>
                  
                  {/* Description Card */}
                  <div className={styles.card}>
                      <div className={styles.infoRow}>
                          <div className={styles.iconContainer}>
                              <i className="material-icons">shopping_bag</i>
                          </div>
                          <div>
                              <p className={styles.infoTitle}>
                                  Descrição
                              </p>
                              <p className={styles.infoValue}>
                                  Animus ChatPro Point
                              </p>
                          </div>
                      </div>
                  </div>
                  
                  {/* Plan Card */}
                  <div className={styles.card}>
                      <div className={styles.infoRow}>
                          <div className={styles.iconContainer}>
                              <i className="material-icons">shield</i>
                          </div>
                          <div>
                              <p className={styles.infoTitle}>
                                  Plano {nome_plano}
                              </p>
                              <p className={styles.infoValue}>
                                  {data}
                              </p>
                          </div>
                      </div>
                  </div>
                  
                  {/* Confirm Button */}
                  <div className={styles.buttonContainer}>
                      <button 
                          onClick={handlerVerificarPix}
                          className={styles.confirmButton}
                          disabled={!result.Chave}
                      >
                          <span className={styles.confirmButtonText}>
                              Pronto, Fiz o Pagamento
                          </span>
                      </button>
                  </div>
              </div>
              
              {/* Result Modal */}
              <Resultado dados={result} />
          </div>
      );
  };
  
  export default PixPayment;