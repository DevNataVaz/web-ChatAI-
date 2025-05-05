import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { toast } from 'react-toastify';
import styles from './LoginPage.module.css';
import MD5 from 'react-native-md5';
import { Descriptografar, Criptografar } from '../../Cripto';

export default function LoginPage() {
  const [formData, setFormData] = useState({ login: '', senha: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  const { isLoading: appLoading, setUser, loadUserData } = useApp();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.login.trim()) newErrors.login = 'Nome de usuário é obrigatório';
    if (!formData.senha) newErrors.senha = 'Senha é obrigatória';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const senhaCriptografada = MD5.hex_md5(formData.senha);
      console.log('Encrypted password:', senhaCriptografada);

      const loginData = { Code: '4048963779', login: formData.login, senha: senhaCriptografada };
      console.log('Sending loginData:', loginData);

      const { socketService } = await import('../../services/socketService');
      const rawResponse = await socketService.requestData('Login', 'ResponseLog', loginData);
      console.log('Raw response received (type ' + typeof rawResponse + '):', rawResponse);

      // Tenta descriptografar, mas trata casos onde rawResponse já é JSON/objeto
      let responseObj;
      if (typeof rawResponse === 'string') {
        try {
          const decryptedJson = Descriptografar(rawResponse);
          console.log('Decrypted JSON string:', decryptedJson);
          responseObj = JSON.parse(decryptedJson);
        } catch (decodeError) {
          console.warn('Descriptografia falhou, tentando parse direto:', decodeError);
          responseObj = JSON.parse(rawResponse);
        }
      } else {
        responseObj = rawResponse;
      }
      console.log('Final parsed response:', responseObj);

      // Normaliza Dados sempre como array
      let dados = responseObj.Dados ?? [];
      if (!Array.isArray(dados)) dados = [dados];

      if (dados.length > 0) {
        const userData = dados[0];
        const encrypted = Criptografar(JSON.stringify(userData));
        localStorage.setItem('animusia_user', encrypted);
        setUser(userData);
        if (userData.LOGIN) await loadUserData(userData.LOGIN);
        toast.success('Login realizado com sucesso!');
        navigate('/dashboard');
      } else {
        toast.error('Credenciais inválidas. Verifique seus dados.');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToRegister = () => navigate('/registro');

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <h1 className={styles.title}>Bem-vindo de volta</h1>
        <p className={styles.subtitle}>Entre com sua conta para continuar</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="login">Nome de usuário</label>
            <input
              type="text"
              id="login"
              name="login"
              value={formData.login}
              onChange={handleChange}
              className={`${styles.input} ${errors.login ? styles.inputError : ''}`}
              placeholder="Digite seu nome de usuário"
            />
            {errors.login && <span className={styles.error}>{errors.login}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              name="senha"
              value={formData.senha}
              onChange={handleChange}
              className={`${styles.input} ${errors.senha ? styles.inputError : ''}`}
              placeholder="Digite sua senha"
            />
            {errors.senha && <span className={styles.error}>{errors.senha}</span>}
          </div>

          <button type="submit" className={styles.submitButton} disabled={isLoading || appLoading}>
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className={styles.registerLink}>
          Não tem uma conta?{' '}
          <button onClick={navigateToRegister} className={styles.linkButton}>
            Cadastrar-se
          </button>
        </p>
      </div>
    </div>
  );
}
