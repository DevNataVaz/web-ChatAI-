// First, let's enhance the Dashboard.jsx file to handle all views
import React, { useState, useEffect } from "react";
import Sidebar from './SideBar/SideBar';
import Header from './Header/Header';
import styles from './Dashboard.module.css';
import { AppProvider, useApp } from '../../context/AppContext';
import LoadingScreen from '../../components/loading/LoadingScreen';
import ErrorBoundary from './ErrorBoundary/index';
import BotDashboard from "./BotDashboard/BotDashboard";

// Existing components
import {
  AgentsPanel,
  ConversationsPanel,
  CreateAgentModal,
  MetricsPanel,
  PaymentPanel,
  ProductsPanel
} from './Components/index';
import GatilhoPainel from "./Components/Gatilhos/Gatilhos";
import PagamentoHistorico from "./Components/HistoricoPagamento/PagamentoHistorico";
import Produto from './Produtos/ProdutosDashboard';
import Disparos from './Disparos/Disparos';
import Assinatura from './Assinaturas/index';

// Campaign components
import CampaignDashboard from './Campanha/CampanhaDashboard';
import CampaignDetail from './Campanha/CampanhaDetalhe/CampanhaDetalhe';
import ApiTriggers from './Campanha/Api/Api';
import SequenceConfiguration from './Campanha/SequenciaConfig/Sequencia';
import BotDetail from './Campanha/BotDetail/BotDetail';
import QRCodeModal from './Campanha/QrCodeModal/QrCode';
import ProductsModal from './Campanha/ProdutoModal/ProdutoModal';

function DashboardContent() {
  // State for content views
  const [activeTab, setActiveTab] = useState('configuracoes');
  const [activeView, setActiveView] = useState('metricas');
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Campaign state
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [campaignView, setCampaignView] = useState('list'); // 'list', 'detail', 'api', 'sequence'
  
  // Bot state
  const [selectedBotId, setSelectedBotId] = useState(null);
  const [botView, setBotView] = useState(null); 
   const [currentView, setCurrentView] = useState('main')
  
  // QR Code state
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQRCodeData] = useState('');
  const [qrCodeLoading, setQRCodeLoading] = useState(false);
  
  // Products modal state
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [productsBotId, setProductsBotId] = useState(null);

  const { isLoading, error } = useApp();

  useEffect(() => {
    // Wait for context initialization
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  // Show loading while context is initializing
  if (!isInitialized || isLoading) {
    return <LoadingScreen />;
  }

  // Show error if any
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Erro ao carregar dashboard</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Recarregar</button>
      </div>
    );
  }

   const handleCampaignClick = () => {
    setActiveView('campaigns');
    setCurrentView('campaign');
  };
   const handleAssinaturaClick = () => {
    setActiveView('assinatura');
    setCurrentView('assinatura');
  };

  const handleCampaignSelect = (campaignId) => {
    setSelectedCampaignId(campaignId);
    setCurrentView('campaignDetail');
  };

  const handleBackToCampaigns = () => {
    setCurrentView('campaign');
  };

  const handleOpenApiTriggers = (campaignId) => {
    setCurrentView('apiTriggers');
  };

   const handleOpenDisparo = (campaignId) => {
    setCurrentView('disparo');
  };


  const handleOpenSequence = (campaignId) => {
    setCurrentView('sequence');
  };

  const handleBotSelect = (botId) => {
    setSelectedBotId(botId);
    setCurrentView('botDetail');
  };

  const handleBackToCampaignDetail = () => {
    setCurrentView('campaignDetail');
  };

  // Render the current view based on state
  const renderCurrentView = () => {
    switch (currentView) {
      case 'campaign':
        return <CampaignDashboard onSelectCampaign={handleCampaignSelect} />;
      
      case 'campaignDetail':
        return (
          <CampaignDetail 
            campaignId={selectedCampaignId}
            onBack={handleBackToCampaigns}
            onOpenApiTriggers={handleOpenApiTriggers}
             onOpenDisparo={handleOpenDisparo}
            onOpenSequence={handleOpenSequence}
            onSelectBot={handleBotSelect}
          />
        );
      
      case 'apiTriggers':
        return (
          <ApiTriggers 
            campaignId={selectedCampaignId}
            onBack={handleBackToCampaignDetail}
          />
        );
      
      case 'disparo':
        return (
          <Disparos 
            campaignId={selectedCampaignId}
            onBack={handleBackToCampaignDetail}
          />
        );
      case 'sequence':
        return (
          <SequenceConfiguration 
            campaignId={selectedCampaignId}
            onBack={handleBackToCampaignDetail}
          />
        );
      
      case 'botDetail':
        return (
          <BotDetail 
            botId={selectedBotId}
            onBack={handleBackToCampaignDetail}
            onOpenQRCode={(data) => {
              setQRCodeData(data);
              setShowQRModal(true);
            }}
            onOpenProductsModal={() => setShowProductsModal(true)}
          />
        );
      
      case 'main':
      default:
        // Handle other main views based on activeView state
        switch (activeView) {
          case 'agents':
            return <BotDashboard />;
          case 'gatilho':
            return <GatilhoPainel />;
          case 'conversations':
            return <ConversationsPanel />;
          case 'metricas':
            return <MetricsPanel />;
          case 'balanco':
            return <PagamentoHistorico />;
          case 'assinatura':
            return <Assinatura />;
          case 'disparos':
            return <Disparos />;
          default:
            return <MetricsPanel />;
        }
    }
  };

  return (
    <ErrorBoundary>
      <div className={styles.container}>
        <Sidebar
          activeView={activeView}
          setContentView={(view) => {
            setActiveView(view);
            if (view === 'campaigns') {
              setCurrentView('campaign');
            } else {
              setCurrentView('main');
            }
          }}
        />
        <main className={styles.main}>
          {/* <Header contentView={activeView} /> */}
          {renderCurrentView()}
        </main>

        {/* Modals */}
        {showQRModal && (
          <QRCodeModal 
            visible={showQRModal}
            qrCodeData={qrCodeData}
            isLoading={false}
            onClose={() => setShowQRModal(false)}
            onTimeout={() => {
              setQRCodeData('');
              setShowQRModal(false);
            }}
            onRetry={() => {
              // Retry QR code generation logic
            }}
          />
        )}

        {showProductsModal && (
          <ProductsModal 
            visible={showProductsModal}
            botId={selectedBotId}
            onClose={() => setShowProductsModal(false)}
            onProductsChange={() => {
              // Refresh products
              setShowProductsModal(false);
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

// Wrapper component with AppProvider
function Dashboard() {
  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
}

export default Dashboard;