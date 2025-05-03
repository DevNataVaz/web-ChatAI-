import { View, Text, Modal, Dimensions, TouchableOpacity, Image, StatusBar, SafeAreaView } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Animated from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { RFValue } from "react-native-responsive-fontsize";

// Nubank inspired colors
const COLORS = {
  primary: '#8A05BE',       // Main purple
  primaryLight: '#9928C3',  // Lighter purple
  primaryDark: '#6D0499',   // Darker purple
  primaryGradient: ['#8A05BE', '#9928C3', '#AB3FE5'], // Purple gradient
  accent: '#00A1FC',        // Accent blue color for highlights
  pixPurple: '#916bfb',     // Original Pix purple
  secondary: '#FFFFFF',     // White
  background: '#F5F5F7',    // Light background
  card: '#FFFFFF',          // Card background
  text: '#333333',          // Primary text
  textSecondary: '#777777', // Secondary text
  shadow: '#000000',        // Shadow color
  success: '#00a650',       // Success green
  warning: '#ff7733',       // Warning orange
  danger: '#f23d4f',        // Danger red
  border: '#E0E0E0',        // Border color
};

export default function Pagamentos({ dados }) {
    const navigate = useNavigation();
    const windowWidth = Dimensions.get('window').width;
    const windowHeight = Dimensions.get('window').height;
    const headerHeight = windowHeight * 0.20;

    const getStatusColor = () => {
        if (dados.Compra === 'approved') return COLORS.success;
        if (dados.Compra === 'rejected') return COLORS.danger;
        if (dados.Compra === 'in_process') return COLORS.warning;
        return COLORS.primary;
    };

    const getStatusIcon = () => {
        if (dados.Compra === 'approved') return "checkmark";
        if (dados.Compra === 'rejected') return "close-circle";
        if (dados.Compra === 'in_process') return "time";
        return "help-circle";
    };

    const getStatusTitle = () => {
        if (dados.Compra === 'approved') return "Seu pagamento foi aprovado";
        if (dados.Compra === 'rejected') return "Não foi possível processar seu pagamento";
        if (dados.Compra === 'in_process') return "Estamos processando seu pagamento";
        return "";
    };

    const getStatusDescription = () => {
        if (dados.Compra === 'in_process') {
            return "Não se preocupe, em até 2 dias úteis, vamos te avisar por e-mail se o pagamento foi aprovado.";
        }
        return "";
    };

    const getButtonText = () => {
        if (dados.Compra === 'rejected') return "Escolher outro meio de pagamento";
        return "Voltar à loja";
    };

    return (
        <Modal visible={dados.Visible} animationType="slide" transparent={false}>
            {dados.Compra && (
                <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
                    <StatusBar 
                        backgroundColor={getStatusColor()} 
                        barStyle="light-content"
                    />
                    
                    {/* Header with Gradient */}
                    <LinearGradient
                        colors={[getStatusColor(), getStatusColor(), getStatusColor()]}
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
                                backgroundColor: getStatusColor(), 
                                borderRadius: 40, 
                                justifyContent: 'center', 
                                alignItems: 'center' 
                            }}>
                                <Feather name={getStatusIcon()} size={40} color={COLORS.secondary} />
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
                            duration={600}
                            style={{
                                alignItems: 'center',
                                marginTop: 30,
                                marginBottom: 30,
                                paddingHorizontal: 20,
                            }}
                        >
                            <Text style={{ 
                                fontSize: RFValue(20), 
                                fontWeight: '700', 
                                textAlign: 'center',
                                color: COLORS.text,
                                marginBottom: getStatusDescription() ? 10 : 0,
                            }}>
                                {getStatusTitle()}
                            </Text>
                            
                            {getStatusDescription() && (
                                <Text style={{ 
                                    fontSize: RFValue(14), 
                                    fontWeight: '400', 
                                    textAlign: 'center',
                                    color: COLORS.textSecondary,
                                }}>
                                    {getStatusDescription()}
                                </Text>
                            )}
                        </Animated.View>
                        
                        {/* Payment Card */}
                        <Animated.View 
                            animation="fadeInUp" 
                            delay={200}
                            duration={300}
                            style={{ 
                                width: '100%',
                                backgroundColor: COLORS.card,
                                borderRadius: 15,
                                overflow: 'hidden',
                                marginBottom: 16,
                                elevation: 2,
                                shadowColor: COLORS.shadow,
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                            }}
                        >
                            <View style={{ 
                                padding: 20,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                                <View style={{ 
                                    width: 48, 
                                    height: 48, 
                                    borderRadius: 24,
                                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    marginRight: 16,
                                    overflow: 'hidden',
                                }}>
                                    <Image 
                                        source={require('./../../../../assets/mercadopago.png')} 
                                        style={{ 
                                            width: 35, 
                                            height: 35,
                                        }} 
                                    />
                                </View>
                                <View>
                                    <Text style={{ 
                                        fontSize: RFValue(16),
                                        fontWeight: '600',
                                        color: COLORS.text,
                                        marginBottom: 4,
                                    }}>
                                        R$ {dados.Valor ? dados.Valor.toFixed(2) : '0.00'}
                                    </Text>
                                    <Text style={{ 
                                        fontSize: RFValue(12),
                                        color: COLORS.textSecondary,
                                    }}>
                                        Pago pelo Mercado Pago
                                    </Text>
                                </View>
                            </View>
                        </Animated.View>
                        
                        {/* Description Card */}
                        <Animated.View 
                            animation="fadeInUp" 
                            delay={300}
                            duration={300}
                            style={{ 
                                width: '100%',
                                backgroundColor: COLORS.card,
                                borderRadius: 15,
                                overflow: 'hidden',
                                marginBottom: 16,
                                elevation: 2,
                                shadowColor: COLORS.shadow,
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                            }}
                        >
                            <View style={{ 
                                padding: 20,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                                <View style={{ 
                                    width: 48, 
                                    height: 48, 
                                    borderRadius: 24,
                                    backgroundColor: 'rgba(145, 107, 251, 0.1)',
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    marginRight: 16,
                                }}>
                                    <Feather name="shopping-bag" size={20} color={COLORS.pixPurple} />
                                </View>
                                <View>
                                    <Text style={{ 
                                        fontSize: RFValue(14),
                                        fontWeight: '600',
                                        color: COLORS.text,
                                        marginBottom: 4,
                                    }}>
                                        Descrição
                                    </Text>
                                    <Text style={{ 
                                        fontSize: RFValue(12),
                                        color: COLORS.textSecondary,
                                    }}>
                                        Animus ChatPro Point
                                    </Text>
                                </View>
                            </View>
                        </Animated.View>
                        
                        {/* Plan Card */}
                        <Animated.View 
                            animation="fadeInUp" 
                            delay={400}
                            duration={300}
                            style={{ 
                                width: '100%',
                                backgroundColor: COLORS.card,
                                borderRadius: 15,
                                overflow: 'hidden',
                                marginBottom: 30,
                                elevation: 2,
                                shadowColor: COLORS.shadow,
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                            }}
                        >
                            <View style={{ 
                                padding: 20,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                                <View style={{ 
                                    width: 48, 
                                    height: 48, 
                                    borderRadius: 24,
                                    backgroundColor: 'rgba(145, 107, 251, 0.1)',
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    marginRight: 16,
                                }}>
                                    <Feather name="shield" size={20} color={COLORS.pixPurple} />
                                </View>
                                <View>
                                    <Text style={{ 
                                        fontSize: RFValue(14),
                                        fontWeight: '600',
                                        color: COLORS.text,
                                        marginBottom: 4,
                                    }}>
                                        Plano {dados.Nome}
                                    </Text>
                                    <Text style={{ 
                                        fontSize: RFValue(12),
                                        color: COLORS.textSecondary,
                                    }}>
                                        {dados.Data} às {dados.Hora} h.
                                    </Text>
                                </View>
                            </View>
                        </Animated.View>
                        
                        {/* Action Button */}
                        <Animated.View 
                            animation="fadeInUp" 
                            delay={500}
                            duration={300}
                            style={{ width: '100%' }}
                        >
                            <TouchableOpacity 
                                onPress={() => navigate.navigate('TabFaturas')}
                                style={{
                                    backgroundColor: COLORS.pixPurple,
                                    width: '100%',
                                    paddingVertical: 15,
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
                                <Text style={{ 
                                    fontSize: RFValue(16), 
                                    fontWeight: '600', 
                                    color: COLORS.secondary,
                                }}>
                                    {getButtonText()}
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </ScrollView>
                </SafeAreaView>
            )}
        </Modal>
    );
}

// Adicionar o ScrollView que faltou na importação
import { ScrollView } from 'react-native';