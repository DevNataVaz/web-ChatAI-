import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { socketService } from '../services/socketService';
import { useNavigate } from 'react-router-dom';
import { Descriptografar, Criptografar } from '../Cripto';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [initializing, setInitializing] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
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

  // Verifica se usuário está autenticado
  const isAuthenticated = useCallback(() => {
    return user !== null;
  }, [user]);

  // Carrega usuário do localStorage
  const loadUserFromStorage = useCallback(() => {
    try {
      const savedUser = localStorage.getItem('animusia_user');
      if (!savedUser) return null;

      const decrypted = Descriptografar(savedUser);
      return JSON.parse(decrypted);
    } catch (err) {
      console.error('Erro ao carregar usuário do localStorage:', err);
      return null;
    }
  }, []);

  // Inicializa conexão de socket
  const initializeSocket = useCallback(() => {
    // Conectar socket
    const socket = socketService.connect();
    
    // Setup global listeners that should persist
    socketService.on('connect', () => {
      console.log('Socket connected');
      setSocketConnected(true);
    });

    socketService.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Erro de conexão com o servidor');
      setSocketConnected(false);
    });

    socketService.on('disconnect', () => {
      console.log('Socket disconnected');
      setSocketConnected(false);
    });
    
    // Setup message listeners
    setupMessageListeners();
  }, []);

  // Configurar listeners de mensagens
  const setupMessageListeners = useCallback(() => {
    socketService.on('ResponseUpdateMensagens', (data) => {
      try {
        const decrypted = JSON.parse(Descriptografar(data));
        if (decrypted.Ativador && user?.LOGIN) {
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
  }, [user]);

  // Inicializa a aplicação
  useEffect(() => {
    const init = async () => {
      try {
        // Conectar socket primeiro
        initializeSocket();
        
        // Tentar carregar usuário do localStorage
        const savedUser = loadUserFromStorage();
        
        if (savedUser) {
          setUser(savedUser);
        }
      } catch (err) {
        console.error('Error initializing app:', err);
      } finally {
        setInitializing(false);
      }
    };
    
    init();
    
    // Cleanup function
    return () => {
      socketService.off('ResponseUpdateMensagens');
      socketService.off('ResponseNovaConversa');
    };
  }, [initializeSocket, loadUserFromStorage]);

  // Carrega dados do usuário após login
  useEffect(() => {
    if (user?.LOGIN && socketConnected) {
      loadUserData(user.LOGIN).catch(err => {
        console.error('Failed to load user data:', err);
      });
    }
  }, [user?.LOGIN, socketConnected]);

  const loadInitialData = useCallback(async (login) => {
    if (!socketConnected) {
      console.log('Socket not connected, waiting...');
      return;
    }
    
    try {
      setIsLoading(true);
      // Load data in sequence to avoid race conditions
      await loadUserData(login);
      await loadAgents(login);
      await loadNotifications(login);
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Erro ao carregar dados iniciais');
    } finally {
      setIsLoading(false);
    }
  }, [socketConnected]);

  const loadNotifications = useCallback(async (login) => {
    if (!socketConnected) return;
    
    try {
      const notificationsData = await socketService.getNotifications(login);
      if (notificationsData && notificationsData.resultado) {
        setNotifications(notificationsData.resultado);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  }, [socketConnected]);

  const loadUserData = useCallback(async (login) => {
    if (!socketConnected) return;
    
    try {
      setIsLoading(true);
      const profile = await socketService.getUserProfile(login);
      if (profile) {
        // Mesclar dados do perfil com o usuário atual
        setUser(prevUser => ({
          ...prevUser,
          ...profile
        }));
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    } finally {
      setIsLoading(false);
    }
  }, [socketConnected]);

  const loadAgents = useCallback(async (login) => {
    if (!socketConnected) return;
    
    try {
      const agentsData = await socketService.getMyAgents(login);
      if (agentsData && agentsData.Dados) {
        setAgents(agentsData.Dados || []);
        if (agentsData.Dados.length > 0) {
          setCurrentAgent(agentsData.Dados[0]);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar agentes:', err);
    }
  }, [socketConnected]);

  const loadPlans = useCallback(async (login) => {
    if (!socketConnected) return null;
    
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
  }, [socketConnected]);

  const loadSubscription = useCallback(async (login) => {
    if (!socketConnected) return null;
    
    try {
      const faturaData = await socketService.getFaturas(login);
      setAssinatura(faturaData);
    } catch (err) {
      console.error('Erro ao carregar assinatura:', err);
      return null
    }
  }, [socketConnected]);


const refreshSubscriptionInfo = useCallback(() => {
  if (!user || !socketConnected) return Promise.resolve(null);
  
  try {
    setIsLoading(true);
    if (user.LOGIN) {
      return loadSubscription(user.LOGIN)
      .finally(() => setIsLoading(false));
    }
    return Promise.resolve(null);
  } catch (err) {
    console.error('Erro ao atualizar informações da assinatura:', err);
    setError('Falha ao atualizar informações da assinatura');
    setIsLoading(false);
    return Promise.resolve(null);
  }
}, [user, socketConnected, loadSubscription]);



 

  const loadConversations = useCallback(async (login, count = 10) => {
    if (!socketConnected) return;
    
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
  }, [socketConnected]);
  
  const loadMessages = useCallback(async (protocolo, count = 15) => {
    if (!socketConnected) return;
    
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
  }, [socketConnected]);
  
  const sendMessage = useCallback(async (protocolo, message, botProtocolo, plataforma) => {
    if (!socketConnected || !user || !botProtocolo) return false;
    
    try {
      setIsLoading(true);
      const result = await socketService.sendMessage(
        protocolo,
        message,
        user.LOGIN,
        botProtocolo,
        plataforma
      );
      
      await loadMessages(protocolo);
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Erro ao enviar mensagem');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [socketConnected, user, loadMessages]);
  
  const loadProducts = useCallback(async (login, protocolo) => {
    if (!socketConnected) return;
    
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
  }, [socketConnected]);

  const checkPlatformStatus = useCallback(async (identificador) => {
    if (!socketConnected) return;
    
    try {
      const instagramStatus = await socketService.checkPlatformStatus(identificador, 'instagram');
      const whatsappStatus = await socketService.checkPlatformStatus(identificador, 'whatsapp');
      
      setPlatformStatus({
        instagram: instagramStatus && instagramStatus.Dados === true,
        whatsapp: whatsappStatus && whatsappStatus.Dados === true
      });
    } catch (err) {
      console.error('Error checking platform status:', err);
    }
  }, [socketConnected]);
  
  const connectPlatform = useCallback(async (platform) => {
    if (!socketConnected || !user || !currentAgent) return false;
    
    try {
      setIsLoading(true);
      const result = await socketService.connectPlatform(
        user.LOGIN,
        currentAgent.PROTOCOLO,
        platform
      );
      
      await checkPlatformStatus(currentAgent.PROTOCOLO);
      return true;
    } catch (err) {
      console.error(`Error connecting to ${platform}:`, err);
      setError(`Erro ao conectar ao ${platform}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [socketConnected, user, currentAgent, checkPlatformStatus]);

  // Login simplificado e robusto
  const login = useCallback((userData) => {
    setUser(userData);
    
    // Salvar no localStorage
    try {
      const encrypted = Criptografar(JSON.stringify(userData));
      localStorage.setItem('animusia_user', encrypted);
    } catch (err) {
      console.error('Erro ao salvar usuário no localStorage:', err);
    }
  }, []);

  // Logout simplificado
  const logout = useCallback(() => {
    setUser(null);
    setAgents([]);
    setCurrentAgent(null);
    setNotifications([]);
    setPlanos([]);
    setAssinatura(null);
    setPaymentHistory([]);
    
    localStorage.removeItem('animusia_user');
    
    // Não desconectar o socket, apenas redirecionar
    navigate('/login');
  }, [navigate]);

  const selectAgent = useCallback((agent) => {
    setCurrentAgent(agent);
  }, []);

  const updateAgentBehavior = useCallback(async (behaviorText, settings) => {
    if (!socketConnected || !currentAgent || !user) return false;
    
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
  }, [socketConnected, currentAgent, user, loadAgents]);

  const value = {
    // Auth related
    isAuthenticated,
    socketConnected,
    
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
    refreshSubscriptionInfo,
    
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