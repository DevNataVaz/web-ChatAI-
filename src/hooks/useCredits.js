import { useState, useEffect, useRef } from 'react';
import { socketService } from '../services/socketService';
import { useApp } from '../context/AppContext';
import { Criptografar, Descriptografar } from '../Cripto';

export const useCredits = () => {
  const [messageUsage, setMessageUsage] = useState({ atual: 0, limite: 1 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const messageUsageRef = useRef({ atual: 0, limite: 1 });
  
  // Obtenha o contexto da aplicação
  const { user, socketConnected, lastLoginTimestamp } = useApp();
  
  const fetchMessages = () => {
    if (!user || !socketConnected) return;
    
    try {
      setIsLoading(true);
      
      // Remover listeners antigos para evitar duplicações
      socketService.socket.off('ResponsegetFaturas');
      
      // Configurar novo listener para a resposta
      socketService.socket.once('ResponsegetFaturas', (dados) => {
        try {
          console.log('Resposta recebida para getFaturas');
          
          if (!dados || !dados.Dados) {
            console.error('Dados inválidos recebidos:', dados);
            setIsLoading(false);
            return;
          }
          
          const DADOS = JSON.parse(Descriptografar(dados.Dados));
          console.log('Dados de fatura decodificados:', DADOS);
          
          if (DADOS && 
              typeof DADOS.ATUAL_MENSAGENS !== 'undefined' && 
              typeof DADOS.LIMITE_MENSAGEM !== 'undefined') {
            
            const atual = Number(DADOS.ATUAL_MENSAGENS) || 0;
            const limite = Number(DADOS.LIMITE_MENSAGEM) || 1;
            
            setMessageUsage({ atual, limite });
            messageUsageRef.current = { atual, limite };
            setLastUpdated(new Date());
            setError(null);
            
            console.log(`Uso de mensagens atualizado: ${atual}/${limite}`);
          }
        } catch (err) {
          console.error('Erro ao processar resposta:', err);
        } finally {
          setIsLoading(false);
        }
      });
      
      // Preparar dados para enviar
      const userData = user.LOGIN || user.login;
      console.log('Enviando solicitação getFaturas com login:', userData);
      
      // Emitir evento (usando abordagem direta como no mobile)
      socketService.socket.emit('getFaturas', {
        Dados: Criptografar(JSON.stringify(userData))
      });
      
      // Configurar timeout mais curto (10 segundos)
      setTimeout(() => {
        if (isLoading) {
          console.log('Timeout na solicitação getFaturas, usando valores em cache');
          setIsLoading(false);
        }
      }, 10000);
      
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err);
      setIsLoading(false);
    }
  };
  
  // Efeito para inicializar e atualizar os dados periodicamente
  useEffect(() => {
    if (user && socketConnected) {
      console.log('Iniciando busca de dados de mensagens');
      
      fetchMessages();
      
      const interval = setInterval(() => {
        // Só buscar novamente se não estiver já carregando
        if (!isLoading) {
          fetchMessages();
        }
      }, 15000);
      
      // Limpar na desmontagem
      return () => {
        clearInterval(interval);
        socketService.socket.off('ResponsegetFaturas');
      };
    }
  }, [user, socketConnected]);
  
  // Efeito especial que reage ao login recente
  useEffect(() => {
    if (lastLoginTimestamp && user && socketConnected) {
      console.log('Login recente detectado, atualizando créditos imediatamente');
      fetchMessages();
    }
  }, [lastLoginTimestamp, user, socketConnected]);
  
  // Calcular a porcentagem de uso com proteção contra valores inválidos
  const getUsagePercentage = () => {
    const { atual, limite } = messageUsageRef.current;
    
    if (!limite) return 0;
    
    const remaining = limite - atual;
    const percentage = (remaining / limite * 100);
    
    // Garantir que a porcentagem esteja entre 0 e 100
    return Math.max(0, Math.min(100, percentage));
  };
  
  return {
    current: messageUsage.atual,
    total: messageUsage.limite,
    percentage: getUsagePercentage(),
    isLoading,
    error,
    lastUpdated,
    refresh: fetchMessages  // Expor função para permitir refresh manual
  };
};