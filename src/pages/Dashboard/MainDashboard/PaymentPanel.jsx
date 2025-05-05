import React, { useState, useEffect } from 'react';
import { useApp } from '../auth';

export default function PaymentPanel({ user, socket, onClose }) {
  const { Criptografar, Descriptografar } = useApp();
  const [activeTab, setActiveTab] = useState('faturas');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [loading, setLoading] = useState(false);
  const [faturas, setFaturas] = useState(null);
  const [plans, setPlans] = useState([]);
  const [history, setHistory] = useState([]);
  const [cardData, setCardData] = useState({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: ''
  });
  const [pixQrCode, setPixQrCode] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchFaturas();
    fetchPlans();
    fetchHistory();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('ResponsegetFaturas', handleFaturas);
      socket.on('ResponseGetPlanos', handlePlans);
      socket.on('responseHistoricoPagamentos', handleHistory);
      socket.on('ResponsePagamentosPix', handlePixResponse);
      socket.on('ResponsePagamentosCard', handleCardResponse);
      socket.on('ResponseVerificaPix', handlePixVerification);
    }

    return () => {
      if (socket) {
        socket.removeAllListeners();
      }
    };
  }, [socket]);

  const fetchFaturas = () => {
    const data = Criptografar(JSON.stringify(user.LOGIN));
    socket.emit('getFaturas', data);
  };

  const fetchPlans = () => {
    const data = Criptografar(JSON.stringify({
      Code: '6543456253415433251332',
      Dados: user.LOGIN
    }));
    socket.emit('getPlanos', data);
  };

  const fetchHistory = () => {
    const data = Criptografar(JSON.stringify({
      Login: user.LOGIN
    }));
    socket.emit('historicoPagamentos', data);
  };

  const handleFaturas = (data) => {
    const result = JSON.parse(Descriptografar(data.Dados));
    setFaturas(result);
  };

  const handlePlans = (data) => {
    const result = JSON.parse(Descriptografar(data));
    setPlans(result.Resultado);
  };

  const handleHistory = (data) => {
    const result = JSON.parse(Descriptografar(data));
    setHistory(result.pagamentos);
  };

  const handlePixResponse = (data) => {
    const result = JSON.parse(Descriptografar(data));
    if (result.Code === '6556464556446536143562') {
      setPixQrCode(result.Dados);
      verifyPixPayment(result.Dados);
    }
  };

  const handleCardResponse = (data) => {
    const result = JSON.parse(Descriptografar(data));
    if (result.Code === '5645345656874689877997849') {
      setProcessingPayment(false);
      alert('Pagamento processado com sucesso!');
      fetchFaturas();
      fetchHistory();
    } else {
      setProcessingPayment(false);
      alert('Erro ao processar pagamento com cartão');
    }
  };

  const verifyPixPayment = (qrCode) => {
    const checkPayment = setInterval(() => {
      const data = Criptografar(JSON.stringify({
        Code: '',
        Dados: qrCode,
        Id_Assinatura: faturas?.ID_ASSINATURA,
        Nome: faturas?.NOME_PLANO,
        Qtd_Mensagens: 0
      }));
      socket.emit('verificaPix', data);
    }, 5000);

    // Para de verificar após 15 minutos
    setTimeout(() => {
      clearInterval(checkPayment);
      setPixQrCode('');
    }, 900000);
  };

  const handlePixVerification = (data) => {
    const result = JSON.parse(Descriptografar(data.Dados));
    if (result.status === 'approved') {
      alert('Pagamento PIX aprovado!');
      setPixQrCode('');
      fetchFaturas();
      fetchHistory();
    }
  };

  const handlePayment = async () => {
    if (!faturas && !selectedPlan) return;

    setLoading(true);
    setPixQrCode('');

    try {
      const paymentData = {
        transaction_amount: selectedPlan ? Number(selectedPlan.PRECO_MES) : Number(faturas.VALOR),
        description: selectedPlan ? `Plano ${selectedPlan.PLANO}` : 'Fatura',
        Login: user.LOGIN,
        Nome: selectedPlan ? selectedPlan.PLANO : faturas.NOME_PLANO,
        Id: selectedPlan ? selectedPlan.ID : faturas.ID_ASSINATURA,
        ASSUNTO: selectedPlan ? 'PLANO' : 'FATURA',
        Qtd_Mensagens: 0
      };

      if (paymentMethod === 'pix') {
        const pixData = Criptografar(JSON.stringify({
          ...paymentData,
          Code: '2473892748324',
          payment_method_id: 'pix',
          payer: {
            email: user.EMAIL
          }
        }));
        socket.emit('pagamentosPix', pixData);
      } else {
        // Validate card data
        if (!validateCardData()) {
          alert('Preencha os dados do cartão corretamente');
          setLoading(false);
          return;
        }

        const cardPaymentData = Criptografar(JSON.stringify({
          Dados: {
            ...paymentData,
            token: 'mock_token', // Em produção, usar Mercado Pago SDK
            installments: 1,
            paymentMethodId: 'master',
            payer: {
              email: user.EMAIL,
              identification: {
                type: 'CPF',
                number: '02735916146' // Em produção, pedir CPF do usuário
              }
            },
            Cpf: '02735916146'
          }
        }));

        setProcessingPayment(true);
        socket.emit('pagamentosCard', cardPaymentData);
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro ao processar pagamento');
      setLoading(false);
    }
  };

  const validateCardData = () => {
    if (!cardData.holderName || !cardData.number || !cardData.expiryMonth || 
        !cardData.expiryYear || !cardData.ccv) {
      return false;
    }
    if (cardData.number.replace(/\s/g, '').length !== 16) {
      return false;
    }
    if (cardData.ccv.length < 3) {
      return false;
    }
    return true;
  };

  const formatCardNumber = (value) => {
    return value
      .replace(/\s/g, '')
      .match(/.{1,4}/g)
      ?.join(' ')
      .substr(0, 19) || '';
  };

  const renderFaturas = () => {
    if (!faturas) return <div>Carregando...</div>;

    return (
      <div className="faturas-container">
        <div className="fatura-card">
          <h3>Fatura Atual</h3>
          <div className="fatura-info">
            <div className="fatura-item">
              <span>Plano:</span>
              <strong>{faturas.NOME_PLANO}</strong>
            </div>
            <div className="fatura-item">
              <span>Status:</span>
              <span className={`status ${faturas.STATUS}`}>{faturas.STATUS}</span>
            </div>
            <div className="fatura-item">
              <span>Valor:</span>
              <strong>R$ {faturas.VALOR}</strong>
            </div>
            <div className="fatura-item">
              <span>Vencimento:</span>
              <strong>{new Date(faturas.VENCIMENTO).toLocaleDateString()}</strong>
            </div>
            <div className="fatura-item">
              <span>Mensagens:</span>
              <strong>{faturas.ATUAL_MENSAGENS} / {faturas.LIMITE_MENSAGEM}</strong>
            </div>
          </div>

          {faturas.STATUS !== 'ativo' && (
            <div className="payment-section">
              <h4>Pagar Fatura</h4>
              <div className="payment-methods">
                <label className={`payment-option ${paymentMethod === 'pix' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    checked={paymentMethod === 'pix'} 
                    onChange={() => setPaymentMethod('pix')}
                  />
                  PIX
                </label>
                <label className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    checked={paymentMethod === 'card'} 
                    onChange={() => setPaymentMethod('card')}
                  />
                  Cartão de Crédito
                </label>
              </div>

              {paymentMethod === 'card' && (
                <div className="card-form">
                  <div className="form-group">
                    <label>Nome no Cartão</label>
                    <input
                      type="text"
                      value={cardData.holderName}
                      onChange={(e) => setCardData({...cardData, holderName: e.target.value})}
                      placeholder="NOME IMPRESSO NO CARTÃO"
                    />
                  </div>
                  <div className="form-group">
                    <label>Número do Cartão</label>
                    <input
                      type="text"
                      value={cardData.number}
                      onChange={(e) => setCardData({...cardData, number: formatCardNumber(e.target.value)})}
                      placeholder="0000 0000 0000 0000"
                      maxLength="19"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Validade</label>
                      <div className="expiry-inputs">
                        <input
                          type="text"
                          value={cardData.expiryMonth}
                          onChange={(e) => setCardData({...cardData, expiryMonth: e.target.value.replace(/\D/g, '').slice(0, 2)})}
                          placeholder="MM"
                          maxLength="2"
                        />
                        <span>/</span>
                        <input
                          type="text"
                          value={cardData.expiryYear}
                          onChange={(e) => setCardData({...cardData, expiryYear: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                          placeholder="AAAA"
                          maxLength="4"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>CVV</label>
                      <input
                        type="text"
                        value={cardData.ccv}
                        onChange={(e) => setCardData({...cardData, ccv: e.target.value.replace(/\D/g, '').slice(0, 3)})}
                        placeholder="000"
                        maxLength="3"
                      />
                    </div>
                  </div>
                </div>
              )}

              {pixQrCode && (
                <div className="pix-qrcode">
                  <img 
                    src={`https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=${encodeURIComponent(pixQrCode)}`} 
                    alt="QR Code PIX" 
                  />
                  <p>Escaneie o QR Code para pagar</p>
                  <input 
                    type="text" 
                    value={pixQrCode} 
                    readOnly 
                    onClick={(e) => e.target.select()}
                  />
                </div>
              )}

              <button 
                className="pay-button" 
                onClick={handlePayment} 
                disabled={loading || processingPayment}
              >
                {loading ? 'Processando...' : `Pagar R$ ${faturas.VALOR}`}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPlans = () => {
    return (
      <div className="plans-grid">
        {plans.map(plan => (
          <div 
            key={plan.ID} 
            className={`plan-card ${selectedPlan?.ID === plan.ID ? 'selected' : ''}`}
            onClick={() => setSelectedPlan(plan)}
          >
            <h3>{plan.PLANO}</h3>
            <div className="plan-price">
              <span className="price">R$ {plan.PRECO_MES}</span>
              <span className="period">/mês</span>
            </div>
            <ul className="plan-features">
              <li>{plan.MENSAGENS} mensagens incluídas</li>
              <li>{plan.BOT_PLATAFORMA} plataformas</li>
              <li>{plan.ATENDENTES} atendentes</li>
              <li>Suporte {plan.SUPORTE}</li>
            </ul>
            <button 
              className={`select-plan-button ${selectedPlan?.ID === plan.ID ? 'selected' : ''}`}
              onClick={() => setSelectedPlan(plan)}
            >
              {selectedPlan?.ID === plan.ID ? 'Selecionado' : 'Selecionar'}
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderHistory = () => {
    return (
      <div className="history-container">
        <table className="history-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>ID Pagamento</th>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Método</th>
            </tr>
          </thead>
          <tbody>
            {history.map(payment => (
              <tr key={payment.ID_PAGAMENTO}>
                <td>{new Date(`${payment.DATA} ${payment.HORA}`).toLocaleString()}</td>
                <td>{payment.ID_PAGAMENTO}</td>
                <td>{payment.ASSUNTO}</td>
                <td>R$ {payment.VALOR}</td>
                <td>
                  <span className={`status ${payment.ESTADO}`}>
                    {payment.ESTADO}
                  </span>
                </td>
                <td>{payment.FORMA_PAGAMENTO}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="payment-panel">
      <div className="panel-header">
        <h2>Pagamentos</h2>
        <button className="close-button" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="payment-tabs">
        <button 
          className={`tab-button ${activeTab === 'faturas' ? 'active' : ''}`}
          onClick={() => setActiveTab('faturas')}
        >
          Faturas
        </button>
        <button 
          className={`tab-button ${activeTab === 'planos' ? 'active' : ''}`}
          onClick={() => setActiveTab('planos')}
        >
          Planos
        </button>
        <button 
          className={`tab-button ${activeTab === 'historico' ? 'active' : ''}`}
          onClick={() => setActiveTab('historico')}
        >
          Histórico
        </button>
      </div>

      <div className="payment-content">
        {activeTab === 'faturas' && renderFaturas()}
        {activeTab === 'planos' && renderPlans()}
        {activeTab === 'historico' && renderHistory()}
      </div>

      <style jsx>{`
        .payment-panel {
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          max-width: 1200px;
          margin: 0 auto;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .panel-header h2 {
          font-size: 1.875rem;
          font-weight: bold;
          color: #1f2937;
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          border-radius: 0.375rem;
          transition: all 0.3s;
        }

        .close-button:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .payment-tabs {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
        }

        .tab-button {
          flex: 1;
          padding: 1rem;
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 500;
          color: #6b7280;
          position: relative;
          transition: all 0.3s;
        }

        .tab-button.active {
          color: #8A63FF;
        }

        .tab-button.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: #8A63FF;
        }

        .payment-content {
          padding: 1.5rem;
        }

        .fatura-card {
          background: #f9fafb;
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .fatura-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin: 1rem 0;
        }

        .fatura-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .fatura-item span {
          color: #6b7280;
        }

        .fatura-item strong {
          color: #1f2937;
        }

        .status {
          padding: 0.25rem 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .status.ativo {
          background: #dcfce7;
          color: #166534;
        }

        .status.desativado {
          background: #fee2e2;
          color: #991b1b;
        }

        .status.approved {
          background: #dcfce7;
          color: #166534;
        }

        .status.pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status.rejected {
          background: #fee2e2;
          color: #991b1b;
        }

        .payment-section {
          margin-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
          padding-top: 1.5rem;
        }

        .payment-methods {
          display: flex;
          gap: 1rem;
          margin: 1rem 0;
        }

        .payment-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: all 0.3s;
        }

        .payment-option.selected {
          border-color: #8A63FF;
          background: #f3f4f6;
        }

        .card-form {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin: 1rem 0;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
        }

        .form-group input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }

        .form-row {
          display: flex;
          gap: 1rem;
        }

        .form-row .form-group {
          flex: 1;
        }

        .expiry-inputs {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .expiry-inputs input {
          width: 50px;
        }

        .pix-qrcode {
          text-align: center;
          margin: 1rem 0;
        }

        .pix-qrcode img {
          margin-bottom: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          background: white;
        }

        .pix-qrcode input {
          width: 100%;
          max-width: 400px;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          margin-top: 0.5rem;
          font-family: monospace;
        }

        .pay-button {
          width: 100%;
          padding: 1rem;
          background: #8A63FF;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .pay-button:hover:not(:disabled) {
          background: #7c59d6;
        }

        .pay-button:disabled {
          background: #d1d5db;
          cursor: not-allowed;
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-top: 1rem;
        }

        .plan-card {
          border: 2px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s;
        }

        .plan-card:hover {
          border-color: #8A63FF;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .plan-card.selected {
          border-color: #8A63FF;
          background: #faf5ff;
        }

        .plan-price {
          margin: 1rem 0;
        }

        .plan-price .price {
          font-size: 2rem;
          font-weight: bold;
          color: #1f2937;
        }

        .plan-price .period {
          color: #6b7280;
          margin-left: 0.5rem;
        }

        .plan-features {
          list-style: none;
          padding: 0;
          margin: 1rem 0;
        }

        .plan-features li {
          padding: 0.5rem 0;
          color: #4b5563;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .plan-features li::before {
          content: '✓';
          color: #059669;
        }

        .select-plan-button {
          width: 100%;
          padding: 0.75rem;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s;
        }

        .select-plan-button.selected {
          background: #8A63FF;
          color: white;
          border-color: #8A63FF;
        }

        .history-container {
          overflow-x: auto;
        }

        .history-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
        }

        .history-table th,
        .history-table td {
          padding: 0.75rem;
          border-bottom: 1px solid #e5e7eb;
          text-align: left;
        }

        .history-table th {
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
        }

        .history-table tr:last-child td {
          border-bottom: none;
        }

        .history-table tr:hover {
          background: #f9fafb;
        }
      `}</style>
    </div>
  );
}