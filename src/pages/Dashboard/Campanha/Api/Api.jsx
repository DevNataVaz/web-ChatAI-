import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, FiPlus, FiKey, FiEdit2, 
  FiTrash2, FiImage, FiX, FiCheck 
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useApp } from '../../../../context/AppContext';
import { socketService } from '../../../../services/socketService';
import { Criptografar, Descriptografar } from '../../../../Cripto/index';
import LoadingScreen from '../../../../components/loading/LoadingScreen';
import styles from './Api.module.css';

const ApiTriggers = ({ campaignId, onBack }) => {

  const navigate = useNavigate();
  const { user, isLoading, setIsLoading } = useApp();
  const fileInputRef = useRef(null);
  
  // State
  const [triggers, setTriggers] = useState([]);
  const [availableBots, setAvailableBots] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state
  const [selectedTriggerId, setSelectedTriggerId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [chaveBot, setChaveBot] = useState('');
  const [chaveApi, setChaveApi] = useState('');
  const [mensagens, setMensagens] = useState(['']); // Array of messages
  const [currentMensagemIndex, setCurrentMensagemIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageBase64, setImageBase64] = useState('');
  
  // Calculate remaining characters for message - CORRIGIDO
  const MAX_CHARS = 2000;
  const currentMessage = mensagens[currentMensagemIndex] || '';
  const remainingChars = MAX_CHARS - currentMessage.length;

  // Load triggers and bots on component mount
  useEffect(() => {
    if (campaignId) {
      fetchTriggers();
      fetchBots();
    }
  }, [campaignId]);

  // Fetch API triggers
  const fetchTriggers = useCallback(async () => {
    if (!user?.LOGIN || !campaignId) {
      return;
    }

    try {
      setError(null);

      const dados = {
        login: user.LOGIN,
        campanha: campaignId
      };

      // Create a promise to handle the async response
      const triggersDataPromise = new Promise((resolve, reject) => {
        // Set up a one-time listener for the response
        socketService.socket.once('RecebendoChaves', async (data) => {
          try {
            const resultado = JSON.parse(Descriptografar(data));
            
            if (!Array.isArray(resultado)) {
              reject(new Error("Invalid response format"));
              return;
            }
            
            resolve(resultado);
          } catch (err) {
            reject(err);
          }
        });

        // Send the request
        socketService.socket.emit('CarregandoChaves', Criptografar(JSON.stringify(dados)));
        
        // Add timeout in case of no response
        setTimeout(() => {
          socketService.socket.off('RecebendoChaves');
          reject(new Error("Timeout fetching triggers"));
        }, 15000);
      });

      // Wait for the response
      const triggersData = await triggersDataPromise;
      
      // Process the triggers data - CORRIGIDO
      const formattedTriggers = triggersData.map((item, index) => ({
        id: item.ID?.toString() || index.toString(),
        chaveBot: item.Chave || '',
        chaveApi: item.Api || '',
        login: item.Login || '',
        mensagem: item.Mensagem || '',
        mensagens: tryParseMessages(item.Mensagem || ''),
        imagem: item.Imagem ? `${item.Imagem}` : null
      }));

      setTriggers(formattedTriggers);
    } catch (error) {
      console.error("Error fetching triggers:", error);
      setError("Failed to load API triggers");
      toast.error("Erro ao carregar gatilhos");
    } finally {
      setIsLoading(false);
    }
  }, [user, campaignId, setIsLoading]);

   const handleBackClick = () => {
    if (onBack) {
      onBack();
    }
  };

  // Fetch available bots
  const fetchBots = useCallback(async () => {
    if (!user?.LOGIN || !campaignId) {
      return;
    }

    try {
      const get = {
        Code: '234645423654423465',
        Login: user.LOGIN,
        Campanha: campaignId
      };

      // Create a promise to handle the async response
      const botsDataPromise = new Promise((resolve, reject) => {
        // Set up a one-time listener for the response
        socketService.socket.once('MeusRobosResponse', (data) => {
          try {
            const { Code, Dados } = JSON.parse(Descriptografar(data));

            if (Code !== '6253442653442365') {
              reject(new Error("Invalid response code"));
              return;
            }
            
            if (Dados && Array.isArray(Dados)) {
              resolve(Dados);
            } else {
              resolve([]);
            }
          } catch (err) {
            reject(err);
          }
        });

        // Send the request
        socketService.socket.emit('MeusRobos', Criptografar(JSON.stringify(get)));
        
        // Add timeout in case of no response
        setTimeout(() => {
          socketService.socket.off('MeusRobosResponse');
          reject(new Error("Timeout fetching bots"));
        }, 15000);
      });

      // Wait for the response
      const botsData = await botsDataPromise;
      
      // Process the bots data
      const processedBots = botsData.map((item, index) => ({
        id: String(index + 1),
        name: item.DADOS[0]?.EMPRESA || `Bot ${index + 1}`,
        protocol: item.PROTOCOLO
      }));

      setAvailableBots(processedBots);
      
      // Set default bot if not already set
      if (processedBots.length > 0 && !chaveBot) {
        setChaveBot(processedBots[0].protocol);
      }
    } catch (error) {
      console.error("Error fetching bots:", error);
      toast.error("Erro ao carregar bots");
    }
  }, [user, campaignId, chaveBot]);

  // Try to parse messages JSON - CORRIGIDO
  const tryParseMessages = (messageString) => {
    // Se messageString for undefined, null ou vazio, retorna array com string vazia
    if (!messageString || typeof messageString !== 'string') {
      return [''];
    }

    try {
      const parsed = JSON.parse(messageString);
      if (Array.isArray(parsed)) {
        // Garantir que todos os elementos sejam strings válidas
        return parsed.map(m => {
          if (typeof m === 'object' && m !== null && m.msg) {
            return String(m.msg);
          }
          if (typeof m === 'string') {
            return m;
          }
          return '';
        }).filter(msg => msg !== undefined && msg !== null);
      }
      return [String(messageString)];
    } catch (e) {
      return [String(messageString)];
    }
  };

  // Reset form
  const resetForm = () => {
    setChaveBot(availableBots.length > 0 ? availableBots[0].protocol : '');
    setChaveApi('');
    setMensagens(['']);
    setCurrentMensagemIndex(0);
    setSelectedImage(null);
    setImageBase64('');
    setIsEditing(false);
    setSelectedTriggerId(null);
  };

  // Open create modal
  const handleOpenCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  // Open edit modal - CORRIGIDO
  const handleOpenEditModal = (trigger) => {
    setIsEditing(true);
    setSelectedTriggerId(trigger.id);
    setChaveBot(trigger.chaveBot || '');
    setChaveApi(trigger.chaveApi || '');
    
    // Handle messages - garantir que sempre temos um array válido
    if (trigger.mensagens && Array.isArray(trigger.mensagens) && trigger.mensagens.length > 0) {
      // Filtrar mensagens válidas e garantir que são strings
      const validMessages = trigger.mensagens
        .filter(msg => msg !== undefined && msg !== null)
        .map(msg => String(msg));
      
      setMensagens(validMessages.length > 0 ? validMessages : ['']);
    } else {
      setMensagens([trigger.mensagem || '']);
    }
    
    setCurrentMensagemIndex(0);
    
    // Handle image
    if (trigger.imagem) {
      setSelectedImage({ preview: trigger.imagem });
      setImageBase64(trigger.imagem);
    } else {
      setSelectedImage(null);
      setImageBase64('');
    }
    
    setShowModal(true);
  };

  // Open delete confirmation modal
  const handleOpenDeleteModal = (id) => {
    setSelectedTriggerId(id);
    setShowDeleteModal(true);
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.warning("A imagem deve ter no máximo 5MB");
      return;
    }
    
    setSelectedImage({
      file,
      preview: URL.createObjectURL(file)
    });
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Remove selected image
  const removeImage = () => {
    setSelectedImage(null);
    setImageBase64('');
  };

  // Add a new message
  const addMessage = () => {
    if (mensagens.length < 50) {
      setMensagens([...mensagens, '']);
      setCurrentMensagemIndex(mensagens.length);
    } else {
      toast.warning("Limite máximo de 50 mensagens atingido");
    }
  };

  // Remove a message
  const removeMessage = (index) => {
    if (mensagens.length > 1) {
      const newMessages = [...mensagens];
      newMessages.splice(index, 1);
      setMensagens(newMessages);
      
      // Adjust current index if needed
      if (currentMensagemIndex >= index) {
        setCurrentMensagemIndex(Math.max(0, currentMensagemIndex - 1));
      }
    }
  };

  // Update message content - CORRIGIDO
  const updateMessage = (text, index) => {
    if (text.length <= MAX_CHARS) {
      const newMessages = [...mensagens];
      // Garantir que o texto seja sempre uma string
      newMessages[index] = String(text || '');
      setMensagens(newMessages);
    }
  };

  // Função auxiliar para verificar se uma mensagem é válida - ADICIONADO
  const isValidMessage = (msg) => {
    return msg !== undefined && msg !== null && String(msg).trim() !== '';
  };

  // Função auxiliar para filtrar mensagens válidas - ADICIONADO
  const getValidMessages = () => {
    return mensagens
      .filter(msg => msg !== undefined && msg !== null)
      .map(msg => String(msg))
      .filter(msg => msg.trim() !== '');
  };

  // Save trigger (create or update) - CORRIGIDO
  const saveTrigger = async () => {
    // Verificar mensagens válidas usando a nova função auxiliar
    const validMessages = getValidMessages();
    
    if (!chaveBot || !chaveApi || validMessages.length === 0) {
      toast.warning("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setIsLoading(true);
      
      const data = {
        Chave: chaveBot,
        Api: chaveApi,
        Login: user.LOGIN,
        Mensagem: validMessages[0] || validMessages.join('\n'),// Mensagem: JSON.stringify(validMessages.map(msg => ({ msg }))),
        Imagem: imageBase64 ? imageBase64.split(',')[1] : null,
        Campanha: campaignId
      };
      
      if (isEditing && selectedTriggerId) {
        // Update existing trigger
        data.ID = parseInt(selectedTriggerId); // CORRIGIDO: Garantir que o ID seja um número
        
        // Create a promise to handle the async response
        const updatePromise = new Promise((resolve, reject) => {
          // Set up a one-time listener for the response
          const handleUpdateResponse = (responseData) => {
            try {
              const response = JSON.parse(Descriptografar(responseData));
              
              if (response?.Code !== '920843905834905' || !response?.Estado) {
                reject(new Error("Failed to update trigger"));
                return;
              }
              
              resolve(true);
            } catch (err) {
              reject(err);
            }
          };

          // Adicionar listener
          socketService.socket.once('RespondendoUpdateApi', handleUpdateResponse);

          // Send the request
          socketService.socket.emit('AtualizandoApi', Criptografar(JSON.stringify(data)));
          
          // Add timeout in case of no response
          setTimeout(() => {
            socketService.socket.off('RespondendoUpdateApi', handleUpdateResponse);
            reject(new Error("Timeout updating trigger"));
          }, 15000);
        });

        // Wait for the response
        await updatePromise;
        toast.success("Gatilho atualizado com sucesso!");
      } else {
        // Create new trigger
        // Create a promise to handle the async response
        const createPromise = new Promise((resolve, reject) => {
          // Set up a one-time listener for the response
          const handleCreateResponse = (responseData) => {
            try {
              const { Code, Estado } = JSON.parse(Descriptografar(responseData));
              
              if (Code !== '920843905834905' || !Estado) {
                reject(new Error("Failed to create trigger"));
                return;
              }
              
              resolve(true);
            } catch (err) {
              reject(err);
            }
          };

          // Adicionar listener
          socketService.socket.once('RespondendoApi', handleCreateResponse);

          // Send the request
          socketService.socket.emit('SalvandoApi', Criptografar(JSON.stringify(data)));
          
          // Add timeout in case of no response
          setTimeout(() => {
            socketService.socket.off('RespondendoApi', handleCreateResponse);
            reject(new Error("Timeout creating trigger"));
          }, 15000);
        });

        // Wait for the response
        await createPromise;
        toast.success("Gatilho criado com sucesso!");
      }
      
      // Refresh triggers and close modal
      setShowModal(false);
      await fetchTriggers(); // CORRIGIDO: Aguardar o refresh
    } catch (error) {
      console.error("Error saving trigger:", error);
      toast.error(error.message || "Erro ao salvar gatilho");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete trigger - CORRIGIDO
  const deleteTrigger = async () => {
    if (!selectedTriggerId) {
      toast.warning("Nenhum gatilho selecionado para exclusão");
      return;
    }

    try {
      setIsLoading(true);
      
      const deleteData = {
        ID: parseInt(selectedTriggerId), // CORRIGIDO: Garantir que o ID seja um número
        Login: user.LOGIN // ADICIONADO: Incluir login para segurança
      };
      
      // Create a promise to handle the async response
      const deletePromise = new Promise((resolve, reject) => {
        // Set up a one-time listener for the response
        const handleDeleteResponse = (responseData) => {
          try {
            const response = JSON.parse(Descriptografar(responseData));
            
            if (response?.Code !== '920843905834905' || !response?.Estado) {
              reject(new Error("Failed to delete trigger"));
              return;
            }
            
            resolve(true);
          } catch (err) {
            reject(err);
          }
        };

        // Adicionar listener
        socketService.socket.once('RespondendoDeleteApi', handleDeleteResponse);

        // Send the request
        socketService.socket.emit('DeletandoApi', Criptografar(JSON.stringify(deleteData)));
        
        // Add timeout in case of no response
        setTimeout(() => {
          socketService.socket.off('RespondendoDeleteApi', handleDeleteResponse);
          reject(new Error("Timeout deleting trigger"));
        }, 15000);
      });

      // Wait for the response
      await deletePromise;
      
      // Update local state for immediate feedback
      setTriggers(triggers.filter(trigger => trigger.id !== selectedTriggerId));
      setShowDeleteModal(false);
      toast.success("Gatilho excluído com sucesso!");
      
      // Refresh the full list
      await fetchTriggers(); // CORRIGIDO: Aguardar o refresh
    } catch (error) {
      console.error("Error deleting trigger:", error);
      toast.error(error.message || "Erro ao excluir gatilho");
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success("Copiado para a área de transferência!");
      })
      .catch(() => {
        toast.error("Erro ao copiar para a área de transferência");
      });
  };

  if (isLoading && triggers.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerGradient}>
        <div className={styles.headerContent}>
          <button 
            className={styles.backButton}
             onClick={handleBackClick}
          >
            <FiArrowLeft size={20} />
            <span>Voltar</span>
          </button>
          
          <h1>Gerenciador de Gatilhos</h1>
          <p>Configure suas chaves API para automação</p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.sectionHeader}>
          <h2>Lista de Gatilhos</h2>
        </div>
        
        {error && (
          <div className={styles.errorContainer}>
            <p>{error}</p>
            <button 
              className={styles.retryButton}
              onClick={fetchTriggers}
            >
              Tentar novamente
            </button>
          </div>
        )}
        
        {!error && (
          <div className={styles.triggersContainer}>
            {triggers.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <FiKey size={60} />
                </div>
                <p>Nenhum gatilho encontrado.</p>
                <p>Clique no botão + para criar seu primeiro gatilho.</p>
              </div>
            ) : (
              <div className={styles.triggersGrid}>
                {triggers.map((trigger) => (
                  <div key={trigger.id} className={styles.triggerCard}>
                    <div className={styles.triggerHeader}>
                      <div className={styles.triggerIcon}>
                        <FiKey size={20} />
                      </div>
                      <div className={styles.triggerActions}>
                        <button 
                          className={styles.editButton}
                          onClick={() => handleOpenEditModal(trigger)}
                          title="Editar"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        
                        <button 
                          className={styles.deleteButton}
                          onClick={() => handleOpenDeleteModal(trigger.id)}
                          title="Excluir"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className={styles.triggerBody}>
                      <div className={styles.triggerInfo}>
                        <div className={styles.infoRow}>
                          <span className={styles.label}>Bot:</span>
                          <div className={styles.valueWithCopy}>
                            <span className={styles.value} title={trigger.chaveBot}>
                              {trigger.chaveBot}
                            </span>
                            <button 
                              className={styles.copyButton}
                              onClick={() => copyToClipboard(trigger.chaveBot)}
                              title="Copiar"
                            >
                              <FiCheck size={12} />
                            </button>
                          </div>
                        </div>
                        
                        <div className={styles.infoRow}>
                          <span className={styles.label}>API:</span>
                          <div className={styles.valueWithCopy}>
                            <span className={styles.value} title={trigger.chaveApi}>
                              {trigger.chaveApi}
                            </span>
                            <button 
                              className={styles.copyButton}
                              onClick={() => copyToClipboard(trigger.chaveApi)}
                              title="Copiar"
                            >
                              <FiCheck size={12} />
                            </button>
                          </div>
                        </div>
                        
                        <div className={styles.infoRow}>
                          <span className={styles.label}>Mensagens:</span>
                          <span className={styles.value}>
                            {trigger.mensagens && trigger.mensagens.length > 1 
                              ? `${trigger.mensagens.length} mensagens configuradas`
                              : trigger.mensagem 
                                ? (trigger.mensagem.length > 30 
                                    ? trigger.mensagem.substring(0, 30) + "..." 
                                    : trigger.mensagem)
                                : "N/A"}
                          </span>
                        </div>
                        
                        {trigger.imagem && (
                          <div className={styles.infoRow}>
                            <span className={styles.label}>Imagem:</span>
                            <span className={styles.imageThumbnail}>
                              <img 
                                src={trigger.imagem} 
                                alt="Thumbnail" 
                                onClick={() => window.open(trigger.imagem, '_blank')}
                              />
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      <button 
        className={styles.addButton}
        onClick={handleOpenCreateModal}
        title="Adicionar novo gatilho"
      >
        <FiPlus size={24} />
      </button>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className={styles.modalBackdrop} onClick={(e) => {
          if (e.target === e.currentTarget) setShowModal(false);
        }}>
          <div className={styles.modalContainer}>
            <div className={styles.modalHeader}>
              <h2>{isEditing ? "Editar Gatilho" : "Novo Gatilho"}</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowModal(false)}
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label htmlFor="chaveBot">Bot</label>
                {availableBots.length > 0 ? (
                  <select
                    id="chaveBot"
                    className={styles.select}
                    value={chaveBot}
                    onChange={(e) => setChaveBot(e.target.value)}
                    disabled={isEditing}
                  >
                    {availableBots.map((bot) => (
                      <option key={bot.id} value={bot.protocol}>
                        {bot.name} ({bot.protocol})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className={styles.emptyBotsMessage}>
                    <p>Nenhum bot disponível. Crie um bot primeiro.</p>
                    <button 
                      className={styles.refreshButton}
                      onClick={fetchBots}
                    >
                      Atualizar Lista
                    </button>
                  </div>
                )}
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="chaveApi">Chave API *</label>
                <input
                  type="text"
                  id="chaveApi"
                  className={styles.input}
                  value={chaveApi}
                  onChange={(e) => setChaveApi(e.target.value)}
                  placeholder="Digite a chave da API"
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <div className={styles.messagesHeader}>
                  <div className={styles.messagesCount}>
                    <label>Mensagens ({mensagens.length}/50)</label>
                    <button 
                      className={styles.addMessageButton}
                      onClick={addMessage}
                      disabled={mensagens.length >= 50}
                    >
                      <FiPlus size={12} />
                      <span>Adicionar Mensagem</span>
                    </button>
                  </div>
                </div>
                
                <div className={styles.messageTabs}>
                  {mensagens.map((_, index) => (
                    <div 
                      key={index}
                      className={`${styles.messageTab} ${currentMensagemIndex === index ? styles.activeTab : ''}`}
                      onClick={() => setCurrentMensagemIndex(index)}
                    >
                      <span>Msg {index + 1}</span>
                      {mensagens.length > 1 && (
                        <button 
                          className={styles.removeTabButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMessage(index);
                          }}
                        >
                          <FiX size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className={styles.messageInputContainer}>
                  <div className={styles.messageHeader}>
                    <label htmlFor="mensagem">Mensagem {currentMensagemIndex + 1} *</label>
                    <span className={`${styles.charCounter} ${
                      remainingChars < 200 ? styles.warning : ''
                    } ${
                      remainingChars < 50 ? styles.danger : ''
                    }`}>
                      {remainingChars}/{MAX_CHARS}
                    </span>
                  </div>
                  <textarea
                    id="mensagem"
                    className={styles.textarea}
                    value={currentMessage}
                    onChange={(e) => updateMessage(e.target.value, currentMensagemIndex)}
                    placeholder="Digite a mensagem personalizada"
                    required
                    rows={6}
                  />
                </div>
                
                <div className={styles.variablesContainer}>
                  <h4>Variáveis disponíveis:</h4>
                  <div className={styles.variablesList}>
                    <div className={styles.variableItem}>
                      <code>${'{nome}'}</code>
                      <span>Nome do cliente</span>
                    </div>
                    <div className={styles.variableItem}>
                      <code>${'{numero}'}</code>
                      <span>Telefone do cliente</span>
                    </div>
                    <div className={styles.variableItem}>
                      <code>${'{link_carrinho}'}</code>
                      <span>Link do carrinho abandonado</span>
                    </div>
                    <div className={styles.variableItem}>
                      <code>${'{email}'}</code>
                      <span>Email do cliente</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label>Anexar Imagem</label>
                {selectedImage ? (
                  <div className={styles.imagePreviewContainer}>
                    <img 
                      src={selectedImage.preview || selectedImage} 
                      alt="Preview" 
                      className={styles.imagePreview}
                    />
                    <button 
                      className={styles.removeImageButton}
                      onClick={removeImage}
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div 
                    className={styles.imageUploadContainer}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FiImage size={40} />
                    <p>Clique para selecionar uma imagem</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className={styles.fileInput}
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowModal(false)}
                disabled={isLoading}
              >
                Cancelar
              </button>
              
              <button 
                className={styles.saveButton}
                onClick={saveTrigger}
                disabled={isLoading || !chaveApi || getValidMessages().length === 0}
              >
                {isLoading ? (
                  <div className={styles.spinner}></div>
                ) : (
                  <>
                    <FiCheck size={16} />
                    <span>{isEditing ? "Atualizar" : "Adicionar"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className={styles.modalBackdrop} onClick={(e) => {
          if (e.target === e.currentTarget) setShowDeleteModal(false);
        }}>
          <div className={styles.deleteModalContainer}>
            <div className={styles.modalHeader}>
              <h2>Confirmar Exclusão</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowDeleteModal(false)}
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.deleteWarning}>
                <FiTrash2 size={40} />
                <p>Tem certeza que deseja excluir este gatilho?</p>
                <p className={styles.deleteNote}>Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowDeleteModal(false)}
                disabled={isLoading}
              >
                Cancelar
              </button>
              
              <button 
                className={styles.deleteConfirmButton}
                onClick={deleteTrigger}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className={styles.spinner}></div>
                ) : (
                  "Excluir"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiTriggers;