// components/ConversationsPanel/ConversationsPanel.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CSSTransition } from 'react-transition-group';
import styles from './ConversationsPanel.module.css';
import { socketService } from '../../../services/socketService';
import { Criptografar, Descriptografar } from '../../../Cripto';

// Icons
import { 
  Search, 
  Send, 
  Trash2, 
  Star,
  MessageCircle,
  Clock,
  ChevronLeft,
  Filter,
  MoreVertical,
  AlertCircle
} from 'lucide-react';

// Loading component with animation
const LoadingPanel = () => (
  <div className={styles.loadingPanel}>
    <div className={styles.loadingSpinner}></div>
    <p>Carregando...</p>
  </div>
);

// Empty state component
const EmptyState = ({ title, description, icon }) => (
  <div className={styles.emptyState}>
    {icon}
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

// Message timestamp formatter
const formatTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return '';
  const date = new Date(`${dateStr} ${timeStr}`);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Format date for conversation list
const formatDate = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return '';
  const today = new Date();
  const date = new Date(`${dateStr} ${timeStr}`);
  
  if (date.toDateString() === today.toDateString()) {
    return `Hoje ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + 
         ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Helper to check valid date/time
const isValidDate = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return dateString && regex.test(dateString);
};

const isValidTime = (timeString) => {
  const regex = /^\d{2}:\d{2}:\d{2}$/;
  return timeString && regex.test(timeString);
};

// Format date string from ISO format
const formatDateString = (dateTimeString) => {
  if (!dateTimeString) return '';
  const [date] = dateTimeString.split('T');
  return date;
};

// Organize conversations by date (mais recentes primeiro)
const organizeConversations = (array) => {
  if (!array || !Array.isArray(array)) return [];
  
  return array
    .map(item => {
      const formattedDate = item.DATA ? formatDateString(item.DATA) : '';
      return {
        ...item,
        DATA: formattedDate
      };
    })
    .filter(item => isValidDate(item.DATA) && isValidTime(item.HORAS))
    .sort((a, b) => {
      const dateA = new Date(`${a.DATA}T${a.HORAS}`);
      const dateB = new Date(`${b.DATA}T${b.HORAS}`);
      return dateB - dateA; // Ordem cronológica reversa
    });
};

// Componente principal
function ConversationsPanel() {
  const { 
    user, 
    socketConnected,
    isLoading, 
    setIsLoading,
    error,
    setError
  } = useApp();
  
  // Acesso direto ao socket e funções de criptografia
  const socket = socketService.socket; // Use a referência direta do serviço importado
  // Usamos as funções de criptografia importadas diretamente, não de window
  
  // State para dados de conversas
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [attendingConversations, setAttendingConversations] = useState([]);
  const [waitingConversations, setWaitingConversations] = useState([]);
  const [finishedConversations, setFinishedConversations] = useState([]);
  
  // UI state
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [pagingLoading, setPagingLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeTabFilter, setActiveTabFilter] = useState(1); // 1 = Todos, 2 = Atendimento, etc
  const [hasMorePages, setHasMorePages] = useState(true);
  
  // Refs
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const conversationsListRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Search filter with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        const filtered = conversations.filter(conv =>
          conv.NOME_CONTATO?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          conv.MOTIVO_CONVERSA?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredConversations(filtered);
      } else {
        setFilteredConversations(conversations);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, conversations]);

  // Inicializar WebSocket e buscar conversas com logs detalhados
  useEffect(() => {
    console.log("Verificando condições para inicializar socket:", {
      userLogin: user?.LOGIN,
      socketExists: !!socket,
      socketConnected: socket?.connected
    });
    
    if (user?.LOGIN) {
      if (!socket) {
        console.error("Socket não disponível! Tentando inicializar...");
        // Tentativa de inicializar socket manualmente se não estiver disponível
        socketService.connect();
      } else {
        console.log("Socket encontrado, verificando conexão...");
        
        // Se socket existe mas não está conectado, tentar reconectar
        if (!socket.connected) {
          console.log("Socket não conectado, tentando reconectar...");
          socket.connect();
          
          // Esperar um pouco para a conexão ser estabelecida
          setTimeout(() => {
            if (socket.connected) {
              console.log("Socket reconectado com sucesso! Buscando conversas...");
              fetchConversations(1);
            } else {
              console.error("Falha ao reconectar socket após tentativa!");
            }
          }, 1000);
        } else {
          console.log("Socket já conectado, buscando conversas...");
          fetchConversations(1);
        }
      }
      
      // Setup listeners for real-time updates
      const handleNovaConversa = (data) => {
        console.log("Recebido evento ResponseNovaConversa:", data);
        handleConversationsResponse(data);
      };
      
      // Remover listener anterior se existir para evitar duplicação
      socket?.off('ResponseNovaConversa', handleNovaConversa);
      
      // Adicionar novo listener
      socket?.on('ResponseNovaConversa', handleNovaConversa);
      
      return () => {
        console.log("Limpando listener ResponseNovaConversa");
        socket?.off('ResponseNovaConversa', handleNovaConversa);
      };
    } else {
      console.warn("Usuário não autenticado ou socket não disponível!");
    }
  }, [user, socket]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      messageInputRef.current?.focus();
    }
  }, [selectedConversation]);

  // Filter conversations by status
  useEffect(() => {
    // Filter conversations by status
    const attending = conversations.filter(conv => conv.TAG === 'Atendimento');
    const waiting = conversations.filter(conv => conv.TAG === 'Espera');
    const finished = conversations.filter(conv => conv.TAG === 'Finalizado');
    
    setAttendingConversations(attending);
    setWaitingConversations(waiting);
    setFinishedConversations(finished);
  }, [conversations]);

  // Buscar conversas do servidor - CORRIGIDO para match com o mobile
  const fetchConversations = useCallback((page = 1) => {
    if (!socket || !user?.LOGIN) {
      console.error("Não é possível buscar conversas: socket ou usuário indisponível", {
        socketExists: !!socket,
        userLogin: user?.LOGIN
      });
      return;
    }
    
    try {
      console.log(`Buscando conversas - página ${page} para usuário ${user.LOGIN}`);
      setPagingLoading(true);
      
      // Format exactly like the mobile app
      const requestData = {
        Code: '890878989048965048956089',
        Login: user.LOGIN,
        Page: page.toString(),
        Limit: '10'
      };
      
      console.log("Dados da requisição:", requestData);
      
      // IMPORTANTE: Use o mesmo formato e métodos do app mobile
      const encryptedData = Criptografar(JSON.stringify(requestData));
      
      console.log("Dados criptografados, enviando evento 'NovaConversa'...");
      
      // IMPORTANTE: Use o nome exato do evento como no backend
      socket.emit('NovaConversa', encryptedData);
      
      // Mecanismo de timeout para garantir que recebemos resposta
      const timeoutId = setTimeout(() => {
        console.warn("Timeout atingido ao esperar resposta de conversas. Tentando novamente...");
        setPagingLoading(false);
        
        // Tentar novamente após timeout
        if (socket.connected) {
          console.log("Tentando novamente buscar conversas...");
          socket.emit('NovaConversa', encryptedData);
        }
      }, 10000); // 10 segundos de timeout
      
      // Armazenar o timeout ID para limpar depois
      return () => clearTimeout(timeoutId);
    } catch (error) {
      console.error('Erro em fetchConversations:', error);
      setPagingLoading(false);
    }
  }, [user, socket]);

  // Handle response from server with conversations data
  const handleConversationsResponse = useCallback((data) => {
    try {
      setPagingLoading(false);
      
      // Descriptografa a resposta
      const result = JSON.parse(Descriptografar(data));
      
      if (result.Code === '655434565435463544') {
        // Dados iniciais das conversas
        if (result.GetInicial && result.GetInicial.length === 0) {
          setHasMorePages(false);
          return;
        }
        
        // Processamos e atualizamos as conversas
        setConversations(prevConversations => {
          // Mapeamos as conversas recebidas para nosso formato
          const newConversations = result.GetInicial.map(item => ({
            ...item,
            NOME_CONTATO: item.NOME,
            MOTIVO_CONVERSA: item.CONVERSA,
            PROTOCOLO_CONVERSA: item.PROTOCOLO_CONVERSA,
            PROTOCOLO_BOT: item.BOT_PROTOCOLO,
          }));
          
          // Se for a primeira página, substituímos todas as conversas
          if (currentPage === 1) {
            return newConversations;
          }
          
          // Caso contrário, mesclamos com as conversas existentes
          const updatedConversations = [...prevConversations];
          
          // Atualizamos conversas existentes
          newConversations.forEach(newConv => {
            const existingIndex = updatedConversations.findIndex(conv => conv.ID === newConv.ID);
            if (existingIndex !== -1) {
              updatedConversations[existingIndex] = newConv;
            } else {
              updatedConversations.push(newConv);
            }
          });
          
          return organizeConversations(updatedConversations);
        });
      }
      
      if (result.Code2 === '655434565435463545') {
        // Lidamos com atualizações em tempo real
        if (result.GetAtualizar && result.GetAtualizar.length > 0) {
          setConversations(prevConversations => {
            const updatedConversations = [...prevConversations];
            
            // Processamos as atualizações
            result.GetAtualizar.forEach(update => {
              const existingIndex = updatedConversations.findIndex(conv => conv.ID === update.ID);
              
              // Mapeamos para o formato correto
              const mappedUpdate = {
                ...update,
                NOME_CONTATO: update.NOME,
                MOTIVO_CONVERSA: update.CONVERSA,
                PROTOCOLO_CONVERSA: update.PROTOCOLO_CONVERSA,
                PROTOCOLO_BOT: update.BOT_PROTOCOLO,
              };
              
              if (existingIndex !== -1) {
                // Atualizamos conversa existente
                updatedConversations[existingIndex] = mappedUpdate;
              } else {
                // Adicionamos nova conversa no início
                updatedConversations.unshift(mappedUpdate);
              }
            });
            
            return organizeConversations(updatedConversations);
          });
        }
      }
    } catch (error) {
      console.error('Error in handleConversationsResponse:', error);
      setPagingLoading(false);
    }
  }, [Descriptografar, currentPage]);

  // Buscar mensagens para a conversa selecionada - CORRIGIDO
  const fetchMessages = useCallback((conversation) => {
    if (!socket || !conversation) {
      console.error("Não é possível buscar mensagens: socket ou conversa indisponível");
      return;
    }
    
    try {
      console.log(`Buscando mensagens para conversa: ${conversation.PROTOCOLO_CONVERSA}`);
      setLoadingMessages(true);
      
      // IMPORTANTE: Usar EXATAMENTE o mesmo formato do app mobile
      // Os objetos devem ser criptografados individualmente
      const data = {
        code: Criptografar('90343263779'),
        protocolo: Criptografar(conversation.PROTOCOLO_CONVERSA),
        contador: Criptografar('0')
      };
      
      console.log("Dados da requisição de mensagens:", {
        code: '90343263779',
        protocolo: conversation.PROTOCOLO_CONVERSA,
        contador: '0'
      });
      
      // Remover listener anterior para evitar duplicação
      socket.off('ResponseMensagens');
      
      // Configurar novo listener para receber as mensagens
      socket.on('ResponseMensagens', (responseData) => {
        console.log("Resposta de mensagens recebida:", responseData);
        
        try {
          if (!responseData || !responseData.Dados) {
            console.error("Resposta inválida para mensagens", responseData);
            setLoadingMessages(false);
            return;
          }
          
          const decrypted = JSON.parse(Descriptografar(responseData.Dados));
          console.log("Mensagens descriptografadas:", decrypted);
          
          // Atualizar estado com as mensagens recebidas
          setMessages(decrypted || []);
          
          // Desligar o estado de loading
          setLoadingMessages(false);
          
          // Removemos o listener para evitar duplicação em futuras chamadas
          socket.off('ResponseMensagens');
        } catch (err) {
          console.error("Erro ao processar resposta de mensagens:", err);
          setLoadingMessages(false);
          socket.off('ResponseMensagens');
        }
      });
      
      // Usar o nome exato do evento como no backend
      console.log("Enviando evento 'requestMensagens'...");
      socket.emit('requestMensagens', data);
      
      // Definir um timeout para evitar ficar preso no carregamento
      const timeout = setTimeout(() => {
        if (loadingMessages) {
          console.error("Timeout ao carregar mensagens! Tentando novamente...");
          // Tentar novamente com o mesmo protocolo
          socket.emit('requestMensagens', data);
          
          // Definir outro timeout para desligar o estado de loading em caso de falha persistente
          setTimeout(() => {
            if (loadingMessages) {
              console.error("Falha persistente ao carregar mensagens. Desligando loading.");
              setLoadingMessages(false);
              socket.off('ResponseMensagens');
            }
          }, 5000);
        }
      }, 5000);
      
      return () => {
        clearTimeout(timeout);
        socket.off('ResponseMensagens');
      };
    } catch (error) {
      console.error('Erro em fetchMessages:', error);
      setLoadingMessages(false);
      socket.off('ResponseMensagens');
    }
  }, [socket]);

  // Remover o effect em conflito que estava configurando listeners novamente
  // Como os listeners agora são configurados diretamente na função fetchMessages

  // Enviar uma nova mensagem - CORRIGIDO
  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !selectedConversation || !socket || !user) return;
    
    try {
      // Usar o mesmo formato do app mobile
      const requestData = {
        Code: '32564436525443565434',
        Protocolo: selectedConversation.PROTOCOLO_CONVERSA,
        Mensagem: newMessage,
        Login: user.LOGIN,
        Bot_Protocolo: selectedConversation.PROTOCOLO_BOT,
        Plataforma: selectedConversation.PLATAFORMA
      };
      
      const encryptedData = Criptografar(JSON.stringify(requestData));
      
      // Usar o nome do evento exatamente como no backend
      socket.emit('EnviarMensagem', encryptedData);
      
      // Criar um listener temporário para a resposta
      const handleSendResponse = (data) => {
        try {
          const result = JSON.parse(Descriptografar(data));
          if (result.Code === '32564436525443565434') {
            setNewMessage('');
            fetchMessages(selectedConversation);
          }
        } catch (error) {
          console.error('Error in handleSendResponse:', error);
        }
        
        // Remover o listener após receber uma resposta
        socket.off('ResponseEnviarMensagem', handleSendResponse);
      };
      
      socket.on('ResponseEnviarMensagem', handleSendResponse);
      
      // Timeout para remover o listener se não houver resposta
      setTimeout(() => {
        socket.off('ResponseEnviarMensagem', handleSendResponse);
      }, 5000);
    } catch (error) {
      console.error('Error in sendMessage:', error);
    }
  }, [newMessage, selectedConversation, user, socket, Criptografar, Descriptografar, fetchMessages]);

  // Excluir conversa - CORRIGIDO
  const deleteConversation = useCallback((conversation) => {
    if (!socket) return;
    
    // Mostrar diálogo de confirmação
    if (window.confirm('Tem certeza que deseja excluir esta conversa?')) {
      try {
        // Usar o mesmo formato do app mobile
        const requestData = {
          Code: '5659723568999234',
          Protocolo: conversation.PROTOCOLO_CONVERSA
        };
        
        const encryptedData = Criptografar(JSON.stringify(requestData));
        
        // Usar o nome do evento exatamente como no backend
        socket.emit('ExcluirConversa', encryptedData);
        
        // Criar um listener temporário para a resposta
        const handleDeleteResponse = (data) => {
          try {
            const result = JSON.parse(Descriptografar(data));
            if (result.Protocolo) {
              // Atualizar lista de conversas
              setConversations(prevConversations => 
                prevConversations.filter(conv => conv.PROTOCOLO_CONVERSA !== result.Protocolo)
              );
              
              // Resetar conversa selecionada se foi excluída
              if (selectedConversation?.PROTOCOLO_CONVERSA === result.Protocolo) {
                setSelectedConversation(null);
                setMessages([]);
              }
            }
          } catch (error) {
            console.error('Error in handleDeleteResponse:', error);
          }
          
          // Remover o listener após receber uma resposta
          socket.off('responseExcluirConversa', handleDeleteResponse);
        };
        
        socket.on('responseExcluirConversa', handleDeleteResponse);
        
        // Timeout para remover o listener se não houver resposta
        setTimeout(() => {
          socket.off('responseExcluirConversa', handleDeleteResponse);
        }, 5000);
      } catch (error) {
        console.error('Error in deleteConversation:', error);
      }
    }
  }, [socket, selectedConversation, Criptografar, Descriptografar]);

  // Marcar mensagens da conversa como lidas - CORRIGIDO
  const markConversationAsRead = useCallback(() => {
    if (!selectedConversation || !socket) return;
    
    const unreadMessages = messages.filter(msg => msg.LIDA === 'false');
    
    unreadMessages.forEach(msg => {
      try {
        // Usar o mesmo formato do app mobile
        const data = {
          Code: Criptografar('56345436545434'),
          ID: Criptografar(msg.ID)
        };
        
        // Usar o nome do evento exatamente como no backend
        socket.emit('updateMensagensLida', data);
      } catch (error) {
        console.error('Error in markConversationAsRead:', error);
      }
    });
  }, [selectedConversation, messages, socket, Criptografar]);

  

  // Selecionar conversa - CORRIGIDO
  const handleSelectConversation = useCallback((conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation);
    
    // Fechar sidebar no mobile ao selecionar uma conversa
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [fetchMessages]);

  // Carregar mais conversas (paginação) - CORRIGIDO
  const handleLoadMore = useCallback(() => {
    if (!pagingLoading && hasMorePages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchConversations(nextPage);
    }
  }, [pagingLoading, hasMorePages, currentPage, fetchConversations]);

  // Handle scroll to load more conversations
  const handleScroll = useCallback(() => {
    if (conversationsListRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = conversationsListRef.current;
      if (scrollHeight - scrollTop - clientHeight < 100 && !pagingLoading && hasMorePages) {
        handleLoadMore();
      }
    }
  }, [handleLoadMore, pagingLoading, hasMorePages]);

  // Get conversations based on active tab filter
  const activeConversations = useMemo(() => {
    if (searchTerm.length > 0) {
      return filteredConversations;
    }
    
    switch (activeTabFilter) {
      case 1: // Todos
        return conversations;
      case 2: // Atendimento
        return attendingConversations;
      case 3: // Espera
        return waitingConversations;
      case 4: // Finalizado
        return finishedConversations;
      default:
        return conversations;
    }
  }, [
    activeTabFilter, 
    conversations, 
    filteredConversations, 
    searchTerm, 
    attendingConversations, 
    waitingConversations,
    finishedConversations
  ]);
  
  // Tabs for filtering conversations
  const filterTabs = useMemo(() => [
    { id: 1, name: 'Todos', data: conversations },
    { id: 2, name: 'Atendimento', data: attendingConversations },
    { id: 3, name: 'Espera', data: waitingConversations },
    { id: 4, name: 'Finalizado', data: finishedConversations }
  ], [conversations, attendingConversations, waitingConversations, finishedConversations]);

  // Platform icons renderer
  const renderPlatformIcon = (platform) => {
    switch (platform) {
      case '0':
        return (
          <div className={`${styles.platformIcon} ${styles.whatsapp}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="currentColor"/>
            </svg>
          </div>
        );
      case '1':
        return (
          <div className={`${styles.platformIcon} ${styles.facebook}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="currentColor"/>
            </svg>
          </div>
        );
      case '2':
        return (
          <div className={`${styles.platformIcon} ${styles.instagram}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63a5.876 5.876 0 00-2.126 1.384A5.855 5.855 0 00.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913a5.885 5.885 0 001.384 2.126A5.868 5.868 0 004.14 23.37c.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558a5.898 5.898 0 002.126-1.384 5.86 5.86 0 001.384-2.126c.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913a5.89 5.89 0 00-1.384-2.126A5.847 5.847 0 0019.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227a3.81 3.81 0 01-.899 1.382 3.744 3.744 0 01-1.38.896c-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421a3.716 3.716 0 01-1.379-.899 3.644 3.644 0 01-.9-1.38c-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 01-2.88 0 1.44 1.44 0 012.88 0z" fill="currentColor"/>
            </svg>
          </div>
        );
      case '3':
        return (
          <div className={`${styles.platformIcon} ${styles.telegram}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.064-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" fill="currentColor"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className={`${styles.platformIcon} ${styles.default}`}>
            <MessageCircle size={18} />
          </div>
        );
    }
  };

  // Display loading state
  if (isLoading) {
    return <LoadingPanel />;
  }

  return (
    <div className={styles.conversationsPanel}>
      <div className={styles.conversationsContainer}>
        {/* Sidebar with conversations list */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div 
              className={styles.conversationsSidebar}
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className={styles.sidebarHeader}>
                <h2>Conversas</h2>
                <div className={styles.sidebarActions}>
                  <button 
                    className={styles.filterButton}
                    onClick={() => setFilterOpen(!filterOpen)}
                  >
                    <Filter size={18} />
                  </button>
                  <span className={styles.conversationCount}>{activeConversations.length}</span>
                </div>
              </div>

              {/* Tabs for filtering conversations */}
              <div className={styles.tabsContainer}>
                {filterTabs.map(tab => (
                  <button
                    key={tab.id}
                    className={`${styles.tabButton} ${activeTabFilter === tab.id ? styles.activeTab : ''}`}
                    onClick={() => setActiveTabFilter(tab.id)}
                  >
                    {tab.name}
                    {tab.data.filter(conv => conv.NEW_MENSAGEM === 'true').length > 0 && (
                      <span className={styles.tabBadge}>
                        {tab.data.filter(conv => conv.NEW_MENSAGEM === 'true').length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Filter dropdown */}
              <CSSTransition
                in={filterOpen}
                timeout={300}
                classNames={{
                  enter: styles.filterEnter,
                  enterActive: styles.filterEnterActive,
                  exit: styles.filterExit,
                  exitActive: styles.filterExitActive
                }}
                unmountOnExit
              >
                <div className={styles.filterDropdown}>
                  <div 
                    className={`${styles.filterOption} ${activeTabFilter === 1 ? styles.active : ''}`}
                    onClick={() => setActiveTabFilter(1)}
                  >
                    Todas
                  </div>
                  <div 
                    className={`${styles.filterOption} ${activeTabFilter === 2 ? styles.active : ''}`}
                    onClick={() => setActiveTabFilter(2)}
                  >
                    Em Atendimento ({attendingConversations.length})
                  </div>
                  <div 
                    className={`${styles.filterOption} ${activeTabFilter === 3 ? styles.active : ''}`}
                    onClick={() => setActiveTabFilter(3)}
                  >
                    Em Espera ({waitingConversations.length})
                  </div>
                  <div 
                    className={`${styles.filterOption} ${activeTabFilter === 4 ? styles.active : ''}`}
                    onClick={() => setActiveTabFilter(4)}
                  >
                    Finalizado ({finishedConversations.length})
                  </div>
                </div>
              </CSSTransition>

              <div className={styles.searchContainer}>
                <Search size={18} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Buscar conversas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              <div 
                className={styles.conversationsList}
                ref={conversationsListRef}
                onScroll={handleScroll}
              >
                {pagingLoading && currentPage === 1 ? (
                  <div className={styles.loadingConversations}>
                    <div className={styles.conversationSkeleton}></div>
                    <div className={styles.conversationSkeleton}></div>
                    <div className={styles.conversationSkeleton}></div>
                  </div>
                ) : activeConversations.length === 0 ? (
                  <EmptyState
                    title="Nenhuma conversa encontrada"
                    description={searchTerm 
                      ? "Tente outros termos de busca" 
                      : "Não há conversas nesta categoria"}
                    icon={<MessageCircle size={40} className={styles.emptyStateIcon} />}
                  />
                ) : (
                  <>
                    {activeConversations.map((conversation, index) => (
                      <motion.div
                        key={conversation.ID}
                        className={`${styles.conversationItem} ${selectedConversation?.ID === conversation.ID ? styles.selected : ''}`}
                        onClick={() => handleSelectConversation(conversation)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        transition={{ duration: 0.1 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        
                      >
                        <div className={styles.conversationHeader}>
                          <div className={styles.contactInfo}>
                            {renderPlatformIcon(conversation.PLATAFORMA)}
                            <div className={styles.contactDetails}>
                              <span className={styles.contactName}>{conversation.NOME_CONTATO}</span>
                              <span className={styles.conversationTime}>
                                <Clock size={12} className={styles.timeIcon} />
                                {formatDate(conversation.DATA, conversation.HORAS)}
                              </span>
                            </div>
                          </div>
                          <div className={styles.conversationActions}>
                            {conversation.NEW_MENSAGEM === 'true' && (
                              <motion.span 
                                className={styles.unreadBadge}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                              >
                                {conversation.QUANTIDADE}
                              </motion.span>
                            )}
                            <button
                              className={styles.actionButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteConversation(conversation);
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                            <button
                              className={styles.actionButton}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Star size={16} className={conversation.FAVORITO === 'true' ? styles.favorite : ''} />
                            </button>
                          </div>
                        </div>
                        
                        <div className={styles.conversationPreview}>
                          <p className={styles.conversationSubject}>{conversation.MOTIVO_CONVERSA}</p>
                          <span className={`${styles.conversationTag} ${styles[conversation.TAG.toLowerCase()]}`}>
                            {conversation.TAG}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                    
                    {pagingLoading && currentPage > 1 && (
                      <div className={styles.loadingMore}>
                        <div className={styles.loadingSpinner}></div>
                        <p>Carregando mais...</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main chat container */}
        <div className={styles.chatContainer}>
          {!sidebarOpen && (
            <button 
              className={styles.toggleSidebarButton}
              onClick={() => setSidebarOpen(true)}
            >
              <ChevronLeft size={20} />
            </button>
          )}
          
          {selectedConversation ? (
            <>
              <div className={styles.chatHeader}>
                <div className={styles.chatContactInfo}>
                  {renderPlatformIcon(selectedConversation.PLATAFORMA)}
                  <div>
                    <h3>{selectedConversation.NOME_CONTATO}</h3>
                    <span className={styles.chatStatus}>{selectedConversation.MOTIVO_CONVERSA}</span>
                  </div>
                </div>
                <div className={styles.chatActions}>
                  <span className={`${styles.conversationTag} ${styles[selectedConversation.TAG.toLowerCase()]}`}>
                    {selectedConversation.TAG}
                  </span>
                  <button className={styles.moreButton}>
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>

              <div className={styles.messagesContainer}>
                {loadingMessages ? (
                  <div className={styles.loadingMessages}>
                    <div className={styles.spinner}></div>
                    <p>Carregando mensagens...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <EmptyState
                    title="Nenhuma mensagem"
                    description="Inicie a conversa enviando uma mensagem"
                    icon={<MessageCircle size={40} className={styles.emptyStateIcon} />}
                  />
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.ID}
                        className={`${styles.messageBubble} ${message.SEQUENCIA === '0' ? styles.sent : styles.received}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
                      >
                        <div className={styles.messageContent}>{message.MENSAGEM}</div>
                        <div className={styles.messageTime}>
                          {formatTime(message.DATA, message.HORA)}
                          {message.SEQUENCIA === '0' && (
                            <span className={message.LIDA === 'true' ? styles.read : styles.unread}>
                              {message.LIDA === 'true' ? 'Lida' : 'Enviada'}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <div className={styles.messageInputContainer}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className={styles.messageInput}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  ref={messageInputRef}
                />
                <motion.button 
                  className={styles.sendButton} 
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send size={18} />
                </motion.button>
              </div>
            </>
          ) : (
            <EmptyState
              title="Selecione uma conversa"
              description="Escolha uma conversa da lista para começar a visualizar as mensagens"
              icon={<MessageCircle size={64} className={styles.emptyStateIcon} />}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default ConversationsPanel;