import React, { useState } from 'react';

export default function LoginPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    login: '',
    senha: '',
    nome: '',
    email: '',
    empresa: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.login || !formData.senha) {
      setError('Login e senha são obrigatórios');
      return false;
    }

    if (!isLogin) {
      if (!formData.nome || !formData.email || !formData.empresa) {
        setError('Todos os campos são obrigatórios');
        return false;
      }

      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        setError('Email inválido');
        return false;
      }

      if (formData.senha.length < 6) {
        setError('Senha deve ter pelo menos 6 caracteres');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await onLogin(formData);
      } else {
        // Registro de novo usuário - implementar handlerRegistro
        const encryptedData = window.Criptografar(JSON.stringify({
          Code: '16254361254413321475648868769',
          nome: formData.nome,
          login: formData.login,
          empresa: formData.empresa,
          senha: formData.senha,
          email: formData.email
        }));

        // Enviar via WebSocket
        if (window.socket) {
          window.socket.emit('registro', encryptedData);
          
          window.socket.on('ResponseRegistro', (response) => {
            const decrypted = JSON.parse(window.Descriptografar(response.Dados));
            if (decrypted.Response) {
              alert('Cadastro realizado com sucesso! Faça login.');
              setIsLogin(true);
            } else {
              setError(decrypted.Mensagem);
            }
          });
        }
      }
    } catch (err) {
      setError(err.message || 'Erro ao processar requisição');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="loginCard">
        <div className="logo">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#8A63FF" />
            <path d="M2 17L12 22L22 17" stroke="#8A63FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="#8A63FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h1>AnimusIA</h1>
        </div>

        <div className="tabs">
          <button 
            className={`tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button 
            className={`tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Cadastro
          </button>
        </div>

        <div className="formContainer">
          {!isLogin && (
            <>
              <div className="formGroup">
                <label htmlFor="nome">Nome Completo</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Seu nome completo"
                  disabled={loading}
                />
              </div>

              <div className="formGroup">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="seu@email.com"
                  disabled={loading}
                />
              </div>

              <div className="formGroup">
                <label htmlFor="empresa">Empresa</label>
                <input
                  type="text"
                  id="empresa"
                  name="empresa"
                  value={formData.empresa}
                  onChange={handleInputChange}
                  placeholder="Nome da empresa"
                  disabled={loading}
                />
              </div>
            </>
          )}

          <div className="formGroup">
            <label htmlFor="login">Login</label>
            <input
              type="text"
              id="login"
              name="login"
              value={formData.login}
              onChange={handleInputChange}
              placeholder="Digite seu login"
              disabled={loading}
            />
          </div>

          <div className="formGroup">
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              name="senha"
              value={formData.senha}
              onChange={handleInputChange}
              placeholder="Digite sua senha"
              disabled={loading}
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button 
            onClick={handleSubmit}
            className="submitButton"
            disabled={loading}
          >
            {loading ? (
              <div className="spinner"></div>
            ) : (
              isLogin ? 'Entrar' : 'Cadastrar'
            )}
          </button>
        </div>

        <div className="footer">
          <p>
            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="switchButton"
            >
              {isLogin ? ' Cadastre-se' : ' Faça login'}
            </button>
          </p>
        </div>
      </div>

      <style jsx>{`
        .container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 1rem;
        }

        .loginCard {
          background: white;
          border-radius: 10px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          padding: 2.5rem;
          width: 100%;
          max-width: 400px;
        }

        .logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 2rem;
        }

        .logo h1 {
          margin-top: 1rem;
          font-size: 1.875rem;
          font-weight: bold;
          color: #1f2937;
        }

        .tabs {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 1.5rem;
        }

        .tab {
          flex: 1;
          padding: 0.75rem;
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
          font-weight: 500;
          position: relative;
          transition: color 0.3s;
        }

        .tab.active {
          color: #8A63FF;
        }

        .tab.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: #8A63FF;
        }

        .formContainer {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .formGroup {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .formGroup label {
          font-weight: 500;
          color: #374151;
        }

        .formGroup input {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          transition: border-color 0.3s, box-shadow 0.3s;
        }

        .formGroup input:focus {
          outline: none;
          border-color: #8A63FF;
          box-shadow: 0 0 0 3px rgba(138, 99, 255, 0.2);
        }

        .formGroup input:disabled {
          background-color: #f9fafb;
          cursor: not-allowed;
        }

        .formGroup input::placeholder {
          color: #9ca3af;
        }

        .error {
          background-color: #fee2e2;
          color: #dc2626;
          padding: 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          text-align: center;
        }

        .submitButton {
          background-color: #8A63FF;
          color: white;
          padding: 0.75rem;
          border: none;
          border-radius: 0.375rem;
          font-weight: 500;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: background-color 0.3s;
          margin-top: 0.5rem;
        }

        .submitButton:hover:not(:disabled) {
          background-color: #7c59d6;
        }

        .submitButton:disabled {
          background-color: #d1d5db;
          cursor: not-allowed;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #ffffff;
          border-top: 3px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .footer {
          margin-top: 2rem;
          text-align: center;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .switchButton {
          background: none;
          border: none;
          color: #8A63FF;
          cursor: pointer;
          margin-left: 0.5rem;
          font-weight: 500;
        }

        .switchButton:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}