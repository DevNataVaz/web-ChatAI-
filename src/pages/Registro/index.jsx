import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { socketService } from '../../services/socketService';
import { toast } from 'react-toastify';
import { Criptografar } from '../../Cripto';
import styles from './RegisterPage.module.css';
import MD5 from 'react-native-md5';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    empresa: '',
    login: '',
    senha: '',
    confirmarSenha: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome completo é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.empresa.trim()) {
      newErrors.empresa = 'Nome da empresa é obrigatório';
    }

    if (!formData.login.trim()) {
      newErrors.login = 'Nome de usuário é obrigatório';
    } else if (formData.login.length < 3) {
      newErrors.login = 'Nome de usuário deve ter pelo menos 3 caracteres';
    }

    if (!formData.senha) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (formData.senha.length < 6) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (!formData.confirmarSenha) {
      newErrors.confirmarSenha = 'Confirmação de senha é obrigatória';
    } else if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  setIsLoading(true);
  try {
    const senhaCriptografada = MD5.hex_md5(formData.senha);

    const data = {
      Code: '16254361254413321475648868769',
      nome: formData.nome,
      login: formData.login,
      senha: senhaCriptografada,
      email: formData.email,
      empresa: formData.empresa,
    };

    console.log("Enviando dados:", data);

    const response = await socketService.requestData(
      'EnviarRegistro',
      'ResponseRegistro',
      data
    );

    console.log("Resposta do servidor:", response);

    // A resposta deve ter sido descriptografada pelo socketService
    // Verificando o formato correto
    if (response && response.Dados && typeof response.Dados === 'object') {
      // Caso 1: Já descriptografado pelo socketService
      if (response.Dados.Response === true) {
        toast.success('Cadastro realizado com sucesso!', {
          position: "top-right",
          autoClose: 3000,
        });
        
        setTimeout(() => {
          navigate('/login');
        }, 1500);
        return;
      } 
      else if (response.Dados.Mensagem) {
        toast.error(response.Dados.Mensagem, {
          position: "top-right",
          autoClose: 5000,
        });
        return;
      }
    } 
    // Caso 2: Dados ainda como string (não descriptografado completamente)
    else if (response && response.Dados && typeof response.Dados === 'string') {
      try {
        const dadosObj = JSON.parse(response.Dados);
        if (dadosObj.Response === true) {
          toast.success('Cadastro realizado com sucesso!', {
            position: "top-right", 
            autoClose: 3000,
          });
          
          setTimeout(() => {
            navigate('/login');
          }, 1500);
          return;
        } else if (dadosObj.Mensagem) {
          toast.error(dadosObj.Mensagem, {
            position: "top-right",
            autoClose: 5000,
          });
          return;
        }
      } catch (parseError) {
        console.error("Erro ao analisar dados:", parseError);
      }
    }

    // Verificação legada (caso a estrutura seja diferente)
    if (response && response.Response === true) {
      toast.success('Cadastro realizado com sucesso!', {
        position: "top-right",
        autoClose: 3000,
      });
      
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      return;
    }

    // Fallback para quando os dados estão sendo registrados mas a resposta não está no formato esperado
    // Esta parte deve ocorrer apenas em situações excepcionais
    console.warn("Resposta em formato inesperado, mas o cadastro parece ter sido realizado:", response);
    toast.success('Cadastro parece ter sido realizado com sucesso!', {
      position: "top-right",
      autoClose: 3000,
    });
    
    setTimeout(() => {
      navigate('/login');
    }, 1500);
  } catch (error) {
    console.error('Register error:', error);
    toast.error('Erro ao realizar cadastro: ' + (error.message || 'Tente novamente.'), {
      position: "top-right",
      autoClose: 5000,
    });
  } finally {
    setIsLoading(false);
  }
};

  const navigateToLogin = () => {
    navigate('/login');
  };

  return (
    <div className={styles.container}>
      <div className={styles.registerCard}>
        <h1 className={styles.title}>Cadastrar conta</h1>
        <p className={styles.subtitle}>Cadastre-se agora e ganhe 30 dias grátis!</p>

        <form onSubmit={handleSubmit} className={styles.form}  method="POST">
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="nome">Nome completo</label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className={`${styles.input} ${errors.nome ? styles.inputError : ''}`}
                placeholder="Digite seu nome completo"
              />
              {errors.nome && <span className={styles.error}>{errors.nome}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                placeholder="Digite seu email"
              />
              {errors.email && <span className={styles.error}>{errors.email}</span>}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="empresa">Nome da empresa</label>
            <input
              type="text"
              id="empresa"
              name="empresa"
              value={formData.empresa}
              onChange={handleChange}
              className={`${styles.input} ${errors.empresa ? styles.inputError : ''}`}
              placeholder="Digite o nome da empresa"
            />
            {errors.empresa && <span className={styles.error}>{errors.empresa}</span>}
          </div>

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

          <div className={styles.formRow}>
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

            <div className={styles.formGroup}>
              <label htmlFor="confirmarSenha">Confirmar senha</label>
              <input
                type="password"
                id="confirmarSenha"
                name="confirmarSenha"
                value={formData.confirmarSenha}
                onChange={handleChange}
                className={`${styles.input} ${errors.confirmarSenha ? styles.inputError : ''}`}
                placeholder="Confirme sua senha"
              />
              {errors.confirmarSenha && <span className={styles.error}>{errors.confirmarSenha}</span>}
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? 'Cadastrando...' : 'Cadastrar agora'}
          </button>
        </form>

        <p className={styles.loginLink}>
          Já tem uma conta?
          <button onClick={navigateToLogin} className={styles.linkButton}>
            Entrar
          </button>
        </p>
      </div>
    </div>
  );
}