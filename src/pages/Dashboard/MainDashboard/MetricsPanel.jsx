import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
    <div className="metrics-panel">
      <div className="metrics-header">
        <h2>Métricas e Análises</h2>
        <div className="time-range-selector">
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="week">Última semana</option>
            <option value="month">Último mês</option>
            <option value="quarter">Último trimestre</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando métricas...</p>
        </div>
      ) : (
        <>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-icon" style={{ backgroundColor: 'rgba(138, 99, 255, 0.1)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="#8A63FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>Total de Conversas</h3>
              </div>
              <div className="metric-value">
                {conversationData.reduce((acc, curr) => acc + curr.conversations, 0)}
              </div>
              <div className="metric-trend positive">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>12% este mês</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>Saldo Disponível</h3>
              </div>
              <div className="metric-value">
                {connections ? formatCurrency(connections.saldo) : '...'}
              </div>
              <div className="metric-description">
                Disponível para saque
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 8V12L15 15" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="10" stroke="#3B82F6" strokeWidth="2"/>
                  </svg>
                </div>
                <h3>Tempo Médio de Resposta</h3>
              </div>
              <div className="metric-value">2m 30s</div>
              <div className="metric-trend positive">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>15% melhor</span>
              </div>
            </div>

            {messageUsage && (
              <div className="metric-card">
                <div className="metric-header">
                  <div className="metric-icon" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22 12C22 16.4183 18.4183 20 14 20H4V10C4 5.58172 7.58172 2 12 2" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3>Uso de Mensagens</h3>
                </div>
                <div className="metric-value">
                  {messageUsage.current} / {messageUsage.limit}
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress" 
                    style={{ 
                      width: `${messageUsage.percentage}%`,
                      backgroundColor: messageUsage.percentage > 80 ? '#dc2626' : '#8A63FF'
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h3>Evolução de Conversas</h3>
              <div className="chart-container">
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

            <div className="chart-card">
              <h3>Receita por Mês</h3>
              <div className="chart-container">
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

          <div className="summary-grid">
            <div className="summary-card">
              <h3>Vendas Recentes</h3>
              <div className="sales-list">
                {sales.slice(0, 5).map((sale, index) => (
                  <div key={index} className="sale-item">
                    <div className="sale-info">
                      <span className="sale-id">{sale.ID_PAGAMENTO}</span>
                      <span className="sale-date">
                        {new Date(`${sale.DATA} ${sale.HORA}`).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="sale-value">
                      {formatCurrency(sale.VALOR)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="summary-card">
              <h3>Resumo Financeiro</h3>
              <div className="financial-summary">
                <div className="financial-item">
                  <span>Receita Total:</span>
                  <strong>{formatCurrency(calculateTotalRevenue())}</strong>
                </div>
                <div className="financial-item">
                  <span>Ticket Médio:</span>
                  <strong>{formatCurrency(calculateAverageTicket())}</strong>
                </div>
                <div className="financial-item">
                  <span>Total de Vendas:</span>
                  <strong>{sales.length}</strong>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .metrics-panel {
          padding: 1.5rem;
        }

        .metrics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .metrics-header h2 {
          font-size: 1.875rem;
          font-weight: bold;
          color: #1f2937;
        }

        .time-range-selector select {
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          background: white;
          font-size: 0.875rem;
          color: #374151;
          cursor: pointer;
        }

        .time-range-selector select:focus {
          outline: none;
          border-color: #8A63FF;
          box-shadow: 0 0 0 2px rgba(138, 99, 255, 0.1);
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 0;
          gap: 1rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #8A63FF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .metric-card {
          background: white;
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .metric-header {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .metric-icon {
          width: 48px;
          height: 48px;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .metric-header h3 {
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
        }

        .metric-value {
          font-size: 2rem;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .metric-trend {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .metric-trend.positive {
          color: #059669;
        }

        .metric-trend.negative {
          color: #dc2626;
        }

        .metric-description {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 9999px;
          overflow: hidden;
          margin-top: 0.5rem;
        }

        .progress {
          height: 100%;
          border-radius: 9999px;
          transition: width 0.5s ease;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .chart-card {
          background: white;
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .chart-card h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1rem;
        }

        .chart-container {
          width: 100%;
          height: 300px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        .summary-card {
          background: white;
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .summary-card h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1rem;
        }

        .sales-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .sale-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .sale-item:last-child {
          border-bottom: none;
        }

        .sale-info {
          display: flex;
          flex-direction: column;
        }

        .sale-id {
          font-size: 0.875rem;
          font-family: monospace;
          color: #4b5563;
        }

        .sale-date {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .sale-value {
          font-weight: 600;
          color: #1f2937;
        }

        .financial-summary {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .financial-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .financial-item:last-child {
          border-bottom: none;
        }

        .financial-item span {
          color: #6b7280;
        }

        .financial-item strong {
          color: #1f2937;
        }
      `}</style>
    </div>
  );
}