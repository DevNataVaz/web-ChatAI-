import { useState, useEffect } from 'react';
import { socketService } from '../services/socketService';
import { useApp } from '../context/AppContext';


export const useCredits = () => {
    const [credits, setCredits] = useState({ current: 0, total: 0 });
    const { user } = useApp();
  
    useEffect(() => {
      const fetchCredits = async () => {
        if (!user) return;
        
        try {
          // Fetch current credits from database
          const faturas = await socketService.requestData(
            'getFaturas',
            'ResponsegetFaturas',
            { Dados: user.LOGIN }
          );
          
          setCredits({
            current: faturas.ATUAL_MENSAGENS,
            total: faturas.LIMITE_MENSAGEM
          });
        } catch (error) {
          console.error('Error fetching credits:', error);
        }
      };
  
      fetchCredits();
    }, [user]);
  
    return credits;
  };