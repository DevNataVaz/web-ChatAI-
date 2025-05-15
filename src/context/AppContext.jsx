import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services/socketService';
import { useNavigate } from 'react-router-dom';
import { Descriptografar, Criptografar } from '../Cripto';
import { toast } from 'react-toastify'; // Assuming you use react-toastify for notifications

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // State management
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
  const [planos, setPlanos] = useState([]);
  const [assinatura, setAssinatura] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [products, setProducts] = useState([]);
  const [platformStatus, setPlatformStatus] = useState({
    instagram: false,
    whatsapp: false
  });
  const [lastDataUpdate, setLastDataUpdate] = useState(Date.now());
  const [lastLoginTimestamp, setLastLoginTimestamp] = useState(null);

  // Refs to prevent stale closures in socket callbacks
  const userRef = useRef(null);
  const socketConnectedRef = useRef(false);
  const conversationsRef = useRef([]);
  
  // Navigation
  const navigate = useNavigate();

  // Update refs when state changes
  useEffect(() => {
    userRef.current = user;
    socketConnectedRef.current = socketConnected;
    conversationsRef.current = conversations;
  }, [user, socketConnected, conversations]);

  // Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    return user !== null;
  }, [user]);

  // Load user from localStorage with error handling
  const loadUserFromStorage = useCallback(() => {
    try {
      const savedUser = localStorage.getItem('animusia_user');
      if (!savedUser) return null;

       if (typeof savedUser !== 'string' || savedUser.trim() === '') {
      localStorage.removeItem('animusia_user');
      return null;
    }

      const decrypted = Descriptografar(savedUser);
      return JSON.parse(decrypted);
    } catch (err) {
      // console.error('Error loading user from localStorage:', err);
      // Clear potentially corrupted data
      localStorage.removeItem('animusia_user');
      return null;
    }
  }, []);

  // Initialize socket connection with improved error handling
  const initializeSocket = useCallback(() => {
    try {
      // Connect socket
      const socket = socketService.connect();
      
      // Setup global listeners that should persist
      socketService.on('connect', () => {
        // console.log('Socket connected');
        setSocketConnected(true);
        
        // Reconnect logic - reload essential data when reconnected
        const currentUser = userRef.current;
        if (currentUser?.LOGIN) {
          loadInitialData(currentUser.LOGIN).catch(err => {
            // console.error('Failed to reload data after reconnection:', err);
          });
        }
      });

      socketService.on('connect_error', (error) => {
        // console.error('Socket connection error:', error);
        setError(`Connection error: ${error.message}`);
        setSocketConnected(false);
      });

      socketService.on('disconnect', (reason) => {
        // console.log(`Socket disconnected: ${reason}`);
        setSocketConnected(false);
        
        // Auto-reconnect for certain disconnect reasons
        if (reason === 'io server disconnect') {
          // Server disconnected explicitly - try to reconnect
          setTimeout(() => {
            socketService.connect();
          }, 3000);
        }
      });
      
      // Setup message listeners
      setupMessageListeners();
      
      return socket;
    } catch (err) {
      // console.error('Socket initialization error:', err);
      setError(`Failed to initialize connection: ${err.message}`);
      return null;
    }
  }, []);

  // Setup message listeners with improved error handling
  const setupMessageListeners = useCallback(() => {
    socketService.on('ResponseUpdateMensagens', (data) => {
      try {
        if (!data) return;
        const decrypted = JSON.parse(Descriptografar(data));
        if (decrypted.Ativador && userRef.current?.LOGIN) {
          loadConversations(userRef.current.LOGIN);
        }
      } catch (err) {
        // console.error('Error processing message update:', err);
      }
    });
    
    socketService.on('ResponseNovaConversa', (data) => {
      try {
        if (!data) return;
        const decrypted = JSON.parse(Descriptografar(data));
        if (decrypted.GetAtualizar && decrypted.GetAtualizar.length > 0) {
          setConversations(prev => {
            // Only add conversations that don't already exist
            const currentIds = new Set(prev.map(c => c.ID));
            const newConversations = decrypted.GetAtualizar.filter(c => !currentIds.has(c.ID));
            
            if (newConversations.length > 0) {
              // Sort by date, most recent first
              return [...newConversations, ...prev].sort((a, b) => {
                const dateA = new Date(`${a.DATA} ${a.HORAS}`);
                const dateB = new Date(`${b.DATA} ${b.HORAS}`);
                return dateB - dateA;
              });
            }
            return prev;
          });
          
        
         
        }
      } catch (err) {
        // console.error('Error processing new conversation:', err);
      }
    });
  }, []);

  // Initialize the application with improved error handling
  useEffect(() => {
    const init = async () => {
      try {
        // Connect socket first
        initializeSocket();
        
        // Try to load user from localStorage
        const savedUser = loadUserFromStorage();
        
        if (savedUser) {
          setUser(savedUser);
        }
      } catch (err) {
        // console.error('Error initializing app:', err);
        localStorage.removeItem('animusia_user');
        setError(`Initialization error: ${err.message}`);
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

  // Load user data after login with retry mechanism
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    
    const loadData = async () => {
      if (user?.LOGIN && socketConnected) {
        try {
          await loadInitialData(user.LOGIN);
        } catch (err) {
          // console.error(`Failed to load user data (attempt ${retryCount + 1}/${maxRetries}):`, err);
          if (retryCount < maxRetries) {
            retryCount++;
            // Exponential backoff
            const delay = Math.pow(2, retryCount) * 1000;
            setTimeout(loadData, delay);
          } else {
            setError('Failed to load your data after multiple attempts. Please refresh the page.');
          }
        }
      }
    };
    
    loadData();
  }, [user?.LOGIN, socketConnected]);

  // Load all initial data in sequence to avoid race conditions
  const loadInitialData = useCallback(async (login) => {
    if (!socketConnected) {
      // console.log('Socket not connected, waiting...');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Load data in sequence to avoid race conditions
      await loadUserData(login);
      await loadAgents(login);
      await loadNotifications(login);
      await loadConversations(login);
      await loadSubscription(login);
      
      // Check if we have a current agent to load platform status
      const currentAgentData = agents[0]; // Default to first agent if none selected
      if (currentAgentData) {
        await checkPlatformStatus(currentAgentData.PROTOCOLO);
      }setLastDataUpdate(Date.now());
    } catch (err) {
      // console.error('Error loading initial data:', err);
      setError('Falha ao carregar dados iniciais. Por favor tente novamente.');
      throw err; // Rethrow for retry mechanism
    } finally {
      setIsLoading(false);
    }
  }, [socketConnected]);

  const forceDataUpdate = useCallback(() => {
  if (user?.LOGIN) {
    return loadInitialData(user.LOGIN);
  }
  return Promise.resolve();
}, [user, loadInitialData]);

  // Load notifications with caching mechanism
  const loadNotifications = useCallback(async (login) => {
    if (!socketConnected) return;
    
    try {
      const notificationsData = await socketService.getNotifications(login);
      if (notificationsData && notificationsData.resultado) {
        // Sort notifications by date, newest first
        const sortedNotifications = [...notificationsData.resultado].sort((a, b) => {
          const dateA = new Date(`${a.DATA} ${a.HORA}`);
          const dateB = new Date(`${b.DATA} ${b.HORA}`);
          return dateB - dateA;
        });
        
        setNotifications(sortedNotifications);
      }
    } catch (err) {
      // console.error('Error loading notifications:', err);
      // Don't set global error for this non-critical feature
    }
  }, [socketConnected]);

  // Load user profile data
  const loadUserData = useCallback(async (login) => {
    if (!socketConnected) return;
    
    try {
      setIsLoading(true);
      const profile = await socketService.getUserProfile(login);
      if (profile) {
        // Merge profile data with current user
        setUser(prevUser => ({
          ...prevUser,
          ...profile
        }));
        
        // Save updated user to localStorage
        try {
          const encrypted = Criptografar(JSON.stringify({
            ...userRef.current,
            ...profile
          }));
          localStorage.setItem('animusia_user', encrypted);
        } catch (storageErr) {
          // console.error('Error saving updated user to localStorage:', storageErr);
        }
      }
    } catch (err) {
      // console.error('Error loading profile:', err);
      throw err; // Rethrow for retry mechanism
    } finally {
      setIsLoading(false);
    }
  }, [socketConnected]);

  // Load user's agents
  const loadAgents = useCallback(async (login) => {
    if (!socketConnected) return;
    
    try {
      const agentsData = await socketService.getMyAgents(login);
      if (agentsData && agentsData.Dados) {
        setAgents(agentsData.Dados || []);
        if (agentsData.Dados.length > 0 && !currentAgent) {
          setCurrentAgent(agentsData.Dados[0]);
        }
      }
    } catch (err) {
      // console.error('Error loading agents:', err);
      throw err; // Rethrow for retry mechanism
    }
  }, [socketConnected, currentAgent]);

  // Load available plans
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
        const processedPlans = response.Resultado.map(plan => ({
          ...plan,
          destaque: plan.ID === 3 // Highlight plan with ID 3
        }));

        setPlanos(processedPlans);
        return {
          Id_Assinatura: response.Id_Assinatura,
          Plano_atual: response.Plano_atual
        };
      }
      return null;
    } catch (err) {
      // console.error('Error loading plans:', err);
      setError('Failed to load plans');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [socketConnected]);

  // Load user subscription
  const loadSubscription = useCallback(async (login) => {
    if (!socketConnected) return null;
    
    try {
      const subscriptionData = await socketService.getFaturas(login);
      if (subscriptionData) {
        setAssinatura(subscriptionData);
        return subscriptionData;
      }
      return null;
    } catch (err) {
      // console.error('Error loading subscription:', err);
      return null;
    }
  }, [socketConnected]);

  // Refresh subscription info
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
      // console.error('Error updating subscription info:', err);
      setError('Failed to update subscription information');
      setIsLoading(false);
      return Promise.resolve(null);
    }
  }, [user, socketConnected, loadSubscription]);

  // Load conversations with pagination
  const loadConversations = useCallback(async (login, count = 10) => {
    if (!socketConnected) return;
    
    try {
      setIsLoading(true);
      const data = await socketService.getConversations(login, count);
      if (data && data.Conversa) {
        // Sort by date, newest first
        const sortedConversations = [...data.Conversa].sort((a, b) => {
          const dateA = new Date(`${a.DATA} ${a.HORAS}`);
          const dateB = new Date(`${b.DATA} ${b.HORAS}`);
          return dateB - dateA;
        });
        
        setConversations(sortedConversations);
      }
    } catch (err) {
      // console.error('Error loading conversations:', err);
      toast.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [socketConnected]);
  
  // Load messages for a conversation
  const loadMessages = useCallback(async (protocolo, count = 15) => {
    if (!socketConnected) return;
    
    try {
      setIsLoading(true);
      const data = await socketService.getMessages(protocolo, count);
      if (data && data.Dados) {
        // Sort messages by timestamp (oldest first for chat display)
        const sortedMessages = [...data.Dados].sort((a, b) => {
          const dateA = new Date(`${a.DATA} ${a.HORA}`);
          const dateB = new Date(`${b.DATA} ${b.HORA}`);
          return dateA - dateB;
        });
        
        setMessages(sortedMessages);
      }
    } catch (err) {
      // console.error('Error loading messages:', err);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [socketConnected]);
  
  // Send a message
  const sendMessage = useCallback(async (protocolo, message, botProtocolo, plataforma) => {
    if (!socketConnected || !user || !botProtocolo) {
      toast.error('You need to be connected to send messages');
      return false;
    }
    
    try {
      setIsLoading(true);
      const result = await socketService.sendMessage(
        protocolo,
        message,
        user.LOGIN,
        botProtocolo,
        plataforma
      );
      
      // If successful, reload messages to show the new message
      await loadMessages(protocolo);
      return true;
    } catch (err) {
      // console.error('Error sending message:', err);
      setError('Failed to send message');
      toast.error('Message could not be sent. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [socketConnected, user, loadMessages]);
  
  // Load products for an agent
  const loadProducts = useCallback(async (login, protocolo) => {
    if (!socketConnected) return;
    
    try {
      setIsLoading(true);
      const data = await socketService.getProducts(login, protocolo);
      if (data && data.Response && data.Response.code) {
        setProducts(data.Response.mensagem || []);
      }
    } catch (err) {
      // console.error('Error loading products:', err);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [socketConnected]);

  // Check platform connection status
  const checkPlatformStatus = useCallback(async (identificador) => {
    if (!socketConnected || !identificador) return;
    
    try {
      const instagramStatus = await socketService.checkPlatformStatus(identificador, 'instagram');
      const whatsappStatus = await socketService.checkPlatformStatus(identificador, 'whatsapp');
      
      setPlatformStatus({
        instagram: instagramStatus && instagramStatus.Dados === true,
        whatsapp: whatsappStatus && whatsappStatus.Dados === true
      });
    } catch (err) {
      // console.error('Error checking platform status:', err);
    }
  }, [socketConnected]);
  
  // Connect to a platform (Instagram, WhatsApp)
  const connectPlatform = useCallback(async (platform) => {
    if (!socketConnected || !user || !currentAgent) {
      toast.error('You need to be connected and have an agent selected');
      return false;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await socketService.connectPlatform(
        user.LOGIN,
        currentAgent.PROTOCOLO,
        platform
      );
      
      // Refresh status after connection attempt
      await checkPlatformStatus(currentAgent.PROTOCOLO);
      
      if (result && result.Code) {
        toast.success(`Connected to ${platform} successfully`);
        return true;
      } else {
        toast.warning('Connection may not have been successful');
        return false;
      }
    } catch (err) {
      // console.error(`Error connecting to ${platform}:`, err);
      setError(`Failed to connect to ${platform}`);
      toast.error(`Could not connect to ${platform}. Please try again.`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [socketConnected, user, currentAgent, checkPlatformStatus]);

  // Enhanced login with validation
  const login = useCallback((userData) => {
    if (!userData || !userData.LOGIN) {
      // console.error('Invalid user data for login');
      return false;
    }
    
    setUser(userData);
    setLastLoginTimestamp(Date.now());
    
    // Save to localStorage
    try {
      const encrypted = Criptografar(JSON.stringify(userData));
      localStorage.setItem('animusia_user', encrypted);
      return true;
    } catch (err) {
      // console.error('Error saving user to localStorage:', err);
      return false;
    }
  }, []);

  // Enhanced logout
  const logout = useCallback(() => {
    // Clear all state
    setUser(null);
    setAgents([]);
    setCurrentAgent(null);
    setNotifications([]);
    setPlanos([]);
    setAssinatura(null);
    setPaymentHistory([]);
    setConversations([]);
    setCurrentConversation(null);
    setMessages([]);
    setProducts([]);
    
    // Clear localStorage
    localStorage.removeItem('animusia_user');
    
    // forçar volta pra tela de login
    window.location.href = '/login';

    // navigate('/login');
  }, [navigate]);

  // Select an agent
  const selectAgent = useCallback((agent) => {
    setCurrentAgent(agent);
    
    // Check platform status when changing agent
    if (agent && agent.PROTOCOLO) {
      checkPlatformStatus(agent.PROTOCOLO);
    }
  }, [checkPlatformStatus]);

  // Update agent behavior
  const updateAgentBehavior = useCallback(async (behaviorText, settings) => {
    if (!socketConnected || !currentAgent || !user) {
      toast.error('You need to be connected and have an agent selected');
      return false;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const questions = [{ Pergunta: 'Comportamento', Resposta: behaviorText }];
      const response = await socketService.saveBehavior(
        currentAgent.EMPRESA,
        currentAgent.ATENDENTE,
        currentAgent.PROTOCOLO,
        user.LOGIN,
        currentAgent.REDE,
        currentAgent.OBJETIVO,
        questions,
        settings.gatilho || 'automatico'
      );
      
      if (response && response.Res) {
        await loadAgents(user.LOGIN);
        toast.success('Agent behavior updated successfully');
        return true;
      }
      
      toast.warning('Behavior may not have been updated');
      return false;
    } catch (err) {
      const errorMessage = 'Error updating behavior: ' + (err.message || 'Unknown error');
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [socketConnected, currentAgent, user, loadAgents]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (protocolo) => {
    if (!socketConnected || !protocolo) return false;
    
    try {
      await socketService.updateMessageRead(protocolo);
      return true;
    } catch (err) {
      // console.error('Error marking messages as read:', err);
      return false;
    }
  }, [socketConnected]);

  // Delete a conversation
  const deleteConversation = useCallback(async (protocolo) => {
    if (!socketConnected || !protocolo) {
      toast.error('Cannot delete conversation at this time');
      return false;
    }
    
    try {
      setIsLoading(true);
      const result = await socketService.deleteConversation(protocolo);
      
      if (result) {
        // Update local state to remove the deleted conversation
        setConversations(prevConversations => 
          prevConversations.filter(conv => conv.PROTOCOLO_CONVERSA !== protocolo)
        );
        
        // If the current conversation was deleted, clear it
        if (currentConversation && currentConversation.PROTOCOLO_CONVERSA === protocolo) {
          setCurrentConversation(null);
          setMessages([]);
        }
        
        toast.success('Conversation deleted successfully');
        return true;
      }
      
      return false;
    } catch (err) {
      // console.error('Error deleting conversation:', err);
      toast.error('Failed to delete conversation');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [socketConnected, currentConversation]);

  // API key management
  const saveApiKey = useCallback(async (apiData) => {
    if (!socketConnected || !user) return false;
    
    try {
      setIsLoading(true);
      const result = await socketService.saveApiKey(apiData);
      
      if (result && result.Estado) {
        toast.success('API key saved successfully');
        return true;
      }
      
      toast.warning('API key may not have been saved');
      return false;
    } catch (err) {
      // console.error('Error saving API key:', err);
      toast.error('Failed to save API key');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [socketConnected, user]);

  const loadApiKeys = useCallback(async () => {
    if (!socketConnected || !user) return [];
    
    try {
      setIsLoading(true);
      return await socketService.getApiKeys(user.LOGIN);
    } catch (err) {
      // console.error('Error loading API keys:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [socketConnected, user]);

  // Context value
  const value = {
    // Auth
    isAuthenticated,
    socketConnected,
    
    // User and data
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
    
    // Subscription and plans
    planos,
    setPlanos,
    assinatura,
    setAssinatura,
    paymentHistory,
    setPaymentHistory,
    initializing,
    
    // Conversations and messages
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
    
    // Core actions
    login,
    logout,
    
    // Data loading
    loadUserData,
    loadAgents,
    loadPlans,
    loadSubscription,
    refreshSubscriptionInfo,
    loadConversations,
    loadMessages,
    loadProducts,
    loadNotifications,
    loadInitialData,
    loadApiKeys,
    
    // Actions
    sendMessage,
    checkPlatformStatus,
    connectPlatform,
    updateAgentBehavior,
    markMessagesAsRead,
    deleteConversation,
    saveApiKey,
    lastDataUpdate,
    forceDataUpdate,
    lastLoginTimestamp
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};