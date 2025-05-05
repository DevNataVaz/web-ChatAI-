import React, { useState, useEffect } from 'react';
import LoginPage from '../login';
import MainDashboard from '../MainDashboard/index';
import crypto from 'crypto-js';

// Context para gerenciamento de estado global
const AppContext = React.createContext();

export function useApp() {
  return React.useContext(AppContext);
}

// Funções de criptografia
export const Criptografar = (text) => {
  const secretKey = 'chave-secreta-de-32-caracteres-12345';
  return crypto.AES.encrypt(text, secretKey).toString();
};

export const Descriptografar = (encryptedText) => {
  const secretKey = 'chave-secreta-de-32-caracteres-12345';
  const bytes = crypto.AES.decrypt(encryptedText, secretKey);
  return bytes.toString(crypto.enc.Utf8);
};

// Custom Hook para WebSocket
export function useWebSocket(url) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const listeners = {};

    const simulateSocket = {
      emit: (event, data) => {
        console.log(`Emitting ${event}:`, data);
        setTimeout(() => {
          if (event === 'login') {
            const mockResponse = {
              type: 'ResponseLog',
              data: Criptografar(JSON.stringify({
                Code: '655434565435463544',
                Dados: [{
                  ID: 1,
                  LOGIN: 'teste',
                  NOME: 'Usuário Teste',
                  EMAIL: 'teste@exemplo.com',
                  EMPRESA: 'Empresa Teste',
                  PLANO: 1
                }]
              }))
            };
            listeners['ResponseLog']?.(mockResponse);
          } else if (event === 'registro') {
            const mockResponse = {
              type: 'ResponseRegistro',
              Dados: Criptografar(JSON.stringify({
                Response: true,
                Mensagem: "Cadastro realizado com sucesso!"
              }))
            };
            listeners['ResponseRegistro']?.(mockResponse);
          }
        }, 1000);
      },
      on: (event, callback) => {
        listeners[event] = callback;
      },
      removeAllListeners: () => {
        Object.keys(listeners).forEach(key => delete listeners[key]);
      },
      onopen: () => {
        setIsConnected(true);
        console.log('WebSocket conectado');
      },
      onclose: () => {
        setIsConnected(false);
        console.log('WebSocket desconectado');
      },
      close: () => {}
    };
    
    return () => {
      simulateSocket.close();
    };
  }, [url]);

  return { socket, isConnected };
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useWebSocket('wss://your-websocket-url');

  useEffect(() => {
    const token = localStorage.getItem('animusia_token');
    const savedUser = localStorage.getItem('animusia_user');

    if (token && savedUser) {
      try {
        setIsAuthenticated(true);
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Erro ao recuperar usuário:', error);
        localStorage.removeItem('animusia_token');
        localStorage.removeItem('animusia_user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = async (loginData) => {
    setLoading(true);
    try {
      const encryptedData = Criptografar(JSON.stringify({
        Code: '4048963779',
        login: loginData.login,
        senha: loginData.senha
      }));

      if (socket) {
        return new Promise((resolve, reject) => {
          socket.onmessage = (event) => {
            if (event.type === 'ResponseLog') {
              const decryptedData = JSON.parse(Descriptografar(event.data));
              if (decryptedData.Code === '655434565435463544' && decryptedData.Dados?.length > 0) {
                const userData = decryptedData.Dados[0];
                setUser(userData);
                setIsAuthenticated(true);
                localStorage.setItem('animusia_token', 'authenticated');
                localStorage.setItem('animusia_user', JSON.stringify(userData));
                setLoading(false);
                resolve(userData);
              } else {
                setLoading(false);
                reject(new Error('Credenciais inválidas'));
              }
            }
          };

          socket.emit('login', encryptedData);
        });
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setLoading(false);
      throw error;
    }
  };

  const handleRegistro = async (formData) => {
    setLoading(true);
    try {
      const encryptedData = Criptografar(JSON.stringify({
        Code: '16254361254413321475648868769',
        nome: formData.nome,
        login: formData.login,
        empresa: formData.empresa,
        senha: formData.senha,
        email: formData.email
      }));

      if (socket) {
        return new Promise((resolve, reject) => {
          socket.on('ResponseRegistro', (response) => {
            const decrypted = JSON.parse(Descriptografar(response.Dados));
            if (decrypted.Response) {
              resolve('Cadastro realizado com sucesso!');
            } else {
              reject(new Error(decrypted.Mensagem));
            }
            setLoading(false);
          });

          socket.emit('registro', encryptedData);
        });
      }
    } catch (error) {
      console.error('Erro no registro:', error);
      setLoading(false);
      throw error;
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('animusia_token');
    localStorage.removeItem('animusia_user');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando...</p>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            gap: 1rem;
          }

          .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #e5e7eb;
            border-top: 4px solid #8A63FF;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .loading-container p {
            color: #6b7280;
            font-size: 1rem;
          }
        `}</style>
      </div>
    );
  }

  const contextValue = {
    user,
    socket,
    isAuthenticated,
    handleLogin,
    handleRegistro,
    handleLogout,
    Criptografar,
    Descriptografar
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="app">
        {!isAuthenticated ? (
          <LoginPage onLogin={handleLogin} />
        ) : (
          <MainDashboard user={user} onLogout={handleLogout} />
        )}
      </div>

      <style jsx>{`
        .app {
          min-height: 100vh;
          width: 100%;
          background-color: #f8fafc;
        }
      `}</style>
    </AppContext.Provider>
  );
}

export default App;
