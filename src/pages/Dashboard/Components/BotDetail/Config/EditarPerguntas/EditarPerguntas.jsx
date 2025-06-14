import React, { useState, useEffect } from 'react';
import { 
  FiX, FiPlus, FiTrash2, FiEdit2, FiCheck, FiSearch,
  FiMessageSquare, FiAlertCircle
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Criptografar, Descriptografar } from '../../../../../../Cripto/index';
import styles from './EditarPerguntas.module.css';

const QuestionsManager = ({ 
  visible, 
  botId, 
  onClose, 
  socketService,
  user
}) => {
  // DEBUG: Verificar importações no primeiro render
  useEffect(() => {
    if (typeof Criptografar !== 'function') {
      toast.error('Erro de configuração: Funções de criptografia não disponíveis');
    }
    if (typeof Descriptografar !== 'function') {
      // console.error('ERRO: Função Descriptografar não foi importada corretamente');
    }
  }, []);

  // State
  const [questions, setQuestions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  
  // Form state
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(-1);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  
  // CORREÇÃO: Fetch questions apenas quando necessário
  useEffect(() => {
    if (visible && botId && user?.LOGIN) {
      // console.log('🔄 [MOUNT] Componente montado, buscando perguntas...');
      fetchQuestions();
    }
    
    // Cleanup listeners on unmount
    return () => {
      socketService.off('ResponseReceberPerguntas');
      socketService.off('ResponseAdicionarPergunta');
      socketService.off('ResponseEditarPergunta');
      socketService.off('ResponseExcluirPergunta');
    };
  }, [visible, botId]); // REMOVIDO user?.LOGIN para evitar re-renders

  // CORREÇÃO: Fetch questions - SEM TIMEOUT DESNECESSÁRIO
  const fetchQuestions = async () => {
    if (!user?.LOGIN || !botId) {
      // console.log('fetchQuestions: Parâmetros faltando:', { user: user?.LOGIN, botId });
      return;
    }
    
    try {
      setLoadingQuestions(true);
      
      if (typeof Criptografar !== 'function' || typeof Descriptografar !== 'function') {
        throw new Error('Funções de criptografia não disponíveis');
      }
      
      // CORREÇÃO: Promise mais limpa SEM timeout
      const questionsData = await new Promise((resolve) => {
        // Remove listeners anteriores
        socketService.off('ResponseReceberPerguntas');
        
        socketService.once('ResponseReceberPerguntas', (data) => {
          try {
            // console.log('🔍 [FETCH] Resposta recebida:', data);
            
            if (!data?.Response || !data?.Code) {
              // console.log('⚠️ [FETCH] Dados inválidos, retornando array vazio');
              resolve([]);
              return;
            }

            const responseDecrypted = Descriptografar(data.Response);
            const result = JSON.parse(String(responseDecrypted).trim());
            
            const codeDecrypted = Descriptografar(data.Code);
            const code = String(codeDecrypted).replace(/"/g, '').trim();

            if (code !== '0896546879475861673215673') {
              // console.log('⚠️ [FETCH] Code inválido:', code);
              resolve([]);
              return;
            }

            const questions = result?.mensagem || [];
            const validQuestions = questions.filter(q => 
              q && typeof q === 'object' && q.PERGUNTA && q.RESPOSTA
            );
            
            // console.log('✅ [FETCH] Perguntas válidas encontradas:', validQuestions.length);
            resolve(validQuestions);
            
          } catch (err) {
            // console.error("❌ [FETCH] Erro ao processar resposta:", err);
            resolve([]);
          }
        });

        try {
          const dadosParaEnviar = {
            Code: Criptografar(JSON.stringify('45635465344565344564562546762')),
            Login: Criptografar(JSON.stringify(user.LOGIN.toLowerCase())), // CORREÇÃO: Lowercase
            Protocolo: Criptografar(JSON.stringify(botId))
          };

          // console.log('📤 [FETCH] Enviando requisição com login:', user.LOGIN.toLowerCase());
          socketService.emit('ReceberPerguntas', dadosParaEnviar);
        } catch (emitError) {
          // console.error("❌ [FETCH] Erro ao enviar dados:", emitError);
          resolve([]);
        }
      });
      
      // console.log('✅ [FETCH] Atualizando state com:', questionsData.length, 'perguntas');
      setQuestions(questionsData);
      
    } catch (error) {
      // console.error("❌ [FETCH] Erro geral:", error);
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setQuestion('');
    setAnswer('');
    setEditingQuestionIndex(-1);
  };

  // Open add form
  const handleOpenAddForm = () => {
    resetForm();
    setShowAddForm(true);
    setShowEditForm(false);
  };

  // Open edit form
  const handleOpenEditForm = (questionObj, index) => {
    resetForm();
    setEditingQuestionIndex(index);
    setQuestion(questionObj.PERGUNTA || '');
    setAnswer(questionObj.RESPOSTA || '');
    
    setShowEditForm(true);
    setShowAddForm(false);
  };

  // Validação do formulário
  const validarFormulario = () => {
    if (!question.trim()) {
      toast.warning('A pergunta não pode estar vazia');
      return false;
    }
    
    if (!answer.trim()) {
      toast.warning('A resposta não pode estar vazia');
      return false;
    }
    
    return true;
  };

  // CORREÇÃO: Save question - DADOS CORRIGIDOS
  const handleSaveQuestion = async () => {
    if (!validarFormulario()) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (typeof Criptografar !== 'function') {
        throw new Error('Função de criptografia não disponível');
      }
      
      // CORREÇÃO: Estrutura correta dos dados
      const novaPergunta = {
        PERGUNTA: question.trim(),
        RESPOSTA: answer.trim()
      };
      
      // console.log('💾 [SAVE] Dados da pergunta:', novaPergunta);
      // console.log('💾 [SAVE] BotId:', botId);
      // console.log('💾 [SAVE] Login original:', user.LOGIN);
      // console.log('💾 [SAVE] Login lowercase:', user.LOGIN.toLowerCase());
      // console.log('💾 [SAVE] Modo:', showEditForm ? 'EDITAR' : 'ADICIONAR');
      
      if (showEditForm && editingQuestionIndex >= 0) {
        // EDITAR PERGUNTA EXISTENTE
        await handleEditQuestion(novaPergunta);
      } else {
        // CRIAR NOVA PERGUNTA
        await handleAddQuestion(novaPergunta);
      }
      
    } catch (error) {
      // console.error("❌ [SAVE] Erro ao salvar pergunta:", error);
      toast.error(`Erro ao salvar pergunta: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // CORREÇÃO: Função para adicionar pergunta - DADOS CORRETOS
  const handleAddQuestion = async (novaPergunta) => {
    return new Promise((resolve, reject) => {
      socketService.off('ResponseAdicionarPergunta');
      
      socketService.once('ResponseAdicionarPergunta', (data) => {
        try {
          // console.log('🆕 [ADD] Resposta recebida:', data);
          
          if (!data?.Response || !data?.Code) {
            reject(new Error('Resposta inválida do servidor'));
            return;
          }

          const result = JSON.parse(Descriptografar(data.Response));
          const code = String(Descriptografar(data.Code)).replace(/"/g, '').trim();
          
          if (code === 'erro') {
            reject(new Error(result.erro || 'Erro ao adicionar pergunta'));
            return;
          }
          
          // console.log('✅ [ADD] Pergunta adicionada com sucesso');
          
          // CORREÇÃO: Atualizar com dados completos
          const perguntaCompleta = {
            PERGUNTA: novaPergunta.PERGUNTA,
            RESPOSTA: novaPergunta.RESPOSTA
          };
          
          setQuestions(prev => [...prev, perguntaCompleta]);
          
          resetForm();
          setShowAddForm(false);
          setShowEditForm(false);
          
          toast.success("Pergunta adicionada com sucesso!");
          resolve(true);
          
        } catch (err) {
          // console.error("❌ [ADD] Erro ao processar resposta:", err);
          reject(err);
        }
      });

      try {
        // CORREÇÃO: Enviar dados corretos para o backend
        const dadosParaEnviar = {
          Code: Criptografar(JSON.stringify("31223123243146556474679894798")),
          Pergunta: Criptografar(JSON.stringify(novaPergunta)),
          Protocolo: Criptografar(JSON.stringify(botId)),
          Login: Criptografar(JSON.stringify(user.LOGIN.toLowerCase())) // CORREÇÃO: Lowercase
        };

        // console.log('📤 [ADD] Enviando dados:', {
        //   pergunta: novaPergunta,
        //   protocolo: botId,
        //   login: user.LOGIN.toLowerCase()
        // });
        
        socketService.emit('AdicionarPergunta', dadosParaEnviar);
      } catch (emitError) {
        // console.error("❌ [ADD] Erro ao preparar dados:", emitError);
        reject(emitError);
      }
      
      setTimeout(() => {
        socketService.off('ResponseAdicionarPergunta');
        reject(new Error('Timeout ao adicionar pergunta'));
      }, 10000);
    });
  };

  // CORREÇÃO: Função para editar pergunta - CORRIGIDA COMPLETAMENTE
  const handleEditQuestion = async (novaPergunta) => {
    return new Promise((resolve, reject) => {
      socketService.off('ResponseEditarPergunta');
      
      socketService.once('ResponseEditarPergunta', (data) => {
        try {
          // console.log('✏️ [EDIT] Resposta recebida:', data);
          
          if (!data?.Response || !data?.Code) {
            reject(new Error('Resposta inválida do servidor'));
            return;
          }

          const result = JSON.parse(Descriptografar(data.Response));
          const code = String(Descriptografar(data.Code)).replace(/"/g, '').trim();
          
          // console.log('✏️ [EDIT] Result:', result);
          // console.log('✏️ [EDIT] Code:', code);
          
          if (code === 'erro') {
            reject(new Error(result.erro || 'Erro ao editar pergunta'));
            return;
          }
          
          // console.log('✅ [EDIT] Pergunta editada com sucesso no backend');
          
          // CORREÇÃO: Atualizar lista local com dados corretos
          const perguntaAtualizada = {
            PERGUNTA: novaPergunta.PERGUNTA,
            RESPOSTA: novaPergunta.RESPOSTA
          };
          
          setQuestions(prev => {
            const novaLista = [...prev];
            novaLista[editingQuestionIndex] = perguntaAtualizada;
            // console.log('✏️ [EDIT] Lista atualizada localmente:', novaLista[editingQuestionIndex]);
            return novaLista;
          });
          
          resetForm();
          setShowAddForm(false);
          setShowEditForm(false);
          
          toast.success("Pergunta atualizada com sucesso!");
          
          // CORREÇÃO: Recarregar para garantir sincronização
          setTimeout(() => {
            // console.log('🔄 [EDIT] Recarregando lista para sincronização...');
            fetchQuestions();
          }, 1500);
          
          resolve(true);
          
        } catch (err) {
          // console.error("❌ [EDIT] Erro ao processar resposta:", err);
          reject(err);
        }
      });

      try {
        // CORREÇÃO: Dados corretos para edição
        const dadosParaEnviar = {
          Code: Criptografar(JSON.stringify("31223123243146556474679894798")),
          Pergunta: Criptografar(JSON.stringify(novaPergunta)),
          Protocolo: Criptografar(JSON.stringify(botId)),
          Login: Criptografar(JSON.stringify(user.LOGIN.toLowerCase())), // CORREÇÃO: Lowercase
          Index: Criptografar(JSON.stringify(editingQuestionIndex))
        };

        // console.log('📤 [EDIT] Enviando dados para edição:', {
        //   pergunta: novaPergunta,
        //   protocolo: botId,
        //   login: user.LOGIN.toLowerCase(),
        //   index: editingQuestionIndex
        // });
        
        socketService.emit('EditarPergunta', dadosParaEnviar);
      } catch (emitError) {
        // console.error("❌ [EDIT] Erro ao preparar dados:", emitError);
        reject(emitError);
      }
      
      setTimeout(() => {
        socketService.off('ResponseEditarPergunta');
        reject(new Error('Timeout ao editar pergunta'));
      }, 10000);
    });
  };

   // CORREÇÃO: Delete question - OTIMIZADO
 const handleDeleteQuestion = async (index) => {
  try {
    setIsLoading(true);
    
    if (typeof Criptografar !== 'function') {
      throw new Error('Função de criptografia não disponível');
    }
    
    // console.log('🗑️ [DELETE] Excluindo pergunta no índice:', index);
    // console.log('🗑️ [DELETE] Pergunta atual:', questions[index]);
    
    // CORREÇÃO: Atualizar interface IMEDIATAMENTE para melhor UX
    const perguntaRemovida = questions[index];
    const novaListaImediata = [...questions];
    novaListaImediata.splice(index, 1);
    setQuestions(novaListaImediata);
    
    const deleteQuestionPromise = new Promise((resolve, reject) => {
      socketService.off('ResponseExcluirPergunta');
      
      socketService.once('ResponseExcluirPergunta', (data) => {
        try {
          // console.log('🗑️ [DELETE] Resposta recebida:', data);
          
          if (!data?.Response || !data?.Code) {
            reject(new Error('Resposta inválida do servidor'));
            return;
          }
          
          const result = JSON.parse(Descriptografar(data.Response));
          const code = String(Descriptografar(data.Code)).replace(/"/g, '').trim();
          
          // console.log('🗑️ [DELETE] Result:', result);
          // console.log('🗑️ [DELETE] Code:', code);
          
          if (code === 'erro') {
            reject(new Error(result.erro || 'Erro ao excluir pergunta'));
            return;
          }
          
          // console.log('✅ [DELETE] Pergunta excluída com sucesso no backend');
          resolve(true);
          
        } catch (err) {
          // console.error("❌ [DELETE] Erro ao processar resposta:", err);
          reject(err);
        }
      });

      try {
        // CORREÇÃO: Login em lowercase
        const dadosParaEnviar = {
          Code: Criptografar(JSON.stringify("31223123243146556474679894798")),
          Protocolo: Criptografar(JSON.stringify(botId)),
          Login: Criptografar(JSON.stringify(user.LOGIN.toLowerCase())), // CORREÇÃO: Lowercase
          Index: Criptografar(JSON.stringify(index))
        };

        // console.log('📤 [DELETE] Enviando dados:', {
        //   protocolo: botId,
        //   login: user.LOGIN.toLowerCase(),
        //   index: index
        // });
        
        socketService.emit('ExcluirPergunta', dadosParaEnviar);
      } catch (emitError) {
        // console.error("❌ [DELETE] Erro ao preparar dados:", emitError);
        reject(emitError);
      }
      
      // CORREÇÃO: Timeout menor e mais responsivo
      setTimeout(() => {
        socketService.off('ResponseExcluirPergunta');
        reject(new Error('Timeout ao excluir pergunta'));
      }, 5000);
    });
    
    // Aguardar confirmação do backend
    await deleteQuestionPromise;
    
    toast.success("Pergunta excluída com sucesso!");
    // console.log('✅ [DELETE] Processo completo - interface já atualizada');
    
  } catch (error) {
    // console.error("❌ [DELETE] Erro ao excluir pergunta:", error);
    
    // CORREÇÃO: Se der erro, RESTAURAR a pergunta na lista
    // console.log('🔄 [DELETE] Erro detectado, restaurando pergunta na lista...');
    setQuestions(questions); // Restaura lista original
    
    toast.error(`Erro ao excluir pergunta: ${error.message}`);
  } finally {
    setIsLoading(false);
    setConfirmDeleteId(null);
  }
};

  // Filter questions based on search term
  const filteredQuestions = questions.filter(question => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (question.PERGUNTA || '').toLowerCase().includes(searchLower) ||
      (question.RESPOSTA || '').toLowerCase().includes(searchLower)
    );
  });

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  // Get form title
  const getFormTitle = () => {
    if (showAddForm) return "Adicionar Pergunta";
    if (showEditForm) return "Editar Pergunta";
    return "Gerenciar Perguntas e Respostas";
  };

  if (!visible) return null;

  return (
    <div 
      className={`${styles.modalBackdrop} ${visible ? styles.visible : ''}`} 
      onClick={handleBackdropClick}
    >
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2>{getFormTitle()}</h2>
          
          <div className={styles.headerActions}>
            {!showAddForm && !showEditForm && (
              <button 
                className={styles.addButton}
                onClick={handleOpenAddForm}
                title="Adicionar nova pergunta"
              >
                <FiPlus size={18} />
                <span>✨ Adicionar</span>
              </button>
            )}
            
            <button 
              className={styles.closeButton}
              onClick={onClose}
              title="Fechar modal"
            >
              <FiX size={22} />
            </button>
          </div>
        </div>
        
        <div className={styles.modalBody}>
          {showAddForm || showEditForm ? (
            <div className={styles.questionForm}>
              <div className={styles.formGroup}>
                <label htmlFor="question">🤔 Pergunta *</label>
                <textarea
                  id="question"
                  className={styles.textarea}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Digite sua pergunta aqui... Ex: Como funciona o seu produto?"
                  rows={3}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="answer">💡 Resposta *</label>
                <textarea
                  id="answer"
                  className={styles.textarea}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Escreva uma resposta clara e objetiva..."
                  rows={6}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className={styles.formActions}>
                <button 
                  className={styles.cancelFormButton}
                  onClick={() => {
                    resetForm();
                    setShowAddForm(false);
                    setShowEditForm(false);
                  }}
                  disabled={isLoading}
                  title="Cancelar operação"
                >
                  ❌ Cancelar
                </button>
                
                <button 
                  className={styles.saveFormButton}
                  onClick={handleSaveQuestion}
                  disabled={isLoading || !question.trim() || !answer.trim()}
                  title={showEditForm ? "Atualizar pergunta" : "Adicionar pergunta"}
                >
                  {isLoading ? (
                    <>
                      <div className={styles.buttonSpinner}></div>
                      {showEditForm ? "Atualizando..." : "Adicionando..."}
                    </>
                  ) : (
                    <>
                      <FiCheck size={18} />
                      <span>{showEditForm ? "🔄 Atualizar" : "✨ Adicionar"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.searchContainer}>
                <div className={styles.searchInputContainer}>
                  <FiSearch size={16} className={styles.searchIcon} />
                  <input
                    type="text"
                    className={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="🔍 Pesquisar perguntas e respostas..."
                  />
                  {searchTerm && (
                    <button 
                      className={styles.clearSearchButton}
                      onClick={() => setSearchTerm('')}
                    >
                      <FiX size={16} />
                    </button>
                  )}
                </div>
              </div>
              
                  {loadingQuestions ? (
                <div className={styles.loadingQuestions}>
                  <div className={styles.spinner}></div>
                  <p>🔄 Carregando suas perguntas...</p>
                </div>
              ) : (
                <div className={styles.questionsList}>
                  {filteredQuestions.length === 0 ? (
                    <div className={styles.emptyQuestions}>
                      <FiMessageSquare size={48} />
                      <p>
                        {searchTerm 
                          ? "🔍 Nenhuma pergunta encontrada para sua pesquisa" 
                          : "🎯 Comece criando sua primeira pergunta"}
                      </p>
                      {!searchTerm && (
                        <button 
                          className={styles.addFirstButton}
                          onClick={handleOpenAddForm}
                          title="Criar primeira pergunta"
                        >
                          <FiPlus size={18} />
                          <span>🚀 Criar Primeira Pergunta</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className={styles.questionsGrid}>
                      {filteredQuestions.map((questionItem, index) => (
                        <div key={index} className={styles.questionCard}>
                          {confirmDeleteId === index ? (
                            <div className={styles.confirmDelete}>
                              <p>🗑️ Excluir esta pergunta?</p>
                              <div className={styles.confirmButtons}>
                                <button 
                                  className={styles.cancelDeleteButton}
                                  onClick={() => setConfirmDeleteId(null)}
                                  disabled={isLoading}
                                >
                                  ❌ Cancelar
                                </button>
                                <button 
                                  className={styles.confirmDeleteButton}
                                  onClick={() => handleDeleteQuestion(index)}
                                  disabled={isLoading}
                                >
                                  {isLoading ? (
                                    <>
                                      <div className={styles.buttonSpinner}></div>
                                      Excluindo...
                                    </>
                                  ) : (
                                    <>🗑️ Confirmar</>
                                  )}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className={styles.questionActions}>
                                <button 
                                  className={styles.editQuestionButton}
                                  onClick={() => handleOpenEditForm(questionItem, index)}
                                  title="Editar pergunta"
                                >
                                  <FiEdit2 size={18} />
                                </button>
                                <button 
                                  className={styles.deleteQuestionButton}
                                  onClick={() => setConfirmDeleteId(index)}
                                  title="Excluir pergunta"
                                >
                                  <FiTrash2 size={18} />
                                </button>
                              </div>
                              
                              <div className={styles.questionInfo}>
                                <h3 className={styles.questionText}>
                                  <span className={styles.questionLabel}>Pergunta:</span> 
                                  {questionItem.PERGUNTA}
                                </h3>
                                
                                <p className={styles.answerText}>
                                  <span className={styles.answerLabel}>Resposta:</span> 
                                  {questionItem.RESPOSTA}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionsManager;