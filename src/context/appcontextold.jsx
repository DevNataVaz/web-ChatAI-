import React, { createContext, useState, useContext, useEffect } from 'react';
import { socketService } from '../services/socketService';
import { useNavigate } from 'react-router-dom';
import { Descriptografar } from '../Cripto';
import { io } from 'socket.io-client';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  // Novos estados para gerenciamento de pagamentos
  const [planos, setPlanos] = useState([]);
  const [assinatura, setAssinatura] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);

  const [products, setProducts] = useState([]);

  const navigate = useNavigate();

// Platform status
const [platformStatus, setPlatformStatus] = useState({
  instagram: false,
  whatsapp: false
});

  useEffect(() => {
    const init = async () => {
      const loadedUser = checkUserFromStorage();
      const socket = socketService.connect();
  
      if (loadedUser) {
        setUser(loadedUser);
      }
      setInitializing(false)
  
    // Setup global listeners that should persist
    socketService.on('connect', () => {
      console.log('Socket connected');
      
    });

    socketService.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Erro de conexão com o servidor');
    });

    socketService.on('disconnect', () => {
      console.log('Socket disconnected');
    });
    
    socketService.on('ResponseUpdateMensagens', (data) => {
      try {
        const decrypted = JSON.parse(Descriptografar(data));
        if (decrypted.Ativador && loadedUser?.LOGIN) {
          // Play notification sound
         
          
          loadConversations(user.LOGIN);
        }
      } catch (err) {
        console.error('Error processing message update:', err);
      }
    });
    
    socketService.on('ResponseNovaConversa', (data) => {
      try {
        const decrypted = JSON.parse(Descriptografar(data));
        if (decrypted.GetAtualizar && decrypted.GetAtualizar.length > 0) {
          
          setConversations(prev => {
            const newConvs = [...decrypted.GetAtualizar];
            const existingIds = new Set(prev.map(c => c.ID));
            const filteredNewConvs = newConvs.filter(c => !existingIds.has(c.ID));
            return [...filteredNewConvs, ...prev];
          });
         
        
        }
      } catch (err) {
        console.error('Error processing new conversation:', err);
      }
    });
  }
  init();
    
    return () => {
      socketService.off('ResponseUpdateMensagens');
      socketService.off('ResponseNovaConversa');
      socketService.disconnect();
    };
  }, []);

  const loadInitialData = async (login) => {
    try {
      setIsLoading(true);
      // Use Promise.all to load data in parallel
      await Promise.all([
        loadUserData(login),
        loadAgents(login),
        loadNotifications(login)
      ]);
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Erro ao carregar dados iniciais');
    } finally {
      setIsLoading(false);
    }
  };

  // New function to load notifications
  const loadNotifications = async (login) => {
    try {
      const notificationsData = await socketService.getNotifications(login);
      if (notificationsData && notificationsData.resultado) {
        setNotifications(notificationsData.resultado);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };


// recupera e valida o usuário do localStorage
const checkUserFromStorage = () => {
  const saved = localStorage.getItem('animusia_user');
  if (!saved) return null;

  try {
    // descriptografa e faz o parse
    const decrypted = Descriptografar(saved);
    const parsed = JSON.parse(decrypted);
    const now = Date.now();

    // verifica expiry
    if (parsed.expiry && now < parsed.expiry) {
      // devolve apenas o objeto user salvo
      return parsed.user;
    } else {
      // expirou: limpa storage
      // localStorage.removeItem('animusia_user');
    }
  } catch (err) {
    console.error('Erro ao carregar usuário do localStorage:', err);
    localStorage.removeItem('animusia_user');
  }

  return null;
};

// busca perfil no backend e mescla no estado
const loadUserData = async (login) => {
  try {
    setIsLoading(true);
    const profile = await socketService.getUserProfile(login);
    if (profile) {
      // mescla os dados do perfil no user atual
      setUser(prev => ({
        ...prev,
        ...profile
      }));
    }
  } catch (err) {
    console.error('Erro ao carregar perfil:', err);
  } finally {
    setIsLoading(false);
  }
};


  const loadAgents = async (login) => {
    try {
      const agentsData = await socketService.getMyAgents(login);
      setAgents(agentsData.Dados || []);
      if (agentsData.Dados && agentsData.Dados.length > 0) setCurrentAgent(agentsData.Dados[0]);
    } catch (err) {
      console.error('Erro ao carregar agentes:', err);
    }
  };

  const loadPlans = async (login) => {
    try {
      setIsLoading(true);
      const data = {
        Code: '6543456253415433251332',
        Dados: login
      };

      const response = await socketService.requestData('GetPlanos', 'ResponseGetPlanos', data);

      if (response && response.Resultado) {
        const planosProcessados = response.Resultado.map(plano => ({
          ...plano,
          destaque: plano.ID === 3
        }));

        setPlanos(planosProcessados);
        return {
          Id_Assinatura: response.Id_Assinatura,
          Plano_atual: response.Plano_atual
        };
      }
      return null;
    } catch (err) {
      console.error('Error loading plans:', err);
      setError('Erro ao carregar planos');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubscription = async (login) => {
    try {
      const faturaData = await socketService.getFaturas(login);
      setAssinatura(faturaData);
    } catch (err) {
      console.error('Erro ao carregar assinatura:', err);
    }
  };


  const loadConversations = async (login, count = 10) => {
    try {
      setIsLoading(true);
      const data = await socketService.getConversations(login, count);
      if (data && data.Conversa) {
        setConversations(data.Conversa);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load messages for a conversation
  const loadMessages = async (protocolo, count = 15) => {
    try {
      setIsLoading(true);
      const data = await socketService.getMessages(protocolo, count);
      if (data && data.Dados) {
        setMessages(data.Dados);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Send a message
  const sendMessage = async (protocolo, message, botProtocolo, plataforma) => {
    if (!user || !botProtocolo) return false;
    try {
      setIsLoading(true);
      const result = await socketService.sendMessage(
        protocolo,
        message,
        user.LOGIN,
        botProtocolo,
        plataforma
      );
      
      // Reload messages after sending
      await loadMessages(protocolo);
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Erro ao enviar mensagem');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load products
  const loadProducts = async (login, protocolo) => {
    try {
      setIsLoading(true);
      const data = await socketService.getProducts(login, protocolo);
      if (data && data.Response && data.Response.code) {
        setProducts(data.Response.mensagem || []);
      }
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPlatformStatus = async (identificador) => {
    try {
      // Check Instagram status
      const instagramStatus = await socketService.checkPlatformStatus(identificador, 'instagram');
      
      // Check WhatsApp status
      const whatsappStatus = await socketService.checkPlatformStatus(identificador, 'whatsapp');
      
      setPlatformStatus({
        instagram: instagramStatus && instagramStatus.Dados === true,
        whatsapp: whatsappStatus && whatsappStatus.Dados === true
      });
    } catch (err) {
      console.error('Error checking platform status:', err);
    }
  };
  
  // Connect platform
  const connectPlatform = async (platform) => {
    if (!user || !currentAgent) return false;
    
    try {
      setIsLoading(true);
      const result = await socketService.connectPlatform(
        user.LOGIN,
        currentAgent.PROTOCOLO,
        platform
      );
      
      // Update platform status after connection attempt
      await checkPlatformStatus(currentAgent.PROTOCOLO);
      return true;
    } catch (err) {
      console.error(`Error connecting to ${platform}:`, err);
      setError(`Erro ao conectar ao ${platform}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };


  const login = (userData) => {
    // setUser(userData);
    const storageData = {
      user: userData,
      expiry: new Date().getTime() + (7 * 24 * 60 * 60 * 1000) // 7 days in milliseconds
    };
    
    const encrypted = Criptografar(JSON.stringify(storageData));
    localStorage.setItem('animusia_user', encrypted);
    // setUser(storageData.user);
    setUser(userData);
    // Load user data
    // if (userData.LOGIN) {
    //   loadUserData(userData.LOGIN);
    // }
  }



  const logout = () => {
    setUser(null);
    setAgents([]);
    setCurrentAgent(null);
    setNotifications([]);
    setPlanos([]);
    setAssinatura(null);
    setPaymentHistory([]);
    localStorage.removeItem('animusia_user');
    socketService.disconnect();
  };

  const selectAgent = (agent) => setCurrentAgent(agent);

  const updateAgentBehavior = async (behaviorText, settings) => {
    if (!currentAgent || !user) return false;
    try {
      setIsLoading(true);
      setError(null);
      const perguntas = [{ Pergunta: 'Comportamento', Resposta: behaviorText }];
      const response = await socketService.saveBehavior(
        currentAgent.EMPRESA,
        currentAgent.ATENDENTE,
        currentAgent.PROTOCOLO,
        user.LOGIN,
        currentAgent.REDE,
        currentAgent.OBJETIVO,
        perguntas,
        settings.gatilho || 'automatico'
      );
      if (response.Res) {
        await loadAgents(user.LOGIN);
        return true;
      }
      return false;
    } catch (err) {
      setError('Erro ao atualizar comportamento: ' + err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    // Existing values
    user,
    setUser,
    agents,
    setAgents,
    currentAgent,
    selectAgent,
    notifications,
    setNotifications,
    isLoading,
    setIsLoading,
    error,
    setError,
    login,
    logout,
    updateAgentBehavior,
    loadUserData,
    loadAgents,
    loadPlans,
    loadSubscription,
    planos,
    setPlanos,
    assinatura,
    setAssinatura,
    paymentHistory,
    setPaymentHistory,
    initializing,
    
    // New values
    conversations,
    setConversations,
    currentConversation,
    setCurrentConversation,
    messages,
    setMessages,
    products,
    setProducts,
    platformStatus,
    setPlatformStatus,
    
    // New functions
    loadConversations,
    loadMessages,
    sendMessage,
    loadProducts,
    checkPlatformStatus,
    connectPlatform,
    loadNotifications,
    loadInitialData
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};