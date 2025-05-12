import { useState, useEffect } from 'react';
import { socketService } from '../services/socketService';
import { useApp } from '../context/AppContext';


export const useCredits = () => {
    const [credits, setCredits] = useState({ current: 0, total: 0});
    const { user } = useApp();
  
    // No arquivo useCredits.js ou no serviço que faz a solicitação de créditos
// Aumente o timeout para 30 segundos e adicione lógica de retry

// Se estiver usando socketService:
async function fetchCredits() {
  try {
    const result = await socketService.requestWithRetry(
      'GetCredits', 
      'ResponseCredits', 
      data,
      3,  // Número de tentativas
      30000  // Timeout de 30 segundos
    );
    return result;
  } catch (error) {
    console.error('Erro ao buscar créditos, tentando alternativa:', error);
    // Implementar uma abordagem alternativa se possível
    return null;
  }
}
  
    return credits;
  };