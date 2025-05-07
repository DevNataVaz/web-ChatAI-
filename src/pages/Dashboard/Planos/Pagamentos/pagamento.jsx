import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './pagamento.module.css';
import { safeDescriptografar, Criptografar } from '../../../../Cripto';
import { useApp } from '../../../../context/AppContext';
import { socketService } from '../../../../services/socketService';

function PagamentoPix() {
  const { planoId } = useParams();
  const { user, planos, isLoading } = useApp();
  const navigate = useNavigate();
  const [plano, setPlano] = useState(null);
  const [qrCode, setQrCode] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [status, setStatus] = useState('pending'); // pending, approved, failed

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Buscar plano específico
    const selectedPlano = planos.find(p => p.ID === parseInt(planoId));
    if (selectedPlano) {
      setPlano(selectedPlano);
      generatePix(selectedPlano);
    }

    // Configurar listeners do socket
    const socket = socketService.connect();
    
    socket.on('ResponsePagamentosPix', (data) => {
      try {
        const result = safeDescriptografar(data);
        if (result.Code === '6556464556446536143562') {
          setQrCode(result.Dados);
          checkPixStatus(result.Dados);
          // Gerar imagem do QR Code
          generateQRCodeImage(result.Dados);
        }
      } catch (err) {
        console.error('Erro ao processar resposta PIX:', err);
      }
    });

    socket.on('ResponseVerificaPix', (data) => {
      try {
        const result = safeDescriptografar(data.Dados || data);
        if (result.status === 'approved') {
          setStatus('approved');
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        }
      } catch (err) {
        console.error('Erro ao verificar PIX:', err);
      }
    });

    return () => {
      socket.off('ResponsePagamentosPix');
      socket.off('ResponseVerificaPix');
    };
  }, [user, planoId, navigate, planos]);

  const generateQRCodeImage = (text) => {
    QRCode.toDataURL(text, {
      width: 250,
      margin: 1,
    })
    .then(url => {
      setQrCodeImage(url);
    })
    .catch(err => {
      console.error('Erro ao gerar QR Code:', err);
    });
  };

  const generatePix = (plano) => {
    const data = {
      Code: '546546546546645',
      transaction_amount: parseFloat(plano.PRECO_MES),
      description: `Assinatura ${plano.PLANO}`,
      payment_method_id: 'pix',
      payer: {
        email: user.EMAIL || '',
      },
      Login: user.LOGIN,
      Nome: plano.PLANO,
      Id: plano.ID,
      ASSUNTO: 'PLANO',
      Qtd_Mensagens: plano.MENSAGENS
    };

    socket.emit('PagamentosPix', Criptografar(JSON.stringify(data)));
  };

  const checkPixStatus = (qrCode) => {
    const data = {
      Code: '865468464654',
      Dados: qrCode,
      Id_Assinatura: user.ID,
      Nome: plano?.PLANO,
      Qtd_Mensagens: plano?.MENSAGENS
    };

    socket.emit('VerificaPix', Criptografar(JSON.stringify(data)));
  };

  const copyQrCode = () => {
    navigator.clipboard.writeText(qrCode);
    // Adicionar feedback visual aqui (toast notification)
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Gerando QR Code PIX...</div>
      </div>
    );
  }

  if (status === 'approved') {
    return (
      <div className={styles.container}>
        <div className={styles.successContainer}>
          <div className={styles.successIcon}>✓</div>
          <h2>Pagamento Aprovado!</h2>
          <p>Seu plano foi ativado com sucesso.</p>
          <p>Redirecionando para o dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.pixContainer}>
        <h1>Pagamento via PIX</h1>
        <div className={styles.planoInfo}>
          <h2>{plano?.PLANO}</h2>
          <p>Valor: R$ {plano?.PRECO_MES}</p>
        </div>

        <div className={styles.qrCodeContainer}>
          {qrCodeImage && <img src={qrCodeImage} alt="QR Code PIX" />}
          <button onClick={copyQrCode} className={styles.copyButton}>
            Copiar código PIX
          </button>
        </div>

        <div className={styles.instructions}>
          <h3>Como pagar:</h3>
          <ol>
            <li>Abra o app do seu banco</li>
            <li>Escolha a opção PIX Copia e Cola</li>
            <li>Cole o código ou escaneie o QR Code</li>
            <li>Confirme o pagamento</li>
          </ol>
        </div>

        <div className={styles.waiting}>
          <p>Aguardando pagamento...</p>
          <div className={styles.spinner}></div>
        </div>
      </div>
    </div>
  );
}

export default PagamentoPix;