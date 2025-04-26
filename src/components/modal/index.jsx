import React, { useState, useEffect } from 'react';
import styles from './AuthModal.module.css';
import { io } from 'socket.io-client';
import CryptoJS from 'crypto-js';
import base64 from 'base-64';
import MD5 from 'react-native-md5';
import { toast } from 'react-toastify';
import Variaveis from '../../../Variaveis.json'

import { useNavigate } from 'react-router-dom';




const socket = io(`${Variaveis.ENDERECO}`, {
  transports: ['websocket'],
  withCredentials: true,
  extraHeaders: {
    "my-custom-header": "value"
  }
});


socket.on('connect', () => {
  console.log('coneectou', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('Erro na conexão com o WebSocket:', err);
});


const secretKeyAES = "a53650a05d0c2d20b93433e828e2ab79f89d3f2669b82dbcba9a560b186dad8fa7701eda833a7b7994eda0538260d4c870f0c273248bbcd69fb34ac10a1bc11e";
const secretKeyHMAC = "51859f08e51dea252dbfbf5a32b3559c9a6cdb41a1fe93f9f2eea7a3de7b0df6";

function criptografar(data) {
  // Criptografar a mensagem com AES
  const encryptedMessage = CryptoJS.AES.encrypt(JSON.stringify(data), secretKeyAES).toString();

  // Gerar a assinatura HMAC da mensagem criptografada
  const hmacSignature = CryptoJS.HmacSHA256(encryptedMessage, secretKeyHMAC).toString();

  // Combinar a mensagem criptografada e a assinatura em um objeto e codificar em Base64
  return base64.encode(JSON.stringify({ encryptedMessage, hmacSignature }));
}

function descriptografar(data) {
  // Decodificar a mensagem Base64 e parsear o JSON
  const decodedMessage = JSON.parse(base64.decode(data));
  const { encryptedMessage, hmacSignature } = decodedMessage;

  // Verificar a assinatura HMAC
  const calculatedHMAC = CryptoJS.HmacSHA256(encryptedMessage, secretKeyHMAC).toString();
  if (calculatedHMAC !== hmacSignature) {
    throw new Error("Assinatura HMAC inválida. Os dados podem ter sido alterados.");
  }

  // Descriptografar a mensagem com AES
  const decryptedMessage = CryptoJS.AES.decrypt(encryptedMessage, secretKeyAES).toString(CryptoJS.enc.Utf8);

  return JSON.parse(decryptedMessage);
}





export default function AuthModal({ onClose }) {
  const [cadastro, setCadastro] = useState(true);
  const [form, setForm] = useState({ login: '', senha: '', nome: '', email: '', empresa: '' });
  const navigate = useNavigate();

  const handleInput = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const enviar = () => {
    const senhaCriptografada = MD5.hex_md5(form.senha);
    const data = cadastro
      ? {
        Code: '16254361254413321475648868769',
        nome: form.nome,
        login: form.login,
        senha: senhaCriptografada,
        email: form.email,
        empresa: form.empresa,
      }
      : {
        Code: '4048963779',
        login: form.login,
        senha: senhaCriptografada,
      };


    console.log('Dados de envio antes da criptografia:', data);


    // const eventName = cadastro ? 'EnviarRegistro' : 'Login';
    const eventName = 'EnviarRegistro';

    console.log(`Enviando evento: ${eventName}`);


    const dataToSend = criptografar(JSON.stringify(data));
    console.log('Dados criptografados enviados:', dataToSend);

    socket.emit(eventName, dataToSend);


    socket.on('ResponseRegistro', (data) => {
      if (descriptografar(data.Code) !== '655434565435463544') return;
      const response = JSON.parse(descriptografar(data.Dados));

      if (response.Response === true) {
        onClose();
        setTimeout(() => {
          onClose();
          
        }, 3000);
      } else {
        Verifica.showAlert('Atenção', response.Mensagem, 'Ok, Obrigado!');
      }
    });

  };

  useEffect(() => {
    socket.on('ResponseRegistro', res => {
      try {
        let dadosFinal;

        if (typeof res === 'string') {
          const { Dados } = descriptografar(res);
          dadosFinal = JSON.parse(Dados);
        } else if (typeof res === 'object' && res.Dados) {
          const Dados = descriptografar(res.Dados);
          dadosFinal = JSON.parse(Dados);
        } else {
          throw new Error('Resposta inválida');
        }

        console.log('Cadastro:', dadosFinal);

        if (dadosFinal.Response) {
          toast.success('Cadastro realizado com sucesso!');
          setCadastro(false);
          navigate('/download');
          onClose && onClose();
        } else if (dadosFinal.Mensagem) {
          toast.error(dadosFinal.Mensagem);
        }

      } catch (e) {
        console.error('Erro ao descriptografar registro:', e.message);
        toast.error('Erro ao processar a resposta do servidor.');
      }
    });



    // socket.on('ResponseLog', res => {
    //   try {

    //     console.log('Raw ResponseLog:', res);
    //     console.log('Response type:', typeof res);

    //     let decryptedData;
    //     try {
    //       decryptedData = descriptografar(res);
    //       console.log('Decrypted data:', decryptedData);
    //     } catch (decryptError) {
    //       console.error('Erro na descriptografia:', decryptError);
    //       toast.error('Falha ao descriptografar resposta do servidor');
    //       return;
    //     }


    //     if (!decryptedData || !decryptedData.Dados) {
    //       console.log('decryptedData object:', decryptedData);
    //       throw new Error('Resposta não contém dados válidos');
    //     }


    //     if (typeof res === 'string' && !res.includes('{')) {
    //       console.log('Response appears to be plain text');
    //       toast.error('Resposta do servidor em formato inesperado');
    //       return;
    //     }

    //     let dadosFinal;
    //     try {
    //       dadosFinal = JSON.parse(decryptedData.Dados);
    //       console.log('Dados finais:', dadosFinal);
    //     } catch (parseError) {
    //       console.error('Erro ao fazer parse do JSON:', parseError);
    //       toast.error('Dados recebidos não estão em formato JSON válido');
    //       return;
    //     }

    //     if (dadosFinal && dadosFinal.length > 0) {
    //       toast.success('Login realizado com sucesso!');
    //       navigate('/download');
    //     } else {
    //       toast.error('Login inválido. Verifique seus dados.');
    //     }
    //   } catch (e) {
    //     console.error('Erro ao processar login:', e.message);
    //     toast.error('Erro interno ao processar login.');
    //   }
    // });


    return () => {
      socket.off('ResponseRegistro');
      socket.off('ResponseLog');
    };
  }, [navigate]);



  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
        <h2>{cadastro ? 'Cadastrar conta' : 'Vamos Fazer o seu Login.'}</h2>
        <p>Cadastre-se agora e ganhe 30 dias grátis!</p>

        {cadastro && (
          <>
            <input type="text" name="nome" placeholder="Nome completo" onChange={handleInput} />
            <input type="text" name="empresa" placeholder="Nome da empresa" onChange={handleInput} />
            <input type="email" name="email" placeholder="Digite seu email" onChange={handleInput} />
          </>
        )}

        <input type="text" name="login" placeholder="Insira nome de usuário" onChange={handleInput} />
        <input type="password" name="senha" placeholder="Insira senha" onChange={handleInput} />

        <button onClick={enviar}>{cadastro ? 'Cadastrar agora' : 'Entrar agora'}</button>
{/* 
        <p className={styles.switchMode} onClick={() => setCadastro(!cadastro)}>
          {cadastro ? (
            <>Já tem conta? <span className={styles.linkColor}>Entrar</span></>
          ) : (
            <>Não tem conta? <span className={styles.linkColor}>Registrar</span></>
          )}
        </p> */}
      </div>
    </div>
  );
}
