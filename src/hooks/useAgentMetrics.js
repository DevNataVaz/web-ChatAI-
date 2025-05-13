import { useState, useEffect } from 'react';
import { socketService } from '../services/socketService';
import { useApp } from '../context/AppContext';

export const useAgentMetrics = () => {
  const [metrics, setMetrics] = useState({
    messages: 0,
    satisfaction: 0,
    errorRate: 0,
    conversions: 12
  });
  const [isLoading, setIsLoading] = useState(true);
  const { currentAgent, user } = useApp();

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!currentAgent || !user) return;
      
      try {
        setIsLoading(true);
        
        // This would be from your existing API calls
        const agendamentos = await socketService.getAgendamentos(new Date(), user.LOGIN);
        const sales = await socketService.getSales(user.LOGIN);
        
        // Calculate metrics from the data
        setMetrics({
          messages: 570, // This would come from your API
          satisfaction: 93,
          errorRate: 2.3,
          conversions: sales.vendas?.length || 0
        });
        
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [currentAgent, user]);

  return { metrics, isLoading };
};

