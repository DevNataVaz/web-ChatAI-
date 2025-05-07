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
  async requestData(emitEvent, responseEvent, data, timeoutDuration = 15000) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.off(responseEvent, handleResponse);
        reject(new Error(`Request timeout after ${timeoutDuration/1000} seconds`));
      }, timeoutDuration);
  
      const handleResponse = (response) => {
        clearTimeout(timeout);
        this.off(responseEvent, handleResponse);
        try {
          // Handle different response formats
          if (typeof response === 'string') {
            try {
              // First try to decrypt
              const decrypted = Descriptografar(response);
              if (decrypted) {
                try {
                  // Then try to parse as JSON
                  resolve(JSON.parse(decrypted));
                } catch (jsonError) {
                  // If not valid JSON, return as string
                  resolve(decrypted);
                }
              } else {
                resolve(response);
              }
            } catch (decryptError) {
              // If decryption fails, try direct JSON parsing
              try {
                resolve(JSON.parse(response));
              } catch (jsonError) {
                // If not valid JSON, return as string
                resolve(response);
              }
            }
          } else if (response && response.Code !== undefined) {
            // Handle object with encrypted fields
            const result = {};
            for (const [key, value] of Object.entries(response)) {
              if (typeof value === 'string') {
                try {
                  const decrypted = Descriptografar(value);
                  try {
                    result[key] = JSON.parse(decrypted);
                  } catch (e) {
                    result[key] = decrypted;
                  }
                } catch (e) {
                  result[key] = value;
                }
              } else {
                result[key] = value;
              }
            }
            resolve(result);
          } else {
            // Direct object return
            resolve(response);
          }
        } catch (error) {
          console.error('Error processing response:', error);
          reject(error);
        }
      };
  
      this.on(responseEvent, handleResponse);
      
      // Encrypt data if it's not already encrypted
      let encryptedData;
      if (typeof data === 'string') {
        try {
          // Check if already encrypted
          Descriptografar(data);
          encryptedData = data; // Already encrypted
        } catch (e) {
          // Not encrypted, so encrypt it
          encryptedData = Criptografar(data);
        }
      } else if (typeof data === 'object') {
        encryptedData = Criptografar(JSON.stringify(data));
      } else {
        encryptedData = data;
      }
      
      this.emit(emitEvent, encryptedData);
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

  // Missing event handlers for critical functionality
  async sendMessage(protocolo, mensagem, login, botProtocolo, plataforma) {
    const data = {
      Code: '32564436525443565434',
      Protocolo: protocolo,
      Mensagem: mensagem,
      Login: login,
      Bot_Protocolo: botProtocolo,
      Plataforma: plataforma
    };
    return this.requestData('EnviarMensagem', 'ResponseEnviarMensagem', data);
  }

  async getConversations(login, contador) {
    const data = {
      Code: '65466556476567545665745',
      login: login,
      contador: contador
    };
    return this.requestData('ReceberConversa', 'ResponseConversa', data);
  }

  async getMessages(protocolo, contador) {
    const data = {
      code: '90343263779',
      protocolo: protocolo,
      contador: contador
    };
    return this.requestData('RequestMensagens', 'ResponseMensagens', data);
  }

  async updateMessageStatus(data) {
    return this.requestData('RequestUpdateMensagensLida', 'ResponseUpdateMensagensLida', data);
  }

  async deleteConversation(protocolo) {
    const data = {
      Code: '5659723568999234',
      Protocolo: protocolo
    };
    return this.requestData('ExcluirConversa', 'responseExcluirConversa', data);
  }

  async createProduct(productData, login, protocolo) {
    const data = {
      Code: '45489644589644',
      Produtos: productData,
      Login: login,
      Protocolo: protocolo
    };
    return this.requestData('CriarProdutos', 'RespostaDaCriação', data);
  }

  async getProducts(login, protocolo) {
    const data = {
      Code: '45635465344565344564562546762',
      Login: login,
      Protocolo: protocolo
    };
    return this.requestData('ReceberProdutos', 'ResponseReceberProdutos', data);
  }

  async editProduct(productData) {
    return this.requestData('EditarProduto', 'ResponseEditarProduto', productData);
  }

  async deleteProduct(linkFotos) {
    const data = {
      LINK_FOTOS: linkFotos
    };
    return this.requestData('ExcluirProduto', null, data);
  }

  async checkPlatformStatus(identificador, platform) {
    const data = {
      Identificador: identificador
    };
    const event = platform === 'instagram' ? 'StatusInstagram' : 'StatusWhatsapp';
    const responseEvent = platform === 'instagram' ? 'updatesInstagram' : 'updatesWhatsapp';
    return this.requestData(event, responseEvent, data);
  }

  async connectPlatform(conta, identificador, platform) {
    const data = {
      code: platform === 'instagram' ? '7554749056' : '2544623544284',
      conta: conta,
      Identificador: identificador
    };
    const event = platform === 'instagram' ? 'Instagram' : 'Whatsapp';
    const responseEvent = platform === 'instagram' ? 'InstagramResponse' : 'WhatsappResponse';
    return this.requestData(event, responseEvent, data);
  }

  async getBalance(login) {
    const data = {
      Code: '3214654132654746856474651',
      login: login
    };
    return this.requestData('SaldoAtual', 'SaldoAtualresponse', data);
  }

  async saveApiKey(data) {
    return this.requestData('SalvandoApi', 'RespondendoApi', data);
  }

  async getApiKeys(login) {
    return this.requestData('CarregandoChaves', 'RecebendoChaves', login);
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
    return this.requestData('getFaturas', 'ResponsegetFaturas', data, 30000);
  }

  async updateMensagens(data) {
    return this.requestData('GetAddMensagens', 'ResponseGetAddMensagens', data);
  }

}

export const socketService = new SocketService();
export default SocketService;