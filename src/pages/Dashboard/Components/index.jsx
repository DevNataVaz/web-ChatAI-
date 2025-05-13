import React, { useState, useEffect } from 'react';
import Sidebar from '../SideBar/SideBar';
import Header from '../Header/Header';
import Content from '../Content/Content';
// import Tabs from '../Tabs/Tabs';
import PaymentPanel from './PaymentPanel';
import ConversationsPanel from './PainelConversas/ConversationsPanel';
import AgentsPanel from './AgentsPanel';
import MetricsPanel from './MetricsPanel/MetricsPanel';
import ProductsPanel from './ProductsPanel';
import BalancePanel from './BalancePanel/BalancePanel';
import CreateAgentModal from './CreateAgentModal';

// IMPORTANTE: Importar useApp do arquivo App onde está definido o contexto
export default function Components({ user, onLogout, socket, Criptografar, Descriptografar }) {
  const [activeTab, setActiveTab] = useState('');
  const [activeNav, setActiveNav] = useState('agentes');
  const [showPayment, setShowPayment] = useState(false);
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [botInstances, setBotInstances] = useState([]);
  const [metrics, setMetrics] = useState({
    conversas: 0,
    faturas: { status: '', valor: 0, vencimento: '', frequencia: 0 },
    mensagens: { total: 0, limite: 0 }
  });

  useEffect(() => {
    // WebSocket event listeners
    if (socket) {
      socket.on('updatesInstagram', handleInstagramStatus);
      socket.on('updatesWhatsapp', handleWhatsappStatus);
      socket.on('MeusRobosResponse', handleMeusRobos);
      socket.on('ResponsegetFaturas', handleFaturas);
      socket.on('responseGetNotification', handleNotifications);
      socket.on('ResponseNovaConversa', handleNovaConversa);
      socket.on('ResponseMensagens', handleMensagens);
      socket.on('ResponseGetPlanos', handlePlanos);
      socket.on('ResponsePagamentosPix', handlePixPayment);
      socket.on('ResponsePagamentosCard', handleCardPayment);
      socket.on('RespostaDaCriação', handleCreationResponse);
      socket.on('responseHistoricoPagamentos', handleHistoricoPagamentos);
      socket.on('ResponseReceberProdutos', handleReceberProdutos);
      socket.on('responseGetAgendamento', handleGetAgendamento);
      socket.on('SaldoAtualresponse', handleSaldoAtual);
      socket.on('retornoVendas', handleRetornoVendas);
      socket.on('ResponseEnviarMensagem', handleEnviarMensagem);
      socket.on('ResponseVerificaPix', handleVerificaPix);

      fetchInitialData();
    }

    return () => {
      if (socket) {
        socket.removeAllListeners();
      }
    };
  }, [socket]);

  const fetchInitialData = () => {
    requestMeusRobos();
    requestFaturas();
    requestNotifications();
    requestSaldo();
    requestConversas();
    requestHistoricoPagamentos();
  };

  // WebSocket handler functions
  const handleInstagramStatus = (data) => {
    const status = JSON.parse(Descriptografar(data.Dados));
    updateBotStatus('instagram', status);
  };

  const handleWhatsappStatus = (data) => {
    const status = JSON.parse(Descriptografar(data.Dados));
    updateBotStatus('whatsapp', status);
  };

  const handleMeusRobos = (data) => {
    const response = JSON.parse(Descriptografar(data));
    setBotInstances(response.Dados);
  };

  const handleFaturas = (data) => {
    const faturas = JSON.parse(Descriptografar(data.Dados));
    setMetrics(prev => ({
      ...prev,
      faturas: faturas,
      mensagens: {
        total: faturas.ATUAL_MENSAGENS,
        limite: faturas.LIMITE_MENSAGEM
      }
    }));
  };

  const handleNotifications = (data) => {
    const notifications = JSON.parse(Descriptografar(data.resultado));
    setNotifications(notifications);
  };

  const requestMeusRobos = () => {
    const data = Criptografar(JSON.stringify({
      Code: '234645423654423465',
      Login: user.LOGIN
    }));
    socket.emit('meusRobos', data);
  };

  const requestFaturas = () => {
    const data = Criptografar(JSON.stringify(user.LOGIN));
    socket.emit('getFaturas', data);
  };

  const requestNotifications = () => {
    const data = Criptografar(JSON.stringify({
      Code: '234653244623544265344',
      Login: user.LOGIN
    }));
    socket.emit('getNotifications', data);
  };

  const requestSaldo = () => {
    const data = Criptografar(JSON.stringify({
      Code: '3214654132654746856474651',
      login: user.LOGIN
    }));
    socket.emit('saldoAtual', data);
  };

  const requestConversas = () => {
    const data = Criptografar(JSON.stringify({
      Code: '890878989048965048956089',
      Login: user.LOGIN,
      Limit: 20,
      Page: 1
    }));
    socket.emit('novaConversa', data);
  };

  // Bot connection functions
  const connectInstagram = (identificador) => {
    const data = Criptografar(JSON.stringify({
      code: '7554749056',
      conta: user.LOGIN,
      Identificador: identificador
    }));
    socket.emit('instagram', data);
  };

  const connectWhatsapp = (identificador) => {
    const data = Criptografar(JSON.stringify({
      code: '2544623544284',
      conta: user.LOGIN,
      Identificador: identificador
    }));
    socket.emit('whatsapp', data);
  };

  // Navigation and UI functions
  const renderMainContent = () => {
    switch (activeNav) {
      case 'conversas':
        return <ConversationsPanel user={user} socket={socket} Criptografar={Criptografar} Descriptografar={Descriptografar} />;
      case 'metricas':
        return <MetricsPanel metrics={metrics} user={user} socket={socket} Criptografar={Criptografar} Descriptografar={Descriptografar} />;
      case 'pagamentos':
        return <PaymentPanel user={user} socket={socket} onClose={() => setActiveNav('agentes')} Criptografar={Criptografar} Descriptografar={Descriptografar} />;
      case 'produtos':
        return <ProductsPanel user={user} socket={socket} Criptografar={Criptografar} Descriptografar={Descriptografar} />;
      case 'saldo':
        return <BalancePanel user={user} socket={socket} Criptografar={Criptografar} Descriptografar={Descriptografar} />;
      case 'agentes':
        return <AgentsPanel 
          user={user} 
          socket={socket} 
          botInstances={botInstances}
          onConnect={{ connectInstagram, connectWhatsapp }}
          onCreateAgent={() => setShowCreateAgent(true)}
          Criptografar={Criptografar}
          Descriptografar={Descriptografar}
        />;
      default:
        return (
          <div className="welcome-content">
            <Content activeTab={activeTab} user={user} socket={socket} Criptografar={Criptografar} Descriptografar={Descriptografar} />
          </div>
        );
    }
  };

  const handlePaymentClick = () => {
    setActiveNav('pagamentos');
  };

  return (
    <div className="dashboard-container">
      <Sidebar 
        activeNav={activeNav} 
        setActiveNav={setActiveNav}
        user={user}
        socket={socket}
        Criptografar={Criptografar}
        Descriptografar={Descriptografar}
      />
      
      <div className="main-content">
        <Header 
          user={user} 
          notifications={notifications}
          metrics={metrics}
          onLogout={onLogout}
          socket={socket}
          Criptografar={Criptografar}
          Descriptografar={Descriptografar}
        />
        
        {/* Only show tabs when certain navigation items are active */}
        {(['agentes', 'configuracoes', 'perfil', 'instrucoes'].includes(activeNav) || 
          ['instrucoes', 'configuracoes', 'perfil'].includes(activeTab)) && (
          <Tabs 
            activeTab={activeTab || 'instrucoes'} 
            setActiveTab={setActiveTab}
            onPaymentClick={handlePaymentClick}
          />
        )}
        
        <div className="content-area">
          {renderMainContent()}
        </div>
      </div>

      {showCreateAgent && (
        <CreateAgentModal
          user={user}
          socket={socket}
          onClose={() => setShowCreateAgent(false)}
          onSuccess={() => {
            setShowCreateAgent(false);
            fetchInitialData();
          }}
          Criptografar={Criptografar}
          Descriptografar={Descriptografar}
        />
      )}

      <style jsx>{`
        .dashboard-container {
          display: flex;
          min-height: 100vh;
          background-color: #f8fafc;
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: auto;
        }

        .content-area {
          flex: 1;
          overflow: auto;
          background: #f8fafc;
        }

        .welcome-content {
          padding: 1.5rem;
        }

        @media (max-width: 768px) {
          .dashboard-container {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}


export { default as AgentsPanel } from './AgentsPanel';
export { default as BalancePanel } from './BalancePanel/BalancePanel';
export { default as ConversationsPanel } from './PainelConversas/ConversationsPanel';
export { default as CreateAgentModal } from './CreateAgentModal';
export { default as MetricsPanel } from './MetricsPanel/MetricsPanel';
export { default as PaymentPanel } from './PaymentPanel';
export { default as ProductsPanel } from './ProductsPanel';