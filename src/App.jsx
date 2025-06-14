import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, Slide as ToastSlide } from 'react-toastify';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

//components
import NavBar from './components/navBar';
import Header from './components/header';
import SectionDashboard from './components/SectionDashboard';
import SectionSEO from './components/SectionSEO';
import PlanosComponent from './components/planos';
import Experimente from './components/experimente';
import Footer from './components/footer';
import Banner from './components/banner';
import Iphone from './components/iphoneMedia';
import ProtectedRoute from './components/ProtectedRoute';
import RocketSection from './components/SectionRocket/RocketSection';
import WhatsAppButton from './components/Whatsapp/Whatsapp';
import Feedbacks from './components/Feedbacks/Feedbacks';
import Duvidas from './components/Duvidas/Duvidas';


//pages
import DownloadPage from './pages/download';
import Dashboard from './pages/Dashboard';
import Components from './pages/Dashboard/Components/index';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Registro';

import Planos from './pages/Dashboard/Planos';

// Novas páginas de pagamento
import Pagamento from './pages/Dashboard/Planos/Pagamentos/Pagamento/pagamento';
import PagamentoPix from './pages/Dashboard/Planos/Pagamentos/Pix/pagamentoPix';
import PagamentoCartao from './pages/Dashboard/Planos/Pagamentos/Cartao/pagamentoCartao';

//paginas de edição
import ProdutosDashboard from './pages/Dashboard/Produtos/ProdutosDashboard';
// import ListaProdutos from './pages/Dashboard/Produtos/ListaProdutos';
// import CriarProduto from './pages/Dashboard/Produtos/CriarProduto';
// import EditarProduto from './pages/Dashboard/Produtos/EditarProduto';
// import ExcluirProduto from './pages/Dashboard/Produtos/ExcluirProduto';
// import VincularRobo from './pages/Dashboard/Produtos/VincularRobo';

import Assinatura from './pages/Dashboard/Assinaturas';

import Comprovante from './pages/Dashboard/Components/HistoricoPagamento/Comprovante/Compovante';

// Novas páginas para gerenciamento de campanhas e automações
// import CampaignDashboard from './pages/Dashboard/Campanha/CampanhaDashboard';
// import CampaignDetail from './pages/Dashboard/Campanha/BotDetail/BotDetail';
// import ApiTriggers from './pages/Dashboard/Campanha/Api/Api';
// import SequenceConfiguration from './pages/Dashboard/Campanha/SequenciaConfig/Sequencia';
// import BotDashboard from './pages/Dashboard/BotDashboard/BotDashboard';
// import BotDetail from './pages/Dashboard/Campanha/BotDetail/BotDetail';
// import BotSettings from './pages/Dashboard/Campanha/BotDetail/BotDetail';
// import CreateBot from './pages/Dashboard/BotDashboard/BotDashboard';

import { AppProvider } from './context/AppContext';

function LandingPage() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      easing: 'ease-out-cubic',
      delay: 100,
    });
  }, []);

  return (
    <>
      <NavBar />
      <Header />
      {/* <Banner />
      <SectionDashboard /> */}
      <RocketSection />
      <Iphone />
      <SectionSEO />
      <PlanosComponent />
      <Experimente />
      <Duvidas />
      <Feedbacks />
      <WhatsAppButton />
      <Footer />
    </>
  );
}

function App() {
  return (
    <Router>
      <AppProvider>
        <Routes>
          {/* rotas publicas */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/download" element={<DownloadPage />} />

          {/* rotas protegidas */}
          <Route element={<ProtectedRoute />}>
            {/* Rotas existentes */}
            <Route path="/planos" element={<Planos />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/assinatura" element={<Assinatura />} />
            <Route path="/pagamento" element={<Pagamento />} />
            <Route path="/pagamento/:planoId" element={<Pagamento />} />
            <Route path="/pagamento/pix/:planoId" element={<PagamentoPix />} />
            <Route path="/pagamento/cartao/:planoId" element={<PagamentoCartao />} />
            <Route path="/produtos/*" element={<ProdutosDashboard />} />
            <Route path="/Comprovante/*" element={<Comprovante />} />
            
            {/* Novas rotas de campanha */}
            {/* <Route path="/campanha" element={<CampaignDashboard />} />
            <Route path="/campanha/:campaignId" element={<CampaignDetail />} />
            <Route path="/api-triggers/:campaignId" element={<ApiTriggers />} />
            <Route path="/sequence/:campaignId" element={<SequenceConfiguration />} />
            
            {/* Novas rotas de bots/automações */}
            {/* <Route path="/bots" element={<BotDashboard />} />
            <Route path="/bot/:botId" element={<BotDetail />} />
            <Route path="/bot/settings/:botId" element={<BotSettings />} />
            <Route path="/bot/create/:campaignId" element={<CreateBot />} /> */} 
          </Route>
        </Routes>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
          theme="colored"
          transition={ToastSlide}
        />
      </AppProvider>
    </Router>
  );
}

export default App;