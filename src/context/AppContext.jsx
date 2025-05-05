import React, { createContext, useState, useContext, useEffect } from 'react';
import { socketService } from '../services/socketService';
import { Descriptografar } from '../Cripto';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  // Novos estados para gerenciamento de pagamentos
  const [planos, setPlanos] = useState([]);
  const [assinatura, setAssinatura] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);

  useEffect(() => {
    // Conectar socket apenas quando necessário
    const socket = socketService.connect();
    
    socket.on('connect', () => {
      console.log('Socket conectado');
      checkUserFromStorage();
      setInitializing(false); 
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  const checkUserFromStorage = () => {
    const savedUser = localStorage.getItem('animusia_user');
    if (savedUser) {
      try {
        const decrypted = Descriptografar(savedUser);
        const userData = JSON.parse(decrypted);
        setUser(userData);
      } catch (err) {
        console.error('Erro ao carregar usuário do localStorage:', err);
        localStorage.removeItem('animusia_user');
      }
    }
  };

  // Funções de carregamento de dados separadas
  const loadUserData = async (login) => {
    try {
      setIsLoading(true);
      const profile = await socketService.getUserProfile(login);
      if (profile) setUser(prev => ({ ...prev, ...profile }));
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
      const plansData = await socketService.getPlanos(login);
      setPlanos(plansData.Dados || []);
    } catch (err) {
      console.error('Erro ao carregar planos:', err);
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

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('animusia_user', JSON.stringify(userData));
    // Carregar apenas dados essenciais após login
    if (userData.LOGIN) {
      loadUserData(userData.LOGIN);
    }
  };

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
    // Funções de carregamento sob demanda
    loadUserData,
    loadAgents,
    loadPlans,
    loadSubscription,
    // Novos valores para pagamentos
    planos,
    setPlanos,
    assinatura,
    setAssinatura,
    paymentHistory,
    setPaymentHistory,
    initializing  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};