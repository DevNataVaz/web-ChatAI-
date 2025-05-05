// resultado.jsx (React Web version)
import React from 'react';
import styles from './resultado.module.css';
import { FiCheckCircle, FiAlertCircle, FiHelpCircle, FiShoppingBag, FiShield } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

// Nubank inspired colors
const COLORS = {
  primary: '#8A05BE',
  primaryLight: '#9928C3',
  primaryDark: '#6D0499',
  pixPurple: '#916bfb',
  secondary: '#FFFFFF',
  background: '#F5F5F7',
  card: '#FFFFFF',
  text: '#333333',
  textSecondary: '#777777',
  shadow: '#000000',
  success: '#00a650',
  warning: '#ff7733',
  danger: '#f23d4f',
};

export default function Pagamentos({ dados }) {
    const navigate = useNavigate();

    const getStatusColor = () => {
        if (dados.Compra === 'approved') return COLORS.success;
        if (dados.Compra === 'rejected') return COLORS.danger;
        if (dados.Compra === 'pending') return COLORS.warning;
        return COLORS.primary;
    };

    const getStatusIcon = () => {
        if (dados.Compra === 'approved') return <FiCheckCircle size={40} color={COLORS.secondary} />;
        if (dados.Compra === 'rejected' || dados.Compra === 'pending') return <FiAlertCircle size={40} color={COLORS.secondary} />;
        return <FiHelpCircle size={40} color={COLORS.secondary} />;
    };

    const getStatusTitle = () => {
        if (dados.Compra === 'approved') return "Seu pagamento foi aprovado";
        if (dados.Compra === 'rejected') return "Não foi possível processar seu pagamento";
        if (dados.Compra === 'pending') return "Estamos processando seu pagamento";
        return "";
    };

    const getStatusDescription = () => {
        if (dados.Compra === 'pending') {
            return "Não se preocupe em poucos minutos vamos reconhecer seu pagamento.";
        }
        return "";
    };

    const getButtonText = () => {
        if (dados.Compra === 'rejected') return "Escolher outro meio de pagamento";
        return "Voltar à loja";
    };

    if (!dados.Compra || !dados.Visible) {
        return null;
    }

    return (
        <div className={styles.modal}>
            <div className={styles.modalContent}>
                {/* Header with Gradient */}
                <div 
                    className={styles.header}
                    style={{
                        background: `linear-gradient(135deg, ${getStatusColor()}, ${getStatusColor()}, ${getStatusColor()})`,
                    }}
                >
                    <div className={styles.iconContainer}>
                        <div 
                            className={styles.iconInner}
                            style={{ backgroundColor: getStatusColor() }}
                        >
                            {getStatusIcon()}
                        </div>
                    </div>
                </div>
                
                <div className={styles.content}>
                    <div className={styles.statusInfo}>
                        <h2 className={styles.statusTitle}>
                            {getStatusTitle()}
                        </h2>
                        
                        {getStatusDescription() && (
                            <p className={styles.statusDescription}>
                                {getStatusDescription()}
                            </p>
                        )}
                    </div>
                    
                    {/* Payment Card */}
                    <div className={styles.card}>
                        <div className={styles.cardContent}>
                            <div className={styles.cardIcon}>
                                <img 
                                    src="/assets/mercadopago.png" 
                                    alt="MercadoPago"
                                    className={styles.cardImage}
                                />
                            </div>
                            <div className={styles.cardText}>
                                <h3 className={styles.cardAmount}>
                                    R$ {dados.Valor ? dados.Valor.toFixed(2) : '0.00'}
                                </h3>
                                <p className={styles.cardLabel}>
                                    Pago pelo Mercado Pago
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Description Card */}
                    <div className={styles.card}>
                        <div className={styles.cardContent}>
                            <div className={styles.cardIconSmall}>
                                <FiShoppingBag size={20} color={COLORS.pixPurple} />
                            </div>
                            <div className={styles.cardText}>
                                <h3 className={styles.cardTitle}>Descrição</h3>
                                <p className={styles.cardLabel}>Animus ChatPro Point</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Plan Card */}
                    <div className={styles.card}>
                        <div className={styles.cardContent}>
                            <div className={styles.cardIconSmall}>
                                <FiShield size={20} color={COLORS.pixPurple} />
                            </div>
                            <div className={styles.cardText}>
                                <h3 className={styles.cardTitle}>Plano {dados.Nome}</h3>
                                <p className={styles.cardLabel}>
                                    {dados.Data} às {dados.Hora} h.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Action Button */}
                    <div className={styles.buttonContainer}>
                        <button 
                            onClick={() => navigate('/TabFaturas')}
                            className={styles.actionButton}
                        >
                            {getButtonText()}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}