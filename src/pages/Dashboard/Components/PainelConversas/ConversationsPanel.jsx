import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useApp } from '../../../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CSSTransition } from 'react-transition-group';
import styles from './ConversationsPanel.module.css';
import { socketService } from '../../../../services/socketService';
import { Criptografar, Descriptografar } from '../../../../Cripto';
import UserImage from '../../../../assets/user.png';

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
  AlertCircle,
  ChevronDown,
  CheckCheck,
  Check,
  Play,
  Pause
} from 'lucide-react';

// Loading Panel Component
const LoadingPanel = () => (
  <div className={styles.loadingPanel}>
    <div className={styles.loadingSpinner}></div>
    <p>Carregando conversas...</p>
  </div>
);

// Empty State Component
const EmptyState = ({ title, description, icon }) => (
  <div className={styles.emptyState}>
    {icon}
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

// Time Formatting Functions
const formatTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return '';

  try {
    const [hours, minutes] = timeStr.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  } catch (error) {
    return 'Hora inválida';
  }
};

const formatDate = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return '';
  const today = new Date();
  const date = new Date(`${dateStr} ${timeStr}`);

  if (date.toDateString() === today.toDateString()) {
    return `Hoje ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === yesterday.toDateString()) {
    return `Ontem ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) +
    ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Validation Functions
const isValidDate = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return dateString && regex.test(dateString);
};

const isValidTime = (timeString) => {
  const regex = /^\d{2}:\d{2}:\d{2}$/;
  return timeString && regex.test(timeString);
};

const formatDateString = (dateTimeString) => {
  if (!dateTimeString) return '';
  const [date] = dateTimeString.split('T');
  return date;
};

// Group messages by sender and time proximity to improve chat UI
const groupMessages = (messages) => {
  if (!messages || messages.length === 0) return [];

  const groups = [];
  let currentGroup = [messages[0]];

  for (let i = 1; i < messages.length; i++) {
    const currentMessage = messages[i];
    const previousMessage = messages[i - 1];

    // Group messages from the same sender that are less than 5 minutes apart
    if (
      currentMessage.SEQUENCIA === previousMessage.SEQUENCIA &&
      isSameTimeWindow(previousMessage.DATA, previousMessage.HORA, currentMessage.DATA, currentMessage.HORA)
    ) {
      currentGroup.push(currentMessage);
    } else {
      groups.push([...currentGroup]);
      currentGroup = [currentMessage];
    }
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
};

// Check if two messages are within a 5-minute window
const isSameTimeWindow = (date1, time1, date2, time2) => {
  const timestamp1 = new Date(`${date1} ${time1}`).getTime();
  const timestamp2 = new Date(`${date2} ${time2}`).getTime();

  // 5 minutes in milliseconds
  const fiveMinutes = 5 * 60 * 1000;

  return Math.abs(timestamp2 - timestamp1) < fiveMinutes;
};

// Organize conversations by priority and timestamp
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
      // First prioritize conversations with new messages
      if (a.NEW_MENSAGEM === 'true' && b.NEW_MENSAGEM !== 'true') {
        return -1;
      }
      if (a.NEW_MENSAGEM !== 'true' && b.NEW_MENSAGEM === 'true') {
        return 1;
      }

      // Then sort by date (newest first)
      const dateA = new Date(`${a.DATA}T${a.HORAS}`);
      const dateB = new Date(`${b.DATA}T${b.HORAS}`);
      return dateB - dateA;
    });
};

