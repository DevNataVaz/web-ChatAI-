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
import Planos from './components/planos';
import Experimente from './components/experimente';
import Footer from './components/footer';
import Banner from './components/banner';
import Iphone from './components/iphoneMedia'
// import AuthModal from './components/AuthModal';
import Pix from './pages/Pagamentos/Pix/index';
import Pagamento from './pages/Pagamentos/Pagamento'

//pages
import DownloadPage from './pages/Download';
import Dashboard from './pages/Dashboard';

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
      <Planos />
      <Experimente />
      <Footer />
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pix" element={<Pix />} />
        <Route path="/pagamento" element={<Pagamento />} />

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
    </Router>
  );
}

export default App;
