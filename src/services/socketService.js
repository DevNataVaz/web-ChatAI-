import io from 'socket.io-client';
import { Criptografar, Descriptografar } from '../Cripto/index';
import Variaveis from '../../Variaveis.json'


// const socket = io(`${Variaveis.TESTE}`, {
//     transports: ['websocket'],
//     withCredentials: true,
//     extraHeaders: {
//       "my-custom-header": "value"
//     }
//   });
  
  
//   socket.on('connect', () => {
//     console.log('coneectou', socket.id);
//   });
  
//   socket.on('connect_error', (err) => {
//     console.error('Erro na conexão com o WebSocket:', err);
//   });


class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

 connect(url = Variaveis.TESTE) { 
    if (!this.socket) {
      this.socket = io(url, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        withCredentials: true
      });
      this.setupListeners();
      
      this.socket.on('connect', () => {
        console.log('socket conectado com dashboard');
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.error('Socket not connected');
    }
  }

  
  once(event, callback) {
    if (this.socket && this.socket.connected) {
      this.socket.once(event, callback);
    } else {
      console.error('Socket not connected');
    }
  }
  

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  setupListeners() {
    if (this.socket) {
      for (const [event, callbacks] of this.listeners) {
        for (const callback of callbacks) {
          this.socket.on(event, callback);
        }
      }
    }
  }

  // Helper methods for common operations
  async requestData(emitEvent, responseEvent, data) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 30000);

      const handleResponse = (response) => {
        clearTimeout(timeout);
        this.off(responseEvent, handleResponse);
        try {
          if (typeof response === 'string') {
            const decrypted = Descriptografar(response);
            resolve(decrypted);
          } else {
            resolve(response);
          }
        } catch (error) {
          reject(error);
        }
      };

      this.on(responseEvent, handleResponse);
      this.emit(emitEvent, Criptografar(JSON.stringify(data)));
    });
  }

  // Specific API calls
  async getMyAgents(login) {
    const data = { Code: '234645423654423465', Login: login };
    return this.requestData('MeusRobos', 'MeusRobosResponse', data);
  }

  async getUserProfile(login) {
    const data = { Login: login };
    return this.requestData('GetPerfil', 'responseGetPerfil', data);
  }

  async getAgendamentos(data, login) {
    const reqData = { Data: data, Login: login };
    return this.requestData('getAgendamento', 'ResponseGetAgendamento', reqData);
  }

  async getSales(login) {
    const data = { login: login };
    return this.requestData('obterVendas', 'retornoVendas', data);
  }

  async getNotifications(login) {
    const data = { Login: login, Code: '234653244623544265344' };
    return this.requestData('GetNotification', 'responseGetNotification', data);
  }

  async getPaymentHistory(login) {
    const data = { Login: login };
    return this.requestData('HistoricoPagamentos', 'responseHistoricoPagamentos', data);
  }

  async saveBehavior(empresa, atendente, protocolo, login, redes, objetivo, perguntas, gatilho) {
    const data = {
      Code: '658467658467865671',
      Empresa: empresa,
      Atendente: atendente,
      Protocolo: protocolo,
      Login: login,
      Redes: redes,
      Objetivo: objetivo,
      Perguntas: perguntas,
      Gatilho: gatilho
    };
    
    for (const [key, value] of Object.entries(data)) {
      if (key !== 'Code') {
        data[key] = Criptografar(value);
      }
    }
    
    return this.requestData('CriarBot', 'RespostaDaCriação', data);
  }

  async getPlanos(login) {
    const data = { Dados: login };
    return this.requestData('GetPlanos', 'ResponseHandlerPlanos', data);
  }

  async createPixPayment(data) {
    return this.requestData('PagamentosPix', 'ResponsePagamentosPix', data);
  }

  async verifyPixPayment(data) {
    return this.requestData('VerificaPix', 'ResponseVerificaPix', data);
  }

  async createCardPayment(data) {
    return this.requestData('PagamentosCard', 'ResponsePagamentosCard', data);
  }

  async getFaturas(login) {
    const data = { Dados: login };
    return this.requestData('getFaturas', 'ResponsegetFaturas', data);
  }

  async updateMensagens(data) {
    return this.requestData('GetAddMensagens', 'ResponseGetAddMensagens', data);
  }

}

export const socketService = new SocketService();
export default SocketService;