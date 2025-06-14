import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, FiSettings, FiPlay, FiPause, FiEdit2, 
  FiCopy, FiPackage, FiCheck, FiX, FiPlus
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useApp } from '../../../../context/AppContext';
import { socketService } from '../../../../services/socketService';
import { Criptografar, Descriptografar } from '../../../../Cripto/index';
import LoadingScreen from '../../../../components/loading/LoadingScreen';
import QRCodeModal from '../QrCodeModal/QrCode';
import ProductsModal from '../ProdutoModal/ProdutoModal';
import styles from './BotDetail.module.css';

const BotDetail = ({ 
  botId, 
  onBack, 
  onOpenQRCode, 
  onOpenProductsModal 
}) => {

  const navigate = useNavigate();
  const { user, isLoading, setIsLoading } = useApp();
  
  // Bot data state
  const [bot, setBot] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [botName, setBotName] = useState('');
  const [error, setError] = useState(null);
  
  // QR Code state
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQRCodeData] = useState('');
  const [qrCodeLoading, setQRCodeLoading] = useState(false);
  
  // Products state
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [products, setProducts] = useState([]);
  
  // Refs for socket listeners
  const currentProtocolRef = useRef(null);
  
  // Load bot data on component mount
  useEffect(() => {
    if (botId) {
      fetchBotDetail();
      checkConnectionStatus();
      fetchProducts();
    }
  }, [botId]);

  // Fetch bot details
  const fetchBotDetail = useCallback(async () => {
    if (!user?.LOGIN || !botId) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const request = {
        Code: '987654321654',
        Login: user.LOGIN,
        Protocolo: botId
      };

      // Create a promise to handle the async response
      const botDataPromise = new Promise((resolve, reject) => {
        // Set up a one-time listener for the response
        socketService.socket.once('BotDetalhesResponse', (data) => {
          try {
            const { Code, Dados } = JSON.parse(Descriptografar(data));

            if (Code !== '123456789654') {
              reject(new Error("Invalid response code"));
              return;
            }
            
            if (Dados) {
              resolve(Dados);
            } else {
              reject(new Error("Bot not found"));
            }
          } catch (err) {
            reject(err);
          }
        });

        // Send the request
        socketService.socket.emit('BotDetalhes', Criptografar(JSON.stringify(request)));
        
        // Add timeout in case of no response
        setTimeout(() => {
          socketService.socket.off('BotDetalhesResponse');
          reject(new Error("Timeout fetching bot details"));
        }, 15000);
      });

      // Wait for the response
      const botData = await botDataPromise;
      
      // Process the bot data
      const processedBot = {
        id: botData.ID,
        name: botData.EMPRESA || 'Bot',
        attendantName: botData.ATENDENTE || 'Atendente',
        platform: botData.REDE || '0',
        protocol: botData.PROTOCOLO,
        createdAt: new Date(botData.DATA_CRIACAO || Date.now()).toLocaleDateString('pt-BR'),
        objetivo: botData.OBJETIVO || 'Geral',
        status: null // Will be updated by checkConnectionStatus
      };
      
      setBot(processedBot);
      setBotName(processedBot.name);
      
      // Store protocol in ref for socket listeners
      currentProtocolRef.current = processedBot.protocol;
    } catch (error) {
      // console.error("Error fetching bot details:", error);
      setError(error.message || "Failed to load bot details");
      
      // If bot not found, navigate back
      if (error.message === "Bot not found") {
        toast.error("Bot não encontrado");
        navigate('/bots');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, botId, setIsLoading, navigate]);

   const handleBackClick = () => {
    if (onBack) {
      onBack();
    }
  };

    const handleQRCodeNeed = (qrData) => {
    if (onOpenQRCode) {
      onOpenQRCode(qrData);
    } else {
      setShowQRModal(true);
      setQRCodeData(qrData);
    }
  };

    const handleProductsClick = () => {
    if (onOpenProductsModal) {
      onOpenProductsModal();
    } else {
      setShowProductsModal(true);
    }
  };

  // Check bot connection status
  const checkConnectionStatus = useCallback(async () => {
    if (!botId) return;
    
    try {
      const statusRequest = {
        Code: Criptografar('7668566448964451'),
        Identificador: Criptografar(botId),
      };
      
      socketService.socket.emit('StatusWhatsapp', statusRequest);
      
      // Set up listener for connection status updates
      const handleConnectionUpdate = (data) => {
        try {
          if (!data || !data.Code || !data.Dados) return;
          
          const code = Descriptografar(data.Code);
          if (code !== '17326186765984') return;
          
          // Check if this is the current bot
          const botIdFromResponse = data.Identificador 
            ? Descriptografar(data.Identificador) 
            : currentProtocolRef.current;
            
          if (botIdFromResponse !== botId && botIdFromResponse !== currentProtocolRef.current) return;
          
          const status = Descriptografar(data.Dados) === 'true' || Descriptografar(data.Dados) === true;
          setIsConnected(status);
          setIsStarting(false);
          setIsStopping(false);
        } catch (err) {
          // console.error("Error processing connection status update:", err);
        }
      };
      
      // Register listener
      socketService.socket.on('updatesWhatsapp', handleConnectionUpdate);
      
      // Return cleanup function
      return () => {
        socketService.socket.off('updatesWhatsapp', handleConnectionUpdate);
      };
    } catch (error) {
      // console.error("Error checking connection status:", error);
    }
  }, [botId]);



  // Fetch products for this bot
  const fetchProducts = useCallback(async () => {
    if (!user?.LOGIN || !botId) return;
    
    try {
      const request = {
        Code: '45635465344565344564562546762',
        Login: user.LOGIN,
        Protocolo: botId
      };
      
      // Create a promise to handle the async response
      const productsDataPromise = new Promise((resolve, reject) => {
        // Set up a one-time listener for the response
        socketService.socket.once('ResponseReceberProdutos', (data) => {
          try {
            const response = JSON.parse(Descriptografar(data));
            
            if (!response?.Response?.mensagem) {
              resolve([]);
              return;
            }
            
            resolve(response.Response.mensagem || []);
          } catch (err) {
            reject(err);
          }
        });

        // Send the request
        socketService.socket.emit('ReceberProdutos', Criptografar(JSON.stringify(request)));
        
        // Add timeout in case of no response
        setTimeout(() => {
          socketService.socket.off('ResponseReceberProdutos');
          resolve([]); // Return empty array on timeout
        }, 15000);
      });
      
      // Wait for the response
      const productsData = await productsDataPromise;
      setProducts(productsData);
    } catch (error) {
      // console.error("Error fetching products:", error);
      setProducts([]);
    }
  }, [user, botId]);

  // Set up QR code listeners
  useEffect(() => {
    if (!botId) return;
    
    // Setup listener for QR Code
    const handleQrCode = (data) => {
      try {
        if (!data || !data.Code || !data.QRCODE) return;
        
        const code = Descriptografar(data.Code);
        if (code !== '129438921435') return;
        
        const qrData = Descriptografar(data.QRCODE);
        setQRCodeData(qrData);
        setQRCodeLoading(false);
      } catch (error) {
        // console.error("Error processing QR Code:", error);
        setQRCodeLoading(false);
      }
    };
    
    // Setup listener for WhatsApp responses
    const handleWhatsappResponse = (data) => {
      try {
        if (!data || !data.Code) return;
        
        const code = Descriptografar(data.Code);
        if (code !== '129438921435') return;
        
        const titulo = data.Titulo ? Descriptografar(data.Titulo) : '';
        const mensagem = data.Mensagem ? Descriptografar(data.Mensagem) : '';
        
        if (mensagem.includes('pronta para atender') || titulo.includes('Ótimas Notícias')) {
          setIsConnected(true);
          setShowQRModal(false);
          setIsStarting(false);
          toast.success(mensagem || "WhatsApp conectado com sucesso!");
        } else if (titulo.includes('Erro')) {
          setIsStarting(false);
          toast.error(mensagem || "Erro ao conectar WhatsApp");
        } else if (mensagem.includes('desligada com Sucesso')) {
          setIsConnected(false);
          setIsStopping(false);
          toast.success("Bot desconectado com sucesso");
        }
      } catch (error) {
        // console.error("Error processing WhatsApp response:", error);
        setIsStarting(false);
        setIsStopping(false);
      }
    };
    
    // Register listeners
    socketService.socket.on('WhatsappQR', handleQrCode);
    socketService.socket.on('WhatsappResponse', handleWhatsappResponse);
    
    // Return cleanup function
    return () => {
      socketService.socket.off('WhatsappQR', handleQrCode);
      socketService.socket.off('WhatsappResponse', handleWhatsappResponse);
    };
  }, [botId]);

  // Toggle bot connection status
const toggleBotStatus = () => {
  if (!user?.LOGIN || !bot) return;
  
  if (isConnected) {
    // Stop the bot
    setIsStopping(true);
    
    socketService.socket.emit('Whatsapp', {
      code: Criptografar('2544623544284'),
      conta: Criptografar(user.LOGIN),
      Identificador: Criptografar(bot.protocol),
    });
    
    // Safety timer
    setTimeout(() => {
      if (isStopping) {
        setIsStopping(false);
        setIsConnected(false);
        toast.info("Automação desconectada");
        
        // Force refresh status
        checkConnectionStatus();
      }
    }, 5000);
  } else {
    // Start the bot - Show QR Code
    setIsStarting(true);
    setQRCodeData("");
    setQRCodeLoading(true);
    
    // Notify parent component to show QR code modal if available
    if (props.onOpenQRCode) {
      props.onOpenQRCode("");
    } else {
      setShowQRModal(true);
    }
    
    socketService.socket.emit('Whatsapp', {
      code: Criptografar('2544623544284'),
      conta: Criptografar(user.LOGIN),
      Identificador: Criptografar(bot.protocol),
    });
    
    // Safety timer for "starting" state
    setTimeout(() => {
      if (isStarting && !isConnected) {
        setIsStarting(false);
        toast.warning("Tempo de conexão excedido. Tente novamente.");
        if (props.onOpenQRCode) {
          props.onOpenQRCode(null);
        } else {
          setShowQRModal(false);
        }
      }
    }, 60000);
  }
};
  // Save bot name
  const saveBotName = async () => {
    if (!user?.LOGIN || !bot || !botName.trim()) return;
    
    try {
      setIsLoading(true);
      
      const request = {
        Code: Criptografar('1234567890'),
        Login: Criptografar(user.LOGIN),
        Protocolo: Criptografar(bot.protocol),
        Nome: Criptografar(botName.trim())
      };
      
      socketService.socket.emit('UpdateBotName', request);
      
      // Update local state
      setBot(prev => ({
        ...prev,
        name: botName.trim()
      }));
      
      setIsEditing(false);
      toast.success("Nome do bot atualizado com sucesso");
    } catch (error) {
      // console.error("Error updating bot name:", error);
      toast.error("Erro ao atualizar nome do bot");
    } finally {
      setIsLoading(false);
    }
  };

  // Copy bot ID to clipboard
  const copyBotId = () => {
    if (!bot) return;
    
    navigator.clipboard.writeText(bot.protocol)
      .then(() => {
        toast.success("ID copiado para a área de transferência");
      })
      .catch(() => {
        toast.error("Erro ao copiar para a área de transferência");
      });
  };

  // Handle QR code timeout
  const handleQrTimeout = () => {
    setQRCodeData("");
    setQRCodeLoading(false);
    toast.info("QR Code expirado. Gere um novo para conectar.");
  };

  // Get platform-specific icon class
  const getPlatformIconClass = () => {
    if (!bot) return '';
    
    switch (bot.platform) {
      case '0':
        return styles.whatsappIcon;
      case '2':
        return styles.instagramIcon;
      default:
        return '';
    }
  };

  // Get platform name
  const getPlatformName = () => {
    if (!bot) return 'Bot';
    
    switch (bot.platform) {
      case '0':
        return 'WhatsApp';
      case '2':
        return 'Instagram';
      default:
        return 'Aplicativo';
    }
  };

  if (isLoading && !bot) {
    return <LoadingScreen />;
  }

  return (
    <div className={styles.container}>
      {bot && (
        <>
          <div className={styles.headerGradient}>
            <div className={styles.headerContent}>
              <button 
                className={styles.backButton}
                onClick={handleBackClick}
              >
                <FiArrowLeft size={20} />
                <span>Voltar</span>
              </button>
              
              <div className={styles.botHeader}>
                <div className={`${styles.botIconCircle} ${getPlatformIconClass()}`}>
                  <FiMessageCircle size={24} />
                </div>
                
                <div className={styles.botInfo}>
                  {isEditing ? (
                    <div className={styles.editNameContainer}>
                      <input
                        type="text"
                        value={botName}
                        onChange={e => setBotName(e.target.value)}
                        className={styles.editNameInput}
                        autoFocus
                      />
                      
                      <div className={styles.editActions}>
                        <button 
                          className={`${styles.editActionButton} ${styles.saveButton}`}
                          onClick={saveBotName}
                          disabled={!botName.trim()}
                        >
                          <FiCheck size={16} />
                        </button>
                        
                        <button 
                          className={`${styles.editActionButton} ${styles.cancelButton}`}
                          onClick={() => {
                            setIsEditing(false);
                            setBotName(bot.name);
                          }}
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.botName}>
                      <h2>{bot.name}</h2>
                      <button 
                        className={styles.editNameButton}
                        onClick={() => setIsEditing(true)}
                      >
                        <FiEdit2 size={16} />
                      </button>
                    </div>
                  )}
                  
                  <div className={styles.botType}>
                    <FiMessageCircle size={14} />
                    <span>{getPlatformName()} Automation</span>
                  </div>
                </div>
                
                <div className={`${styles.connectionStatus} ${isConnected ? styles.connected : styles.disconnected}`}>
                  <span className={styles.statusDot}></span>
                  <span>{isConnected ? 'Conectado' : 'Desconectado'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.content}>
            {error && (
              <div className={styles.errorContainer}>
                <p>{error}</p>
                <button 
                  className={styles.retryButton}
                  onClick={() => {
                    fetchBotDetail();
                    checkConnectionStatus();
                  }}
                >
                  Tentar novamente
                </button>
              </div>
            )}
            
            <div className={styles.actionButtons}>
              <button
                className={styles.actionButton}
                onClick={() => navigate(`/bot/settings/${bot.protocol}`)}
              >
                <FiSettings size={16} />
                <span>Configurações</span>
              </button>
              
              <button
                className={styles.actionButton}
                 onClick={handleProductsClick}
              >
                <FiPackage size={16} />
                <span>Produtos</span>
              </button>
              
              <button
                className={`${styles.actionButton} ${isConnected ? styles.stopButton : styles.startButton}`}
                onClick={toggleBotStatus}
                disabled={isStarting || isStopping}
              >
                {isStarting || isStopping ? (
                  <>
                    <div className={styles.buttonSpinner}></div>
                    <span>{isStarting ? 'Iniciando...' : 'Parando...'}</span>
                  </>
                ) : (
                  <>
                    {isConnected ? (
                      <>
                        <FiPause size={16} />
                        <span>Parar</span>
                      </>
                    ) : (
                      <>
                        <FiPlay size={16} />
                        <span>Iniciar</span>
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
            
            <div className={styles.detailsSection}>
              <div className={styles.detailCard}>
                <h3 className={styles.detailTitle}>Detalhes do Bot</h3>
                
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>ID:</div>
                  <div className={styles.detailValue}>
                    <div className={styles.copyableValue}>
                      <span className={styles.botId}>{bot.protocol}</span>
                      <button 
                        className={styles.copyButton}
                        onClick={copyBotId}
                      >
                        <FiCopy size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Atendente:</div>
                  <div className={styles.detailValue}>
                    {bot.attendantName}
                  </div>
                </div>
                
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Plataforma:</div>
                  <div className={styles.detailValue}>
                    {getPlatformName()}
                  </div>
                </div>
                
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Criado em:</div>
                  <div className={styles.detailValue}>
                    {bot.createdAt}
                  </div>
                </div>
                
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Objetivo:</div>
                  <div className={styles.detailValue}>
                    {bot.objetivo}
                  </div>
                </div>
                
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Status:</div>
                  <div className={styles.detailValue}>
                    <span className={`${styles.statusBadge} ${isConnected ? styles.activeBadge : styles.inactiveBadge}`}>
                      {isConnected ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className={styles.productsSection}>
                <div className={styles.productsSectionHeader}>
                  <h3 className={styles.detailTitle}>Produtos ({products.length})</h3>
                  <button 
                    className={styles.addProductButton}
                    onClick={() => setShowProductsModal(true)}
                  >
                    <FiPlus size={14} />
                    <span>Adicionar</span>
                  </button>
                </div>
                
                {products.length > 0 ? (
                  <div className={styles.productsGrid}>
                    {products.slice(0, 6).map((product, index) => (
                      <div key={index} className={styles.productCard}>
                        {product.URL_FOTO ? (
                          <div className={styles.productImage}>
                            <img src={product.URL_FOTO} alt={product.Titulo} />
                          </div>
                        ) : (
                          <div className={styles.productImagePlaceholder}>
                            <FiPackage size={20} />
                          </div>
                        )}
                        
                        <div className={styles.productInfo}>
                          <h4 className={styles.productName}>{product.Titulo}</h4>
                          <p className={styles.productPrice}>
                            {typeof product.Valor === 'number'
                              ? `R$ ${product.Valor.toFixed(2)}`.replace('.', ',')
                              : product.Valor}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {products.length > 6 && (
                      <div 
                        className={`${styles.productCard} ${styles.viewMoreCard}`}
                        onClick={() => setShowProductsModal(true)}
                      >
                        <div className={styles.viewMoreContent}>
                          <span>+{products.length - 6}</span>
                          <p>Ver mais</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.emptyProducts}>
                    <FiPackage size={40} />
                    <p>Nenhum produto cadastrado.</p>
                    <button 
                      className={styles.addFirstProductButton}
                      onClick={() => setShowProductsModal(true)}
                    >
                      Adicionar Produto
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* QR Code Modal */}
          {showQRModal && (
            <QRCodeModal 
              visible={showQRModal}
              qrCodeData={qrCodeData}
              isLoading={qrCodeLoading}
              onClose={() => {
                setShowQRModal(false);
                setIsStarting(false);
              }}
              onTimeout={handleQrTimeout}
              onRetry={() => {
                setQRCodeLoading(true);
                setQRCodeData("");
                
                socketService.socket.emit('Whatsapp', {
                  code: Criptografar('2544623544284'),
                  conta: Criptografar(user.LOGIN),
                  Identificador: Criptografar(bot.protocol),
                });
              }}
            />
          )}
          
          {/* Products Modal */}
          {showProductsModal && (
            <ProductsModal 
              visible={showProductsModal}
              botId={bot.protocol}
              products={products}
              onClose={() => setShowProductsModal(false)}
              onProductsChange={fetchProducts}
            />
          )}
        </>
      )}
    </div>
  );
};

export default BotDetail;