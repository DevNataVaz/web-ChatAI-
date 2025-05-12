import io from 'socket.io-client';
import { Criptografar, Descriptografar } from '../Cripto/index';
import Variaveis from '../../Variaveis.json';

// Constants
const DEFAULT_TIMEOUT = 15000;
const RECONNECTION_ATTEMPTS = 5;
const RECONNECTION_DELAY = 2000;
const MAX_RECONNECTION_DELAY = 30000;

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.pendingRequests = new Map();
    this.requestId = 1;
    this.isReconnecting = false;
    this.reconnectionAttempts = 0;
    this.connectionUrl = Variaveis.TESTE;
  }

  /**
   * Connect to socket server with exponential backoff reconnection
   */
  connect(url = this.connectionUrl) {
    this.connectionUrl = url;
    
    if (this.socket && this.socket.connected) {
      console.log('Socket already connected');
      return this.socket;
    }
    
    // Clear any existing socket
    if (this.socket) {
      this.socket.removeAllListeners();
     
      this.socket = null;
    }
    
    // Create a new socket connection
    this.socket = io(url, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: RECONNECTION_ATTEMPTS,
      reconnectionDelay: RECONNECTION_DELAY,
      reconnectionDelayMax: MAX_RECONNECTION_DELAY,
      timeout: DEFAULT_TIMEOUT,
      autoConnect: true
    });

    // Set up core socket event handlers
    this.socket.on('connect', () => {
      console.log('Socket connected with dashboard');
      this.isReconnecting = false;
      this.reconnectionAttempts = 0;
      
      // Re-establish registered event listeners after reconnection
      this.setupListeners();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.handleReconnection();
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      
      // Retry connecting in certain scenarios
      if (reason === 'io server disconnect' || reason === 'transport close') {
        this.handleReconnection();
      }
    });
    
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  /**
   * Handle reconnection logic with exponential backoff
   */
  handleReconnection() {
    if (this.isReconnecting) return;
    
    this.isReconnecting = true;
    this.reconnectionAttempts++;
    
    const delay = Math.min(
      Math.pow(2, this.reconnectionAttempts) * RECONNECTION_DELAY,
      MAX_RECONNECTION_DELAY
    );
    
    console.log(`Attempting to reconnect in ${delay/1000} seconds (attempt ${this.reconnectionAttempts})`);
    
    setTimeout(() => {
      if (this.reconnectionAttempts <= RECONNECTION_ATTEMPTS) {
        console.log(`Reconnection attempt ${this.reconnectionAttempts}`);
        
        if (this.socket) {
          this.socket.connect();
        } else {
          this.connect(this.connectionUrl);
        }
      } else {
        console.log('Max reconnection attempts reached, giving up');
        this.isReconnecting = false;
        
        // Notify any pending requests about the failure
        this.pendingRequests.forEach((requestInfo, requestId) => {
          if (requestInfo.reject) {
            requestInfo.reject(new Error('Connection lost and reconnection failed'));
          }
        });
        this.pendingRequests.clear();
      }
    }, delay);
  }

  /**
   * Disconnect from socket server
   */
  disconnect() {
    if (this.socket) {
      // Clear any pending requests
      this.pendingRequests.forEach((requestInfo, requestId) => {
        if (requestInfo.reject) {
          requestInfo.reject(new Error('Socket disconnected'));
        }
      });
      this.pendingRequests.clear();
      
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected() {
    return this.socket && this.socket.connected;
  }

  /**
   * Emit event with error handling
   */
  emit(event, data) {
    if (!this.isConnected()) {
      console.error(`Cannot emit ${event}: Socket not connected`);
      throw new Error('Socket not connected');
    }
    
    try {
      this.socket.emit(event, data);
      return true;
    } catch (error) {
      console.error(`Error emitting ${event}:`, error);
      throw error;
    }
  }

  /**
   * Register one-time event listener
   */
  once(event, callback) {
    if (this.socket) {
      this.socket.once(event, callback);
    } else {
      console.error('Socket not initialized for once()');
      throw new Error('Socket not initialized');
    }
  }

  /**
   * Register event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      if (callback) {
        this.listeners.get(event).delete(callback);
      } else {
        // Remove all callbacks for this event
        this.listeners.delete(event);
      }
    }
    
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.removeAllListeners(event);
      }
    }
  }

  /**
   * Set up all registered listeners on socket
   */
  setupListeners() {
    if (this.socket) {
      for (const [event, callbacks] of this.listeners) {
        for (const callback of callbacks) {
          this.socket.on(event, callback);
        }
      }
    }
  }

  /**
   * Request data from server with promise, timeout, and retry
   */
  async requestData(emitEvent, responseEvent, data, timeoutDuration = DEFAULT_TIMEOUT) {
    // Generate a unique request ID
    const requestId = this.requestId++;
    
    return new Promise((resolve, reject) => {
      // Set timeout handler
      const timeout = setTimeout(() => {
        this.off(responseEvent, handleResponse);
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request timeout after ${timeoutDuration/1000} seconds`));
      }, timeoutDuration);
      
      // Store the request info
      this.pendingRequests.set(requestId, { 
        emitEvent,
        responseEvent,
        data,
        resolve,
        reject,
        timeout,
        startTime: Date.now()
      });
  
      const handleResponse = (response) => {
        clearTimeout(timeout);
        this.off(responseEvent, handleResponse);
        this.pendingRequests.delete(requestId);
        
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
  
      // Register response handler
      this.on(responseEvent, handleResponse);
      
      // Prepare data for emission
      let encryptedData;
      try {
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
        
        // Emit the request
        this.emit(emitEvent, encryptedData);
      } catch (error) {
        // Clean up on error
        clearTimeout(timeout);
        this.off(responseEvent, handleResponse);
        this.pendingRequests.delete(requestId);
        reject(error);
      }
    });
  }

  /**
   * Request with retry logic
   */
  async requestWithRetry(emitEvent, responseEvent, data, maxRetries = 3, timeoutDuration = DEFAULT_TIMEOUT) {
    let retries = 0;
    
    while (retries <= maxRetries) {
      try {
        return await this.requestData(emitEvent, responseEvent, data, timeoutDuration);
      } catch (error) {
        retries++;
        
        if (retries > maxRetries || !error.message.includes('timeout')) {
          throw error;
        }
        
        console.log(`Retry ${retries}/${maxRetries} for ${emitEvent}`);
        
        // Exponential backoff
        const retryDelay = Math.min(Math.pow(2, retries) * 1000, 10000);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  async requestWhatsAppQRCode(agentProtocol, userLogin) {
  if (!agentProtocol || !userLogin) {
    throw new Error("Protocolo do agente e login do usuário são obrigatórios");
  }
  
  try {
    // Solicitar QR Code
    const encryptedData = {
      code: Criptografar('2544623544284'),
      conta: Criptografar(userLogin),
      Identificador: Criptografar(agentProtocol)
    };
    
    // Este evento não retorna diretamente um QR code, 
    // o QR code virá em um evento separado 'WhatsappQR'
    await this.emit('Whatsapp', encryptedData);
    
    // Configurar um promise que será resolvido quando o QR code for recebido
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.off('WhatsappQR');
        reject(new Error('Tempo esgotado ao aguardar QR code'));
      }, 30000);
      
      this.once('WhatsappQR', (data) => {
        clearTimeout(timeout);
        
        try {
          if (Descriptografar(data.Code) === '129438921435') {
            resolve({
              qrCode: Descriptografar(data.QRCODE),
              protocol: agentProtocol
            });
          } else {
            reject(new Error('Código de resposta inválido ao solicitar QR code'));
          }
        } catch (error) {
          reject(new Error(`Erro ao processar QR code: ${error.message}`));
        }
      });
    });
  } catch (error) {
    console.error('Erro ao solicitar QR code WhatsApp:', error);
    throw error;
  }
}

// Função para verificar status de conexão de um agente
async checkAgentConnectionStatus(agentProtocol, platform = 'whatsapp') {
  if (!agentProtocol) {
    throw new Error("Protocolo do agente é obrigatório");
  }
  
  try {
    const eventName = platform === 'instagram' ? 'StatusInstagram' : 'StatusWhatsapp';
    const responseEvent = platform === 'instagram' ? 'updatesInstagram' : 'updatesWhatsapp';
    const codeField = platform === 'instagram' ? '678984766951766581' : '17326186765984';
    
    const encryptedData = {
      Code: Criptografar('7668566448964451'),
      Identificador: Criptografar(agentProtocol)
    };
    
    // Emitir evento para verificar status
    this.emit(eventName, encryptedData);
    
    // Aguardar resposta
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.off(responseEvent);
        reject(new Error('Tempo esgotado ao verificar status de conexão'));
      }, 10000);
      
      this.once(responseEvent, (data) => {
        clearTimeout(timeout);
        
        try {
          if (Descriptografar(data.Code) === codeField) {
            const isConnected = Descriptografar(data.Dados) === 'true' || Descriptografar(data.Dados) === true;
            resolve(isConnected);
          } else {
            reject(new Error('Código de resposta inválido ao verificar status'));
          }
        } catch (error) {
          reject(new Error(`Erro ao processar status: ${error.message}`));
        }
      });
    });
  } catch (error) {
    console.error(`Erro ao verificar status de conexão ${platform}:`, error);
    throw error;
  }
}

  async registerAgent(agentData) {
  try {
    // Verificar se temos todos os dados necessários
    const requiredFields = ['empresa', 'atendente', 'objetivo', 'redes', 'perguntas'];
    for (const field of requiredFields) {
      if (!agentData[field]) {
        throw new Error(`Campo obrigatório ausente: ${field}`);
      }
    }
    
    // Gerar protocolo único se não for fornecido
    if (!agentData.protocolo) {
      agentData.protocolo = `bot_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    
    // Encriptar dados para envio
    const encryptedData = {
      Code: '658467658467865671', // Código para criação de bot
      Empresa: Criptografar(agentData.empresa),
      Atendente: Criptografar(agentData.atendente),
      Protocolo: Criptografar(agentData.protocolo),
      Login: Criptografar(agentData.login),
      Redes: Criptografar(agentData.redes),
      Objetivo: Criptografar(agentData.objetivo),
      Perguntas: Criptografar(agentData.perguntas),
      Gatilho: Criptografar(agentData.gatilho || 'automatico')
    };
    
    // Enviar solicitação e aguardar resposta
    const response = await this.requestData('CriarBot', 'RespostaDaCriação', encryptedData, 30000);
    
    // Validar resposta
    if (response && response.Res === true) {
      return {
        success: true,
        protocol: agentData.protocolo,
        message: 'Agente criado com sucesso'
      };
    } else {
      throw new Error('Falha ao criar agente. Resposta inválida do servidor.');
    }
  } catch (error) {
    console.error('Erro ao registrar agente:', error);
    throw error;
  }
} 



async getMyAgents(login) {
  if (!login) {
    throw new Error("Login do usuário é obrigatório para buscar agentes");
  }
  
  try {
    // Preparar dados para envio
    const encryptedData = Criptografar(JSON.stringify({
      Code: '234645423654423465',
      Login: login
    }));
    
    // Enviar solicitação
    const response = await this.requestWithRetry('MeusRobos', 'MeusRobosResponse', encryptedData, 3, 30000);
    
    // Processar resposta
    if (response && response.Dados && Array.isArray(response.Dados)) {
      // Transformar dados para facilitar uso no frontend
      const formattedAgents = response.Dados.map(bot => {
        const firstBot = bot.DADOS[0] || {};
        return {
          id: bot.PROTOCOLO,
          protocol: bot.PROTOCOLO,
          name: firstBot.EMPRESA || 'Bot sem nome',
          attendantName: firstBot.ATENDENTE || 'Atendente',
          platform: firstBot.REDE || '0',
          objective: firstBot.OBJETIVO || 'Outro',
          login: firstBot.LOGIN,
          gatilho: firstBot.GATILHO || 'automatico',
          status: null, // Status de conexão será buscado separadamente
          createdAt: firstBot.DATA_CRIACAO || new Date().toISOString()
        };
      });
      
      return {
        agents: formattedAgents,
        limit: response.Limite || 0
      };
    }
    
    return { agents: [], limit: 0 };
  } catch (error) {
    console.error('Erro ao buscar agentes:', error);
    throw new Error(`Falha ao buscar agentes: ${error.message}`);
  }
}

  
  async getUserProfile(login) {
    const data = { Login: login };
    return this.requestData('GetPerfil', 'responseGetPerfil', data);
  }

  /**
   * Get user's scheduled appointments
   */
  async getAgendamentos(data, login) {
    const reqData = { Data: data, Login: login };
    return this.requestData('getAgendamento', 'ResponseGetAgendamento', reqData);
  }

  /**
   * Get user's sales
   */
  async getSales(login) {
    const data = { login: login };
    return this.requestData('obterVendas', 'retornoVendas', data);
  }

  /**
   * Get user notifications
   */
  async getNotifications(login) {
    const data = { Login: login, Code: '234653244623544265344' };
    return this.requestData('GetNotification', 'responseGetNotification', data);
  }

  /**
   * Get user's payment history
   */
  async getPaymentHistory(login) {
    const data = { Login: login };
    return this.requestData('HistoricoPagamentos', 'responseHistoricoPagamentos', data);
  }

  /**
   * Send a message
   */
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

  /**
   * Get user's conversations
   */
  async getConversations(login, contador = 10) {
    const data = {
      Code: '65466556476567545665745',
      login: login,
      contador: contador
    };
    return this.requestData('ReceberConversa', 'ResponseConversa', data);
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(protocolo, contador = 0) {
    const data = {
      code: Criptografar('90343263779'),
      protocolo: Criptografar(protocolo),
      contador: Criptografar(contador.toString())
    };
    
    return this.requestWithRetry('requestMensagens', 'ResponseMensagens', data);
  }

  /**
   * Mark message as read
   */
  async updateMessageRead(messageId) {
    const data = {
      Code: Criptografar('56345436545434'),
      ID: Criptografar(messageId)
    };
    
    return this.requestData('updateMensagensLida', 'ResponseUpdateMensagensLida', data);
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(protocolo) {
    const data = {
      Code: '5659723568999234',
      Protocolo: protocolo
    };
    return this.requestData('ExcluirConversa', 'responseExcluirConversa', data);
  }

  /**
   * Create a product
   */
  async createProduct(productData, login, protocolo) {
    const data = {
      Code: '45489644589644',
      Produtos: productData,
      Login: login,
      Protocolo: protocolo
    };
    return this.requestData('CriarProdutos', 'RespostaDaCriação', data);
  }

  /**
   * Get products for an agent
   */
  async getProducts(login, protocolo) {
    const data = {
      Code: '45635465344565344564562546762',
      Login: login,
      Protocolo: protocolo
    };
    return this.requestData('ReceberProdutos', 'ResponseReceberProdutos', data);
  }

  /**
   * Edit a product
   */
  async editProduct(productData) {
    return this.requestData('EditarProduto', 'ResponseEditarProduto', productData);
  }

  /**
   * Delete a product
   */
  async deleteProduct(linkFotos) {
    const data = {
      LINK_FOTOS: linkFotos
    };
    return this.requestData('ExcluirProduto', 'ResponseExcluirProduto', data);
  }

  /**
   * Check platform status (Instagram/WhatsApp)
   */
  async checkPlatformStatus(identificador, platform) {
    const data = {
      Identificador: identificador
    };
    const event = platform === 'instagram' ? 'StatusInstagram' : 'StatusWhatsapp';
    const responseEvent = platform === 'instagram' ? 'updatesInstagram' : 'updatesWhatsapp';
    return this.requestData(event, responseEvent, data);
  }

  /**
   * Connect to a platform (Instagram/WhatsApp)
   */
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

  /**
   * Get user's balance
   */
  async getBalance(login) {
    const data = {
      Code: '3214654132654746856474651',
      login: login
    };
    return this.requestData('SaldoAtual', 'SaldoAtualresponse', data);
  }

  /**
   * Save API key
   */
  async saveApiKey(data) {
    return this.requestData('SalvandoApi', 'RespondendoApi', data);
  }

  /**
   * Get API keys
   */
  async getApiKeys(login) {
    return this.requestData('CarregandoChaves', 'RecebendoChaves', login);
  }

  /**
   * Save bot behavior
   */
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

    // Encrypt data fields
    const encryptedData = {
      Code: data.Code
    };
    
    for (const [key, value] of Object.entries(data)) {
      if (key !== 'Code') {
        encryptedData[key] = Criptografar(value);
      }
    }

    return this.requestData('CriarBot', 'RespostaDaCriação', encryptedData);
  }

  /**
   * Get available plans
   */
  async getPlanos(login) {
    const data = { Dados: login };
    return this.requestData('GetPlanos', 'ResponseHandlerPlanos', data);
  }

  /**
   * Create a PIX payment
   */
  async createPixPayment(data) {
    return this.requestData('PagamentosPix', 'ResponsePagamentosPix', data);
  }

  /**
   * Verify PIX payment status
   */
  async verifyPixPayment(data) {
    return this.requestData('VerificaPix', 'ResponseVerificaPix', data);
  }

  /**
   * Create a card payment
   */
  async createCardPayment(data) {
    return this.requestData('PagamentosCard', 'ResponsePagamentosCard', data);
  }

  /**
   * Get user's invoices
   */
  async getFaturas(login) {
    const data = { Dados: login };
    return this.requestData('getFaturas', 'ResponsegetFaturas', data, 30000);
  }

  /**
   * Update messages
   */
  async updateMensagens(data) {
    return this.requestData('GetAddMensagens', 'ResponseGetAddMensagens', data);
  }
}

// Create a singleton instance
export const socketService = new SocketService();
export default SocketService;