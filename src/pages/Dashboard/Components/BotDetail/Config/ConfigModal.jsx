import React, { useState, useEffect } from 'react';
import { 
  FiX, FiUser, FiEdit2, FiCheck, FiPackage, FiSettings,
  FiMessageSquare, FiTrash2, FiAlertTriangle, FiPlus
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Criptografar, Descriptografar } from '../../../../../Cripto/index';
import ProdutoConfig from './ProdutoConfig/ProdutoConfig';
import QuestionsManager from './EditarPerguntas/EditarPerguntas';
import DeleteBotConfirm from './DeleteBot/DeleteBot';
import styles from './ConfigModal.module.css';

const BotSettingsModal = ({ 
  visible, 
  bot, 
  onClose, 
  socketService,
  user,
  onRefresh,
  onDelete
}) => {
  // Settings tabs
  const [activeTab, setActiveTab] = useState('general');
  
  // General settings state - Alinhado com versão mobile
  const [attendantName, setAttendantName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isEditingAttendant, setIsEditingAttendant] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Additional modals state
  const [showProductsManager, setShowProductsManager] = useState(false);
  const [showQuestionsManager, setShowQuestionsManager] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Initialize state with bot data
  useEffect(() => {
    if (bot) {
      setAttendantName(bot.attendantName || '');
      setCompanyName(bot.name || '');
    }
  }, [bot]);

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      socketService.off('ResponseTrocarNomeAtendente');
      socketService.off('ResponseTrocarNomeEmpresa');
    };
  }, []);

  // Validação do formulário - Igual versão mobile
  const validarFormularioAtendente = () => {
    if (!attendantName.trim()) {
      toast.warning('O nome não pode estar vazio');
      return false;
    }

    if (attendantName.trim() === bot.attendantName) {
      toast.warning('O novo nome não pode ser igual ao atual');
      return false;
    }

    if (attendantName.length < 2) {
      toast.warning('O nome deve ter pelo menos 2 caracteres');
      return false;
    }

    return true;
  };

  const validarFormularioEmpresa = () => {
    if (!companyName.trim()) {
      toast.warning('O nome da empresa não pode estar vazio');
      return false;
    }

    if (companyName.trim() === bot.name) {
      toast.warning('O novo nome não pode ser igual ao atual');
      return false;
    }

    if (companyName.length < 2) {
      toast.warning('O nome da empresa deve ter pelo menos 2 caracteres');
      return false;
    }

    return true;
  };

  // Update attendant name - CORRIGIDO para seguir padrão mobile exato
  const updateAttendantName = async () => {
    if (!validarFormularioAtendente()) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Remove listeners anteriores
      socketService.off('ResponseTrocarNomeAtendente');
      
      const updateNamePromise = new Promise((resolve, reject) => {
        socketService.once('ResponseTrocarNomeAtendente', (data) => {
          try {
            const result = JSON.parse(Descriptografar(data.Response));
            const code = JSON.parse(Descriptografar(data.Code));

            if (code !== '0896546879475861673215673') {
              reject(new Error("Erro de autenticação"));
              return;
            }

            if (result.code === true) {
              resolve(true);
            } else {
              reject(new Error(result.mensagem || "Erro ao atualizar o nome"));
            }
          } catch (err) {
            reject(err);
          }
        });

        // Formato exato da versão mobile
        const dadosParaEnviar = {
          Code: Criptografar(JSON.stringify("31223123243146556474679894798")),
          Nome: Criptografar(JSON.stringify(attendantName.trim())),
          Protocolo: Criptografar(JSON.stringify(bot.protocol)),
          Login: Criptografar(JSON.stringify(user.LOGIN))
        };

        socketService.emit('TrocarNomeAtendente', dadosParaEnviar);
        
        setTimeout(() => {
          socketService.off('ResponseTrocarNomeAtendente');
          reject(new Error("Tempo esgotado ao atualizar nome do atendente"));
        }, 15000);
      });
      
      await updateNamePromise;
      setIsEditingAttendant(false);
      
      // Atualizar o dashboard após alteração bem-sucedida
      if (onRefresh) {
        onRefresh();
      }
      
      toast.success("Nome do atendente atualizado com sucesso");
    } catch (error) {
      // console.error("Error updating attendant name:", error);
      toast.error(error.message || "Erro ao atualizar nome do atendente");
    } finally {
      setIsLoading(false);
    }
  };

  // Update company name - CORRIGIDO para seguir padrão mobile exato
  const updateCompanyName = async () => {
    if (!validarFormularioEmpresa()) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Remove listeners anteriores
      socketService.off('ResponseTrocarNomeEmpresa');
      
      const updateNamePromise = new Promise((resolve, reject) => {
        socketService.once('ResponseTrocarNomeEmpresa', (data) => {
          try {
            const result = JSON.parse(Descriptografar(data.Response));
            const code = JSON.parse(Descriptografar(data.Code));

            if (code !== '0896546879475861673215673') {
              reject(new Error("Erro de autenticação"));
              return;
            }

            if (result.code === true) {
              resolve(true);
            } else {
              reject(new Error(result.mensagem || "Erro ao atualizar o nome da empresa"));
            }
          } catch (err) {
            reject(err);
          }
        });

        // Formato exato da versão mobile
        const dadosParaEnviar = {
          Code: Criptografar(JSON.stringify("31223123243146556474679894798")),
          Nome: Criptografar(JSON.stringify(companyName.trim())),
          Protocolo: Criptografar(JSON.stringify(bot.protocol)),
          Login: Criptografar(JSON.stringify(user.LOGIN))
        };

        socketService.emit('TrocarNomeEmpresa', dadosParaEnviar);
        
        setTimeout(() => {
          socketService.off('ResponseTrocarNomeEmpresa');
          reject(new Error("Tempo esgotado ao atualizar nome da empresa"));
        }, 15000);
      });
      
      await updateNamePromise;
      setIsEditingCompany(false);
      
      // Atualizar o dashboard após alteração bem-sucedida
      if (onRefresh) {
        onRefresh();
      }
      
      toast.success("Nome da empresa atualizado com sucesso");
    } catch (error) {
      // console.error("Error updating company name:", error);
      toast.error(error.message || "Erro ao atualizar nome da empresa");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      // If editing, cancel editing before closing
      if (isEditingAttendant || isEditingCompany) {
        setIsEditingAttendant(false);
        setIsEditingCompany(false);
        setAttendantName(bot.attendantName || '');
        setCompanyName(bot.name || '');
      } else {
        onClose();
      }
    }
  };

  // Handle key press for form inputs
  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action();
    } else if (e.key === 'Escape') {
      if (isEditingAttendant) {
        setIsEditingAttendant(false);
        setAttendantName(bot.attendantName || '');
      }
      if (isEditingCompany) {
        setIsEditingCompany(false);
        setCompanyName(bot.name || '');
      }
    }
  };

  // Handle questions manager refresh - Função para garantir sincronização
  const handleQuestionsManagerClose = () => {
    setShowQuestionsManager(false);
    // Opcional: refresh do bot se necessário
    if (onRefresh) {
      setTimeout(() => {
        onRefresh();
      }, 500);
    }
  };

  if (!visible || !bot) return null;

  return (
    <div 
      className={`${styles.modalBackdrop} ${visible ? styles.visible : ''}`} 
      onClick={handleBackdropClick}
    >
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2>Configurações do Bot</h2>
          
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className={styles.tabsContainer}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'general' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <FiSettings size={16} />
            <span>Geral</span>
          </button>
          
          <button 
            className={`${styles.tabButton} ${activeTab === 'products' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <FiPackage size={16} />
            <span>Produtos</span>
          </button>
          
          <button 
            className={`${styles.tabButton} ${activeTab === 'questions' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            <FiMessageSquare size={16} />
            <span>Perguntas</span>
          </button>
        </div>
        
        <div className={styles.modalBody}>
          {activeTab === 'general' && (
            <div className={styles.generalSettings}>
              <div className={styles.settingSection}>
                <div className={styles.settingHeader}>
                  <FiUser size={18} />
                  <h3>Nome do Atendente</h3>
                </div>
                
                <div className={styles.settingContent}>
                  {isEditingAttendant ? (
                    <div className={styles.editContainer}>
                      <input 
                        type="text"
                        className={styles.editInput}
                        value={attendantName}
                        onChange={(e) => setAttendantName(e.target.value)}
                        onKeyDown={(e) => handleKeyPress(e, updateAttendantName)}
                        placeholder="Nome do atendente"
                        autoFocus
                        maxLength={50}
                        disabled={isLoading}
                      />
                      
                      <div className={styles.editActions}>
                        <button 
                          className={`${styles.editActionButton} ${styles.saveButton}`}
                          onClick={updateAttendantName}
                          disabled={isLoading || !attendantName.trim() || attendantName.trim() === bot.attendantName}
                        >
                          {isLoading ? (
                            <div className={styles.buttonSpinner}></div>
                          ) : (
                            <FiCheck size={16} />
                          )}
                        </button>
                        
                        <button 
                          className={`${styles.editActionButton} ${styles.cancelButton}`}
                          onClick={() => {
                            setIsEditingAttendant(false);
                            setAttendantName(bot.attendantName || '');
                          }}
                          disabled={isLoading}
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.displayContainer}>
                      <p className={styles.settingValue}>{attendantName || 'Não definido'}</p>
                      
                      <button 
                        className={styles.editButton}
                        onClick={() => setIsEditingAttendant(true)}
                      >
                        <FiEdit2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className={styles.settingSection}>
                <div className={styles.settingHeader}>
                  <FiEdit2 size={18} />
                  <h3>Nome da Empresa</h3>
                </div>
                
                <div className={styles.settingContent}>
                  {isEditingCompany ? (
                    <div className={styles.editContainer}>
                      <input 
                        type="text"
                        className={styles.editInput}
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        onKeyDown={(e) => handleKeyPress(e, updateCompanyName)}
                        placeholder="Nome da empresa"
                        autoFocus
                        maxLength={100}
                        disabled={isLoading}
                      />
                      
                      <div className={styles.editActions}>
                        <button 
                          className={`${styles.editActionButton} ${styles.saveButton}`}
                          onClick={updateCompanyName}
                          disabled={isLoading || !companyName.trim() || companyName.trim() === bot.name}
                        >
                          {isLoading ? (
                            <div className={styles.buttonSpinner}></div>
                          ) : (
                            <FiCheck size={16} />
                          )}
                        </button>
                        
                        <button 
                          className={`${styles.editActionButton} ${styles.cancelButton}`}
                          onClick={() => {
                            setIsEditingCompany(false);
                            setCompanyName(bot.name || '');
                          }}
                          disabled={isLoading}
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.displayContainer}>
                      <p className={styles.settingValue}>{companyName || 'Não definido'}</p>
                      
                      <button 
                        className={styles.editButton}
                        onClick={() => setIsEditingCompany(true)}
                      >
                        <FiEdit2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className={styles.settingSection}>
                <div className={styles.settingHeader}>
                  <FiPackage size={18} />
                  <h3>Produtos</h3>
                </div>
                
                <div className={styles.settingContent}>
                  <div className={styles.displayContainer}>
                    <p className={styles.settingValue}>Gerencie os produtos do seu bot</p>
                    
                    <button 
                      className={styles.editButton}
                      onClick={() => setShowProductsManager(true)}
                    >
                      <FiEdit2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className={styles.settingSection}>
                <div className={styles.settingHeader}>
                  <FiMessageSquare size={18} />
                  <h3>Perguntas e Respostas</h3>
                </div>
                
                <div className={styles.settingContent}>
                  <div className={styles.displayContainer}>
                    <p className={styles.settingValue}>Gerencie as perguntas automáticas do bot</p>
                    
                    <button 
                      className={styles.editButton}
                      onClick={() => setShowQuestionsManager(true)}
                    >
                      <FiEdit2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className={styles.dangerZone}>
                <div className={styles.dangerHeader}>
                  <FiAlertTriangle size={18} />
                  <h3>Zona de Perigo</h3>
                </div>
                
                <button 
                  className={styles.deleteButton}
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <FiTrash2 size={16} />
                  <span>Excluir Bot</span>
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'products' && (
            <div className={styles.productsSettings}>
              <div className={styles.productsHeader}>
                <h3>Gerenciar Produtos</h3>
              </div>
              
              <p className={styles.productsDescription}>
                No gerenciador de produtos você pode visualizar, adicionar, editar e excluir produtos para seu bot.
                Você também pode criar produtos em lote e definir preços, categorias e imagens.
              </p>
              
              <button 
                className={styles.manageProductsButton}
                onClick={() => setShowProductsManager(true)}
              >
                <FiPackage size={18} />
                <span>Abrir Gerenciador de Produtos</span>
              </button>
            </div>
          )}
          
          {activeTab === 'questions' && (
            <div className={styles.questionsSettings}>
              <div className={styles.questionsHeader}>
                <h3>Perguntas e Respostas</h3>
              </div>
              
              <p className={styles.questionsDescription}>
                Configure as perguntas e respostas automáticas que seu bot deve responder aos clientes.
                Você pode criar perguntas frequentes e suas respectivas respostas para automatizar o atendimento.
              </p>
              
              <button 
                className={styles.manageQuestionsButton}
                onClick={() => setShowQuestionsManager(true)}
              >
                <FiMessageSquare size={18} />
                <span>Abrir Gerenciador de Perguntas</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Gerenciador de Produtos Modal */}
      {showProductsManager && (
        <ProdutoConfig
          visible={showProductsManager}
          botId={bot.protocol}
          onClose={() => setShowProductsManager(false)}
          socketService={socketService}
          user={user}
        />
      )}
      
      {/* Gerenciador de Perguntas e Respostas - CORRIGIDO */}
      {showQuestionsManager && (
        <QuestionsManager
          visible={showQuestionsManager}
          botId={bot.protocol}
          onClose={handleQuestionsManagerClose}
          socketService={socketService}
          user={user}
        />
      )}
      
      {/* Confirmação de exclusão do bot */}
      {showDeleteConfirm && (
        <DeleteBotConfirm
          visible={showDeleteConfirm}
          botId={bot.protocol}
          botName={bot.name}
          onClose={() => setShowDeleteConfirm(false)}
          socketService={socketService}
          user={user}
          onDelete={onDelete}
        />
      )}
    </div>
  );
};

export default BotSettingsModal;