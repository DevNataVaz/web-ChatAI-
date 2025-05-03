import React, { useState } from 'react';
import { View, Modal, Alert, Text, Image, TouchableOpacity, SafeAreaView, StatusBar, Dimensions, ScrollView } from 'react-native';
import axios from 'axios';
import { TextInput } from 'react-native-paper';
import Cores from '../../../Css/Styles/Styles.json';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import Resultado from './resultado.js';
import Loading from '../../../Componentes/Loading';
import Socket from '../../../Socket';
import { Criptografar, Descriptografar } from '../../../Cripto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Verifica from '../../../Componentes/Verifica';
import { LinearGradient } from 'expo-linear-gradient';
import { RFValue } from "react-native-responsive-fontsize";
import * as Animated from 'react-native-animatable';

// Nubank inspired colors
const COLORS = {
  primary: '#8A05BE',       // Main purple
  primaryLight: '#9928C3',  // Lighter purple
  primaryDark: '#6D0499',   // Darker purple
  primaryGradient: ['#8A05BE', '#9928C3', '#AB3FE5'], // Purple gradient
  accent: '#00A1FC',        // Accent blue color for highlights
  secondary: '#FFFFFF',     // White
  background: '#F5F5F7',    // Light background
  card: '#FFFFFF',          // Card background
  text: '#333333',          // Primary text
  textSecondary: '#777777', // Secondary text
  shadow: '#000000',        // Shadow color
  success: '#00a650',       // Success green
  warning: '#FFC107',       // Warning yellow
  danger: '#f23d4f',        // Danger red
  border: '#E0E0E0',        // Border color
  inputBorder: '#CCCCCC',   // Input border color
};

