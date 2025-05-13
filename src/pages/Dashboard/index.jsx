// Dashboard.jsx
import React, { useState, useEffect } from "react";
import Sidebar from './SideBar/SideBar';
import Header from './Header/Header';
// import Tabs from './Tabs/Tabs';
import Content from './Content/Content';
import styles from './Dashboard.module.css';
import { AppProvider, useApp } from '../../context/AppContext';
import LoadingScreen from '../../components/loading/LoadingScreen';
import ErrorBoundary from './ErrorBoundary/index';
import BotDashboard from "./BotDashboard/BotDashboard";


// Importar os componentes da estrutura
import {
  AgentsPanel,
  
  ConversationsPanel,
  CreateAgentModal,
  MetricsPanel,
  PaymentPanel,
  ProductsPanel
} from './Components/index';
import GatilhoPainel from "./Components/BalancePanel/BalancePanel";
import PagamentoHistorico from "./Components/HistoricoPagamento/PagamentoHistorico";
// Componente interno que usa o contexto
function DashboardContent() {
  const [activeTab, setActiveTab] = useState('configuracoes');
  const [activeView, setActiveView] = useState(null);
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { isLoading, error } = useApp();

  useEffect(() => {
    // Aguardar a inicialização do contexto
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100); // Pequeno delay para garantir que o contexto seja configurado

    return () => clearTimeout(timer);
  }, []);

  // Mostrar loading enquanto o contexto não estiver pronto
  if (!isInitialized || isLoading) {
    return <LoadingScreen />;
  }

  // Mostrar erro se houver
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Erro ao carregar dashboard</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Recarregar</button>
      </div>
    );
  }

  const renderMainContent = () => {
    // Se estiver em uma view específica, renderizar o componente correspondente
    if (activeView) {
      switch (activeView) {
        case 'agents':
          return <BotDashboard activeTab={activeTab} contentView={activeView} />
          // return <AgentsPanel onCreateAgent={() => setShowCreateAgent(true)} />;
        case 'gatilho':
          return <GatilhoPainel />;
          case 'conversations':
            return (
              <ConversationsPanel />
            );
        case 'metrics':
          return <MetricsPanel />;
        case 'balanco':
          return <PagamentoHistorico />;
        case 'products':
          return <ProductsPanel />;
        default:
          return <BotDashboard activeTab={activeTab} contentView={activeView} />;
      }
    }
    
    // Caso contrário, renderizar o conteúdo baseado na aba ativa
    return <BotDashboard activeTab={activeTab} contentView={activeView} />;
  };

  return (
    <ErrorBoundary>
      <div className={styles.container}>
        <Sidebar 
          activeView={activeView}
          setContentView={setActiveView}
        />
        <main className={styles.main}>
          <Header contentView={activeView} />
          
          {/* Mostrar tabs apenas quando necessário */}
          {/* {(['configuracoes', 'instrucoes', 'perfil'].includes(activeTab) && !activeView) && (
            <Tabs 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
            />
          )} */}
          
          {renderMainContent()}
        </main>
        
        {/* Modal de criação de agente */}
        {showCreateAgent && (
          <CreateAgentModal
            onClose={() => setShowCreateAgent(false)}
            onSuccess={() => {
              setShowCreateAgent(false);
              // Atualizar dados se estiver visualizando agentes
              if (activeView === 'agents') {
                // Trigger agentes refresh
              }
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

// Componente externo com Provider
function Dashboard() {
  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
}

export default Dashboard;