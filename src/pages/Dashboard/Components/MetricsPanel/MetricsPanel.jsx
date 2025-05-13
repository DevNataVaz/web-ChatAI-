import React, { useState, useEffect } from 'react';
import { useApp } from '../../../../context/AppContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './MetricsPanel.module.css';

export default function MetricsPanel({ metrics, user }) {
  const { Criptografar, Descriptografar, socket } = useApp();
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(false);
  const [conversationData, setConversationData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [messageUsage, setMessageUsage] = useState(null);
  const [connections, setConnections] = useState(null);
  const [sales, setSales] = useState([]);

  useEffect(() => {
    fetchMetricsData();
  }, [timeRange]);

  useEffect(() => {
    if (socket) {
      socket.on('SaldoAtualresponse', handleSaldoResponse);
      socket.on('retornoVendas', handleSalesResponse);
      socket.on('ResponsegetFaturas', handleFaturasResponse);
    }

    return () => {
      if (socket) {
        socket.removeAllListeners();
      }
    };
  }, [socket]);

  const fetchMetricsData = async () => {
    setLoading(true);
    try {
      // Fetch saldo
      const saldoData = Criptografar(JSON.stringify({
        Code: '3214654132654746856474651',
        login: user.LOGIN
      }));
      socket.emit('saldoAtual', saldoData);

      // Fetch sales
      const salesData = user.LOGIN;
      socket.emit('retornoVendas', salesData);

      // Fetch faturas
      const faturasData = Criptografar(JSON.stringify(user.LOGIN));
      socket.emit('getFaturas', faturasData);

      // Generate mock conversation data based on time range
      generateMockConversationData();
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaldoResponse = (data) => {
    const result = JSON.parse(Descriptografar(data));
    if (result.Code === '453436544565315323415332' && result.Dados.length > 0) {
      setConnections({
        saldo: result.Dados[0].SALDO,
        userId: result.Dados[0].ID
      });
    }
  };

  const handleSalesResponse = (data) => {
    const result = JSON.parse(Descriptografar(data));
    setSales(result.vendas || []);
    generateRevenueData(result.vendas || []);
  };

  const handleFaturasResponse = (data) => {
    const result = JSON.parse(Descriptografar(data.Dados));
    setMessageUsage({
      current: result.ATUAL_MENSAGENS,
      limit: result.LIMITE_MENSAGEM,
      percentage: (result.ATUAL_MENSAGENS / result.LIMITE_MENSAGEM) * 100
    });
  };

  const generateMockConversationData = () => {
    const data = [];
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        conversations: Math.floor(Math.random() * 50) + 10,
        messages: Math.floor(Math.random() * 200) + 50,
        satisfaction: Math.floor(Math.random() * 20) + 80
      });
    }
    setConversationData(data);
  };

  const generateRevenueData = (salesData) => {
    const revenueByMonth = {};
    
    salesData.forEach(sale => {
      const date = new Date(`${sale.DATA} ${sale.HORA}`);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      if (!revenueByMonth[monthKey]) {
        revenueByMonth[monthKey] = 0;
      }
      revenueByMonth[monthKey] += Number(sale.VALOR);
    });

    const data = Object.entries(revenueByMonth).map(([month, value]) => ({
      month,
      value
    }));

    setRevenueData(data);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateTotalRevenue = () => {
    return sales.reduce((total, sale) => total + Number(sale.VALOR), 0);
  };

  const calculateAverageTicket = () => {
    if (sales.length === 0) return 0;
    return calculateTotalRevenue() / sales.length;
  };

  return (
    <div className={styles.metricsPanel}>
      <div className={styles.metricsHeader}>
        <h2>Métricas e Análises</h2>
        <div className={styles.timeRangeSelector}>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="week">Última semana</option>
            <option value="month">Último mês</option>
            <option value="quarter">Último trimestre</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Carregando métricas...</p>
        </div>
      ) : (
        <>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <div className={`${styles.metricIcon} ${styles.iconConversation}`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="#8A63FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>Total de Conversas</h3>
              </div>
              <div className={styles.metricValue}>
                {conversationData.reduce((acc, curr) => acc + curr.conversations, 55)}
              </div>
              <div className={`${styles.metricTrend} ${styles.positive}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>12% este mês</span>
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <div className={`${styles.metricIcon} ${styles.iconBalance}`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>Saldo Disponível</h3>
              </div>
              <div className={styles.metricValue}>
                {connections ? formatCurrency(connections.saldo) : 'R$ 0,00'}
              </div>
              <div className={styles.metricDescription}>
                Disponível para saque
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <div className={`${styles.metricIcon} ${styles.iconTime}`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 8V12L15 15" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="10" stroke="#3B82F6" strokeWidth="2"/>
                  </svg>
                </div>
                <h3>Tempo Médio de Resposta</h3>
              </div>
              <div className={styles.metricValue}>27s</div>
              <div className={`${styles.metricTrend} ${styles.positive}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>15% melhor</span>
              </div>
            </div>

            {messageUsage && (
              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <div className={`${styles.metricIcon} ${styles.iconMessages}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22 12C22 16.4183 18.4183 20 14 20H4V10C4 5.58172 7.58172 2 12 2" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3>Uso de Mensagens</h3>
                </div>
                <div className={styles.metricValue}>
                  {messageUsage.current} / {messageUsage.limit}
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={messageUsage.percentage > 80 ? styles.progressDanger : styles.progressNormal}
                    style={{ width: `${messageUsage.percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <h3>Evolução de Conversas</h3>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={conversationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="conversations" 
                      name="Conversas" 
                      stroke="#8A63FF" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="messages" 
                      name="Mensagens" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={styles.chartCard}>
              <h3>Receita por Mês</h3>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="value" name="Receita" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <h3>Vendas Recentes</h3>
              <div className={styles.salesList}>
                {sales.slice(0, 5).map((sale, index) => (
                  <div key={index} className={styles.saleItem}>
                    <div className={styles.saleInfo}>
                      <span className={styles.saleId}>{sale.ID_PAGAMENTO}</span>
                      <span className={styles.saleDate}>
                        {new Date(`${sale.DATA} ${sale.HORA}`).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={styles.saleValue}>
                      {formatCurrency(sale.VALOR)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.summaryCard}>
              <h3>Resumo Financeiro</h3>
              <div className={styles.financialSummary}>
                <div className={styles.financialItem}>
                  <span>Receita Total:</span>
                  <strong>{formatCurrency(calculateTotalRevenue())}</strong>
                </div>
                <div className={styles.financialItem}>
                  <span>Ticket Médio:</span>
                  <strong>{formatCurrency(calculateAverageTicket())}</strong>
                </div>
                <div className={styles.financialItem}>
                  <span>Total de Vendas:</span>
                  <strong>{sales.length}</strong>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}