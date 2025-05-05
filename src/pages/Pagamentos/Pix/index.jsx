// index.js (React Web version) - Simplificado com requestData
import React, { useEffect, useState } from 'react';
import styles from './Pix.module.css';

import { FiArrowLeft, FiCopy, FiShoppingBag, FiShield } from 'react-icons/fi';
import { MdPix } from 'react-icons/md';
import Resultado from './resultado';
import { socketService } from '../../../services/socketService.js';
import Loading from '../../../components/loading/LoadingScreen.jsx';


// Nubank inspired colors
const COLORS = {
  primary: '#8A05BE',
  primaryLight: '#9928C3',
  primaryDark: '#6D0499',
  primaryGradient: ['#8A05BE', '#9928C3', '#AB3FE5'],
  accent: '#00A1FC',
  pixPurple: '#916bfb',
  pixGradient: ['#8A05BE', '#916bfb', '#916bfb'],
  secondary: '#FFFFFF',
  background: '#F5F5F7',
  card: '#FFFFFF',
  text: '#333333',
  textSecondary: '#777777',
  shadow: '#000000',
  success: '#00C853',
  warning: '#FFC107',
  danger: '#F44336',
  border: '#E0E0E0',
};

const Login = ({ route, navigate }) => {
    const { fatura } = route?.params || {};
    const navigation = {
        goBack: () => navigate.goBack(),
        navigate: (route) => navigate(`/${route}`)
    };

    const [result, setResult] = useState({ 
        Visible: false, 
        Compra: null, 
        Chave: '', 
        Hora: '', 
        Data: '', 
        Valor: null, 
        Nome: '' 
    });
    const [Alerta, setAlerta] = useState('Copiar código Pix Copia e Cola');
    const [loading, setLoading] = useState(false);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(result.Chave);
            setAlerta("Copiado!");
            
            setTimeout(() => {
                setAlerta("Copiar código Pix Copia e Cola");
            }, 3000);
        } catch (err) {
            console.error('Erro ao copiar para área de transferência:', err);
        }
    };

    useEffect(() => {
        handlePayment();
    }, []);

    const handlePayment = async () => {
        try {
            const paymentData = {
                Code: '5645345656874689877997849',
                transaction_amount: fatura?.valor,
                description: `${fatura?.ASSUNTO}`,
                payment_method_id: 'pix',
                payer: {
                    email: `${fatura?.login}@gmail.com`,
                },
                Login: localStorage.getItem('LoginInicial'), 
                Nome: fatura?.nome_plano,
                Id: fatura?.id_assinatura,
                ASSUNTO: fatura?.ASSUNTO,
                Qtd_Mensagens: fatura?.QTD_MENSAGENS || 0
            };

            // Usando requestData - muito mais simples!
            const response = await socketService.requestData(
                'PagamentosPix', 
                'ResponsePagamentosPix', 
                paymentData
            );

            const {Dados, Code} = JSON.parse(response);

            if(Code === '6556464556446536143562'){
                setResult((prev) => ({ ...prev, Chave: Dados }));
            }
            if(Code === '65564645564465361435621'){
               console.log('Ops, algo deu errado', 'Serviço temporariamente indisponível. Por favor, tente novamente mais tarde.');
            }

        } catch (error) {
            console.error('Erro ao processar pagamento:', error);
            alert('Erro ao processar pagamento: ' + error.message);
        }
    };

    const handlerVerificarPix = async () => {
        setLoading(true);

        try {
            const dados = {
                Code: '6534453456544653514343132516325',
                Dados: result.Chave,
                Id_Assinatura: fatura?.id_assinatura,
                Nome: fatura?.nome_plano,
                Qtd_Mensagens: fatura?.QTD_MENSAGENS || 0
            };

            // Aguarda 5 segundos antes de verificar
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Usando requestData - código muito mais limpo!
            const dados_response = await socketService.requestData(
                'VerificaPix', 
                'ResponseVerificaPix', 
                dados
            );
            
            const { status, data, hora, valor, nome } = JSON.parse(dados_response);
            setResult((prev) => ({ 
                ...prev, 
                Compra: status, 
                Visible: true, 
                Data: data, 
                Hora: hora, 
                Valor: parseFloat(valor), 
                Nome: nome 
            }));

        } catch (error) {
            console.error('Erro ao verificar PIX:', error);
            alert('Erro ao verificar pagamento: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <Loading visible={loading} Mensagem={'VERIFICANDO PAGAMENTO...'} />
            
            {/* Header with Gradient */}
            <div className={styles.header} style={{
                background: `linear-gradient(135deg, ${COLORS.primaryGradient.join(', ')})`,
            }}>
                <button 
                    onClick={() => navigation.goBack()}
                    className={styles.backButton}
                >
                    <FiArrowLeft size={24} color={COLORS.secondary} />
                </button>
                
                <div className={styles.pixIconContainer}>
                    <div className={styles.pixIconInner}>
                        <MdPix size={40} color={COLORS.secondary} />
                    </div>
                </div>
            </div>
            
            <div className={styles.content}>
                <div className={styles.paymentInfo}>
                    <p className={styles.paymentText}>
                        Para concluir o pagamento, copie o código Pix e pague
                    </p>
                    <h2 className={styles.paymentAmount}>
                        R$ {fatura?.valor ? parseFloat(fatura.valor).toFixed(2) : '0.00'}
                    </h2>
                    <p className={styles.paymentSubtext}>
                        Use a opção Pix Copia e Cola no seu banco.
                    </p>
                </div>
                
                {/* Pix Code Card */}
                <div className={styles.pixCodeCard}>
                    <div className={styles.pixCodeContent}>
                        <div className={styles.pixCodeHeader}>
                            <div className={styles.pixIconSmall}>
                                <img 
                                    src="/assets/pix.png" 
                                    alt="Pix" 
                                    className={styles.pixImage}
                                />
                            </div>
                            <div>
                                <p className={styles.pixCodeLabel}>Código Pix</p>
                                <p className={styles.pixCodeValue}>
                                    {result.Chave}
                                </p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={copyToClipboard}
                            className={styles.copyButton}
                        >
                            <FiCopy size={20} color={COLORS.secondary} />
                            <span className={styles.copyButtonText}>
                                {Alerta}
                            </span>
                        </button>
                    </div>
                </div>
                
                {/* Description Card */}
                <div className={styles.infoCard}>
                    <div className={styles.infoCardContent}>
                        <div className={styles.infoIcon}>
                            <FiShoppingBag size={20} color={COLORS.pixPurple} />
                        </div>
                        <div className={styles.infoCardText}>
                            <h3 className={styles.infoCardTitle}>Descrição</h3>
                            <p className={styles.infoCardLabel}>Animus ChatPro Point</p>
                        </div>
                    </div>
                </div>
                
                {/* Plan Card */}
                <div className={styles.infoCard}>
                    <div className={styles.infoCardContent}>
                        <div className={styles.infoIcon}>
                            <FiShield size={20} color={COLORS.pixPurple} />
                        </div>
                        <div className={styles.infoCardText}>
                            <h3 className={styles.infoCardTitle}>Plano {fatura?.nome_plano}</h3>
                            <p className={styles.infoCardLabel}>{fatura?.data}</p>
                        </div>
                    </div>
                </div>
                
                {/* Confirm Button */}
                <div className={styles.buttonContainer}>
                    <button 
                        onClick={handlerVerificarPix}
                        className={styles.confirmButton}
                    >
                        Pronto, Fiz o Pagamento
                    </button>
                </div>
            </div>
            
            {/* Result Modal */}
            <Resultado dados={result} />
        </div>
    );
};

export default Login;