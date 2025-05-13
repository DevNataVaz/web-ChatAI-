import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IoArrowBack, IoCheckmarkCircleOutline, IoTimeOutline, IoCloseCircleOutline, IoHourglassOutline } from 'react-icons/io5';
import styles from './Comprovante.module.css';

// Cores inspiradas no Nubank
const COLORS = {
  primary: '#8A05BE',       // Roxo principal
  primaryLight: '#9928C3',  // Roxo mais claro
  primaryDark: '#6D0499',   // Roxo mais escuro
  primaryGradient: ['#8A05BE', '#9928C3', '#AB3FE5'], // Gradiente roxo
  secondary: '#FFFFFF',     // Branco
  background: '#F5F5FA',    // Fundo claro
  card: '#FFFFFF',          // Fundo do cartão
  text: '#333333',          // Texto primário
  textSecondary: '#777777', // Texto secundário
  shadow: '#000000',        // Cor da sombra
  success: '#00a650',       // Verde de sucesso
  warning: '#ff7733',       // Laranja de alerta
  danger: '#f23d4f',        // Vermelho de perigo
  neutral: '#8E8E8E',       // Cinza neutro
};

const PaymentReceipt = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { estado, titulo, valor, tipo, data, hora } = location.state || {};
  
  // Navegue de volta se não tiver dados
  if (!estado || !titulo) {
    navigate('/pagamentos');
    return null;
  }
  
  // Funções para determinar o estado e cores do pagamento
  const getStatusColor = () => {
    if (estado === 'approved') return COLORS.success;
    if (estado === 'pending' || estado === 'in_process') return COLORS.warning;
    if (estado === 'rejected') return COLORS.danger;
    return COLORS.neutral;
  };
  
  const getStatusIcon = () => {
    if (estado === 'approved') return <IoCheckmarkCircleOutline size={60} color={getStatusColor()} />;
    if (estado === 'pending' || estado === 'in_process') return <IoTimeOutline size={60} color={getStatusColor()} />;
    if (estado === 'rejected') return <IoCloseCircleOutline size={60} color={getStatusColor()} />;
    return <IoHourglassOutline size={60} color={getStatusColor()} />;
  };
  
  const getStatusText = () => {
    if (estado === 'approved') return `Pagamento ${tipo === 'pix' ? 'Pix' : 'Cartão'} realizado com sucesso!`;
    if (estado === 'pending' || estado === 'in_process') return `Pagamento ${tipo === 'pix' ? 'Pix' : 'Cartão'} está sendo processado!`;
    if (estado === 'rejected') return `Pagamento ${tipo === 'pix' ? 'Pix' : 'Cartão'} foi rejeitado!`;
    return `Pagamento ${tipo === 'pix' ? 'Pix' : 'Cartão'} cancelado!`;
  };
  
  const statusColor = getStatusColor();
  
  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <button 
            onClick={() => navigate(-1)}
            className={styles.backButton}
          >
            <IoArrowBack size={24} color="#FFFFFF" />
          </button>
          
          <h1 className={styles.headerText}>Detalhe da transação</h1>
          
          <div className={styles.placeholder}></div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className={styles.contentContainer}>
        {/* Status Card */}
        <div className={styles.card}>
          <div 
            className={styles.statusIconContainer}
            style={{ backgroundColor: `${statusColor}20` }}
          >
            {getStatusIcon()}
          </div>
          
          <h2 className={styles.successText}>{getStatusText()}</h2>
          <p className={styles.dateText}>{data} às {hora}</p>
        </div>
        
        {/* Amount Card */}
        <div className={styles.card}>
          <div className={styles.amountContainer}>
            <p className={styles.amountLabel}>Valor do pagamento</p>
            <p className={styles.amountValue}>R$ {valor}</p>
          </div>
        </div>
        
        {/* Recipient Card */}
        <div className={styles.card}>
          <div className={styles.recipientContainer}>
            <p className={styles.recipientLabel}>Para</p>
            <p className={styles.recipientName}>Animus ChatPro</p>
            <p className={styles.recipientCPF}>CPF: ***.051.741-**</p>
          </div>
        </div>
        
        {/* Transaction Card */}
        <div className={styles.card}>
          <div className={styles.transactionContainer}>
            <div className={styles.transactionRow}>
              <p className={styles.transactionLabel}>Método</p>
              <p className={styles.transactionValue}>
                {tipo === 'pix' ? 'PIX' : 'Cartão de Crédito'}
              </p>
            </div>
            
            <div className={styles.transactionRow}>
              <p className={styles.transactionLabel}>Status</p>
              <p className={styles.transactionStatus} style={{ color: statusColor }}>
                {estado === 'approved' ? 'Aprovado' : 
                 estado === 'pending' || estado === 'in_process' ? 'Em processamento' : 
                 estado === 'rejected' ? 'Rejeitado' : 'Cancelado'}
              </p>
            </div>
            
            <div className={styles.transactionRow}>
              <p className={styles.transactionLabel}>ID da transação</p>
              <p className={styles.transactionValue}>
                {titulo.slice(-10, -1) || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Status Color Indicator */}
      <div className={styles.statusIndicator} style={{ backgroundColor: statusColor }}></div>
    </div>
  );
};

export default PaymentReceipt;