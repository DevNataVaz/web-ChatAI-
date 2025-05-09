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
import ConnectionStatus from './pages/Dashboard/MainDashboard/ConnectionStatus';

//pages
import DownloadPage from './pages/Download';
import Dashboard from './pages/Dashboard';
import MainDashboard from './pages/Dashboard/MainDashboard/index';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Registro';

import Planos from './pages/Dashboard/Planos';

// Novas páginas de pagamento
import Pagamento from './pages/Dashboard/Planos/Pagamentos/Pagamento/pagamento';
import PagamentoPix from './pages/Dashboard/Planos/Pagamentos/Pix/pagamentoPix';
import PagamentoCartao from './pages/Dashboard/Planos/Pagamentos/Cartao/pagamentoCartao';
import Assinatura from './pages/Dashboard/Assinaturas';

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
      <Banner />
      <SectionDashboard />
      <Iphone />
      <SectionSEO />
      <PlanosComponent />
      <Experimente />
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
          <Route path="/planos" element={<Planos />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assinatura" element={<Assinatura />} />
          <Route path="/pagamento" element={<Pagamento />} />
          <Route path="/pagamento/:planoId" element={<Pagamento />} />
          <Route path="/pagamento/pix/:planoId" element={<PagamentoPix />} />
          <Route path="/pagamento/cartao/:planoId" element={<PagamentoCartao />} />
          
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