// Main Component
function PainelConversas() {
  const {
    user,
    socketConnected,
    isLoading,
    setIsLoading,
    error,
    setError
  } = useApp();

  // Direct access to socket and encryption functions
  const socket = socketService.socket;

  // State for conversation data
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [attendingConversations, setAttendingConversations] = useState([]);
  const [waitingConversations, setWaitingConversations] = useState([]);
  const [finishedConversations, setFinishedConversations] = useState([]);

  // UI state
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageGroups, setMessageGroups] = useState([]); // New state for grouped messages
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [pagingLoading, setPagingLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeTabFilter, setActiveTabFilter] = useState(1); // 1 = Todos, 2 = Atendimento, etc
  const [hasMorePages, setHasMorePages] = useState(true);
  const [newMessageNotification, setNewMessageNotification] = useState(false);
  const [hasImageError, setHasImageError] = useState({}); // Track image loading errors

  // Bot control states - CORRIGIDO: movido para dentro do componente
  const [dijuntor, setDijuntor] = useState(true); 
  const [botsStatus, setBotsStatus] = useState({}); 
  // Refs
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const conversationsListRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  // Group messages when they change
  useEffect(() => {
    const groups = groupMessages(messages);
    setMessageGroups(groups);
  }, [messages]);

  // Fetch conversations from server
  const fetchConversations = useCallback((page = 1) => {
    if (!socket || !user?.LOGIN) {
      return;
    }

    try {
      setPagingLoading(true);

      // Format exactly like the mobile app
      const requestData = {
        Code: '890878989048965048956089',
        Login: user.LOGIN,
        Page: page.toString(),
        Limit: '150'
      };

      // Use the same format and methods as the mobile app
      const encryptedData = Criptografar(JSON.stringify(requestData));

      // Use the exact event name as in the backend
      socket.emit('NovaConversa', encryptedData);

      // Set a timeout to prevent infinite loading if no response
      const timeoutId = setTimeout(() => {
        setPagingLoading(false);
      }, 10000);

      return () => clearTimeout(timeoutId);
    } catch (error) {
      setPagingLoading(false);
    }
  }, [user, socket, Criptografar]);

  // Função para atualizar status de bot específico
  const updateBotStatus = useCallback((protocolo, status) => {
    setBotsStatus(prev => ({
      ...prev,
      [protocolo]: status
    }));
  }, []);

 

  // Simplificar a função fetchMessages para evitar chamadas repetidas
  const fetchMessages = useCallback((conversation, skipLoadingState = false) => {
    if (!socket || !conversation) {
      return;
    }

    try {
      // Mostrar loading apenas quando necessário
      if (!skipLoadingState) {
        // setLoadingMessages(true);
      }

      const data = {
        code: Criptografar('90343263779'),
        protocolo: Criptografar(conversation.PROTOCOLO_CONVERSA),
        contador: Criptografar(0)
      };

      // Emitir evento para buscar mensagens sem configurar listeners aqui
      socket.emit('RequestMensagens', data);

      // Adicionar timeout para garantir que o loading é removido
      const timeout = setTimeout(() => {
        setLoadingMessages(false);
      }, 5000);

      return () => {
        clearTimeout(timeout);
      };
    } catch (error) {
      setLoadingMessages(false);
    }
  }, [socket, Criptografar]);

  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !selectedConversation || !socket || !user) return;

    try {
      // Criar uma cópia temporária da mensagem antes de enviar
      const messageText = newMessage.trim();
      const tempId = `temp-${Date.now()}`;
      const timestamp = new Date();

      // Limpar o campo de entrada imediatamente para melhor UX
      setNewMessage('');

      // Adicionar mensagem temporária para feedback visual instantâneo
      setMessages(prevMessages => {
        const tempMsg = {
          ID: tempId,
          PROTOCOLO_CONVERSA: selectedConversation.PROTOCOLO_CONVERSA,
          SEQUENCIA: '0', // Mensagem enviada
          MENSAGEM: messageText,
          DATA: timestamp.toISOString().split('T')[0],
          HORA: timestamp.toTimeString().split(' ')[0],
          LIDA: 'false',
          _temp: true // Flag para identificar mensagens temporárias
        };

        return [...prevMessages, tempMsg];
      });

      // Use the same format as the mobile app
      const requestData = {
        Code: '32564436525443565434',
        Protocolo: selectedConversation.PROTOCOLO_CONVERSA,
        Mensagem: messageText,
        Login: user.LOGIN,
        Bot_Protocolo: selectedConversation.PROTOCOLO_BOT,
        Plataforma: selectedConversation.PLATAFORMA
      };

      const encryptedData = Criptografar(JSON.stringify(requestData));

      // Use the event name exactly as in the backend
      socket.emit('EnviarMensagem', encryptedData);

      // Create a temporary listener for the response
      const handleSendResponse = (data) => {
        try {
          const result = JSON.parse(Descriptografar(data));
          if (result.Code === '32564436525443565434') {
            // Substituir a mensagem temporária pela confirmada
            setMessages(prevMessages => {
              return prevMessages.map(msg => {
                if (msg.ID === tempId) {
                  // Substituir pelos dados reais se disponíveis
                  if (result.ID) {
                    return {
                      ...msg,
                      ID: result.ID,
                      _temp: false
                    };
                  }
                  return { ...msg, _temp: false };
                }
                return msg;
              });
            });

            // Atualizar a prévia da conversa
            setConversations(prevConversations => {
              return prevConversations.map(conv => {
                if (conv.PROTOCOLO_CONVERSA === selectedConversation.PROTOCOLO_CONVERSA) {
                  return {
                    ...conv,
                    ULTIMA_MENSAGEM: messageText
                  };
                }
                return conv;
              });
            });
          } else {
            fetchMessages(selectedConversation);
          }
        } catch (error) {
          // Em caso de erro, atualizar todas as mensagens para garantir consistência
          fetchMessages(selectedConversation);
        }

        // Remove the listener after receiving a response
        socket.off('ResponseEnviarMensagem', handleSendResponse);
      };

      socket.on('ResponseEnviarMensagem', handleSendResponse);

      // Timeout para remover o listener se não houver resposta
      const timeoutId = setTimeout(() => {
        socket.off('ResponseEnviarMensagem', handleSendResponse);
      }, 5000);

      return () => {
        clearTimeout(timeoutId);
        socket.off('ResponseEnviarMensagem', handleSendResponse);
      };
    } catch (error) {
      return undefined; // Sempre retorna undefined para evitar erros
    }
  }, [newMessage, selectedConversation, user, socket, Criptografar, Descriptografar, fetchMessages]);

  // Função aprimorada para marcar mensagens como lidas
  const markConversationAsRead = useCallback(() => {
    if (!selectedConversation || !socket || !messages.length) return;

    const unreadMessages = messages.filter(msg => msg.LIDA === 'false' && msg.SEQUENCIA === '1');
    if (unreadMessages.length === 0) return;

    // Processamento em lote com throttling
    let processedCount = 0;
    const batchSize = 5;
    const messagesQueue = [...unreadMessages];

    const processNextBatch = () => {
      const batch = messagesQueue.splice(0, batchSize);
      if (batch.length === 0) return;

      batch.forEach(msg => {
        try {
          socket.emit('updateMensagensLida', {
            Code: Criptografar('56345436545434'),
            ID: Criptografar(msg.ID)
          });
          processedCount++;
        } catch (error) {
          // Ignorar erros individuais
        }
      });

      // Atualizar estado localmente apenas uma vez no final
      if (processedCount > 0 && messagesQueue.length === 0) {
        // Atualizar mensagens
        setMessages(prevMessages =>
          prevMessages.map(msg => {
            if (msg.SEQUENCIA === '1' && msg.LIDA === 'false') {
              return { ...msg, LIDA: 'true' };
            }
            return msg;
          })
        );

        // Limpar badge de notificação 
        if (selectedConversation.NEW_MENSAGEM === 'true') {
          setConversations(prevConversations => {
            return prevConversations.map(conv => {
              if (conv.PROTOCOLO_CONVERSA === selectedConversation.PROTOCOLO_CONVERSA) {
                return {
                  ...conv,
                  NEW_MENSAGEM: 'false',
                  QUANTIDADE: '0'
                };
              }
              return conv;
            });
          });
        }
      }

      // Se ainda há mensagens para processar, agendar próximo lote
      if (messagesQueue.length > 0) {
        setTimeout(processNextBatch, 300);
      }
    };

    // Iniciar processamento em lote
    processNextBatch();

  }, [selectedConversation, messages, socket, Criptografar]);



  const updateConversations = useCallback(() => {
  if (!socket || !user?.LOGIN) return;

  try {
    const requestData = {
      Code: '890878989048965048956089',
      Login: user.LOGIN,
      Page: '1',
      Limit: '50' // Limite maior para atualizações
    };

    const encryptedData = Criptografar(JSON.stringify(requestData));
    socket.emit('NovaConversa', encryptedData);
  } catch (error) {
    // console.error('Erro ao atualizar conversas:', error);
  }
}, [user, socket, Criptografar]);

