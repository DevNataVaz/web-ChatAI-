import React, { useState, useEffect, useRef } from 'react';
import styles from './GerenciadorMensagens.module.css';
import { useApp } from '../../../context/AppContext';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Save,
  Loader,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { Criptografar, Descriptografar } from '../../../Cripto/index';

const GerenciadorMensagens = ({ 
  visible, 
  onClose, 
  campanha, 
  onMensagensAtualizadas,
  // Receber socketService como prop
}) => {
  const [mensagens, setMensagens] = useState([]);
  const [mensagemEditando, setMensagemEditando] = useState('');
  const [indiceEditando, setIndiceEditando] = useState(-1);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [editMode, setEditMode] = useState(false);
   const { user, socketService } = useApp();
  // Ref para o input
  const inputRef = useRef(null);
  
  // Constantes
  const MAX_CHARS = 2000;
  
  useEffect(() => {
    if (visible) {
      // console.log("🔓 Modal GerenciadorMensagens aberto");
      buscarMensagens();
    }
  }, [visible]);
  
  const buscarMensagens = async () => {
      const login = user?.LOGIN || '';
    try {
      // console.log("📤 Buscando mensagens para gerenciador...");
      setCarregando(true);
      
      if (!login) {
        // console.error("❌ Login não fornecido ao gerenciador");
        setCarregando(false);
        return;
      }
      
      const dadosSolicitacao = {
        login: login,
        campanha: campanha,
        acao: 'listar'
      };
      
      // console.log("📤 Solicitação de mensagens:", dadosSolicitacao);
      
      // Remover listeners anteriores
      if (socketService?.socket) {
        socketService.socket.off('RespostaListagemMensagens');
      }
      
      socketService.emit("ListarMensagens", Criptografar(JSON.stringify(dadosSolicitacao)));
      
      // Timeout para evitar travamento
      const timeoutId = setTimeout(() => {
        // console.log("⏰ Timeout ao buscar mensagens no gerenciador");
        setCarregando(false);
        alert("Tempo esgotado ao buscar mensagens. Tente novamente.");
      }, 10000);
      
      socketService.socket.once('RespostaListagemMensagens', (data) => {
        try {
          clearTimeout(timeoutId);
          // console.log("📥 Resposta recebida no gerenciador");
          
          const resultado = JSON.parse(Descriptografar(data));
          
          // console.log("📥 Mensagens para gerenciamento:", resultado);
          
          if (resultado && resultado.mensagens) {
            setMensagens(resultado.mensagens.map(m => ({ 
              id: m.id,
              texto: m.mensagem,
              editado: false,
              nova: false
            })));
            // console.log(`✅ ${resultado.mensagens.length} mensagens carregadas no gerenciador`);
          } else {
            setMensagens([]);
            // console.log("⚠️ Nenhuma mensagem encontrada para gerenciar");
          }
          
          setCarregando(false);
        } catch (error) {
          clearTimeout(timeoutId);
          // console.error("❌ Erro ao processar lista de mensagens no gerenciador:", error);
          setCarregando(false);
          alert("Não foi possível carregar as mensagens.");
        }
      });
    } catch (error) {
      // console.error("❌ Erro ao buscar mensagens no gerenciador:", error);
      setCarregando(false);
      alert("Erro ao buscar mensagens: " + error.message);
    }
  };
  
  const iniciarEdicao = (mensagem, index) => {
    setMensagemEditando(mensagem.texto);
    setIndiceEditando(index);
    setEditMode(true);
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };
  
  const cancelarEdicao = () => {
    setMensagemEditando('');
    setIndiceEditando(-1);
    setEditMode(false);
  };
  
  const salvarEdicao = () => {
    if (!mensagemEditando.trim()) {
      alert("Por favor, digite uma mensagem válida.");
      return;
    }
    
    const novasMensagensArray = [...mensagens];
    novasMensagensArray[indiceEditando] = {
      ...novasMensagensArray[indiceEditando],
      texto: mensagemEditando,
      editado: true
    };
    
    setMensagens(novasMensagensArray);
    cancelarEdicao();
  };
  
  const excluirMensagem = (index) => {
    if (window.confirm("Tem certeza que deseja excluir esta mensagem?")) {
      const novasMensagensArray = [...mensagens];
      novasMensagensArray.splice(index, 1);
      setMensagens(novasMensagensArray);
    }
  };
  
  const adicionarNovaMensagem = () => {
    setMensagemEditando('');
    setIndiceEditando(-1);
    setEditMode(false);
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };
  
  const salvarNovaMensagem = () => {
    if (!mensagemEditando.trim()) {
      alert("Por favor, digite uma mensagem válida.");
      return;
    }
    
    const novaMensagem = {
      id: `temp_${Date.now()}`,
      texto: mensagemEditando,
      nova: true,
      editado: false
    };
    
    setMensagens([...mensagens, novaMensagem]);
    setMensagemEditando('');
  };
  
  const salvarTodasAlteracoes = async () => {
    try {
      // console.log("💾 Salvando todas as alterações...");
      setSalvando(true);
      
      if (!login) {
        alert("Erro: Login não encontrado. Por favor, faça login novamente.");
        setSalvando(false);
        return;
      }
      
      // Preparar dados para salvar
      const mensagensParaSalvar = mensagens.map(m => ({
        id: m.id,
        mensagem: m.texto,
        nova: m.nova || false,
        editado: m.editado || false
      }));
      
      const dadosSalvar = {
        login: login,
        campanha: campanha,
        mensagens: mensagensParaSalvar,
        acao: 'salvar'
      };
      
      // console.log("📤 Enviando alterações:", {
      //   ...dadosSalvar,
      //   mensagens: `${dadosSalvar.mensagens.length} mensagens`
      // });
      
      // Remover listeners anteriores
      if (socketService?.socket) {
        socketService.socket.off('RespostaSalvarMensagens');
      }
      
      socketService.emit("SalvarMensagens", Criptografar(JSON.stringify(dadosSalvar)));
      
      // Timeout
      const timeoutId = setTimeout(() => {
        // console.log("⏰ Timeout ao salvar mensagens");
        setSalvando(false);
        alert("Tempo esgotado ao salvar. Tente novamente.");
      }, 10000);
      
      socketService.socket.once('RespostaSalvarMensagens', (data) => {
        try {
          clearTimeout(timeoutId);
          // console.log("📥 Resposta de salvamento recebida");
          
          const resultado = JSON.parse(Descriptografar(data));
          
          // console.log("📥 Resultado do salvamento:", resultado);
          
          setSalvando(false);
          
          if (resultado && resultado.sucesso) {
            alert("✅ Mensagens atualizadas com sucesso!");
            
            // Notificar o componente pai
            if (onMensagensAtualizadas) {
              onMensagensAtualizadas(mensagens.map(m => m.texto));
            }
            
            fecharModal();
          } else {
            alert("❌ Erro: " + (resultado.mensagem || "Não foi possível salvar as alterações."));
          }
        } catch (error) {
          clearTimeout(timeoutId);
          // console.error("❌ Erro ao processar resposta de salvamento:", error);
          setSalvando(false);
          alert("Erro ao salvar as alterações. Tente novamente.");
        }
      });
    } catch (error) {
      // console.error("❌ Erro ao salvar alterações:", error);
      setSalvando(false);
      alert("Erro ao salvar: " + error.message);
    }
  };
  
  const fecharModal = () => {
    const temAlteracoes = mensagens.some(m => m.editado || m.nova);
    
    if (temAlteracoes) {
      if (window.confirm("Você tem alterações não salvas. Deseja descartar essas alterações?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      if (editMode) {
        salvarEdicao();
      } else if (mensagemEditando) {
        salvarNovaMensagem();
      }
    }
  };
  
  if (!visible) return null;
  
  return (
    <div className={styles.modalOverlay} onClick={fecharModal}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <MessageSquare size={20} />
            Gerenciar Mensagens
          </h2>
          <button className={styles.closeButton} onClick={fecharModal}>
            <X size={24} />
          </button>
        </div>
        
        <div className={styles.modalSubHeader}>
          <div className={styles.campaignInfo}>
            Campanha: <span className={styles.campaignName}>{campanha || 'Padrão'}</span>
          </div>
          
          <button 
            className={styles.addButton}
            onClick={adicionarNovaMensagem}
          >
            <Plus size={16} />
            Nova Mensagem
          </button>
        </div>
        
        {/* Formulário de edição/adição */}
        {(mensagemEditando !== undefined && (indiceEditando >= 0 || !editMode)) && (
          <div className={styles.formContainer}>
            <div className={styles.formHeader}>
              <h3 className={styles.formTitle}>
                {editMode ? 'Editar Mensagem' : 'Nova Mensagem'}
              </h3>
              <span className={styles.charCounter}>
                {mensagemEditando.length}/{MAX_CHARS}
              </span>
            </div>
            
            <textarea
              ref={inputRef}
              className={styles.messageInput}
              value={mensagemEditando}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) {
                  setMensagemEditando(e.target.value);
                }
              }}
              onKeyDown={handleKeyPress}
              placeholder="Digite a mensagem personalizada. Use {nome} para incluir o nome do contato."
              maxLength={MAX_CHARS}
              rows={4}
            />
            
            <div className={styles.formActions}>
              <button
                className={styles.cancelButton}
                onClick={cancelarEdicao}
              >
                Cancelar
              </button>
              
              <button
                className={styles.saveButton}
                onClick={editMode ? salvarEdicao : salvarNovaMensagem}
              >
                <Save size={16} />
                Salvar
              </button>
            </div>
            
            <div className={styles.formHint}>
              <AlertCircle size={14} />
              <span>Dica: Use Ctrl+Enter para salvar rapidamente</span>
            </div>
          </div>
        )}
        
        {/* Lista de mensagens */}
        <div className={styles.messagesContainer}>
          {carregando ? (
            <div className={styles.loadingContainer}>
              <Loader className={styles.spinIcon} size={32} />
              <span>Carregando mensagens...</span>
            </div>
          ) : mensagens.length > 0 ? (
            <div className={styles.messagesList}>
              {mensagens.map((mensagem, index) => (
                <div 
                  key={mensagem.id || index} 
                  className={`${styles.messageItem} ${mensagem.nova ? styles.messageItemNew : ''} ${mensagem.editado ? styles.messageItemEdited : ''}`}
                >
                  <div className={styles.messageContent}>
                    <div className={styles.messageHeader}>
                      <span className={styles.messageNumber}>Mensagem {index + 1}</span>
                      <div className={styles.messageTags}>
                        {mensagem.nova && <span className={styles.tagNew}>Nova</span>}
                        {mensagem.editado && <span className={styles.tagEdited}>Editada</span>}
                      </div>
                    </div>
                    <p className={styles.messageText}>{mensagem.texto}</p>
                  </div>
                  
                  <div className={styles.messageActions}>
                    <button
                      className={styles.actionButton}
                      onClick={() => iniciarEdicao(mensagem, index)}
                      title="Editar mensagem"
                    >
                      <Edit2 size={16} />
                    </button>
                    
                    <button
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      onClick={() => excluirMensagem(index)}
                      title="Excluir mensagem"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyContainer}>
              <MessageSquare size={48} />
              <h3>Nenhuma mensagem encontrada</h3>
              <p>Clique em "Nova Mensagem" para adicionar a primeira mensagem.</p>
            </div>
          )}
        </div>
        
        {/* Rodapé com ações */}
        <div className={styles.modalFooter}>
          <button
            className={styles.footerCancelButton}
            onClick={fecharModal}
          >
            Cancelar
          </button>
          
          <button
            className={`${styles.footerSaveButton} ${salvando ? styles.buttonDisabled : ''}`}
            onClick={salvarTodasAlteracoes}
            disabled={salvando}
          >
            {salvando ? (
              <>
                <Loader className={styles.spinIcon} size={16} />
                Salvando...
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
  );
};

export default GerenciadorMensagens;