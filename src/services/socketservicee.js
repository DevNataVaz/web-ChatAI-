// context/AppContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { socketService } from '../services/socketService';
import { Criptografar, Descriptografar } from '../Cripto';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const initializeApp = async () => {
      try {
        setIsConnecting(true);
        
        // Tentar conectar ao socket
        const socket = socketService.connect('http://localhost:3000');
        
        // Esperar pela conexão
        const waitForConnection = new Promise((resolve, reject) => {
          let attempts = 0;
          const maxAttempts = 5;
          
          const checkConnection = () => {
            if (socket.connected) {
              resolve();
            } else if (attempts >= maxAttempts) {
              reject(new Error('Failed to connect to server'));
            } else {
              attempts++;
              setTimeout(checkConnection, 1000);
            }
          };
          
          // Começar verificação imediatamente
          checkConnection();
          
          // Também escutar o evento de conexão
          socket.once('connect', () => resolve());
          socket.once('connect_error', () => reject(new Error('Connection error')));
        });
        
        try {
          await waitForConnection;
          
          if (mounted) {
            setIsConnecting(false);
            console.log('Socket conectado com sucesso');
            
            // Recuperar dados do usuário do localStorage
            const savedUser = localStorage.getItem('animusia_user');
            if (savedUser) {
              const userData = JSON.parse(savedUser);
              setUser(userData);
              if (userData.LOGIN) {
                await initializeData(userData.LOGIN);
              } else {
                setIsLoading(false);
              }
            } else {
              setIsLoading(false);
            }
          }
        } catch (connectionError) {
          console.error('Erro ao conectar:', connectionError);
          if (mounted) {
            setError('Erro ao conectar ao servidor. Verifique sua conexão.');
            setIsConnecting(false);
            setIsLoading(false);
          }
        }
        
      } catch (error) {
        console.error('Erro na inicialização:', error);
        if (mounted) {
          setError('Erro ao inicializar a aplicação');
          setIsConnecting(false);
          setIsLoading(false);
        }
      }
    };

    initializeApp();

    return () => {
      mounted = false;
      socketService.disconnect();
    };
  }, []);

  const initializeData = async (login) => {
    if (!login || isConnecting) return;
    
    try {
      setIsLoading(true);
      setError(null);

      const [profile, agentsData, notificationsData] = await Promise.all([
        socketService.getUserProfile(login).catch(err => {
          console.error('Error getting profile:', err);
          return {};
        }),
        socketService.getMyAgents(login).catch(err => {
          console.error('Error getting agents:', err);
          return { Dados: [] };
        }),
        socketService.getNotifications(login).catch(err => {
          console.error('Error getting notifications:', err);
          return { resultado: [] };
        })
      ]);

      if (profile) setUser(prev => ({ ...prev, ...profile }));
      setAgents(agentsData.Dados || []);
      setNotifications(notificationsData.resultado || []);
      if (agentsData.Dados && agentsData.Dados.length > 0) setCurrentAgent(agentsData.Dados[0]);
    } catch (err) {
      console.error('Initialization data error:', err);
      setError('Erro ao carregar dados: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setAgents([]);
    setCurrentAgent(null);
    setNotifications([]);
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
        await initializeData(user.LOGIN);
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
    logout,
    updateAgentBehavior,
    initializeData,
    refreshData: () => user?.LOGIN && initializeData(user.LOGIN),
    Criptografar,
    Descriptografar,
    socket: socketService.getSocket(),
    isConnecting
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};