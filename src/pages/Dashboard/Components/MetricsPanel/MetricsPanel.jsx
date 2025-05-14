import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer
} from 'recharts';

import { 
  ChevronDown, ChevronUp, Activity, DollarSign, 
  Send, CreditCard, MessageSquare, Clock, 
  Zap, Award, BarChart2, 
  Calendar, Filter, TrendingUp, Target, ShoppingBag
} from 'lucide-react';

const MetricsPanel = ({ metrics, user }) => {
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(false);
  const [conversationData, setConversationData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [expensesData, setExpensesData] = useState([]);
  const [messageUsage, setMessageUsage] = useState(null);
  const [conversionData, setConversionData] = useState([]);
  const [dispatches, setDispatches] = useState({});
  const [connections, setConnections] = useState(null);
  const [sales, setSales] = useState([]);
  const [conversionRate, setConversionRate] = useState(0);
  const [activeMetric, setActiveMetric] = useState('conversas');
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipData, setTooltipData] = useState({});
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // Paleta de cores aprimorada para todo o dashboard
  const COLORS = {
    primary: '#6366f1',
    primaryLight: '#818cf8',
    primaryDark: '#4f46e5',
    primaryTransparent: 'rgba(99, 102, 241, 0.1)',
    secondary: '#3b82f6',
    secondaryLight: '#60a5fa',
    secondaryTransparent: 'rgba(59, 130, 246, 0.1)',
    success: '#10b981',
    successLight: '#34d399',
    successTransparent: 'rgba(16, 185, 129, 0.1)',
    warning: '#f59e0b',
    warningLight: '#fbbf24',
    warningTransparent: 'rgba(245, 158, 11, 0.1)',
    danger: '#ef4444',
    dangerLight: '#f87171',
    dangerTransparent: 'rgba(239, 68, 68, 0.1)',
    info: '#0ea5e9',
    infoLight: '#38bdf8',
    infoTransparent: 'rgba(14, 165, 233, 0.1)',
    purple: '#8b5cf6',
    purpleLight: '#a78bfa',
    purpleTransparent: 'rgba(139, 92, 246, 0.1)',
    pink: '#ec4899',
    teal: '#14b8a6',
    indigo: '#4f46e5',
    background: '#f8fafc',
    backgroundDark: '#f1f5f9',
    backgroundCard: '#ffffff',
    darkBackground: '#1f2937',
    text: '#1f2937',
    textSecondary: '#4b5563',
    lightText: '#6b7280',
    surface: '#ffffff',
    surfaceHover: '#f3f4f6',
    border: '#e5e7eb',
    borderHover: '#d1d5db',
  };

  // Paleta para gráficos
  const CHART_COLORS = [
    COLORS.primary,
    COLORS.secondary,
    COLORS.success,
    COLORS.warning,
    COLORS.danger,
    COLORS.info,
    COLORS.purple,
    COLORS.pink
  ];

  useEffect(() => {
    fetchMetricsData();
  }, [timeRange]);

  const fetchMetricsData = async () => {
    setLoading(true);
    try {
      // Simular tempo de carregamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Gerar dados fictícios para demonstração
      generateMockData();
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    generateMockConversationData();
    generateMockFinancialData();
    generateMockDispatchData();
    generateMockConversionData();
    generateMockConnectionData();
    generateMockSalesData();
  };

  const generateMockConversationData = () => {
    const data = [];
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
    
    const endDate = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(endDate.getDate() - i);
      
      const dayFactor = (days - i) / days;
      const randomFactor = Math.random() * 0.3 + 0.85;
      const baseFactor = 1 + (dayFactor * 0.5);
      
      const conversations = Math.floor((Math.random() * 20 + 30) * baseFactor * randomFactor);
      const messages = Math.floor(conversations * (Math.random() * 3 + 2));
      const satisfaction = Math.min(98, Math.floor(85 + Math.random() * 10 + (dayFactor * 5)));
      
      data.push({
        fullDate: date,
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        weekday: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        conversations,
        messages,
        satisfaction
      });
    }
    
    setConversationData(data);
  };

  const generateMockFinancialData = () => {
    const revenueData = [];
    const expensesData = [];
    const months = timeRange === 'week' ? 6 : timeRange === 'month' ? 12 : 24;
    
    const monthNames = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    
    const currentMonth = new Date().getMonth();
    
    for (let i = months - 1; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const month = monthNames[monthIndex];
      
      const baseTrend = 1 + ((months - i) / months) * 0.8;
      const seasonality = 1 + Math.sin(monthIndex / 12 * Math.PI * 2) * 0.2;
      const randomness = 0.9 + Math.random() * 0.2;
      
      const revenue = Math.floor(10000 * baseTrend * seasonality * randomness);
      
      const expenseFactor = 0.6 + Math.random() * 0.2;
      const expenses = Math.floor(revenue * expenseFactor);
      
      revenueData.push({
        month,
        revenue,
        profit: revenue - expenses
      });
      
      expensesData.push({
        month,
        marketing: Math.floor(expenses * 0.4),
        operacional: Math.floor(expenses * 0.35),
        infraestrutura: Math.floor(expenses * 0.25)
      });
    }
    
    setRevenueData(revenueData);
    setExpensesData(expensesData);
  };
  
  const generateMockDispatchData = () => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
    
    const totalDispatched = Math.floor(10000 + Math.random() * 5000);
    const delivered = Math.floor(totalDispatched * (0.95 + Math.random() * 0.04));
    const opened = Math.floor(delivered * (0.5 + Math.random() * 0.3));
    const clicked = Math.floor(opened * (0.2 + Math.random() * 0.2));
    
    const dailyData = [];
    const endDate = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(endDate.getDate() - i);
      
      const dayOfWeek = date.getDay();
      const businessDayFactor = (dayOfWeek > 0 && dayOfWeek < 6) ? (1.2 + Math.random() * 0.3) : (0.6 + Math.random() * 0.2);
      
      const dailyDispatched = Math.floor((totalDispatched / days) * businessDayFactor);
      const dailyDelivered = Math.floor(dailyDispatched * (0.95 + Math.random() * 0.04));
      const dailyOpened = Math.floor(dailyDelivered * (0.4 + Math.random() * 0.3));
      const dailyClicked = Math.floor(dailyOpened * (0.1 + Math.random() * 0.3));
      
      dailyData.push({
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        dispatched: dailyDispatched,
        delivered: dailyDelivered,
        opened: dailyOpened,
        clicked: dailyClicked
      });
    }
    
    setDispatches({
      total: totalDispatched,
      delivered,
      opened,
      clicked,
      deliveryRate: (delivered / totalDispatched) * 100,
      openRate: (opened / delivered) * 100,
      clickRate: (clicked / opened) * 100,
      dailyData
    });
  };
  
  const generateMockConversionData = () => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
    
    const conversionRate = 2.5 + Math.random() * 1.5;
    setConversionRate(conversionRate);
    
    const data = [];
    const endDate = new Date();
    
    let cumulativeLeads = 0;
    let cumulativeConversions = 0;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(endDate.getDate() - i);
      
      const improvementFactor = 1 + ((days - i) / days) * 0.3;
      const dayOfWeek = date.getDay();
      const businessDayFactor = (dayOfWeek > 0 && dayOfWeek < 6) ? 1.1 : 0.7;
      const randomFactor = 0.9 + Math.random() * 0.2;
      
      const dailyLeads = Math.floor(100 * businessDayFactor * randomFactor);
      const dailyConversions = Math.floor(dailyLeads * (conversionRate / 100) * improvementFactor);
      const dailyValue = Math.floor(dailyConversions * (Math.random() * 50 + 150));
      
      cumulativeLeads += dailyLeads;
      cumulativeConversions += dailyConversions;
      
      data.push({
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        leads: dailyLeads,
        conversions: dailyConversions,
        value: dailyValue,
        rate: (dailyConversions / dailyLeads) * 100
      });
    }
    
    setConversionData({
      data,
      totalLeads: cumulativeLeads,
      totalConversions: cumulativeConversions,
      totalValue: data.reduce((sum, item) => sum + item.value, 0),
      avgConversionRate: (cumulativeConversions / cumulativeLeads) * 100,
      sources: [
        { name: 'Campanhas de Email', value: 35 + Math.floor(Math.random() * 10) },
        { name: 'Redes Sociais', value: 25 + Math.floor(Math.random() * 10) },
        { name: 'Orgânico', value: 20 + Math.floor(Math.random() * 8) },
        { name: 'Referências', value: 15 + Math.floor(Math.random() * 5) },
        { name: 'Outros', value: 5 + Math.floor(Math.random() * 5) }
      ]
    });
  };
  
  const generateMockConnectionData = () => {
    const saldo = Math.floor(5000 + Math.random() * 10000);
    
    setConnections({
      saldo,
      userId: Math.floor(1000 + Math.random() * 9000)
    });
    
    const limit = 100000;
    const current = Math.floor(limit * (0.3 + Math.random() * 0.5));
    
    setMessageUsage({
      current,
      limit,
      percentage: (current / limit) * 100
    });
  };
  
  const generateMockSalesData = () => {
    const salesCount = 20;
    const sales = [];
    
    for (let i = 0; i < salesCount; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      date.setHours(Math.floor(Math.random() * 24));
      date.setMinutes(Math.floor(Math.random() * 60));
      
      const valor = Math.floor(100 + Math.random() * 900);
      
      sales.push({
        ID_PAGAMENTO: `PAG-${Math.floor(10000 + Math.random() * 90000)}`,
        DATA: date.toLocaleDateString('pt-BR'),
        HORA: date.toLocaleTimeString('pt-BR'),
        VALOR: valor,
        CLIENTE: `Cliente ${Math.floor(1000 + Math.random() * 9000)}`,
        STATUS: ['Concluído', 'Processando', 'Concluído', 'Concluído'][Math.floor(Math.random() * 4)]
      });
    }
    
    sales.sort((a, b) => {
      const dateA = new Date(`${a.DATA} ${a.HORA}`);
      const dateB = new Date(`${b.DATA} ${b.HORA}`);
      return dateB - dateA;
    });
    
    setSales(sales);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const calculateTotalRevenue = () => {
    return sales.reduce((total, sale) => total + Number(sale.VALOR), 0);
  };

  const calculateAverageTicket = () => {
    if (sales.length === 0) return 0;
    return calculateTotalRevenue() / sales.length;
  };
  
  const getGrowthClass = (value) => {
    return value >= 0 ? "metricTrend positive" : "metricTrend negative";
  };
  
  const getGrowthIcon = (value) => {
    return value >= 0 
      ? <ChevronUp size={14} />
      : <ChevronDown size={14} />;
  };
  
  const handleMetricCardHover = (data, event) => {
    setTooltipData(data);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
    setShowTooltip(true);
  };
  
  const handleMetricCardLeave = () => {
    setShowTooltip(false);
  };

  return (
    <div style={{
      height: '1550%',
      padding: 0,
      backgroundColor: COLORS.background,
      borderRadius: '0.75rem',
      color: COLORS.text,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      border: `1px solid ${COLORS.border}`,
      overflow: 'hidden',
    }}>
      {/* Cabeçalho do Dashboard */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.25rem 1.5rem',
        borderBottom: `1px solid ${COLORS.border}`,
        backgroundColor: COLORS.backgroundCard,
        borderRadius: '0.75rem 0.75rem 0 0',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: COLORS.text,
            margin: 0,
          }}>Dashboard</h2>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            color: COLORS.lightText,
          }}>
            <span>Métricas</span>
            <span style={{ color: COLORS.border, margin: '0 0.375rem' }}>/</span>
            <span style={{
              color: COLORS.primary,
              fontWeight: 500,
            }}>Análise de Desempenho</span>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: COLORS.backgroundCard,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '0.5rem',
            padding: '0.5rem 0.75rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}>
            <Calendar size={16} color={COLORS.lightText} />
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              style={{
                border: 'none',
                fontSize: '0.875rem',
                color: COLORS.textSecondary,
                background: 'transparent',
                cursor: 'pointer',
                paddingRight: '1.5rem',
                appearance: 'none',
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right center',
                backgroundSize: '1rem',
              }}
            >
              <option value="week">7 dias</option>
              <option value="month">30 dias</option>
              <option value="quarter">90 dias</option>
            </select>
          </div>
          
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: COLORS.backgroundCard,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '0.5rem',
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            color: COLORS.textSecondary,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontWeight: 500,
          }}>
            <Filter size={16} />
            <span>Filtros</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem 0',
          gap: '1rem',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `4px solid ${COLORS.border}`,
            borderTop: `4px solid ${COLORS.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}></div>
          <p style={{ color: COLORS.lightText, fontSize: '0.875rem' }}>Carregando métricas...</p>
        </div>
      ) : (
        <>
          {/* Layout principal do dashboard */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '280px 1fr 300px',
            gap: '1.25rem',
            padding: '1.25rem',
            height: 'calc(100vh - 230px)',
            overflow: 'auto',
          }}>
            {/* Coluna de KPIs */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              overflow: 'hidden',
            }}>
              {/* Título da seção */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                padding: '0 0.25rem',
                position: 'relative',
              }}>
                <Activity size={16} color={COLORS.primary} />
                <h3 style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: COLORS.textSecondary,
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>Visão Geral</h3>
              </div>
              
              {/* Grid de cards de KPI */}
              <div style={{
                display: 'grid',
                gap: '0.875rem',
              }}>
                {/* Card de Taxa de Conversão */}
                <div 
                  style={{
                    backgroundColor: COLORS.backgroundCard,
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.875rem',
                    border: `1px solid ${COLORS.border}`,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    transform: showTooltip ? 'translateY(-2px)' : 'none',
                  }}
                  onMouseEnter={(e) => handleMetricCardHover({
                    title: 'Taxa de Conversão',
                    value: formatPercentage(conversionRate),
                    details: 'Taxa média de conversão de leads em clientes'
                  }, e)}
                  onMouseLeave={handleMetricCardLeave}
                >
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    backgroundColor: COLORS.purple
                  }}>
                    <Target size={18} color="white" />
                  </div>
                  <div style={{
                    flex: 1,
                    minWidth: 0,
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: COLORS.lightText,
                      marginBottom: '0.375rem',
                    }}>Taxa de Conversão</div>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: COLORS.text,
                      marginBottom: '0.375rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>{formatPercentage(conversionRate)}</div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      marginTop: '0.5rem',
                      color: 12.5 >= 0 ? COLORS.success : COLORS.danger,
                    }}>
                      {getGrowthIcon(12.5)}
                      <span>12,5%</span>
                    </div>
                  </div>
                </div>
                
                {/* Card de Receita */}
                <div 
                  style={{
                    backgroundColor: COLORS.backgroundCard,
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.875rem',
                    border: `1px solid ${COLORS.border}`,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => handleMetricCardHover({
                    title: 'Receita Total',
                    value: formatCurrency(calculateTotalRevenue()),
                    details: 'Receita total gerada no período selecionado'
                  }, e)}
                  onMouseLeave={handleMetricCardLeave}
                >
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    backgroundColor: COLORS.success
                  }}>
                    <DollarSign size={18} color="white" />
                  </div>
                  <div style={{
                    flex: 1,
                    minWidth: 0,
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: COLORS.lightText,
                      marginBottom: '0.375rem',
                    }}>Receita</div>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: COLORS.text,
                      marginBottom: '0.375rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>{formatCurrency(calculateTotalRevenue())}</div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      marginTop: '0.5rem',
                      color: 18.3 >= 0 ? COLORS.success : COLORS.danger,
                    }}>
                      {getGrowthIcon(18.3)}
                      <span>18,3%</span>
                    </div>
                  </div>
                </div>
                
                {/* Card de Disparos */}
                <div 
                  style={{
                    backgroundColor: COLORS.backgroundCard,
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.875rem',
                    border: `1px solid ${COLORS.border}`,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => handleMetricCardHover({
                    title: 'Total de Disparos',
                    value: formatNumber(dispatches.total || 0),
                    details: `Taxa de entrega: ${formatPercentage(dispatches.deliveryRate || 0)}`
                  }, e)}
                  onMouseLeave={handleMetricCardLeave}
                >
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    backgroundColor: COLORS.info
                  }}>
                    <Send size={18} color="white" />
                  </div>
                  <div style={{
                    flex: 1,
                    minWidth: 0,
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: COLORS.lightText,
                      marginBottom: '0.375rem',
                    }}>Disparos</div>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: COLORS.text,
                      marginBottom: '0.375rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>{formatNumber(dispatches.total || 0)}</div>
                    <div style={{ fontSize: '0.75rem', color: COLORS.lightText }}>
                      Entregas: <strong>{formatPercentage(dispatches.deliveryRate || 0)}</strong>
                    </div>
                  </div>
                </div>
                
                {/* Card de Despesas */}
                <div 
                  style={{
                    backgroundColor: COLORS.backgroundCard,
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.875rem',
                    border: `1px solid ${COLORS.border}`,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => handleMetricCardHover({
                    title: 'Total de Despesas',
                    value: formatCurrency(expensesData.reduce((sum, item) => 
                      sum + item.marketing + item.operacional + item.infraestrutura, 0)),
                    details: 'Total de despesas operacionais no período'
                  }, e)}
                  onMouseLeave={handleMetricCardLeave}
                >
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    backgroundColor: COLORS.danger
                  }}>
                    <CreditCard size={18} color="white" />
                  </div>
                  <div style={{
                    flex: 1,
                    minWidth: 0,
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: COLORS.lightText,
                      marginBottom: '0.375rem',
                    }}>Despesas</div>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: COLORS.text,
                      marginBottom: '0.375rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {formatCurrency(expensesData.reduce((sum, item) => 
                        sum + item.marketing + item.operacional + item.infraestrutura, 0))}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      marginTop: '0.5rem',
                      color: -4.2 >= 0 ? COLORS.success : COLORS.danger,
                    }}>
                      {getGrowthIcon(-4.2)}
                      <span>4,2%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Cartão de uso de mensagens */}
              {messageUsage && (
                <div style={{
                  backgroundColor: COLORS.backgroundCard,
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
                  border: `1px solid ${COLORS.border}`,
                  transition: 'all 0.2s ease',
                  marginTop: '0.5rem',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.875rem',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}>
                      <MessageSquare size={16} color={COLORS.primary} />
                      <h3 style={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: COLORS.textSecondary,
                        margin: 0,
                      }}>Uso de Mensagens</h3>
                    </div>
                    <div style={{
                      fontSize: '0.975rem',
                      fontWeight: 600,
                      color: COLORS.text,
                    }}>
                      {formatNumber(messageUsage.current)} / {formatNumber(messageUsage.limit)}
                    </div>
                  </div>
                  
                  {/* Barra de progresso */}
                  <div style={{
                    backgroundColor: COLORS.backgroundDark,
                    height: '0.5rem',
                    borderRadius: '999px',
                    overflow: 'hidden',
                    marginBottom: '0.5rem',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${messageUsage.percentage}%`,
                      backgroundColor: messageUsage.percentage > 80 ? COLORS.danger : COLORS.primary,
                      borderRadius: '999px',
                      transition: 'width 0.5s ease',
                    }}></div>
                  </div>
                  
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: COLORS.lightText, 
                    textAlign: 'right' 
                  }}>
                    {formatPercentage(messageUsage.percentage)} utilizado
                  </div>
                </div>
              )}
              
              {/* Cartão de tempo de resposta */}
              <div style={{
                backgroundColor: COLORS.backgroundCard,
                borderRadius: '0.75rem',
                padding: '1rem',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
                border: `1px solid ${COLORS.border}`,
                transition: 'all 0.2s ease',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.875rem',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <Clock size={16} color={COLORS.secondary} />
                    <h3 style={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: COLORS.textSecondary,
                      margin: 0,
                    }}>Tempo de Resposta</h3>
                  </div>
                  <div style={{
                    fontSize: '0.975rem',
                    fontWeight: 600,
                    color: COLORS.text,
                  }}>27s</div>
                </div>
                
                <div style={{
                  backgroundColor: COLORS.backgroundDark,
                  height: '0.5rem',
                  borderRadius: '999px',
                  overflow: 'hidden',
                  marginBottom: '0.5rem',
                }}>
                  <div style={{
                    height: '100%',
                    width: '85%',
                    backgroundColor: COLORS.success,
                    borderRadius: '999px',
                    transition: 'width 0.5s ease',
                  }}></div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  marginTop: '0.5rem',
                  color: 15 >= 0 ? COLORS.success : COLORS.danger,
                  justifyContent: 'flex-end',
                }}>
                  {getGrowthIcon(15)}
                  <span>15% melhor que a média</span>
                </div>
              </div>
              
              {/* Cartão de total de conversas */}
              <div style={{
                backgroundColor: COLORS.backgroundCard,
                borderRadius: '0.75rem',
                padding: '1rem',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
                border: `1px solid ${COLORS.border}`,
                transition: 'all 0.2s ease',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.875rem',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <MessageSquare size={16} color={COLORS.purple} />
                    <h3 style={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: COLORS.textSecondary,
                      margin: 0,
                    }}>Total de Conversas</h3>
                  </div>
                  <div style={{
                    fontSize: '0.975rem',
                    fontWeight: 600,
                    color: COLORS.text,
                  }}>
                    {formatNumber(conversationData.reduce((acc, curr) => acc + curr.conversations, 0))}
                  </div>
                </div>
                
                {/* Mini gráfico */}
                <div style={{
                  marginTop: '0.875rem',
                  height: '60px',
                }}>
                  <ResponsiveContainer width="100%" height={60}>
                    <AreaChart data={conversationData.slice(-7)}>
                      <defs>
                        <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="conversations" 
                        stroke={COLORS.primary} 
                        strokeWidth={2}
                        fill="url(#colorConv)"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* Coluna de Gráficos */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              overflow: 'hidden',
            }}>
              {/* Tabs para gráficos principais */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                padding: '0 0.25rem',
              }}>
                <button 
                  onClick={() => setActiveMetric('conversas')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    border: activeMetric === 'conversas' ? `1px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
                    borderRadius: '0.5rem',
                    background: activeMetric === 'conversas' ? COLORS.primary : COLORS.backgroundCard,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: activeMetric === 'conversas' ? COLORS.backgroundCard : COLORS.lightText,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <BarChart2 size={16} />
                  <span>Conversas</span>
                </button>
                <button 
                  onClick={() => setActiveMetric('mensagens')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    border: activeMetric === 'mensagens' ? `1px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
                    borderRadius: '0.5rem',
                    background: activeMetric === 'mensagens' ? COLORS.primary : COLORS.backgroundCard,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: activeMetric === 'mensagens' ? COLORS.backgroundCard : COLORS.lightText,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <MessageSquare size={16} />
                  <span>Mensagens</span>
                </button>
                <button 
                  onClick={() => setActiveMetric('satisfacao')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    border: activeMetric === 'satisfacao' ? `1px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
                    borderRadius: '0.5rem',
                    background: activeMetric === 'satisfacao' ? COLORS.primary : COLORS.backgroundCard,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: activeMetric === 'satisfacao' ? COLORS.backgroundCard : COLORS.lightText,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Award size={16} />
                  <span>Satisfação</span>
                </button>
              </div>
              
              {/* Gráfico principal */}
              <div style={{
                backgroundColor: COLORS.backgroundCard,
                borderRadius: '0.75rem',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
                padding: '1rem',
                border: `1px solid ${COLORS.border}`,
                transition: 'all 0.2s ease',
                height: '300px',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}>
                  <h3 style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: COLORS.textSecondary,
                    margin: 0,
                  }}>
                    {activeMetric === 'conversas' ? 'Evolução de Conversas' : 
                     activeMetric === 'mensagens' ? 'Volume de Mensagens' : 
                     'Índice de Satisfação'}
                  </h3>
                </div>
                
                {/* Gráfico principal Recharts */}
                <ResponsiveContainer width="100%" height={270}>
                  <LineChart 
                    data={conversationData}
                    margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.border} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: COLORS.lightText, fontSize: 12 }}
                    />
                    <YAxis 
                      yAxisId="left"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: COLORS.lightText, fontSize: 12 }}
                      width={40}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 100]}
                      hide={activeMetric !== 'satisfacao'}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: COLORS.lightText, fontSize: 12 }}
                      width={40}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: COLORS.backgroundCard, 
                        borderRadius: '0.5rem',
                        border: `1px solid ${COLORS.border}`,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                      }}
                      formatter={(value, name) => {
                        if (name === 'satisfaction') return [`${value}%`, 'Satisfação'];
                        if (name === 'conversations') return [value, 'Conversas'];
                        if (name === 'messages') return [value, 'Mensagens'];
                        return [value, name];
                      }}
                      labelFormatter={(label) => `Data: ${label}`}
                    />
                    
                    {/* Renderização condicional de linhas baseada na métrica ativa */}
                    {activeMetric === 'conversas' && (
                      <>
                        <defs>
                          <linearGradient id="colorConversations" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="conversations"
                          stroke={COLORS.primary}
                          fillOpacity={1}
                          fill="url(#colorConversations)"
                          yAxisId="left"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="conversations" 
                          name="Conversas" 
                          stroke={COLORS.primary} 
                          strokeWidth={3}
                          yAxisId="left"
                          dot={{ r: 3, fill: COLORS.primary, strokeWidth: 2, stroke: 'white' }}
                          activeDot={{ r: 6, fill: COLORS.primary, strokeWidth: 2, stroke: 'white' }}
                        />
                      </>
                    )}
                    
                    {activeMetric === 'mensagens' && (
                      <>
                        <defs>
                          <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="messages"
                          stroke={COLORS.secondary}
                          fillOpacity={1}
                          fill="url(#colorMessages)"
                          yAxisId="left"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="messages" 
                          name="Mensagens" 
                          stroke={COLORS.secondary} 
                          strokeWidth={3}
                          yAxisId="left"
                          dot={{ r: 3, fill: COLORS.secondary, strokeWidth: 2, stroke: 'white' }}
                          activeDot={{ r: 6, fill: COLORS.secondary, strokeWidth: 2, stroke: 'white' }}
                        />
                      </>
                    )}
                    
                    {activeMetric === 'satisfacao' && (
                      <>
                        <defs>
                          <linearGradient id="colorSatisfaction" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={COLORS.success} stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="satisfaction"
                          stroke={COLORS.success}
                          fillOpacity={1}
                          fill="url(#colorSatisfaction)"
                          yAxisId="right"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="satisfaction" 
                          name="Satisfação (%)" 
                          stroke={COLORS.success} 
                          strokeWidth={3}
                          yAxisId="right"
                          dot={{ r: 3, fill: COLORS.success, strokeWidth: 2, stroke: 'white' }}
                          activeDot={{ r: 6, fill: COLORS.success, strokeWidth: 2, stroke: 'white' }}
                        />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {/* Grid de gráficos secundários */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
              }}>
                {/* Gráfico de Receita vs. Despesas */}
                <div style={{
                  backgroundColor: COLORS.backgroundCard,
                  borderRadius: '0.75rem',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
                  padding: '1rem',
                  border: `1px solid ${COLORS.border}`,
                  transition: 'all 0.2s ease',
                  height: '260px',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                  }}>
                    <h3 style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: COLORS.textSecondary,
                      margin: 0,
                    }}>Receita vs. Despesas</h3>
                    <button style={{ 
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '0.25rem',
                      padding: '0.25rem',
                      cursor: 'pointer',
                      display: 'flex'
                    }} title="Ver detalhes">
                      <Filter size={14} color={COLORS.lightText} />
                    </button>
                  </div>
                  
                  {/* Gráfico de Barras */}
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={revenueData.slice(-4)}
                      margin={{ top: 10, right: 20, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.border} />
                      <XAxis 
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: COLORS.lightText, fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: COLORS.lightText, fontSize: 12 }}
                        tickFormatter={(value) => `${value / 1000}k`}
                        width={40}
                      />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: COLORS.backgroundCard, 
                          borderRadius: '0.5rem',
                          border: `1px solid ${COLORS.border}`,
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                        }}
                        formatter={(value) => formatCurrency(value)}
                        labelFormatter={(label) => `Mês: ${label}`}
                      />
                      <Legend 
                        verticalAlign="top" 
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '12px', color: COLORS.lightText }}
                      />
                      <Bar 
                        dataKey="revenue" 
                        name="Receita" 
                        fill={COLORS.success}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="profit" 
                        name="Lucro" 
                        fill={COLORS.primary}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Gráfico de Fontes de Conversão */}
                <div style={{
                  backgroundColor: COLORS.backgroundCard,
                  borderRadius: '0.75rem',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
                  padding: '1rem',
                  border: `1px solid ${COLORS.border}`,
                  transition: 'all 0.2s ease',
                  height: '260px',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                  }}>
                    <h3 style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: COLORS.textSecondary,
                      margin: 0,
                    }}>Fontes de Conversão</h3>
                    <button style={{ 
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '0.25rem',
                      padding: '0.25rem',
                      cursor: 'pointer',
                      display: 'flex'
                    }} title="Ver detalhes">
                      <Filter size={14} color={COLORS.lightText} />
                    </button>
                  </div>
                  
                  {/* Gráfico de Pizza */}
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={conversionData?.sources}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        innerRadius={50}
                        paddingAngle={2}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => 
                          percent > 0.1 ? `${(percent * 100).toFixed(0)}%` : ''}
                      >
                        {conversionData?.sources?.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={CHART_COLORS[index % CHART_COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: COLORS.backgroundCard, 
                          borderRadius: '0.5rem',
                          border: `1px solid ${COLORS.border}`,
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                        }}
                        formatter={(value) => `${value}%`}
                        labelFormatter={(label) => label}
                      />
                      <Legend 
                        layout="vertical" 
                        verticalAlign="middle" 
                        align="right"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '12px', color: COLORS.lightText, right: 0 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* Coluna da direita */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              overflow: 'hidden',
            }}>
              {/* Seção de Vendas Recentes */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                padding: '0 0.25rem',
                position: 'relative',
              }}>
                <ShoppingBag size={18} color={COLORS.primary} />
                <h3 style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: COLORS.textSecondary,
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>Vendas Recentes</h3>
              </div>
              
              {/* Lista de vendas */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: COLORS.backgroundCard,
                borderRadius: '0.75rem',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
                overflow: 'hidden',
                border: `1px solid ${COLORS.border}`,
                transition: 'all 0.2s ease',
              }}>
                {/* Items de vendas */}
                {sales.slice(0, 5).map((sale, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    padding: '0.875rem 1rem',
                    borderBottom: `1px solid ${COLORS.surfaceHover}`,
                    transition: 'background-color 0.15s ease',
                    backgroundColor: index % 2 === 0 ? COLORS.backgroundCard : COLORS.backgroundDark,
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      minWidth: 0,
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontFamily: "'JetBrains Mono', monospace",
                          color: COLORS.textSecondary,
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>{sale.ID_PAGAMENTO}</span>
                        <span style={{
                          fontSize: '0.625rem',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '9999px',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          backgroundColor: sale.STATUS === 'Concluído' ? COLORS.successTransparent : COLORS.warningTransparent,
                          color: sale.STATUS === 'Concluído' ? COLORS.success : COLORS.warning,
                        }}>
                          {sale.STATUS}
                        </span>
                      </div>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.125rem',
                      }}>
                        <span style={{
                          fontSize: '0.75rem',
                          color: COLORS.textSecondary,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '160px',
                        }}>{sale.CLIENTE}</span>
                        <span style={{
                          fontSize: '0.625rem',
                          color: COLORS.lightText,
                        }}>
                          {new Date(`${sale.DATA} ${sale.HORA}`).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: COLORS.text,
                    }}>
                      {formatCurrency(sale.VALOR)}
                    </div>
                  </div>
                ))}
                
                {/* Botão de ver todas */}
                <button style={{
                  padding: '0.625rem',
                  textAlign: 'center',
                  backgroundColor: COLORS.surfaceHover,
                  border: 'none',
                  borderTop: `1px solid ${COLORS.border}`,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: COLORS.primary,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                }}>
                  Ver todas as vendas
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              
              {/* Resumo Financeiro */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                padding: '0 0.25rem',
                position: 'relative',
                marginTop: '0.5rem',
              }}>
                <TrendingUp size={18} color={COLORS.primary} />
                <h3 style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: COLORS.textSecondary,
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>Resumo Financeiro</h3>
              </div>
              
              {/* Card de resumo financeiro */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: COLORS.backgroundCard,
                borderRadius: '0.75rem',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
                overflow: 'hidden',
                border: `1px solid ${COLORS.border}`,
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  borderBottom: `1px solid ${COLORS.surfaceHover}`,
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    color: COLORS.lightText,
                  }}>Receita Total:</span>
                  <strong style={{
                    fontSize: '0.875rem',
                    color: COLORS.text,
                    fontWeight: 600,
                  }}>{formatCurrency(calculateTotalRevenue())}</strong>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  borderBottom: `1px solid ${COLORS.surfaceHover}`,
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    color: COLORS.lightText,
                  }}>Ticket Médio:</span>
                  <strong style={{
                    fontSize: '0.875rem',
                    color: COLORS.text,
                    fontWeight: 600,
                  }}>{formatCurrency(calculateAverageTicket())}</strong>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  borderBottom: `1px solid ${COLORS.surfaceHover}`,
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    color: COLORS.lightText,
                  }}>Conversões:</span>
                  <strong style={{
                    fontSize: '0.875rem',
                    color: COLORS.text,
                    fontWeight: 600,
                  }}>{formatNumber(conversionData?.totalConversions || 0)}</strong>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    color: COLORS.lightText,
                  }}>Custo p/ Conversão:</span>
                  <strong style={{
                    fontSize: '0.875rem',
                    color: COLORS.text,
                    fontWeight: 600,
                  }}>{formatCurrency((expensesData.reduce((sum, item) => 
                    sum + item.marketing + item.operacional + item.infraestrutura, 0)) / 
                    (conversionData?.totalConversions || 1))}</strong>
                </div>
              </div>
              
              {/* Métricas em linha */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
              }}>
                {/* CTR */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  backgroundColor: COLORS.backgroundCard,
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
                  border: `1px solid ${COLORS.border}`,
                }}>
                  <div style={{
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: '0.375rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    backgroundColor: COLORS.primary
                  }}>
                    <Zap size={14} color="white" />
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 0,
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: COLORS.lightText,
                    }}>CTR</div>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: COLORS.text,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>{formatPercentage(dispatches.clickRate || 0)}</div>
                  </div>
                </div>
                
                {/* ROI */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  backgroundColor: COLORS.backgroundCard,
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
                  border: `1px solid ${COLORS.border}`,
                }}>
                  <div style={{
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: '0.375rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    backgroundColor: COLORS.success
                  }}>
                    <Award size={14} color="white" />
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 0,
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: COLORS.lightText,
                    }}>ROI</div>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: COLORS.text,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>238%</div>
                  </div>
                </div>
                
                {/* CAC */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  backgroundColor: COLORS.backgroundCard,
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
                  border: `1px solid ${COLORS.border}`,
                }}>
                  <div style={{
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: '0.375rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    backgroundColor: COLORS.warning
                  }}>
                    <Target size={14} color="white" />
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 0,
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: COLORS.lightText,
                    }}>CAC</div>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: COLORS.text,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>{formatCurrency(89.75)}</div>
                  </div>
                </div>
              </div>
              
              {/* Seção de Disparos e Conversões */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                padding: '0 0.25rem',
                position: 'relative',
                marginTop: '0.5rem',
              }}>
                <BarChart2 size={16} color={COLORS.primary} />
                <h3 style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: COLORS.textSecondary,
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>Disparos e Conversões</h3>
                <button style={{ 
                  marginLeft: 'auto',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '0.25rem',
                  padding: '0.25rem',
                  cursor: 'pointer',
                  display: 'flex'
                }} title="Exportar dados">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 10V16M12 16L9 13M12 16L15 13M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H14.5858C14.851 3 15.1054 3.10536 15.2929 3.29289L18.7071 6.70711C18.8946 6.89464 19 7.149 19 7.41421V19C19 20.1046 18.1046 21 17 21Z" 
                    stroke={COLORS.lightText} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              
              {/* Gráfico de conversão */}
              <div style={{
                backgroundColor: COLORS.backgroundCard,
                borderRadius: '0.75rem',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
                padding: '1rem',
                border: `1px solid ${COLORS.border}`,
                transition: 'all 0.2s ease',
                height: '220px',
              }}>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart
                    data={dispatches.dailyData?.slice(-7)}
                    margin={{ top: 10, right: 10, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.border} />
                    <XAxis 
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: COLORS.lightText, fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: COLORS.lightText, fontSize: 12 }}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: COLORS.backgroundCard, 
                        borderRadius: '0.5rem',
                        border: `1px solid ${COLORS.border}`,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                      }}
                      formatter={(value) => formatNumber(value)}
                      labelFormatter={(label) => `Data: ${label}`}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={20}
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '12px', color: COLORS.lightText }}
                    />
                    <defs>
                      <linearGradient id="colorDispatched" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.info} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={COLORS.info} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorClicked" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={COLORS.success} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="dispatched" 
                      name="Enviados" 
                      stroke={COLORS.info} 
                      fill="url(#colorDispatched)"
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="clicked" 
                      name="Clicados" 
                      stroke={COLORS.success}
                      fill="url(#colorClicked)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
            </div>
          </div>
        </>
      )}
      
      {/* Tooltip customizado */}
      {showTooltip && (
        <div 
          style={{
            position: 'fixed',
            backgroundColor: COLORS.backgroundCard,
            borderRadius: '0.5rem',
            padding: '0.75rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            zIndex: 50,
            maxWidth: '250px',
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y + 10
          }}
        >
          <div style={{
            fontSize: '0.75rem',
            color: COLORS.lightText,
            marginBottom: '0.25rem',
          }}>{tooltipData.title}</div>
          <div style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: COLORS.text,
            marginBottom: '0.5rem',
          }}>{tooltipData.value}</div>
          {tooltipData.details && (
            <div style={{
              fontSize: '0.75rem',
              color: COLORS.lightText,
            }}>{tooltipData.details}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default MetricsPanel;