useEffect(() => {
  if (!socket || !user?.LOGIN) return;

  // Atualizar conversas a cada 3 segundos
  const intervalId = setInterval(() => {
    updateConversations();
  }, 3000);

  return () => clearInterval(intervalId);
}, [socket, user, updateConversations]);

 const updateConversationWithNewMessage = useCallback((messageData) => {
  if (!messageData || !messageData.PROTOCOLO_CONVERSA) return;

  const messagePreview = messageData.MENSAGEM || "Nova mensagem";

  setConversations(prevConversations => {
    const existingIndex = prevConversations.findIndex(
      conv => conv.PROTOCOLO_CONVERSA === messageData.PROTOCOLO_CONVERSA
    );

    if (existingIndex === -1) {
      // Usar nova função de update para conversas novas
      setTimeout(() => updateConversations(), 500);
      return prevConversations;
    }

    const updatedConversations = [...prevConversations];
    const updatedConversation = {
      ...updatedConversations[existingIndex],
      NEW_MENSAGEM: 'true',
      QUANTIDADE: updatedConversations[existingIndex].QUANTIDADE
        ? (parseInt(updatedConversations[existingIndex].QUANTIDADE) + 1).toString()
        : '1',
      DATA: new Date().toISOString().split('T')[0],
      HORAS: new Date().toTimeString().split(' ')[0],
      ULTIMA_MENSAGEM: messagePreview
    };

    // Remove conversa existente e adiciona no topo
    updatedConversations.splice(existingIndex, 1);
    updatedConversations.unshift(updatedConversation);

    return organizeConversations(updatedConversations);
  });
}, [updateConversations]);

  // Função PausaIndividualBots
  const pausarIndividualBots = useCallback(() => {
    if (!selectedConversation || !socket || !user) {
      // console.warn("Cannot pause bots: missing conversation, socket or user");
      return;
    }

    try {
      const dados = {
        Code: '34245331253432545162',
        Protocolo: selectedConversation.PROTOCOLO_CONVERSA,
        Login: user.LOGIN,
        Bot_Protocolo: selectedConversation.BOT_PROTOCOLO,
        Plataforma: selectedConversation.PLATAFORMA
      };
      console.log(dados);
 
      socket.emit('PausaIndividualBots', Criptografar(JSON.stringify(dados)));

     
      const handlePausaResponse = (data) => {
        try {
          const result = JSON.parse(Descriptografar(data));

          if (result.Code === '23456234456234465324') {
           
            setDijuntor(result.resultado);
          
            updateBotStatus(selectedConversation.PROTOCOLO_CONVERSA, result.resultado);
          }

          if (result.Code === '7564576554676554765654') {
        
            alert('Atenção: Conversa encerrada. Para interagir novamente, aguarde até que o atendimento seja reativado.');
          }

          if (result.Code === '54345653445356445453654') {
          
            alert(`Atenção: ${result.resultado}`);
          }
        } catch (error) {
          // console.error('Error processing pause response:', error);
          alert('Erro ao processar resposta do servidor.');
        }

        
        socket.off('responsePausaIndividualBots', handlePausaResponse);
      };

      socket.on('responsePausaIndividualBots', handlePausaResponse);

      // Timeout to remove the listener if no response
      const timeoutId = setTimeout(() => {
        socket.off('responsePausaIndividualBots', handlePausaResponse);
      }, 10000);

      return () => {
        clearTimeout(timeoutId);
        socket.off('responsePausaIndividualBots', handlePausaResponse);
      };
    } catch (error) {
      // console.error('Error in pausarIndividualBots:', error);
      alert('Erro ao pausar/retomar bots.');
    }
  }, [selectedConversation, socket, user, Criptografar, Descriptografar, updateBotStatus]);

  useEffect(() => {
    if (!socket || !selectedConversation) return;

    // Handler para respostas de mensagens - definido fora para evitar recriação
    const handleResponseMensagens = (responseData) => {
      try {
        if (Descriptografar(responseData.Code) !== '9875697857598647565') {
          setLoadingMessages(false);
          return;
        }

        const decrypted = Descriptografar(responseData.Dados);

        if (!Array.isArray(decrypted)) {
          setLoadingMessages(false);
          return;
        }

        // Ordenar e definir mensagens
        const orderedMessages = [...decrypted].reverse();

        // Atualizar mensagens de uma vez só
        setMessages(orderedMessages);
        setLoadingMessages(false);

        // Marcar conversa como lida em uma operação separada
        if (selectedConversation.NEW_MENSAGEM === 'true') {
          setConversations(prevConversations => {
            return prevConversations.map(conv => {
              if (conv.PROTOCOLO_CONVERSA === selectedConversation.PROTOCOLO_CONVERSA) {
                return {
                  ...conv,
                  NEW_MENSAGEM: 'false',
                  QUANTIDADE: '0'
                };
              }
              return conv;
            });
          });
        }

        // Agendar marcação de mensagens como lidas
        setTimeout(() => {
          const unreadMessages = orderedMessages.filter(msg =>
            msg.SEQUENCIA === '1' && msg.LIDA === 'false'
          ).slice(0, 5); // Limitar a 5 por vez

          if (unreadMessages.length > 0) {
            unreadMessages.forEach(msg => {
              socket.emit('updateMensagensLida', {
                Code: Criptografar('56345436545434'),
                ID: Criptografar(msg.ID)
              });
            });
          }
        }, 500);
      } catch (err) {
        setLoadingMessages(false);
      }
    };

    // Handler para novas mensagens
    const handleNovaMensagem = (data) => {
      try {
        const decryptedData = JSON.parse(Descriptografar(data));

        // Verificar se a mensagem pertence à conversa atual
        if (decryptedData.PROTOCOLO_CONVERSA === selectedConversation.PROTOCOLO_CONVERSA) {
          // Atualizar mensagens usando função de callback para evitar dependência no estado atual
          setMessages(prevMessages => {
            // Verificar se a mensagem já existe
            const messageExists = prevMessages.some(msg => msg.ID === decryptedData.ID);
            if (messageExists) return prevMessages;

            // Nova mensagem
            const newMsg = {
              ID: decryptedData.ID,
              PROTOCOLO_CONVERSA: decryptedData.PROTOCOLO_CONVERSA,
              SEQUENCIA: decryptedData.SEQUENCIA,
              MENSAGEM: decryptedData.MENSAGEM,
              DATA: decryptedData.DATA || new Date().toISOString().split('T')[0],
              HORA: decryptedData.HORA || new Date().toTimeString().split(' ')[0],
              LIDA: 'false'
            };

            // Adicionar à lista existente
            return [...prevMessages, newMsg];
          });

          // Verificar se precisamos rolar para baixo
          const messagesContainer = document.querySelector(`.${styles.messagesContainer}`);
          if (messagesContainer) {
            const isScrolledToBottom =
              messagesContainer.scrollHeight - messagesContainer.scrollTop <= messagesContainer.clientHeight + 100;

            if (isScrolledToBottom) {
              // Agendar rolagem para permitir que a renderização ocorra primeiro
              // setTimeout(scrollToBottom, 100);
            } else if (decryptedData.SEQUENCIA === '1') {
              // Notificação apenas para mensagens recebidas
              setNewMessageNotification(true);
              setTimeout(() => setNewMessageNotification(false), 5000);
            }
          }

          // Marcar como lida se for uma mensagem recebida
          if (decryptedData.SEQUENCIA === '1') {
            setTimeout(() => {
              socket.emit('updateMensagensLida', {
                Code: Criptografar('56345436545434'),
                ID: Criptografar(decryptedData.ID)
              });
            }, 300);
          }
        }

        // Atualizar preview da conversa
        updateConversationWithNewMessage(decryptedData);
      } catch (error) {
        // Erro silencioso para não quebrar a UI
      }
    };

    // Configurar os listeners - removidos anteriormente pelo cleanup
    socket.on('ResponseMensagens', handleResponseMensagens);
    socket.on('NovaMensagem', handleNovaMensagem);

    // Buscar mensagens iniciais - apenas emitir o evento
    const data = {
      code: Criptografar('90343263779'),
      protocolo: Criptografar(selectedConversation.PROTOCOLO_CONVERSA),
      contador: Criptografar(0)
    };
    socket.emit('RequestMensagens', data);

    // Cleanup - IMPORTANTE: remover todos os listeners
    return () => {
      socket.off('ResponseMensagens', handleResponseMensagens);
      socket.off('NovaMensagem', handleNovaMensagem);
    };
  }, [socket, selectedConversation, Criptografar, Descriptografar, updateConversationWithNewMessage]);

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

  // Initialize WebSocket and fetch conversations
  useEffect(() => {
    if (user?.LOGIN) {
      if (!socket) {
        socketService.connect();
      } else {
        // If socket exists but not connected, try to reconnect
        if (!socket.connected) {
          socket.connect();

          // Wait a bit for the connection to be established
          setTimeout(() => {
            if (socket.connected) {
              fetchConversations(1);
            }
          }, 1000);
        } else {
          fetchConversations(1);
        }
      }

      // Setup handler for new messages
      const handleNovaMensagem = (data) => {
        try {
          const decryptedData = JSON.parse(Descriptografar(data));

          // If we have a selected conversation and the message belongs to it, update the messages
          if (selectedConversation && decryptedData.PROTOCOLO_CONVERSA === selectedConversation.PROTOCOLO_CONVERSA) {
            fetchMessages(selectedConversation);

            // Only show notification if not viewing bottom of chat
            const messagesContainer = document.querySelector(`.${styles.messagesContainer}`);
            if (messagesContainer) {
              const isScrolledToBottom =
                messagesContainer.scrollHeight - messagesContainer.scrollTop <= messagesContainer.clientHeight + 100;

              if (!isScrolledToBottom && decryptedData.SEQUENCIA === '1') { // Only show for received messages
                setNewMessageNotification(true);
                setTimeout(() => setNewMessageNotification(false), 5000);
              }
            }
          }

          // Extract the message content for preview
          const messagePreview = decryptedData.MENSAGEM || "Nova mensagem";

          // Update conversations to move the one with new message to the top
          setConversations(prevConversations => {
            // Find if the conversation already exists
            const existingIndex = prevConversations.findIndex(
              conv => conv.PROTOCOLO_CONVERSA === decryptedData.PROTOCOLO_CONVERSA
            );

            const updatedConversations = [...prevConversations];

            if (existingIndex !== -1) {
              // If the conversation exists, update it
              const updatedConversation = {
                ...updatedConversations[existingIndex],
                NEW_MENSAGEM: 'true',
                // Increment message count
                QUANTIDADE: updatedConversations[existingIndex].QUANTIDADE
                  ? (parseInt(updatedConversations[existingIndex].QUANTIDADE) + 1).toString()
                  : '1',
                // Update timestamp to current time to ensure it goes to the top
                DATA: new Date().toISOString().split('T')[0],
                HORAS: new Date().toTimeString().split(' ')[0],
                // Add the message preview to the conversation
                ULTIMA_MENSAGEM: messagePreview
              };

              // Remove the existing conversation
              updatedConversations.splice(existingIndex, 1);
              // Add the updated conversation at the beginning
              updatedConversations.unshift(updatedConversation);
            } else {
              // If it's a new conversation, fetch all conversations to get the new one
              fetchConversations(1);
              return prevConversations;
            }

            return organizeConversations(updatedConversations);
          });
        } catch (error) {
          // console.error("Error processing new message:", error);
        }
      };

      socket?.off('NovaMensagem');
      socket?.on('NovaMensagem', handleNovaMensagem);

      // Setup listeners for real-time updates
      const handleNovaConversa = (data) => {
        handleConversationsResponse(data);
      };

      // Remove previous listener if exists to avoid duplication
      socket?.off('ResponseNovaConversa', handleNovaConversa);

      // Add new listener
      socket?.on('ResponseNovaConversa', handleNovaConversa);

      return () => {
        socket?.off('ResponseNovaConversa', handleNovaConversa);
        socket?.off('NovaMensagem', handleNovaMensagem);
      };
    }
  }, [user, socket, fetchConversations, selectedConversation, Descriptografar]);

