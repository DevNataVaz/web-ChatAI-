import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  LineChart, Line, BarChart, Bar,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer
} from 'recharts';

import { 
  ChevronDown, ChevronUp, Activity, DollarSign, 
  Send, CreditCard, MessageSquare, Clock, 
  Zap, Award, BarChart2, TrendingUp,
  Calendar, Filter, Target, ShoppingBag,
  X, ChevronLeft, ChevronRight, User,
  Percent, Eye,
  CheckCircle, AlertCircle, Bell, 
  ArrowUpRight, ArrowDownRight, Menu,
  RefreshCcw, Package
} from 'lucide-react';

import { useApp } from '../../../../context/AppContext';
import { Criptografar, Descriptografar } from '../../../../Cripto/index';

import './MetricsPanel.css';

// Paleta de cores para o tema escuro
const COLORS = {
  background: '#0a0c1b',
  backgroundDark: '#080a17',
  backgroundLight: '#111327',
  backgroundCard: '#161a36',
  backgroundHover: '#1c2042',
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',
  primaryTransparent: 'rgba(99, 102, 241, 0.15)',
  secondary: '#3b82f6',
  secondaryLight: '#60a5fa',
  secondaryTransparent: 'rgba(59, 130, 246, 0.15)',
  success: '#10b981',
  successLight: '#34d399',
  successTransparent: 'rgba(16, 185, 129, 0.15)',
  warning: '#f59e0b',
  warningLight: '#fbbf24',
  warningTransparent: 'rgba(245, 158, 11, 0.15)',
  danger: '#ef4444',
  dangerLight: '#f87171',
  dangerTransparent: 'rgba(239, 68, 68, 0.15)',
  info: '#0ea5e9',
  infoLight: '#38bdf8',
  infoTransparent: 'rgba(14, 165, 233, 0.15)',
  purple: '#8b5cf6',
  purpleLight: '#a78bfa',
  purpleTransparent: 'rgba(139, 92, 246, 0.15)',
  pink: '#ec4899',
  teal: '#14b8a6',
  indigo: '#4f46e5',
  text: '#f3f4f6',
  textSecondary: '#9ca3af',
  border: '#1e293b',
  borderHover: '#334155',
  borderLight: '#283548',
};

