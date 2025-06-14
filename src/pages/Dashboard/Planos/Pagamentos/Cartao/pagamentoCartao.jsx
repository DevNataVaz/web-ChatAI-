import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './PagamentoCartao.module.css';
import { socketService } from '../../../../../services/socketService';
import { Criptografar, Descriptografar } from '../../../../../Cripto/index';
import { useApp } from '../../../../../context/AppContext';
import SuccessModal from '../ModalSucesso/SuccessModal';
import { CreditCard, Shield } from 'react-feather';
import axios from 'axios';

function CardPayment() {
  const { planoId } = useParams();
  const { user, planos } = useApp();
  const navigate = useNavigate();
  const [plano, setPlano] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentResult, setPaymentResult] = useState({});
  
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

    // Find selected plan
    const selectedPlano = planos.find(p => p.ID === parseInt(planoId));
    if (selectedPlano) {
      setPlano(selectedPlano);
      // Pre-fill email if available
      setFormData(prev => ({
        ...prev,
        email: user.EMAIL || ''
      }));
    }

    // Setup socket listeners
    const socket = socketService.connect();
    
    socket.on('ResponsePagamentosCard', (data) => {
      setLoading(false);
      
      try {
        const result = JSON.parse(Descriptografar(data.Dados));
        const Code = JSON.parse(Descriptografar(data.Code));

        if (Code === '5645345656874689877997849') {
          setPaymentStatus(result.STATUS);
          setPaymentResult(result);
          setModalVisible(true);
          
          if (result.STATUS === 'approved') {
            setTimeout(() => {
              navigate('/dashboard');
            }, 5000);
          }
        } else if (Code === '56453456568746898779978491') {
          setError('Erro no processamento do pagamento. Verifique os dados e tente novamente.');
        }
      } catch (err) {
        // console.error('Erro ao processar resposta:', err);
        setError('Erro ao processar pagamento. Tente novamente mais tarde.');
      }
    });

    return () => {
      socket.off('ResponsePagamentosCard');
    };
  }, [user, planoId, navigate, planos]);

  const formatCardNumber = (value) => {
    return value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  const formatCPF = (value) => {
    return value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format specific fields
    switch (name) {
      case 'cardNumber':
        formattedValue = formatCardNumber(value);
        break;
      case 'cpf':
        formattedValue = formatCPF(value);
        break;
      case 'expiryMonth':
        formattedValue = value.replace(/\D/g, '').substring(0, 2);
        break;
      case 'expiryYear':
        formattedValue = value.replace(/\D/g, '').substring(0, 2);
        break;
      case 'cvv':
        formattedValue = value.replace(/\D/g, '').substring(0, 4);
        break;
      default:
        break;
    }

    setFormData({
      ...formData,
      [name]: formattedValue
    });
  };

  const getCardType = (number) => {
    // Remove non-digits
    number = number.replace(/\D/g, '');

    // Check card patterns
    const patterns = {
      visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
      mastercard: /^5[1-5][0-9]{14}$/,
      amex: /^3[47][0-9]{13}$/,
      elo: /^(401178|401179|431274|438935|451416|457393|457631|457632|504175|627780|636297|636368|(506699|5067[0-6]\\d|50677[0-8])|(50900\\d|5090[1-9]\\d|509[1-9]\\d{2})|65003[1-3]|(65003[5-9]|65004\\d|65005[0-1])|(65040[5-9]|6504[1-3]\\d)|(65048[5-9]|65049\\d|6505[0-2]\\d|65053[0-8])|(65054[1-9]|6505[5-8]\\d|65059[0-8])|(65070\\d|65071[0-8])|65072[0-7]|(65090[1-9]|65091\\d|650920)|(65165[2-9]|6516[6-7]\\d)|(65500\\d|65501\\d)|(65502[1-9]|6550[3-4]\\d|65505[0-8]))[0-9]{10,12}/,
      hipercard: /^(38[0-9]{17}|60[0-9]{14})$/
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(number)) {
        return type;
      }
    }

    return 'generic';
  };

  const validateForm = () => {
    // Basic validation
    if (!formData.cardNumber.trim()) return 'Número do cartão é obrigatório';
    if (!formData.cardName.trim()) return 'Nome no cartão é obrigatório';
    if (!formData.expiryMonth.trim() || !formData.expiryYear.trim()) return 'Data de validade é obrigatória';
    if (!formData.cvv.trim()) return 'Código de segurança é obrigatório';
    if (!formData.cpf.trim()) return 'CPF é obrigatório';
    if (!formData.email.trim()) return 'Email é obrigatório';

    const cardNumber = formData.cardNumber.replace(/\s/g, '');
    if (cardNumber.length < 13) return 'Número do cartão inválido';
    
    const month = parseInt(formData.expiryMonth, 10);
    if (month < 1 || month > 12) return 'Mês de validade inválido';

    return null;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  
  const validationError = validateForm();
  if (validationError) {
    setError(validationError);
    return;
  }
  
  setLoading(true);

  try {
    // Em vez de esperar por um token do backend,
    // vamos gerar um token simulado baseado nos dados do cartão
    // A ideia é que o backend processará os dados que enviamos
    // independentemente do token exato
    const cardNumberClean = formData.cardNumber.replace(/\s/g, '');
    const cpfClean = formData.cpf.replace(/\D/g, '');
    
    // Gerar um "token simulado" baseado nos últimos 4 dígitos do cartão (modo simplificado)
    // Isso é apenas para fornecer algo ao backend - em produção você NÃO faria isso
    const simulatedToken = `tok_${cardNumberClean.slice(-4)}_${Date.now()}`;
    
    // Obter o tipo de cartão
    const cardType = getCardType(cardNumberClean);
    
    // Criar o objeto de dados no formato que o backend espera
    const data = {
      token: simulatedToken, // Token simulado
      transaction_amount: parseFloat(plano.PRECO_MES.replace(',', '.')),
      description: `${plano.PLANO}`,
      installments: 1,
      paymentMethodId: cardType,
      payer: {
        email: formData.email,
      },
      Login: user.LOGIN,
      Nome: plano.PLANO,
      Id: plano.ID,
      ASSUNTO: 'PLANO',
      Qtd_Mensagens: plano.MENSAGENS || 0,
      Cpf: cpfClean,
      // Vamos incluir os dados do cartão como propriedades adicionais
      // para caso o backend precise deles para gerar o token real
      cardData: {
        cardNumber: cardNumberClean,
        expiryMonth: parseInt(formData.expiryMonth),
        expiryYear: parseInt('20' + formData.expiryYear),
        securityCode: formData.cvv,
        cardholderName: formData.cardName
      }
    };

    // Configurar o listener para a resposta antes de enviar
    const responseHandler = (data) => {
      setLoading(false);
      
      try {
        const result = JSON.parse(Descriptografar(data.Dados));
        const Code = JSON.parse(Descriptografar(data.Code));

        if (Code === '5645345656874689877997849') {
          setPaymentStatus(result.STATUS);
          setPaymentResult(result);
          setModalVisible(true);
          
          if (result.STATUS === 'approved') {
            setTimeout(() => {
              navigate('/dashboard');
            }, 5000);
          }
        } else if (Code === '56453456568746898779978491') {
          setError('Erro no processamento do pagamento. Verifique os dados e tente novamente.');
        }
      } catch (err) {
        // console.error('Erro ao processar resposta:', err);
        setError('Erro ao processar pagamento. Tente novamente mais tarde.');
      }
      
      // Remover o listener após processar a resposta
      socketService.socket.off('ResponsePagamentosCard', responseHandler);
    };
    
    // Configurar o listener para a resposta
    socketService.socket.on('ResponsePagamentosCard', responseHandler);
    
    // Enviar os dados para processamento
    socketService.socket.emit('PagamentosCard', {
      Code: Criptografar(JSON.stringify('5645345656874689877997849')),
      Dados: Criptografar(JSON.stringify(data))
    });
    
    // Configurar timeout para garantir que o loading não fique preso
    setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('Tempo limite excedido. Tente novamente mais tarde.');
        socketService.socket.off('ResponsePagamentosCard', responseHandler);
      }
    }, 30000);
    
  } catch (err) {
    // console.error('Erro ao processar pagamento:', err);
    setError(err.message || 'Erro ao processar cartão. Verifique os dados e tente novamente.');
    setLoading(false);
  }
};

  if (!plano) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Carregando detalhes do plano...</p>
        </div>
      </div>
    );
  }

  const cardBrandLogos = [
    { name: 'mastercard'},
    { name: 'visa'},
    { name: 'elo'},
    { name: 'amex'},
    { name: 'hipercard'}
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {/* <button 
          className={styles.backButton} 
          onClick={() => navigate(`/pagamento/${planoId}`)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 19L5 12L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button> */}
        <div className={styles.headerCircle}>
          <CreditCard size={32} color="white" />
        </div>
      </div>

      <div className={styles.content}>
        <h1>Cartão de crédito ou débito</h1>
        
        <div className={styles.cardBrands}>
          {cardBrandLogos.map((brand) => (
            <div key={brand.name} className={styles.cardBrand}>
              <img src={brand.src} alt={brand.name} />
            </div>
          ))}
        </div>

        <h2>Dados do cartão</h2>
        
        <form onSubmit={handleSubmit} className={styles.cardForm}>
          <div className={styles.formGroup}>
            <label htmlFor="cardNumber">Número do Cartão</label>
            <div className={styles.inputWithIcon}>
              <CreditCard size={20} color="#8A05BE" />
              <input
                id="cardNumber"
                type="text"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleInputChange}
                placeholder="0000 0000 0000 0000"
                maxLength="19"
                required
              />
            </div>
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
              <label htmlFor="cvv">Código de Segurança</label>
              <input
                id="cvv"
                type="text"
                name="cvv"
                value={formData.cvv}
                onChange={handleInputChange}
                placeholder="CVV"
                maxLength="4"
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="cardName">Nome no Cartão</label>
            <input
              id="cardName"
              type="text"
              name="cardName"
              value={formData.cardName}
              onChange={handleInputChange}
              placeholder="NOME COMO ESTÁ NO CARTÃO"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="cpf">CPF</label>
            <input
              id="cpf"
              type="text"
              name="cpf"
              value={formData.cpf}
              onChange={handleInputChange}
              placeholder="000.000.000-00"
              maxLength="14"
              required
            />
          </div>

          <h2>Dados do comprador</h2>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="exemplo@email.com"
              required
            />
          </div>

          <div className={styles.orderSummary}>
            <h3>Resumo da Compra</h3>
            
            <div className={styles.summaryItem}>
              <span>Plano</span>
              <span>{plano.PLANO}</span>
            </div>
            
            <div className={styles.summaryTotal}>
              <span>Valor Total</span>
              <span>R$ {plano.PRECO_MES}</span>
            </div>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#f23d4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8V12" stroke="#f23d4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="16" r="1" fill="#f23d4f"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            className={styles.payButton}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className={styles.buttonSpinner}></div>
                <span>Processando...</span>
              </>
            ) : (
              <>
                <Shield size={20} color="white" />
                <span>Pagar R$ {plano.PRECO_MES}</span>
              </>
            )}
          </button>
        </form>
      </div>

      <SuccessModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)}
        status={paymentStatus}
        plano={plano}
        paymentData={paymentResult}
      />
    </div>
  );
}

export default CardPayment;