useEffect(() => {
  if (selectedConversation) {
    messageInputRef.current?.focus();
    // Começar como ativo (false) ao selecionar nova conversa
    setDijuntor(true);
    
    // Verificar status específico se disponível
    const botStatus = botsStatus[selectedConversation.PROTOCOLO_CONVERSA];
    if (botStatus !== undefined) {
      setDijuntor(botStatus);
      // console.log(botsStatus)
    }
  }
}, [selectedConversation, botsStatus]);

  useEffect(() => {
    if (!socket || !selectedConversation) return;

    // Função de polling otimizada para verificar atualizações
    const checkForUpdates = () => {
      // Usar evento específico para atualizações
      socket.emit('RequestUpdateMensagens', {
        Code: Criptografar('564536546584674'),
        protocolo: Criptografar(selectedConversation.PROTOCOLO_CONVERSA),
      });
    };

    // Handler para respostas de atualização
    const handleUpdateResponse = (data) => {
      try {
        // Validar código da resposta
        if (Descriptografar(data.Code) !== '2473892748324') return;
        if (!Descriptografar(data.Ativador)) return;

        const Dados = Descriptografar(data.Dados);
        if (!Array.isArray(Dados) || Dados.length === 0) return;

        // Atualizar mensagens de forma eficiente
        setMessages(prevMessages => {
          // Criar um conjunto de IDs existentes para verificação rápida
          const existingIds = new Set(prevMessages.map(m => m.ID));

          // Filtrar apenas mensagens novas
          const newMessages = Dados
            .filter(msg => !existingIds.has(msg.ID))
            .map(msg => ({
              ID: msg.ID,
              PROTOCOLO_CONVERSA: msg.NUMERO_PROTOCOLO || selectedConversation.PROTOCOLO_CONVERSA,
              SEQUENCIA: msg.SEQUENCIA,
              MENSAGEM: msg.MENSAGEM,
              DATA: msg.DATA || new Date().toISOString().split('T')[0],
              HORA: msg.HORA,
              LIDA: msg.LIDA
            }));

          // Se não há mensagens novas, não causar re-render
          if (newMessages.length === 0) return prevMessages;

          // Agendar marcação de mensagens como lidas
          setTimeout(() => {
            newMessages.forEach(msg => {
              if (msg.SEQUENCIA === '1' && msg.LIDA === 'false') {
                socket.emit('updateMensagensLida', {
                  Code: Criptografar('56345436545434'),
                  ID: Criptografar(msg.ID)
                });
              }
            });
          }, 300);

          // Anexar novas mensagens preservando a ordem
          return [...prevMessages, ...newMessages];
        });

        // Só rolar para baixo se houver mensagens novas
        const messagesContainer = document.querySelector(`.${styles.messagesContainer}`);
        if (messagesContainer) {
          const isScrolledToBottom =
            messagesContainer.scrollHeight - messagesContainer.scrollTop <= messagesContainer.clientHeight + 100;

          if (isScrolledToBottom) {
            // setTimeout(scrollToBottom, 100);
          }
        }
      } catch (error) {
        // Erro silencioso para não quebrar a UI
      }
    };

    // Configurar handler uma única vez
    socket.on('ResponseUpdateMensagens', handleUpdateResponse);

    // Verificar a cada 5 segundos em vez de 3 para reduzir carga
    const intervalId = setInterval(checkForUpdates, 5000);

    // Limpar tudo ao desmontar
    return () => {
      clearInterval(intervalId);
      socket.off('ResponseUpdateMensagens', handleUpdateResponse);
    };
  }, [socket, selectedConversation, Criptografar, Descriptografar]);

  // Filter conversations by status
  useEffect(() => {
    const attending = conversations.filter(conv => conv.TAG === 'Atendimento');
    const waiting = conversations.filter(conv => conv.TAG === 'Espera');
    const finished = conversations.filter(conv => conv.TAG === 'Finalizado');

    setAttendingConversations(attending);
    setWaitingConversations(waiting);
    setFinishedConversations(finished);
  }, [conversations]);

  // Inicializar status dos bots quando carregar conversas
  useEffect(() => {
    conversations.forEach(conv => {
      if (!botsStatus.hasOwnProperty(conv.PROTOCOLO_CONVERSA)) {
        setBotsStatus(prev => ({
          ...prev,
          [conv.PROTOCOLO_CONVERSA]: true // Assumir pausado por padrão
        }));
      }
    });
  }, [conversations, botsStatus]);

  // Handle response from server with conversations data
  const handleConversationsResponse = useCallback((data) => {
    try {
      setPagingLoading(false);

      // Decrypt the response
      const result = JSON.parse(Descriptografar(data));

      if (result.Code === '655434565435463544') {
        // Initial conversations data
        if (result.GetInicial && result.GetInicial.length === 0) {
          setHasMorePages(false);
          return;
        }

        // Process and update conversations
        setConversations(prevConversations => {
          // Map received conversations to our format
          const newConversations = result.GetInicial.map(item => ({
            ...item,
            NOME_CONTATO: item.NOME,
            MOTIVO_CONVERSA: item.CONVERSA,
            PROTOCOLO_CONVERSA: item.PROTOCOLO_CONVERSA,
            PROTOCOLO_BOT: item.BOT_PROTOCOLO,
            // Handle latest message preview
            ULTIMA_MENSAGEM: item.ULTIMA_MENSAGEM || '',
            // Ensure these fields exist
            NEW_MENSAGEM: item.NEW_MENSAGEM || 'false',
            QUANTIDADE: item.QUANTIDADE || '0'
          }));

          // If it's the first page, just return the new conversations
          if (currentPage === 1) {
            return organizeConversations(newConversations);
          }

          // Otherwise, merge with existing conversations
          const updatedConversations = [...prevConversations];

          // Update existing conversations
          newConversations.forEach(newConv => {
            const existingIndex = updatedConversations.findIndex(conv =>
              conv.PROTOCOLO_CONVERSA === newConv.PROTOCOLO_CONVERSA
            );
            if (existingIndex !== -1) {
              // Preserve notification state and latest message if already set
              if (updatedConversations[existingIndex].NEW_MENSAGEM === 'true') {
                newConv.NEW_MENSAGEM = 'true';
                newConv.QUANTIDADE = updatedConversations[existingIndex].QUANTIDADE;
              }

              // Keep existing latest message if no new one is provided
              if (!newConv.ULTIMA_MENSAGEM && updatedConversations[existingIndex].ULTIMA_MENSAGEM) {
                newConv.ULTIMA_MENSAGEM = updatedConversations[existingIndex].ULTIMA_MENSAGEM;
              }

              updatedConversations[existingIndex] = newConv;
            } else {
              updatedConversations.push(newConv);
            }
          });

          return organizeConversations(updatedConversations);
        });
      }

      if (result.Code2 === '655434565435463545') {
        // Handle real-time updates
        if (result.GetAtualizar && result.GetAtualizar.length > 0) {
          setConversations(prevConversations => {
            const updatedConversations = [...prevConversations];

            // Process updates
            result.GetAtualizar.forEach(update => {
              const existingIndex = updatedConversations.findIndex(conv =>
                conv.PROTOCOLO_CONVERSA === update.PROTOCOLO_CONVERSA
              );

              // Map to correct format
              const mappedUpdate = {
                ...update,
                NOME_CONTATO: update.NOME,
                MOTIVO_CONVERSA: update.CONVERSA,
                PROTOCOLO_CONVERSA: update.PROTOCOLO_CONVERSA,
                PROTOCOLO_BOT: update.BOT_PROTOCOLO,
                // Handle latest message preview
                ULTIMA_MENSAGEM: update.ULTIMA_MENSAGEM || '',
                // Ensure these fields exist
                NEW_MENSAGEM: update.NEW_MENSAGEM || 'false',
                QUANTIDADE: update.QUANTIDADE || '0'
              };
console.log("AAAAAAAAAAAAAAAAAAAAAA", mappedUpdate)
              if (existingIndex !== -1) {
                // Preserve notification state if already set
                if (updatedConversations[existingIndex].NEW_MENSAGEM === 'true') {
                  mappedUpdate.NEW_MENSAGEM = 'true';
                  mappedUpdate.QUANTIDADE = updatedConversations[existingIndex].QUANTIDADE;
                }

                // Keep existing latest message if no new one is provided
                if (!mappedUpdate.ULTIMA_MENSAGEM && updatedConversations[existingIndex].ULTIMA_MENSAGEM) {
                  mappedUpdate.ULTIMA_MENSAGEM = updatedConversations[existingIndex].ULTIMA_MENSAGEM;
                }

                // Update existing conversation
                updatedConversations[existingIndex] = mappedUpdate;
              } else {
                // Add new conversation at the beginning
                updatedConversations.unshift(mappedUpdate);
              }
            });

            return organizeConversations(updatedConversations);
          });
        }
      }
    } catch (error) {
      setPagingLoading(false);
    }
  }, [Descriptografar, currentPage]);

  // Delete conversation
  const deleteConversation = useCallback((conversation) => {
    if (!socket) return;

    // Show confirmation dialog
    if (window.confirm('Tem certeza que deseja excluir esta conversa?')) {
      try {
        // Use the same format as the mobile app
        const requestData = {
          Code: '5659723568999234',
          Protocolo: conversation.PROTOCOLO_CONVERSA
        };

        const encryptedData = Criptografar(JSON.stringify(requestData));

        // Use the event name exactly as in the backend
        socket.emit('ExcluirConversa', encryptedData);

        // Create a temporary listener for the response
        const handleDeleteResponse = (data) => {
          try {
            const result = JSON.parse(Descriptografar(data));
            if (result.Protocolo) {
              // Update conversations list
              setConversations(prevConversations =>
                prevConversations.filter(conv => conv.PROTOCOLO_CONVERSA !== result.Protocolo)
              );

              // Reset selected conversation if it was deleted
              if (selectedConversation?.PROTOCOLO_CONVERSA === result.Protocolo) {
                setSelectedConversation(null);
                setMessages([]);
                setMessageGroups([]);
              }
            }
          } catch (error) {
            // console.error('Error in handleDeleteResponse:', error);
          }

          // Remove the listener after receiving a response
          socket.off('responseExcluirConversa', handleDeleteResponse);
        };

        socket.on('responseExcluirConversa', handleDeleteResponse);

        // Timeout to remove the listener if no response
        setTimeout(() => {
          socket.off('responseExcluirConversa', handleDeleteResponse);
        }, 5000);
      } catch (error) {
        // console.error('Error in deleteConversation:', error);
      }
    }
  }, [socket, selectedConversation, Criptografar, Descriptografar]);

  // Select conversation
  const handleSelectConversation = useCallback((conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation);
    setNewMessageNotification(false);

    // Reset unread count when selecting a conversation
    if (conversation.NEW_MENSAGEM === 'true') {
      setConversations(prevConversations => {
        return prevConversations.map(conv => {
          if (conv.PROTOCOLO_CONVERSA === conversation.PROTOCOLO_CONVERSA) {
            return {
              ...conv,
              NEW_MENSAGEM: 'false',
              QUANTIDADE: '0'
            };
          }
          return conv;
        });
      });
    }

    // Close sidebar on mobile when selecting a conversation
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [fetchMessages]);

  // Load more conversations (pagination)
  const handleLoadMore = useCallback(() => {
    // if (!pagingLoading && hasMorePages) {
    //   const nextPage = currentPage + 1;
    //   setCurrentPage(nextPage);
    //   fetchConversations(nextPage);
    // }
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

  // Handle image loading errors
  const handleImageError = (conversationId) => {
    setHasImageError(prev => ({
      ...prev,
      [conversationId]: true
    }));
  };

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

  // Platform icons renderer with enhanced visibility
  const renderPlatformIcon = (platform) => {
    switch (platform) {
      case '0':
        return (
          <div className={`${styles.platformIcon} ${styles.whatsapp}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="currentColor" />
            </svg>
          </div>
        );
      case '1':
        return (
          <div className={`${styles.platformIcon} ${styles.facebook}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="currentColor" />
            </svg>
          </div>
        );
      case '2':
        return (
          <div className={`${styles.platformIcon} ${styles.instagram}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63a5.876 5.876 0 00-2.126 1.384A5.855 5.855 0 00.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913a5.885 5.885 0 001.384 2.126A5.868 5.868 0 004.14 23.37c.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558a5.898 5.898 0 002.126-1.384 5.86 5.86 0 001.384-2.126c.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913a5.89 5.89 0 00-1.384-2.126A5.847 5.847 0 0019.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227a3.81 3.81 0 01-.899 1.382 3.744 3.744 0 01-1.38.896c-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421a3.716 3.716 0 01-1.379-.899 3.644 3.644 0 01-.9-1.38c-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 01-2.88 0 1.44 1.44 0 012.88 0z" fill="currentColor" />
            </svg>
          </div>
        );
      case '3':
        return (
          <div className={`${styles.platformIcon} ${styles.telegram}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.064-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" fill="currentColor" />
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
                  {/* <button
                    className={styles.filterButton}
                    onClick={() => setFilterOpen(!filterOpen)}
                    title="Filtrar conversas"
                  >
                    <Filter size={18} />
                  </button> */}
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
                <input
                  type="text"
                  placeholder="Buscar conversas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
                <Search size={18} className={styles.searchIcon} />
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
                    {activeConversations.map((conversation) => (
                      <motion.div
                        key={conversation.ID || conversation.PROTOCOLO_CONVERSA}
                        className={`${styles.conversationItem} 
                          ${selectedConversation?.PROTOCOLO_CONVERSA === conversation.PROTOCOLO_CONVERSA ? styles.selected : ''}
                          ${conversation.NEW_MENSAGEM === 'true' ? styles.unread : ''}`}
                        onClick={() => handleSelectConversation(conversation)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        transition={{ duration: 0.1 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className={styles.conversationHeader}>
                          <div className={styles.contactInfo}>
                            <div className={styles.avatarContainer}>
                              <img
                                src={hasImageError[conversation.PROTOCOLO_CONVERSA]
                                  ? UserImage
                                  : `https://animuschatpro.up.railway.app/images?image=${conversation.PROTOCOLO_CONVERSA}.jpg`}
                                alt="Avatar"
                                className={styles.avatarImage}
                                onError={() => handleImageError(conversation.PROTOCOLO_CONVERSA)}
                              />
                              {renderPlatformIcon(conversation.PLATAFORMA)}
                            </div>

                            <div className={styles.contactDetails}>
                              <span className={styles.contactName}>{conversation.NOME_CONTATO}</span>
                              <span className={styles.conversationTime}>
                                <Clock size={12} className={styles.timeIcon} />
                                {formatDate(conversation.DATA, conversation.HORAS)}
                              </span>
                            </div>
                          </div>
                          <div className={styles.conversationActions}>
                            {/* Indicador de status do bot */}
                            <div 
                              className={`${styles.botStatusIndicator} ${
                                botsStatus[conversation.PROTOCOLO_CONVERSA] === false ? styles.paused : styles.active
                              }`}
                              title={botsStatus[conversation.PROTOCOLO_CONVERSA] === false ? "Bot pausado" : "Bot ativo" }
                            />
                            
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
                              title="Excluir conversa"
                            >
                              <Trash2 size={16} />
                            </button>
                            {/* <button
                              className={styles.actionButton}
                              onClick={(e) => e.stopPropagation()}
                              title="Favoritar conversa"
                            >
                              <Star size={16} className={conversation.FAVORITO === 'true' ? styles.favorite : ''} />
                            </button> */}
                          </div>
                        </div>

                        <div className={styles.conversationPreview}>
                          <div className={styles.previewContainer}>
                            <p className={styles.conversationSubject}>{conversation.MOTIVO_CONVERSA}</p>
                            {/* Display the latest message preview */}
                            {conversation.ULTIMA_MENSAGEM && (
                              <p className={styles.messagePreview}>
                                {conversation.ULTIMA_MENSAGEM.length > 60
                                  ? conversation.ULTIMA_MENSAGEM.substring(0, 60) + '...'
                                  : conversation.ULTIMA_MENSAGEM}
                              </p>
                            )}
                          </div>
                          <span className={`${styles.conversationTag} ${styles[conversation.TAG.toLowerCase() || 'default']}`}>
                            {conversation.TAG}
                          </span>
                        </div>
                      </motion.div>
                    ))}

                    {pagingLoading && currentPage > 1 && (
                      <div className={styles.loadingMore}>
                        <div className={styles.loadingSpinner}></div>
                        <p>Carregando mais conversas...</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat container */}
        <div className={styles.chatContainer}>
          {!sidebarOpen && (
            <button
              className={styles.toggleSidebarButton}
              onClick={() => setSidebarOpen(true)}
              title="Mostrar conversas"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {selectedConversation ? (
            <>
              <div className={styles.chatHeader}>
                <div className={styles.chatContactInfo}>
                  <div className={styles.avatarContainer}>
                    <img
                      src={hasImageError[selectedConversation.PROTOCOLO_CONVERSA]
                        ? UserImage
                        : `https://animuschatpro.up.railway.app/images?image=${selectedConversation.PROTOCOLO_CONVERSA}.jpg`}
                      alt="Avatar"
                      className={styles.avatarImage}
                      onError={() => handleImageError(selectedConversation.PROTOCOLO_CONVERSA)}
                    />
                    {renderPlatformIcon(selectedConversation.PLATAFORMA)}
                  </div>
                  <div>
                    <h3>{selectedConversation.NOME_CONTATO}</h3>
                    <span className={styles.chatStatus}>{selectedConversation.MOTIVO_CONVERSA}</span>
                  </div>
                </div>
                <div className={styles.chatActions}>
                  <span className={`${styles.conversationTag} ${styles[selectedConversation.TAG.toLowerCase() || 'default']}`}>
                    {selectedConversation.TAG}
                  </span>

                  <button
                    className={`${styles.pauseBotButton} ${dijuntor ? styles.active : styles.paused}`}
                    onClick={pausarIndividualBots}
                    title={dijuntor ? "Bot ativo - Clique para pausar" : "Bot pausado - Clique para ativar"}
                    disabled={!selectedConversation}
                  >
                    {dijuntor ? (
                      <>
                        <Pause size={16} />
                        Pausar Bot
                       
                      </>
                    ) : (
                      <>
                       <Play size={16} />
                        Ativar Bot
                      </>
                    )}
                  </button>

                  <button className={styles.moreButton} title="Mais opções">
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
                ) : messageGroups.length === 0 ? (
                  <EmptyState
                    title="Nenhuma mensagem"
                    description="Inicie a conversa enviando uma mensagem"
                    icon={<MessageCircle size={40} className={styles.emptyStateIcon} />}
                  />
                ) : (
                  <>
                    {messageGroups.map((group, groupIndex) => {
                      const isSent = group[0].SEQUENCIA === '0';
                      return (
                        <div
                          key={`group-${groupIndex}`}
                          className={`${styles.messageGroup} ${isSent ? styles.sent : styles.received}`}
                        >
                          {!isSent && (
                            <img
                              src={hasImageError[selectedConversation.PROTOCOLO_CONVERSA]
                                ? UserImage
                                : `https://animuschatpro.up.railway.app/images?image=${selectedConversation.PROTOCOLO_CONVERSA}.jpg`}
                              alt="Contact"
                              className={styles.messageAvatar}
                              onError={() => handleImageError(selectedConversation.PROTOCOLO_CONVERSA)}
                            />
                          )}
                          <div className={styles.messageWrapper}>
                            {group.map((message, messageIndex) => (
                              <motion.div
                                key={message.ID}
                                className={`${styles.messageBubble} ${message.SEQUENCIA === '0' ? styles.sent : styles.received} ${messageIndex === 0 ? styles.firstInGroup : ''
                                  } ${messageIndex === group.length - 1 ? styles.lastInGroup : ''}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: Math.min(messageIndex * 0.05, 0.3) }}
                              >
                                <div className={styles.messageContent}>{message.MENSAGEM}</div>
                                {messageIndex === group.length - 1 && (
                                  <div className={styles.messageTime}>
                                    {formatTime(message.DATA, message.HORA)}
                                    {message.SEQUENCIA === '0' && (
                                      <span className={message.LIDA === 'true' ? styles.read : styles.unread}>
                                        {message.LIDA === 'true' ? (
                                          <><CheckCheck size={12} /> Lida</>
                                        ) : (
                                          <><Check size={12} /> Enviada</>
                                        )}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}

                {/* New message notification */}
                {newMessageNotification && (
                  <motion.div
                    className={styles.newMessageNotification}
                    onClick={scrollToBottom}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                  >
                    <ChevronDown size={16} />
                    Nova(s) mensagem(ns)
                  </motion.div>
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
                  title="Enviar mensagem"
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

export default PainelConversas;