const MetricsPanel = () => {
  const { user, socketConnected, isLoading: contextLoading, setIsLoading, socketService } = useApp();
  
  // States para os dados das métricas
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(false);
  const [messageUsage, setMessageUsage] = useState(null);
  const [dispatches, setDispatches] = useState({});
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipData, setTooltipData] = useState({});
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // Novos estados baseados na API
  const [despesas, setDespesas] = useState(0);
  const [disparosTotal, setDisparosTotal] = useState(0);
  const [carrinhoRecuperados, setCarrinhoRecuperados] = useState(0);
  const [valorTotalRecuperado, setValorTotalRecuperado] = useState(0);
  const [ultimosDisparos, setUltimosDisparos] = useState([]);
  const [receitaDespesasMensal, setReceitaDespesasMensal] = useState([]);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assinatura, setAssinatura] = useState(null);
  
  // Estados para funcionalidades de UI
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDateRange, setSelectedDateRange] = useState('Últimos 7 dias');
  const [selectedRange, setSelectedRange] = useState([null, null]);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const calendarRef = useRef(null);

  // Configuração do gráfico para o tema escuro
  const darkChartConfig = {
    backgroundColor: 'transparent',
    axisColor: COLORS.textSecondary,
    gridColor: COLORS.border,
    tooltipBg: COLORS.backgroundCard,
    tooltipBorder: COLORS.border,
    textColor: COLORS.text,
  };

  // Função para carregar dados do dashboard
  const fetchDashboardData = useCallback(async () => {
    if (!socketService || !user?.LOGIN) return;
    
    try {
      setLoading(true);
      
      const payload = {
        Code: '79862534568',
        login: user.LOGIN,
        startDate: startDate || null,
        endDate: endDate || null
      };
      
      socketService.emit('DadosDashboard', Criptografar(JSON.stringify(payload)));
      
      socketService.once('ResponseDashboard', (data) => {
        try {
          const { Code, Dados } = JSON.parse(Descriptografar(data));
          
          if (Code !== '45678123567') {
            setLoading(false);
            return;
          }
          
          if (Dados && !Dados.error) {
            // Atualizar com os novos campos da API
            setDespesas(Dados.despesas || 0);
            setDisparosTotal(Dados.disparos || 0);
            setCarrinhoRecuperados(Dados.carrinhos_recuperados || 0);
            setValorTotalRecuperado(Dados.valor_total_recuperado || 0);
            
            if (Dados.evolucaoDisparos && Dados.evolucaoDisparos.length > 0) {
              setUltimosDisparos(Dados.evolucaoDisparos);
            }
            
            if (Dados.receitaDespesas && Dados.receitaDespesas.length > 0) {
              setReceitaDespesasMensal(Dados.receitaDespesas);
            }
            
            generateMockNotifications();
          }
        } catch (error) {
          // console.error('Erro ao processar dados do dashboard:', error);
        } finally {
          setLoading(false);
        }
      });
    } catch (error) {
      // console.error('Erro ao buscar dados do dashboard:', error);
      setLoading(false);
    }
  }, [socketConnected, user, startDate, endDate]);

  const fetchInvoiceData = useCallback(async () => {
    if (!socketConnected || !user?.LOGIN) return;
    
    try {
      const resultado = await socketService.getFaturas(user.LOGIN);
      
      if (resultado) {
        try {
          setAssinatura({
            nome_plano: resultado.NOME_PLANO,
            status: resultado.STATUS,
            valor: parseFloat(resultado.VALOR),
            vencimento: resultado.VENCIMENTO,
            frequencia: resultado.FREQUENCIA,
            id_assinatura: resultado.ID_ASSINATURA,
            data: resultado.DATA,
            limite_mensagem: resultado.LIMITE_MENSAGEM,
            atual_mensagens: resultado.ATUAL_MENSAGENS
          });
          
          const limit = parseInt(resultado.LIMITE_MENSAGEM || 0);
          const current = parseInt(resultado.ATUAL_MENSAGENS || 0);
          
          setMessageUsage({
            current,
            limit,
            percentage: limit > 0 ? (current / limit) * 100 : 0
          });
        } catch (error) {
          // console.error('Erro ao processar dados de faturas:', error);
        }
      }
    } catch (error) {
      // console.error('Erro ao buscar dados de faturas:', error);
    }
  }, [socketConnected, user, socketService]);

  const generateMockNotifications = () => {
    const notifs = [
      {
        id: 1,
        title: 'Carrinho recuperado',
        message: 'Um carrinho foi recuperado com sucesso.',
        time: '5min atrás',
        read: false,
        type: 'success'
      },
      {
        id: 2,
        title: 'Alto uso de mensagens',
        message: 'Você está utilizando 85% do seu limite de mensagens.',
        time: '2h atrás',
        read: true,
        type: 'warning'
      },
      {
        id: 3,
        title: 'Disparo concluído',
        message: 'Campanha de recuperação de carrinho finalizada.',
        time: '1h atrás',
        read: true,
        type: 'info'
      }
    ];
    
    setNotifications(notifs);
  };

  // Funções de formatação
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

  // Funções de calendário (mantidas as mesmas)
  const formatCalendarDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleDateRangeSelect = (range) => {
    setSelectedRange(range);
    if (range[0] && range[1]) {
      const formattedStart = formatCalendarDate(range[0]);
      const formattedEnd = formatCalendarDate(range[1]);
      setSelectedDateRange(`${formattedStart} - ${formattedEnd}`);
      
      setStartDate(range[0].toISOString().split('T')[0]);
      setEndDate(range[1].toISOString().split('T')[0]);
      
      setShowCalendar(false);
      fetchDashboardData();
    }
  };

  const handleQuickDateSelect = (option) => {
    const today = new Date();
    let start, end;
    
    switch(option) {
      case '7days':
        start = new Date(today);
        start.setDate(today.getDate() - 7);
        end = new Date(today);
        setSelectedDateRange('Últimos 7 dias');
        break;
      case '30days':
        start = new Date(today);
        start.setDate(today.getDate() - 30);
        end = new Date(today);
        setSelectedDateRange('Últimos 30 dias');
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today);
        setSelectedDateRange('Este mês');
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        setSelectedDateRange('Mês passado');
        break;
      default:
        start = null;
        end = null;
        break;
    }
    
    if (start && end) {
      setSelectedRange([start, end]);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
      setShowCalendar(false);
      fetchDashboardData();
    }
  };

  const handlePrevMonth = () => {
    const prev = new Date(selectedMonth);
    prev.setMonth(prev.getMonth() - 1);
    setSelectedMonth(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(selectedMonth);
    next.setMonth(next.getMonth() + 1);
    setSelectedMonth(next);
  };

  const renderCalendar = () => {
    const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    const endDate = new Date(monthEnd);
    
    startDate.setDate(1 - (startDate.getDay() || 7) + 1);
    
    if (endDate.getDay() !== 0) {
      endDate.setDate(endDate.getDate() + (7 - endDate.getDay()));
    }
    
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    return (
      <div className="calendar-container">
        <div className="calendar-header">
          <div className="calendar-title">
            {selectedMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </div>
          <div className="calendar-nav">
            <button className="calendar-nav-btn" onClick={handlePrevMonth}>
              <ChevronLeft size={16} />
            </button>
            <button className="calendar-nav-btn" onClick={handleNextMonth}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        
        <div className="calendar-weekdays">
          {weekdays.map((day, index) => (
            <div key={index} className="calendar-weekday">{day}</div>
          ))}
        </div>
        
        <div className="calendar-days">
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === selectedMonth.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            const isSelected = selectedRange[0] && selectedRange[1] && 
                              day >= selectedRange[0] && day <= selectedRange[1];
            const isRangeStart = selectedRange[0] && day.toDateString() === selectedRange[0].toDateString();
            const isRangeEnd = selectedRange[1] && day.toDateString() === selectedRange[1].toDateString();
            
            return (
              <div 
                key={index} 
                className={`calendar-day ${isCurrentMonth ? 'current-month' : 'other-month'} 
                           ${isToday ? 'today' : ''} 
                           ${isSelected ? 'selected' : ''} 
                           ${isRangeStart ? 'range-start' : ''} 
                           ${isRangeEnd ? 'range-end' : ''}`}
                onClick={() => {
                  if (!selectedRange[0] || (selectedRange[0] && selectedRange[1])) {
                    setSelectedRange([day, null]);
                  } else {
                    const range = [selectedRange[0], day];
                    if (range[0] > range[1]) {
                      range.reverse();
                    }
                    setSelectedRange(range);
                    handleDateRangeSelect(range);
                  }
                }}
              >
                {day.getDate()}
              </div>
            );
          })}
        </div>
        
        <div className="calendar-presets">
          <button className="preset-btn" onClick={() => handleQuickDateSelect('7days')}>Últimos 7 dias</button>
          <button className="preset-btn" onClick={() => handleQuickDateSelect('30days')}>Últimos 30 dias</button>
          <button className="preset-btn" onClick={() => handleQuickDateSelect('thisMonth')}>Este mês</button>
          <button className="preset-btn" onClick={() => handleQuickDateSelect('lastMonth')}>Mês passado</button>
        </div>
      </div>
    );
  };

  // Efeitos
  useEffect(() => {
    if (socketConnected && user?.LOGIN) {
      fetchDashboardData();
      fetchInvoiceData();
      
      const interval = setInterval(() => {
        fetchDashboardData();
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [socketConnected, user, timeRange, fetchDashboardData, fetchInvoiceData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowCalendar(false);
        setSidebarOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const getGrowthClass = (value) => {
    return value >= 0 ? "trend-indicator positive" : "trend-indicator negative";
  };
  
  const getGrowthIcon = (value) => {
    return value >= 0 
      ? <ArrowUpRight size={14} />
      : <ArrowDownRight size={14} />;
  };
  
  const handleMetricCardHover = (data, event) => {
    setTooltipData(data);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
    setShowTooltip(true);
  };
  
  const handleMetricCardLeave = () => {
    setShowTooltip(false);
  };

  // Componente de cartão métrica reutilizável
  const MetricCard = ({ icon: Icon, color, title, value, trend, trendValue, details }) => (
    <div 
      className="metric-card"
      onMouseEnter={(e) => handleMetricCardHover({ title, value, details }, e)}
      onMouseLeave={handleMetricCardLeave}
    >
      <div className="metric-card-header">
        <div className="metric-icon" style={{ backgroundColor: color + '22' }}>
          <Icon size={18} color={color} />
        </div>
        <div className="metric-title">{title}</div>
      </div>
      <div className="metric-value">{value}</div>
      {trend && (
        <div className={getGrowthClass(trendValue)}>
          {getGrowthIcon(trendValue)}
          <span>{formatPercentage(Math.abs(trendValue))}</span>
        </div>
      )}
    </div>
  );

  // Componente de mensagens de uso
  const MessageUsageCard = () => {
    if (!messageUsage) return null;
    
    const { current, limit, percentage } = messageUsage;
    const usageClass = percentage > 80 ? "danger" : percentage > 60 ? "warning" : "success";
    
    return (
      <div className="usage-card">
        <div className="usage-header">
          <div className="usage-icon">
            <MessageSquare size={18} color={COLORS.primary} />
          </div>
          <div className="usage-title">Uso de Mensagens</div>
        </div>
        <div className="usage-values">
          <span>{formatNumber(current)} / {formatNumber(limit)}</span>
        </div>
        <div className="usage-bar-container">
          <div className="usage-bar-bg">
            <div 
              className={`usage-bar-fill ${usageClass}`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
        <div className="usage-footer">
          {formatPercentage(percentage)} utilizado
        </div>
      </div>
    );
  };

  // Preparar dados para o gráfico central
  const chartData = ultimosDisparos.map(item => {
    const date = new Date(item.data);
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
    
    return {
      date: `${dia}/${mes}`,
      dispatched: item.total,
      recovered: Math.floor(item.total * 0.15), // Simulando recuperações
    };
  });
  
  return (
    <div className="dashboard-container">
      {/* Cabeçalho */}
      <div className="dashboard-header">
        <div className="header-left">
          {isMobileView && (
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={20} />
            </button>
          )}
          <div className="header-title-container">
            <h2 className="header-title">Dashboard</h2>
            <div className="header-nav">
              <span>Métricas</span>
              <span className="header-nav-separator">/</span>
              <span className="header-nav-active">Análise de Desempenho</span>
            </div>
          </div>
        </div>
        
        <div className="header-right">
          <div className="date-selector-container" ref={calendarRef}>
            <button 
              className="date-selector-btn"
              onClick={() => setShowCalendar(!showCalendar)}
            >
              <Calendar size={16} />
              <span className="date-range-text">{selectedDateRange}</span>
              <ChevronDown size={14} />
            </button>
            
            {showCalendar && (
              <div className="calendar-dropdown">
                {renderCalendar()}
              </div>
            )}
          </div>
          
          <div className="notifications-container">
            <button className="notifications-btn">
              <Bell size={18} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="notifications-badge">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
          </div>
          
          {/* <div className="user-avatar">
            <User size={20} />
          </div> */}
        </div>
      </div>

      {/* Conteúdo principal */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Carregando métricas...</p>
        </div>
      ) : (
        <div className="dashboard-content">
          {/* Layout atualizado */}
          <div className="dashboard-grid-new">
            {/* Seção de métricas principais */}
            <div className="metrics-section">
              <div className="section-header">
                <Activity size={16} className="section-icon" />
                <h3 className="section-title">Visão Geral</h3>
              </div>
              
              <div className="metrics-grid">
                <MetricCard 
                  icon={RefreshCcw} 
                  color={COLORS.purple} 
                  title="Recuperação" 
                  value={formatNumber(carrinhoRecuperados)}
                  trend={true}
                  trendValue={12.5}
                  details="Carrinhos recuperados no período"
                />
                
                <MetricCard 
                  icon={DollarSign} 
                  color={COLORS.success} 
                  title="Receita" 
                  value={formatCurrency(valorTotalRecuperado)}
                  trend={true}
                  trendValue={18.3}
                  details="Valor total recuperado"
                />
                
                <MetricCard 
                  icon={Send} 
                  color={COLORS.info} 
                  title="Disparos" 
                  value={formatNumber(disparosTotal)}
                  trend={true}
                  trendValue={8.7}
                  details="Total de disparos realizados"
                />
                
                <MetricCard 
                  icon={CreditCard} 
                  color={COLORS.danger} 
                  title="Despesas" 
                  value={formatCurrency(despesas)}
                  trend={true}
                  trendValue={-4.2}
                  details="Total de despesas operacionais"
                />
                
                {/* <MessageUsageCard /> */}
              </div>
            </div>
            
            {/* Seção central - Gráfico principal */}
            <div className="chart-section-main">
              <div className="chart-card-main">
                <div className="chart-header">
                  <div className="chart-title-container">
                    <BarChart2 size={18} className="chart-icon" />
                    <h3 className="chart-title">Disparos e Recuperações</h3>
                  </div>
                  <div className="chart-legend-horizontal">
                    <div className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: COLORS.info }}></div>
                      <span>Disparos</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: COLORS.success }}></div>
                      <span>Recuperações</span>
                    </div>
                  </div>
                </div>
                
                <div className="chart-container-main">
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkChartConfig.gridColor} />
                      <XAxis 
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: darkChartConfig.axisColor, fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: darkChartConfig.axisColor, fontSize: 12 }}
                        width={60}
                      />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: darkChartConfig.tooltipBg, 
                          borderRadius: '0.5rem',
                          border: `1px solid ${darkChartConfig.tooltipBorder}`,
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                          color: darkChartConfig.textColor
                        }}
                        formatter={(value, name) => {
                          if (name === 'dispatched') return [formatNumber(value), 'Disparos'];
                          if (name === 'recovered') return [formatNumber(value), 'Recuperações'];
                          return [value, name];
                        }}
                        labelFormatter={(label) => `Data: ${label}`}
                      />
                      <defs>
                        <linearGradient id="colorDispatched" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.info} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={COLORS.info} stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={COLORS.success} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="dispatched" 
                        name="dispatched" 
                        stroke={COLORS.info} 
                        fill="url(#colorDispatched)"
                        strokeWidth={2}
                        dot={{ r: 3, fill: COLORS.info, strokeWidth: 2, stroke: COLORS.backgroundCard }}
                        activeDot={{ r: 5, fill: COLORS.info, strokeWidth: 2, stroke: COLORS.backgroundCard }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="recovered" 
                        name="recovered" 
                        stroke={COLORS.success}
                        fill="url(#colorRecovered)"
                        strokeWidth={2}
                        dot={{ r: 3, fill: COLORS.success, strokeWidth: 2, stroke: COLORS.backgroundCard }}
                        activeDot={{ r: 5, fill: COLORS.success, strokeWidth: 2, stroke: COLORS.backgroundCard }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* Seção lateral - Resumo e métricas adicionais */}
            <div className="sidebar-section">
              <div className="sidebar-box">
                <div className="sidebar-header">
                  <TrendingUp size={16} className="sidebar-icon" />
                  <h3 className="sidebar-title">Resumo Financeiro</h3>
                </div>
                
                <div className="financial-summary">
                  <div className="summary-row">
                    <span className="summary-label">Valor Recuperado:</span>
                    <strong className="summary-value">{formatCurrency(valorTotalRecuperado)}</strong>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Carrinhos Recuperados:</span>
                    <strong className="summary-value">{formatNumber(carrinhoRecuperados)}</strong>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Total Disparos:</span>
                    <strong className="summary-value">{formatNumber(disparosTotal)}</strong>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Taxa de Recuperação:</span>
                    <strong className="summary-value">
                      {disparosTotal > 0 ? formatPercentage((carrinhoRecuperados / disparosTotal) * 100) : '0%'}
                    </strong>
                  </div>
                </div>
                
                <div className="metrics-row">
                  <div className="mini-metric">
                    <div className="mini-metric-icon" style={{ backgroundColor: COLORS.primaryTransparent }}>
                      <Zap size={14} color={COLORS.primary} />
                    </div>
                    <div className="mini-metric-data">
                      <div className="mini-metric-label">Eficiência</div>
                      <div className="mini-metric-value">89.5%</div>
                    </div>
                  </div>
                  
                  <div className="mini-metric">
                    <div className="mini-metric-icon" style={{ backgroundColor: COLORS.successTransparent }}>
                      <Award size={14} color={COLORS.success} />
                    </div>
                    <div className="mini-metric-data">
                      <div className="mini-metric-label">ROI</div>
                      <div className="mini-metric-value">285%</div>
                    </div>
                  </div>
                  
                  <div className="mini-metric">
                    <div className="mini-metric-icon" style={{ backgroundColor: COLORS.warningTransparent }}>
                      <Target size={14} color={COLORS.warning} />
                    </div>
                    <div className="mini-metric-data">
                      <div className="mini-metric-label">Meta</div>
                      <div className="mini-metric-value">78%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Tooltip customizado */}
      {showTooltip && (
        <div 
          className="custom-tooltip"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y + 10
          }}
        >
          <div className="tooltip-title">{tooltipData.title}</div>
          <div className="tooltip-value">{tooltipData.value}</div>
          {tooltipData.details && (
            <div className="tooltip-details">{tooltipData.details}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default MetricsPanel;