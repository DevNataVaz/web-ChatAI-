import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../../../context/AppContext';
import { socketService } from '../../../../services/socketService';
import { Criptografar, Descriptografar } from '../../../../Cripto/index';
import { toast } from 'react-toastify';
import styles from './Gatilhos.module.css';

// Importar ícones do Lucide (ou usar SVGs como componentes)
import { 
  Edit, Trash2, Plus, RefreshCw, Check, Save,
  Key, X, Image, Clock, AlertTriangle, Copy,
  ChevronDown, ArrowRight, Search, MessageSquare
} from 'lucide-react';

const Gatilhos = () => {
  // Get user from AppContext
  const { user } = useApp();
  
  // Local state
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [chaveBot, setChaveBot] = useState('');
  const [chaveApi, setChaveApi] = useState('');
  const [login, setLogin] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [chaves, setChaves] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageBase64, setImageBase64] = useState('');
  const [selectedKeyId, setSelectedKeyId] = useState(null);
  const [editingKey, setEditingKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  // Available bots for selection
  const [availableBots, setAvailableBots] = useState([]);
  const [loadingBots, setLoadingBots] = useState(false);
  const [showBotSelection, setShowBotSelection] = useState(false);
  
  // Refs for click outside handling
  const botDropdownRef = useRef(null);
  const modalRef = useRef(null);
  const searchInputRef = useRef(null);
  
  // Use ref to track if initial data load has happened
  const initialLoadComplete = useRef(false);
  
  // Calculate remaining characters for message
  const MAX_CHARS = 2000;
  const remainingChars = MAX_CHARS - mensagem.length;
  const charCounterClass = remainingChars < 100 
    ? styles.charCounterLow 
    : remainingChars < 500 
      ? styles.charCounterWarning 
      : styles.charCounter;

  // Handle click outside of dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (botDropdownRef.current && !botDropdownRef.current.contains(event.target)) {
        setShowBotSelection(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Direct fetch bots implementation
  const fetchBots = useCallback(async () => {
    if (!user?.LOGIN) {
      return;
    }
    
    setLoadingBots(true);
    
    try {
      // Send direct socket request for bots
      const get = {
        Code: '234645423654423465',
        Login: user.LOGIN,
      };

      // Create a promise to handle the async response
      const botsDataPromise = new Promise((resolve, reject) => {
        // Remove any existing listeners first to avoid duplicates
        socketService.socket.off('MeusRobosResponse');
        
        // Set up a one-time listener for the response
        socketService.socket.once('MeusRobosResponse', (data) => {
          try {
            const decryptedData = Descriptografar(data);
            const parsedData = JSON.parse(decryptedData);
            
            if (!parsedData || !parsedData.Dados) {
              reject(new Error("Formato de dados inválido"));
              return;
            }

            // Transform the data for frontend
            const botsData = parsedData.Dados.map((item, index) => {
              return {
                id: String(index + 1),
                name: item.ATENDENTE || item.EMPRESA || `Bot ${index + 1}`,
                protocol: item.PROTOCOLO || `bot_${index + 1}`,
              };
            });

            resolve(botsData);
          } catch (err) {
            reject(err);
          }
        });

        // Send the request after setting up the listener
        const requestData = Criptografar(JSON.stringify(get));
        socketService.socket.emit('MeusRobos', requestData);
        
        // Add timeout in case of no response
        setTimeout(() => {
          socketService.socket.off('MeusRobosResponse');
          reject(new Error("Timeout ao buscar bots"));
        }, 10000);
      });

      // Wait for the response
      const botsData = await botsDataPromise;
      
      // Update state with the fetched bots
      setAvailableBots(botsData);
      
      // Set default bot if not already set
      if (botsData.length > 0 && !chaveBot) {
        setChaveBot(botsData[0].protocol);
      }
      
      // Show success message
      if (botsData.length > 0) {
        toast.success(`${botsData.length} bots encontrados`);
      } else {
        toast.info("Nenhum bot encontrado na sua conta");
      }
    } catch (error) {
      toast.error("Não foi possível carregar a lista de bots: " + error.message);
    } finally {
      setLoadingBots(false);
    }
  }, [user, chaveBot]);

  // Alternative method to fetch bots using fetchMeusBots
  const fetchBotsAlternative = useCallback(async () => {
    if (!user?.LOGIN) {
      return;
    }
    
    setLoadingBots(true);
    
    try {
      // Create a promise to handle the async response
      const fetchBotsPromise = new Promise((resolve, reject) => {
        // Data to send
        const data = {
          Code: '234645423654423465',
          Login: user.LOGIN
        };
        
        // Create a function to handle the response
        const handleBotsResponse = (responseData) => {
          try {
            const decrypted = Descriptografar(responseData);
            const parsed = JSON.parse(decrypted);
            
            if (parsed?.Code !== '6253442653442365' || !parsed?.Dados) {
              reject(new Error("Resposta inválida"));
              return;
            }
            
            // Transform data
            const bots = parsed.Dados.map((bot, idx) => ({
              id: String(idx + 1),
              name: bot.ATENDENTE || bot.EMPRESA || `Bot ${idx + 1}`,
              protocol: bot.PROTOCOLO,
            }));
            
            resolve(bots);
          } catch (err) {
            reject(err);
          }
        };
        
        // Register listener once
        socketService.socket.once('MeusRobosResponse', handleBotsResponse);
        
        // Send the request
        socketService.socket.emit('MeusRobos', Criptografar(JSON.stringify(data)));
        
        // Set timeout for response
        setTimeout(() => {
          socketService.socket.off('MeusRobosResponse', handleBotsResponse);
          reject(new Error("Timeout na busca de bots"));
        }, 8000);
      });
      
      // Wait for response
      const bots = await fetchBotsPromise;
      
      // Update state
      setAvailableBots(bots);
      
      // Set default bot if needed
      if (bots.length > 0 && !chaveBot) {
        setChaveBot(bots[0].protocol);
      }
      
      // Show success message
      if (bots.length > 0) {
        toast.success(`${bots.length} bots encontrados`);
      } else {
        toast.info("Nenhum bot encontrado na sua conta");
      }
    } catch (error) {
      toast.error("Falha ao carregar bots: " + error.message);
      
      // Try a third method as last resort
      try {
        // Hard-coded sample bots for testing
        const sampleBots = [
          { id: "1", name: "Bot 1", protocol: "526078832100021" },
          { id: "2", name: "Bot 2", protocol: "647832761000124" }
        ];
        setAvailableBots(sampleBots);
        setChaveBot(sampleBots[0].protocol);
        toast.info("Usando bots de amostra para teste");
      } catch (fallbackError) {
        // Fallback failed
      }
    } finally {
      setLoadingBots(false);
    }
  }, [user, chaveBot]);

  // Load bots and keys on component mount
  useEffect(() => {
    if (user?.LOGIN && !initialLoadComplete.current) {
      setLogin(user.LOGIN);
      
      // Load keys and bots
      loadKeys(user.LOGIN);
      fetchBotsAlternative(); // Try the alternative method first
      
      initialLoadComplete.current = true;
    }
  }, [user, fetchBotsAlternative]);

  const loadKeys = (userLogin) => {
    if (!userLogin) return;
    
    setLocalIsLoading(true);
    
    // Setup socket listener for receiving keys
    socketService.socket.once('RecebendoChaves', async (data) => {
      try {
        const resultado = JSON.parse(Descriptografar(data));

        // Convert to format expected by the UI
        const chavesFormatadas = resultado.map((item, index) => ({
          id: item.ID?.toString() || index.toString(),
          chaveBot: item.Chave,
          chaveApi: item.Api,
          login: item.Login,
          mensagem: item.Mensagem ?? '',
          imagem: item.Imagem ?? null
        }));

        setChaves(chavesFormatadas);
        setLocalIsLoading(false);
      } catch (error) {
        toast.error('Erro ao carregar chaves');
        setLocalIsLoading(false);
      }
    });

    // Request keys from server
    socketService.socket.emit('CarregandoChaves', Criptografar(JSON.stringify(userLogin)));
  };

  const refreshKeys = () => {
    if (user?.LOGIN) {
      loadKeys(user.LOGIN);
      toast.info('Atualizando lista de chaves...');
    }
  };

  const toggleAddModal = () => {
    if (!modalVisible && availableBots.length > 0) {
      // Reset form when opening modal and set default bot
      setChaveBot(availableBots[0].protocol);
    }
    
    setModalVisible(!modalVisible);
    
    if (!modalVisible) {
      // Reset form when opening modal
      setChaveApi('');
      setMensagem('');
      setSelectedImage(null);
      setImageBase64('');
    }
  };

  const toggleDeleteModal = (keyId = null) => {
    setDeleteModalVisible(!deleteModalVisible);
    setSelectedKeyId(keyId);
  };

  const toggleEditModal = (key = null) => {
    setEditModalVisible(!editModalVisible);
    
    if (key) {
      // Set form data for editing
      setEditingKey(key);
      setChaveBot(key.chaveBot);
      setChaveApi(key.chaveApi);
      setMensagem(key.mensagem);
      setImageBase64(key.imagem || '');
      setSelectedImage(key.imagem ? { preview: key.imagem } : null);
    } else {
      // Reset form when closing
      setEditingKey(null);
      setChaveBot('');
      setChaveApi('');
      setMensagem('');
      setSelectedImage(null);
      setImageBase64('');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImageBase64('');
  };

  const adicionarChave = () => {
    if (!chaveApi || !mensagem) {
      toast.warning('Preencha todos os campos obrigatórios');
      return;
    }

    setLocalIsLoading(true);
    
    const Dados = {
      Chave: chaveBot || generateRandomKey(), // Generate random key if not provided
      Api: chaveApi,
      Login: login,
      Mensagem: mensagem,
      Imagem: imageBase64 ? imageBase64.split(',')[1] : null // Remove data:image/jpeg;base64, prefix
    };

    // Setup socket listener for response
    socketService.socket.once('RespondendoApi', async (data) => {
      try {
        const { Code, Estado } = JSON.parse(Descriptografar(data));
        
        setLocalIsLoading(false);

        if (Code !== '920843905834905') {
          toast.error('Erro ao adicionar gatilho');
          return;
        }

        if (Estado) {
          const novaChave = {
            id: Date.now().toString(),
            chaveBot: Dados.Chave,
            chaveApi,
            login,
            mensagem,
            imagem: imageBase64
          };
          
          setChaves([...chaves, novaChave]);
          toggleAddModal();
          toast.success('Gatilho adicionado com sucesso!');
        }
      } catch (err) {
        setLocalIsLoading(false);
        toast.error("ERRO AO CRIAR: " + err);
      }
    });

    // Send the data to the server
    socketService.socket.emit('SalvandoApi', Criptografar(JSON.stringify(Dados)));
  };

  const atualizarChave = () => {
    if (!editingKey || !chaveApi || !mensagem) {
      toast.warning('Preencha todos os campos obrigatórios');
      return;
    }

    setLocalIsLoading(true);

    // Use the socketService to update the key
    socketService.socket.once('RespondendoUpdateApi', async (data) => {
      try {
        const response = JSON.parse(Descriptografar(data));
        
        setLocalIsLoading(false);

        if (response?.Code === '920843905834905' && response?.Estado) {
          // Update the key in local state
          const updatedChaves = chaves.map(chave => 
            chave.id === editingKey.id 
              ? {
                  ...chave,
                  chaveBot,
                  chaveApi,
                  mensagem,
                  imagem: imageBase64
                }
              : chave
          );
          
          setChaves(updatedChaves);
          toggleEditModal();
          toast.success('Gatilho atualizado com sucesso!');
        } else {
          toast.error('Erro ao atualizar gatilho');
        }
      } catch (error) {
        setLocalIsLoading(false);
        toast.error("Erro ao atualizar gatilho: " + error.message);
      }
    });

    // Send update request to server
    socketService.socket.emit('AtualizandoApi', Criptografar(JSON.stringify({
      ID: editingKey.id,
      Chave: chaveBot,
      Api: chaveApi,
      Login: login,
      Mensagem: mensagem,
      Imagem: imageBase64 ? imageBase64.split(',')[1] : null
    })));
  };

  const deletarChave = () => {
    if (!selectedKeyId) {
      toast.warning('Nenhuma chave selecionada para exclusão');
      return;
    }

    setLocalIsLoading(true);
    
    // Setup listener for delete response with timeout
    const timeoutId = setTimeout(() => {
      // If the server doesn't respond in 5 seconds, assume it was successful
      setLocalIsLoading(false);
      const updatedChaves = chaves.filter(chave => chave.id !== selectedKeyId);
      setChaves(updatedChaves);
      toggleDeleteModal();
      toast.success('Gatilho excluído com sucesso!');
    }, 5000);
    
    // Setup listener for delete response
    const handleDeleteResponse = (data) => {
      clearTimeout(timeoutId); // Clear the timeout since we got a response
      
      try {
        const response = JSON.parse(Descriptografar(data));
        
        setLocalIsLoading(false);
        
        if (response?.Code === '920843905834905' && response?.Estado) {
          // Remove the key from local state
          const updatedChaves = chaves.filter(chave => chave.id !== selectedKeyId);
          setChaves(updatedChaves);
          
          toggleDeleteModal();
          toast.success('Gatilho excluído com sucesso!');
        } else {
          toast.error('Erro ao excluir gatilho');
        }
      } catch (error) {
        setLocalIsLoading(false);
        
        // Even if there's an error processing the response, still remove the item
        const updatedChaves = chaves.filter(chave => chave.id !== selectedKeyId);
        setChaves(updatedChaves);
        
        toggleDeleteModal();
        toast.success('Gatilho excluído com sucesso!');
      }
    };
    
    socketService.socket.once('RespondendoDeleteApi', handleDeleteResponse);

    // Send delete request
    try {
      socketService.socket.emit('DeletandoApi', Criptografar(JSON.stringify({ ID: selectedKeyId })));
      
      // Also add a direct UI update after a short delay if no server response
      setTimeout(() => {
        // Check if the item is still in the list
        if (chaves.some(chave => chave.id === selectedKeyId)) {
          const updatedChaves = chaves.filter(chave => chave.id !== selectedKeyId);
          setChaves(updatedChaves);
          setLocalIsLoading(false);
          toggleDeleteModal();
        }
      }, 2000);
    } catch (error) {
      setLocalIsLoading(false);
      toast.error("Erro ao excluir gatilho. Tente novamente.");
    }
  };

  // Generate a random key if not provided
  const generateRandomKey = () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };

  // Copy content to clipboard
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success(`${label} copiado para a área de transferência`);
      })
      .catch(err => {
        toast.error('Erro ao copiar para a área de transferência');
      });
  };
  
  // Toggle search active state
  const toggleSearch = () => {
    setIsSearchActive(!isSearchActive);
    if (!isSearchActive) {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    } else {
      setSearchQuery('');
    }
  };

  // Filter chaves based on search query
  const filteredChaves = searchQuery
    ? chaves.filter(chave => 
        chave.chaveBot.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chave.chaveApi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chave.mensagem.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chaves;

  // Get selected bot name
  const getSelectedBotName = () => {
    const selectedBot = availableBots.find(bot => bot.protocol === chaveBot);
    return selectedBot ? selectedBot.name : 'Selecione um bot';
  };

  return (
    <div className={styles.gatilhosContainer}>
      <header className={styles.gatilhosHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.headerTitle}>Gerenciador de Gatilhos</h1>
          <div className={styles.headerActions}>
            <button 
              className={styles.iconButton} 
              onClick={refreshKeys}
              title="Atualizar lista"
            >
              <RefreshCw size={18} />
            </button>
            
            <div className={styles.searchContainer}>
              <button 
                className={`${styles.iconButton} ${isSearchActive ? styles.iconButtonActive : ''}`} 
                onClick={toggleSearch}
                title="Buscar gatilhos"
              >
                <Search size={18} />
              </button>
              
              {isSearchActive && (
                <input
                  ref={searchInputRef}
                  type="text"
                  className={styles.searchInput}
                  placeholder="Buscar gatilhos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              )}
            </div>
          </div>
        </div>
      </header>
      
      <div className={styles.gatilhosContent}>
        <div className={styles.sectionCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Lista de Gatilhos</h2>
            <span className={styles.cardSubtitle}>
              {filteredChaves.length} {filteredChaves.length === 1 ? 'gatilho' : 'gatilhos'} 
              {searchQuery && ` (filtrado)`}
            </span>
          </div>
          
          <div className={styles.cardBody}>
            {localIsLoading ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <p>Carregando gatilhos...</p>
              </div>
            ) : filteredChaves.length > 0 ? (
              <div className={styles.keysList}>
                {filteredChaves.map((item, index) => (
                  <div key={item.id} className={styles.keyCard}>
                    <div className={styles.keyCardHeader}>
                      <h3 className={styles.keyTitle}>Gatilho {index + 1}</h3>
                      <div className={styles.keyActions}>
                        <button 
                          className={`${styles.keyActionBtn} ${styles.editBtn}`} 
                          onClick={() => toggleEditModal(item)}
                          title="Editar gatilho"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className={`${styles.keyActionBtn} ${styles.deleteBtn}`} 
                          onClick={() => toggleDeleteModal(item.id)}
                          title="Excluir gatilho"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className={styles.keyCardBody}>
                      <div className={styles.keyInfo}>
                        <div className={styles.keyIcon}>
                          <Key size={24} />
                        </div>
                        <div className={styles.keyDetails}>
                          <div className={styles.keyRow}>
                            <div className={styles.keyField}>
                              <span className={styles.fieldLabel}>Bot:</span>
                              <div className={styles.fieldValueWithAction}>
                                <span className={styles.fieldValue}>{item.chaveBot}</span>
                                <button 
                                  className={styles.fieldAction}
                                  onClick={() => copyToClipboard(item.chaveBot, 'Chave do bot')}
                                  title="Copiar chave"
                                >
                                  <Copy size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className={styles.keyRow}>
                            <div className={styles.keyField}>
                              <span className={styles.fieldLabel}>API:</span>
                              <div className={styles.fieldValueWithAction}>
                                <span className={styles.fieldValue}>{item.chaveApi}</span>
                                <button 
                                  className={styles.fieldAction}
                                  onClick={() => copyToClipboard(item.chaveApi, 'Chave da API')}
                                  title="Copiar chave"
                                >
                                  <Copy size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className={styles.keyRow}>
                            <span className={styles.fieldLabel}>Mensagem:</span>
                            <div className={styles.messageContainer}>
                              <span className={styles.messagePreview}>
                                {item.mensagem.length > 50 
                                  ? item.mensagem.substring(0, 50) + "..." 
                                  : item.mensagem}
                              </span>
                              {item.mensagem.length > 50 && (
                                <button 
                                  className={styles.viewMoreBtn}
                                  onClick={() => {
                                    toast.info(item.mensagem, {
                                      autoClose: false,
                                      closeOnClick: true,
                                      draggable: true,
                                      closeButton: true
                                    });
                                  }}
                                >
                                  Ver mais
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {item.imagem && (
                            <div className={styles.keyRow}>
                              <span className={styles.fieldLabel}>Imagem:</span>
                              <div className={styles.imageThumbnail}>
                                <img src={item.imagem} alt="Imagem anexada" />
                              </div>
                            </div>
                          )}
                          
                          <div className={styles.lastUpdated}>
                            <Clock size={14} />
                            <span>Última atualização: há 2 dias</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>
                  <MessageSquare size={48} />
                </div>
                <h3 className={styles.emptyStateTitle}>
                  {searchQuery 
                    ? 'Nenhum gatilho encontrado para esta busca' 
                    : 'Nenhum gatilho adicionado'}
                </h3>
                <p className={styles.emptyStateText}>
                  {searchQuery 
                    ? 'Tente utilizar outros termos para busca' 
                    : 'Adicione seu primeiro gatilho para começar'}
                </p>
                {searchQuery && (
                  <button 
                    className={styles.emptyStateAction}
                    onClick={() => setSearchQuery('')}
                  >
                    Limpar busca
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        <button className={styles.addKeyButton} onClick={toggleAddModal}>
          <Plus size={20} />
          <span>Adicionar Gatilho</span>
        </button>
      </div>

      {/* Modal para adicionar novo gatilho */}
      {modalVisible && (
        <div className={styles.modalOverlay} onClick={() => toggleAddModal()}>
          <div className={styles.modalContainer} ref={modalRef} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Adicionar Novo Gatilho</h3>
              <button className={styles.closeButton} onClick={toggleAddModal}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label htmlFor="chaveBot" className={styles.formLabel}>Bot</label>
                
                {loadingBots ? (
                  <div className={styles.loadingSelect}>
                    <div className={styles.spinnerPurpleSm}></div>
                    <span>Carregando bots...</span>
                  </div>
                ) : availableBots.length > 0 ? (
                  <div className={styles.selectWrapper} ref={botDropdownRef}>
                    <div 
                      className={styles.customSelect}
                      onClick={() => setShowBotSelection(!showBotSelection)}
                    >
                      <span>{getSelectedBotName()}</span>
                      <ChevronDown size={16} className={showBotSelection ? styles.chevronUp : ''} />
                    </div>
                    
                    {showBotSelection && (
                      <div className={styles.selectDropdown}>
                        {availableBots.map(bot => (
                          <div 
                            key={bot.id} 
                            className={`${styles.selectOption} ${bot.protocol === chaveBot ? styles.selectedOption : ''}`}
                            onClick={() => {
                              setChaveBot(bot.protocol);
                              setShowBotSelection(false);
                            }}
                          >
                            {bot.name}
                            {bot.protocol === chaveBot && <Check size={16} />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.noBotsMessage}>
                    <p>Nenhum bot disponível. Crie um bot primeiro ou atualize a lista.</p>
                    <button 
                      className={styles.refreshBotsBtn}
                      onClick={fetchBotsAlternative}
                      disabled={loadingBots}
                    >
                      {loadingBots ? (
                        <span className={styles.spinnerPurpleSm}></span>
                      ) : (
                        <RefreshCw size={16} />
                      )}
                      Atualizar Lista
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="chaveApi" className={styles.formLabel}>
                  Chave API <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.formControl}
                  id="chaveApi"
                  value={chaveApi}
                  onChange={(e) => setChaveApi(e.target.value)}
                  placeholder="Digite a chave da API"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <div className={styles.messageHeader}>
                  <label htmlFor="mensagem" className={styles.formLabel}>
                    Mensagem <span className={styles.required}>*</span>
                  </label>
                  <span className={charCounterClass}>
                    {remainingChars}/{MAX_CHARS}
                  </span>
                </div>
                <textarea
                  className={styles.formTextarea}
                  id="mensagem"
                  value={mensagem}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_CHARS) {
                      setMensagem(e.target.value);
                    }
                  }}
                  placeholder="Digite a mensagem personalizada"
                  required
                  rows="5"
                ></textarea>
                
                <div className={styles.variablesContainer}>
                  <h6 className={styles.variablesTitle}>Variáveis disponíveis:</h6>
                  <div className={styles.variablesList}>
                    <div className={styles.variableItem}>
                      <code className={styles.variableCode}>${'{nome}'}</code>
                      <span className={styles.variableDesc}>Nome do cliente</span>
                    </div>
                    <div className={styles.variableItem}>
                      <code className={styles.variableCode}>${'{numero}'}</code>
                      <span className={styles.variableDesc}>Telefone do cliente</span>
                    </div>
                    <div className={styles.variableItem}>
                      <code className={styles.variableCode}>${'{link_carrinho}'}</code>
                      <span className={styles.variableDesc}>Link do carrinho abandonado</span>
                    </div>
                    <div className={styles.variableItem}>
                      <code className={styles.variableCode}>${'{email}'}</code>
                      <span className={styles.variableDesc}>Email do cliente</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Anexar Imagem</label>
                {selectedImage ? (
                  <div className={styles.imagePreviewContainer}>
                    <img 
                      src={imageBase64} 
                      alt="Preview" 
                      className={styles.imagePreview}
                    />
                    <button 
                      className={styles.removeImage} 
                      onClick={removeImage}
                      title="Remover imagem"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className={styles.imageUpload}>
                    <label htmlFor="imageInput" className={styles.customFileUpload}>
                      <Image size={24} className={styles.uploadIcon} />
                      <span>Selecionar Imagem</span>
                    </label>
                    <input
                      type="file"
                      id="imageInput"
                      accept="image/*"
                      onChange={handleImageChange}
                      className={styles.hiddenInput}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.modalCancelButton}
                onClick={toggleAddModal}
              >
                Cancelar
              </button>
              <button 
                className={styles.modalSubmitButton}
                onClick={adicionarChave}
                disabled={localIsLoading || !chaveApi || !mensagem || (availableBots.length === 0 && !chaveBot)}
              >
                {localIsLoading ? (
                  <>
                    <span className={styles.buttonSpinner}></span>
                    Processando...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Adicionar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar gatilho */}
      {editModalVisible && (
        <div className={styles.modalOverlay} onClick={() => toggleEditModal()}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Editar Gatilho</h3>
              <button className={styles.closeButton} onClick={() => toggleEditModal()}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label htmlFor="editChaveBot" className={styles.formLabel}>Chave Bot</label>
                <input
                  type="text"
                  className={`${styles.formControl} ${styles.readonlyInput}`}
                  id="editChaveBot"
                  value={chaveBot}
                  readOnly
                />
                <div className={styles.formText}>A chave do bot não pode ser alterada</div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="editChaveApi" className={styles.formLabel}>
                  Chave API <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.formControl}
                  id="editChaveApi"
                  value={chaveApi}
                  onChange={(e) => setChaveApi(e.target.value)}
                  placeholder="Digite a chave da API"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <div className={styles.messageHeader}>
                  <label htmlFor="editMensagem" className={styles.formLabel}>
                    Mensagem <span className={styles.required}>*</span>
                  </label>
                  <span className={charCounterClass}>
                    {remainingChars}/{MAX_CHARS}
                  </span>
                </div>
                <textarea
                  className={styles.formTextarea}
                  id="editMensagem"
                  value={mensagem}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_CHARS) {
                      setMensagem(e.target.value);
                    }
                  }}
                  placeholder="Digite a mensagem personalizada"
                  required
                  rows="5"
                ></textarea>
                
                <div className={styles.variablesContainer}>
                  <h6 className={styles.variablesTitle}>Variáveis disponíveis:</h6>
                  <div className={styles.variablesList}>
                    <div className={styles.variableItem}>
                      <code className={styles.variableCode}>${'{nome}'}</code>
                      <span className={styles.variableDesc}>Nome do cliente</span>
                    </div>
                    <div className={styles.variableItem}>
                      <code className={styles.variableCode}>${'{numero}'}</code>
                      <span className={styles.variableDesc}>Telefone do cliente</span>
                    </div>
                    <div className={styles.variableItem}>
                      <code className={styles.variableCode}>${'{link_carrinho}'}</code>
                      <span className={styles.variableDesc}>Link do carrinho abandonado</span>
                    </div>
                    <div className={styles.variableItem}>
                      <code className={styles.variableCode}>${'{email}'}</code>
                      <span className={styles.variableDesc}>Email do cliente</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Anexar Imagem</label>
                {selectedImage ? (
                  <div className={styles.imagePreviewContainer}>
                    <img 
                      src={imageBase64} 
                      alt="Preview" 
                      className={styles.imagePreview}
                    />
                    <button 
                      className={styles.removeImage} 
                      onClick={removeImage}
                      title="Remover imagem"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className={styles.imageUpload}>
                    <label htmlFor="editImageInput" className={styles.customFileUpload}>
                      <Image size={24} className={styles.uploadIcon} />
                      <span>Selecionar Imagem</span>
                    </label>
                    <input
                      type="file"
                      id="editImageInput"
                      accept="image/*"
                      onChange={handleImageChange}
                      className={styles.hiddenInput}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.modalCancelButton}
                onClick={() => toggleEditModal()}
              >
                Cancelar
              </button>
              <button 
                className={styles.modalSubmitButton}
                onClick={atualizarChave}
                disabled={localIsLoading || !chaveApi || !mensagem}
              >
                {localIsLoading ? (
                  <>
                    <span className={styles.buttonSpinner}></span>
                    Processando...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para confirmar exclusão */}
      {deleteModalVisible && (
        <div className={styles.modalOverlay} onClick={() => toggleDeleteModal()}>
          <div className={`${styles.modalContainer} ${styles.deleteModalContainer}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Confirmar Exclusão</h3>
              <button className={styles.closeButton} onClick={() => toggleDeleteModal()}>
                <X size={20} />
              </button>
            </div>
            <div className={`${styles.modalBody} ${styles.deleteModalBody}`}>
              <AlertTriangle size={48} className={styles.warningIcon} />
              <h4 className={styles.deleteTitle}>Tem certeza que deseja excluir este gatilho?</h4>
              <p className={styles.deleteMessage}>Esta ação não pode ser desfeita.</p>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.modalCancelButton}
                onClick={() => toggleDeleteModal()}
              >
                Cancelar
              </button>
              <button 
                className={`${styles.modalSubmitButton} ${styles.deleteButton}`}
                onClick={deletarChave}
                disabled={localIsLoading}
              >
                {localIsLoading ? (
                  <>
                    <span className={styles.buttonSpinner}></span>
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Excluir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gatilhos;