const App = ({ route, navigation }) => {
    const { fatura } = route.params;
    const [cardNumber, setCardNumber] = useState('');
    const [expirationMonth, setExpirationMonth] = useState('');
    const [expirationYear, setExpirationYear] = useState('');
    const [securityCode, setSecurityCode] = useState('');
    const [cardholderName, setCardholderName] = useState('');
    const [identificationNumber, setIdentificationNumber] = useState('');
    const [Email, setEmail] = useState('');
    const [result, setResult] = useState({ 
        Visible: false, 
        Compra: null, 
        Nome: '', 
        Login: '', 
        Hora: '', 
        Data: '', 
        Valor: '' 
    });
    const [loading, setLoading] = useState(false);
    
    const windowWidth = Dimensions.get('window').width;
    const windowHeight = Dimensions.get('window').height;
    const headerHeight = windowHeight * 0.20;

    const Voltar = (() => {
        setResult((prev) => ({ ...prev, Visible: !result.Visible }));
    });

    function getCardType(number) {
        // Remove espaços em branco do número do cartão
        number = number.replace(/\\s+/g, '');

        // Verifica se o número do cartão começa com os prefixos conhecidos
        const visaRegex = /^4[0-9]{12}(?:[0-9]{3})?$/;
        const masterCardRegex = /^(?:5[1-5][0-9]{14}|2[2-7][0-9]{14})$/;
        const amexRegex = /^3[47][0-9]{13}$/;

        if (visaRegex.test(number)) {
            return 'visa';
        } else if (masterCardRegex.test(number)) {
            return 'master';
        } else if (amexRegex.test(number)) {
            return 'amex';
        } else {
            return 'Unknown';
        }
    }

    const handlePayment = async () => {
        setLoading(true);
        if (!cardNumber || !expirationMonth || !expirationYear || !securityCode || !cardholderName || !identificationNumber || !Email) {
            Verifica.showAlert('Dados em Branco', 'Por favor, preencha todas as informações e tente novamente.', 'Ok, Obrigado');
            setLoading(false);
        } else {
            try {
                const tokenResponse = await axios.post('https://api.mercadopago.com/v1/card_tokens', {
                    card_number: cardNumber,
                    expiration_month: parseInt(expirationMonth),
                    expiration_year: parseInt(20 + expirationYear),
                    security_code: securityCode,
                    cardholder: {
                        name: cardholderName,
                        identification: {
                            type: 'CPF',
                            number: identificationNumber,
                        },
                    },
                }, {
                    headers: {
                        'Authorization': 'Bearer APP_USR-7226029545915410-062814-9767f8cd123198fee77f4176756f0053-398922135',
                        'Content-Type': 'application/json'
                    },
                });

                const token = tokenResponse.data.id;

                const DataPagamento = {
                    token: token,
                    transaction_amount: fatura.valor, // valor do pagamento
                    description: `${fatura.ASSUNTO}`,
                    installments: 1,
                    payment_method_id: getCardType(cardNumber), // ou outro método
                    payer: {
                        email: Email,
                    },
                    Login: await AsyncStorage.getItem('LoginInicial'),
                    Nome: fatura.nome_plano,
                    Id: fatura.id_assinatura,
                    ASSUNTO: fatura.ASSUNTO,
                    Qtd_Mensagens: fatura.QTD_MENSAGENS || 0,
                    Cpf: identificationNumber
                };

                Socket.socket.emit('PagamentosCard', {
                    Code: Criptografar(JSON.stringify('5645345656874689877997849')),
                    Dados: Criptografar(JSON.stringify(DataPagamento))
                });

                Socket.socket.on('ResponsePagamentosCard', ((data) => {
                    const resultado = JSON.parse(Descriptografar(data.Dados));
                    const Code = JSON.parse(Descriptografar(data.Code));

                    if (Code === '5645345656874689877997849') {
                        const { ID, STATUS, FORMADEPAGAMENTO, CARTÃO, NOME, LOGIN, HORA, DATA, VALOR } = resultado;
                        setResult((prev) => ({ 
                            ...prev, 
                            Compra: STATUS, 
                            Visible: true, 
                            Login: LOGIN, 
                            Nome: NOME, 
                            Hora: HORA, 
                            Data: DATA, 
                            Valor: VALOR 
                        }));
                        setLoading(false);
                    }
                    if (Code === '56453456568746898779978491') {
                        Verifica.showAlert('Erro no pagamento', resultado, 'Ok, Obrigado!');
                        setLoading(false);
                    }
                }));

            } catch (error) {
                if (error.response) {
                    console.error('Erro ao processar pagamento:', error.response.data);
                    console.error('Status:', error.response.status);
                    console.error('Headers:', error.response.headers);
                    Alert.alert('Erro ao processar pagamento', JSON.stringify(error.response.data));
                } else if (error.request) {
                    console.error('Erro ao processar pagamento: Nenhuma resposta recebida', error.request);
                    Alert.alert('Erro ao processar pagamento', 'Nenhuma resposta recebida');
                } else {
                    console.error('Erro ao configurar solicitação:', error.message);
                    Alert.alert('Erro ao configurar solicitação', error.message);
                }
                setLoading(false);
            }

            return () => {
                Socket.socket.off('ResponsePagamentosCard');
            };
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <StatusBar 
                backgroundColor={result.Compra === 'approved' ? COLORS.success : result.Compra === 'refused' ? COLORS.danger : COLORS.primary} 
                barStyle="light-content"
            />
            <Loading visible={loading} Mensagem={"VERIFICANDO PAGAMENTO..."} />
            
            {/* Header with Gradient */}
            <LinearGradient
                colors={COLORS.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    height: headerHeight,
                    width: '100%',
                    alignItems: 'center',
                    paddingTop: 20,
                    elevation: 5,
                    shadowColor: COLORS.shadow,
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                }}
            >
                <TouchableOpacity 
                    onPress={() => navigation.goBack()}
                    style={{
                        position: 'absolute',
                        top: 20,
                        left: 20,
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        alignItems: 'center', 
                        justifyContent: 'center',
                    }}
                >
                    <Feather name="arrow-left" size={24} color={COLORS.secondary} />
                </TouchableOpacity>
                
                <Animated.View 
                    animation="pulse" 
                    iterationCount="infinite" 
                    duration={2000}
                    style={{
                        width: 85, 
                        height: 85, 
                        backgroundColor: COLORS.secondary, 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        borderRadius: 42.5,
                        marginTop: 20,
                        elevation: 5,
                        shadowColor: COLORS.shadow,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 3,
                    }}
                >
                    <View style={{ 
                        width: 80, 
                        height: 80, 
                        backgroundColor: COLORS.primary, 
                        borderRadius: 40, 
                        justifyContent: 'center', 
                        alignItems: 'center' 
                    }}>
                        <Ionicons name="card" size={40} color={COLORS.secondary} />
                    </View>
                </Animated.View>
            </LinearGradient>
            
            <ScrollView 
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingBottom: 40,
                }}
            >
                <Animated.View 
                    animation="fadeIn" 
                    duration={500}
                    style={{
                        alignItems: 'center',
                        marginTop: 20,
                        width: '100%',
                    }}
                >
                    <Text style={{ 
                        fontSize: RFValue(18), 
                        fontWeight: '600', 
                        color: COLORS.text,
                        marginBottom: 10,
                    }}>
                        Cartão de crédito ou débito
                    </Text>
                    
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 30,
                    }}>
                        <Image 
                            source={require('./../../../../assets/bandeiras.jpg')} 
                            style={{ 
                                height: 40, 
                                width: 250, 
                                resizeMode: 'contain'
                            }} 
                        />
                    </View>
                    
                    <Text style={{ 
                        fontSize: RFValue(16), 
                        fontWeight: '600', 
                        color: COLORS.textSecondary,
                        alignSelf: 'flex-start',
                        marginBottom: 15,
                    }}>
                        Dados do cartão
                    </Text>
                    
                    {/* Card Number */}
                    <Animated.View 
                        animation="fadeInUp" 
                        delay={100}
                        duration={300}
                        style={{ width: '100%', marginBottom: 15 }}
                    >
                        <TextInput
                            outlineColor={COLORS.primary}
                            activeOutlineColor={COLORS.primary}
                            style={{ 
                                height: 55, 
                                width: '100%',
                                backgroundColor: COLORS.card,
                            }}
                            mode="outlined"
                            label="Número do Cartão"
                            value={cardNumber}
                            onChangeText={setCardNumber}
                            keyboardType='numeric'
                            left={<TextInput.Icon icon="credit-card" color={COLORS.primary} />}
                            theme={{ colors: { primary: COLORS.primary } }}
                        />
                    </Animated.View>
                    
                    {/* Expiration and Security Code */}
                    <Animated.View 
                        animation="fadeInUp" 
                        delay={200}
                        duration={300}
                        style={{ 
                            flexDirection: 'row', 
                            width: '100%', 
                            justifyContent: 'space-between',
                            marginBottom: 15,
                        }}
                    >
                        <TextInput
                            outlineColor={COLORS.primary}
                            activeOutlineColor={COLORS.primary}
                            style={{ 
                                height: 55, 
                                width: '30%',
                                backgroundColor: COLORS.card,
                            }}
                            mode="outlined"
                            label="Mês"
                            value={expirationMonth}
                            onChangeText={setExpirationMonth}
                            keyboardType='numeric'
                            maxLength={2}
                            theme={{ colors: { primary: COLORS.primary } }}
                        />
                        
                        <View style={{
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Text style={{ 
                                fontSize: RFValue(18), 
                                color: COLORS.textSecondary,
                                fontWeight: '500',
                            }}>
                                /
                            </Text>
                        </View>
                        
                        <TextInput
                            outlineColor={COLORS.primary}
                            activeOutlineColor={COLORS.primary}
                            style={{ 
                                height: 55, 
                                width: '30%',
                                backgroundColor: COLORS.card,
                            }}
                            mode="outlined"
                            label="Ano"
                            value={expirationYear}
                            onChangeText={setExpirationYear}
                            keyboardType='numeric'
                            maxLength={2}
                            theme={{ colors: { primary: COLORS.primary } }}
                        />
                        
                        <TextInput
                            outlineColor={COLORS.primary}
                            activeOutlineColor={COLORS.primary}
                            style={{ 
                                height: 55, 
                                width: '30%',
                                backgroundColor: COLORS.card,
                            }}
                            mode="outlined"
                            label="CVV"
                            value={securityCode}
                            onChangeText={setSecurityCode}
                            keyboardType='numeric'
                            maxLength={4}
                            theme={{ colors: { primary: COLORS.primary } }}
                            right={<TextInput.Icon icon="help-circle" color={COLORS.primary} />}
                        />
                    </Animated.View>
                    
                    {/* Cardholder Name */}
                    <Animated.View 
                        animation="fadeInUp" 
                        delay={300}
                        duration={300}
                        style={{ width: '100%', marginBottom: 15 }}
                    >
                        <TextInput
                            outlineColor={COLORS.primary}
                            activeOutlineColor={COLORS.primary}
                            style={{ 
                                height: 55, 
                                width: '100%',
                                backgroundColor: COLORS.card,
                            }}
                            mode="outlined"
                            label="Nome do Titular"
                            value={cardholderName}
                            onChangeText={setCardholderName}
                            left={<TextInput.Icon icon="account" color={COLORS.primary} />}
                            theme={{ colors: { primary: COLORS.primary } }}
                        />
                    </Animated.View>
                    
                    {/* CPF */}
                    <Animated.View 
                        animation="fadeInUp" 
                        delay={400}
                        duration={300}
                        style={{ width: '100%', marginBottom: 30 }}
                    >
                        <TextInput
                            outlineColor={COLORS.primary}
                            activeOutlineColor={COLORS.primary}
                            style={{ 
                                height: 55, 
                                width: '100%',
                                backgroundColor: COLORS.card,
                            }}
                            mode="outlined"
                            label="CPF"
                            value={identificationNumber}
                            onChangeText={setIdentificationNumber}
                            keyboardType='numeric'
                            left={<TextInput.Icon icon="card-account-details" color={COLORS.primary} />}
                            theme={{ colors: { primary: COLORS.primary } }}
                        />
                    </Animated.View>
                    
                    <Text style={{ 
                        fontSize: RFValue(16), 
                        fontWeight: '600', 
                        color: COLORS.textSecondary,
                        alignSelf: 'flex-start',
                        marginBottom: 15,
                    }}>
                        Dados do comprador
                    </Text>
                    
                    {/* Email */}
                    <Animated.View 
                        animation="fadeInUp" 
                        delay={500}
                        duration={300}
                        style={{ width: '100%', marginBottom: 30 }}
                    >
                        <TextInput
                            outlineColor={COLORS.primary}
                            activeOutlineColor={COLORS.primary}
                            style={{ 
                                height: 55, 
                                width: '100%',
                                backgroundColor: COLORS.card,
                            }}
                            mode="outlined"
                            label="Email"
                            value={Email}
                            onChangeText={setEmail}
                            keyboardType='email-address'
                            left={<TextInput.Icon icon="email" color={COLORS.primary} />}
                            theme={{ colors: { primary: COLORS.primary } }}
                        />
                    </Animated.View>
                    
                    {/* Order Summary */}
                    <Animated.View 
                        animation="fadeInUp" 
                        delay={600}
                        duration={300}
                        style={{
                            width: '100%',
                            backgroundColor: COLORS.card,
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 30,
                            elevation: 2,
                            shadowColor: COLORS.shadow,
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.1,
                            shadowRadius: 2,
                        }}
                    >
                        <Text style={{ 
                            fontSize: RFValue(14), 
                            fontWeight: '600', 
                            color: COLORS.text,
                            marginBottom: 10,
                        }}>
                            Resumo da Compra
                        </Text>
                        
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 6,
                        }}>
                            <Text style={{ 
                                fontSize: RFValue(13), 
                                color: COLORS.textSecondary,
                            }}>
                                Plano
                            </Text>
                            <Text style={{ 
                                fontSize: RFValue(13), 
                                fontWeight: '500', 
                                color: COLORS.text,
                            }}>
                                {fatura.nome_plano}
                            </Text>
                        </View>
                        
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: 6,
                        }}>
                            <Text style={{ 
                                fontSize: RFValue(14), 
                                fontWeight: '600', 
                                color: COLORS.textSecondary,
                            }}>
                                Valor Total
                            </Text>
                            <Text style={{ 
                                fontSize: RFValue(18), 
                                fontWeight: '700', 
                                color: COLORS.primary,
                            }}>
                                R$ {parseFloat(fatura.valor).toFixed(2)}
                            </Text>
                        </View>
                    </Animated.View>
                    
                    {/* Pay Button */}
                    <Animated.View 
                        animation="fadeInUp" 
                        delay={700}
                        duration={300}
                        style={{ width: '100%' }}
                    >
                        <TouchableOpacity 
                            onPress={handlePayment}
                            style={{
                                backgroundColor: COLORS.primary,
                                width: '100%',
                                height: 55,
                                borderRadius: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                elevation: 2,
                                shadowColor: COLORS.shadow,
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.2,
                                shadowRadius: 3,
                            }}
                        >
                            <Feather name="lock" size={20} color={COLORS.secondary} style={{ marginRight: 10 }} />
                            <Text style={{ 
                                fontSize: RFValue(16), 
                                fontWeight: '600', 
                                color: COLORS.secondary,
                            }}>
                                Pagar R$ {parseFloat(fatura.valor).toFixed(2)}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>
            </ScrollView>
            
            {/* Result Modal */}
            <Resultado dados={result} />
        </SafeAreaView>
    );
};

export default App;