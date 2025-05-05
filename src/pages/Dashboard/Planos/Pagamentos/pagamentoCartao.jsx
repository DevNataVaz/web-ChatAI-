import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './pagamento.module.css';
import { useApp } from '../../../../context/AppContext';
import { socketService } from '../../../../services/socketService';
import { Descriptografar } from '../../../../Cripto';

function PagamentoCartao() {
  const { planoId } = useParams();
  const { user, planos, isLoading } = useApp();
  const navigate = useNavigate();
  const [plano, setPlano] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cpf: '',
    email: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Buscar plano
    const selectedPlano = planos.find(p => p.ID === parseInt(planoId));
    if (selectedPlano) {
      setPlano(selectedPlano);
      setFormData(prev => ({
        ...prev,
        email: user.EMAIL || ''
      }));
    }

    // Configurar listeners do socket
    const socket = socketService.connect();
    
    socket.on('ResponsePagamentosCard', (data) => {
      try {
        const result = Descriptografar(data);
        if (result.Code === '654645654654654654') {
          // Pagamento aprovado
          navigate('/dashboard');
        } else if (result.Code === '6546456546546546') {
          // Erro no pagamento
          setError('Pagamento recusado. Verifique os dados do cartão.');
          setProcessing(false);
        }
      } catch (err) {
        console.error('Erro ao processar resposta:', err);
        setError('Erro ao processar pagamento.');
        setProcessing(false);
      }
    });

    return () => {
      socket.off('ResponsePagamentosCard');
    };
  }, [user, planoId, navigate, planos]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Formatar campos específicos
    switch (name) {
      case 'cardNumber':
        formattedValue = value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
        break;
      case 'cpf':
        formattedValue = value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4');
        break;
      default:
        break;
    }

    setFormData({
      ...formData,
      [name]: formattedValue
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setProcessing(true);
    setError('');

    const data = {
      Code: '546546546546645',
      valor: parseFloat(plano.PRECO_MES),
      descricao: `Assinatura ${plano.PLANO}`,
      numeroCartao: formData.cardNumber.replace(/\s/g, ''),
      cvv: formData.cvv,
      mesExpiracao: formData.expiryMonth,
      anoExpiracao: formData.expiryYear,
      cpf: formData.cpf.replace(/\D/g, ''),
      email: formData.email,
      nomeCartao: formData.cardName,
      login: user.LOGIN,
      nome: plano.PLANO,
      id: plano.ID,
      ASSUNTO: 'PLANO',
      QtdMensagens: plano.MENSAGENS
    };

    socketService.createCardPayment(data);
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.cardContainer}>
        <h1>Pagamento com Cartão</h1>
        <div className={styles.planoInfo}>
          <h2>{plano?.PLANO}</h2>
          <p>Valor: R$ {plano?.PRECO_MES}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.cardForm}>
          <div className={styles.formGroup}>
            <label>Número do Cartão</label>
            <input
              type="text"
              name="cardNumber"
              value={formData.cardNumber}
              onChange={handleInputChange}
              placeholder="0000 0000 0000 0000"
              maxLength="19"
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Validade</label>
              <div className={styles.expiryRow}>
                <input
                  type="text"
                  name="expiryMonth"
                  value={formData.expiryMonth}
                  onChange={handleInputChange}
                  placeholder="MM"
                  maxLength="2"
                  required
                />
                <span>/</span>
                <input
                  type="text"
                  name="expiryYear"
                  value={formData.expiryYear}
                  onChange={handleInputChange}
                  placeholder="AA"
                  maxLength="2"
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>CVV</label>
              <input
                type="text"
                name="cvv"
                value={formData.cvv}
                onChange={handleInputChange}
                placeholder="000"
                maxLength="3"
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Nome no Cartão</label>
            <input
              type="text"
              name="cardName"
              value={formData.cardName}
              onChange={handleInputChange}
              placeholder="NOME COMO NO CARTÃO"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>CPF</label>
            <input
              type="text"
              name="cpf"
              value={formData.cpf}
              onChange={handleInputChange}
              placeholder="000.000.000-00"
              maxLength="14"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="seu@email.com"
              required
            />
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={processing}
          >
            {processing ? 'Processando...' : `Pagar R$ ${plano?.PRECO_MES}`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PagamentoCartao;