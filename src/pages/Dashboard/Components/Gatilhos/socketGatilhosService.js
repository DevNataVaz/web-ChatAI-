import { socketService } from '../../../../services/socketService';
import { Criptografar, Descriptografar } from '../../../../Cripto/index';

export const gatilhosSocket = {
  /**
   * Load API keys for a user
   * @param {string} login - User's login
   * @param {function} onSuccess - Callback for successful response
   * @param {function} onError - Callback for error
   */
  loadApiKeys: (login, onSuccess, onError) => {
    try {
      // Setup event listener for receiving keys
      socketService.socket.once('RecebendoChaves', async (data) => {
        try {
          const resultado = JSON.parse(Descriptografar(data));
          
          // Process result
          if (resultado && Array.isArray(resultado)) {
            // Convert to expected format
            const processedKeys = resultado.map((item, index) => ({
              id: item.ID?.toString() || index.toString(),
              chaveBot: item.Chave,
              chaveApi: item.Api,
              login: item.Login,
              mensagem: item.Mensagem ?? '',
              imagem: item.Imagem ?? null
            }));
            
            onSuccess(processedKeys);
          } else {
            onError(new Error('Formato de resposta inválido'));
          }
        } catch (error) {
          // console.error("Erro ao processar chaves recebidas:", error);
          onError(error);
        }
      });

      // Send request to server
      socketService.socket.emit('CarregandoChaves', Criptografar(JSON.stringify(login)));
    } catch (error) {
      // console.error("Erro ao solicitar chaves:", error);
      onError(error);
    }
  },

  /**
   * Save a new API key
   * @param {Object} apiData - API key data to save
   * @param {function} onSuccess - Callback for successful response
   * @param {function} onError - Callback for error
   */
  saveApiKey: (apiData, onSuccess, onError) => {
    try {
      // Setup listener for response
      socketService.socket.once('RespondendoApi', async (data) => {
        try {
          const response = JSON.parse(Descriptografar(data));
          
          if (response?.Code === '920843905834905' && response?.Estado) {
            onSuccess(response);
          } else {
            onError(new Error('Erro ao salvar chave API'));
          }
        } catch (error) {
          // console.error("Erro ao processar resposta:", error);
          onError(error);
        }
      });

      // Prepare data
      const payload = {
        Chave: apiData.chaveBot,
        Api: apiData.chaveApi,
        Login: apiData.login,
        Mensagem: apiData.mensagem,
        Imagem: apiData.imageBase64 ? apiData.imageBase64.split(',')[1] : null
      };

      // Send request
      socketService.socket.emit('SalvandoApi', Criptografar(JSON.stringify(payload)));
    } catch (error) {
      // console.error("Erro ao salvar chave API:", error);
      onError(error);
    }
  },

  /**
   * Delete an API key
   * @param {string} keyId - ID of the key to delete
   * @param {function} onSuccess - Callback for successful response
   * @param {function} onError - Callback for error
   */
  deleteApiKey: (keyId, onSuccess, onError) => {
    try {
      // Setup listener for delete response
      socketService.socket.once('RespondendoDeleteApi', async (data) => {
        try {
          const response = JSON.parse(Descriptografar(data));
          
          if (response?.Code === '920843905834905' && response?.Estado) {
            onSuccess(response);
          } else {
            onError(new Error('Erro ao excluir chave API'));
          }
        } catch (error) {
          // console.error("Erro ao processar resposta de exclusão:", error);
          onError(error);
        }
      });

      // Send delete request
      socketService.socket.emit('DeletandoApi', Criptografar(JSON.stringify({ ID: keyId })));
    } catch (error) {
      // console.error("Erro ao excluir chave API:", error);
      onError(error);
    }
  }
};

export default gatilhosSocket;