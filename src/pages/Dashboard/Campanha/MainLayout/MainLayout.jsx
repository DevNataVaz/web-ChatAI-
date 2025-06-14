import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiHome, FiMessageCircle, FiSettings, FiUser, 
  FiCreditCard, FiMenu, FiX, FiLogOut, FiZap
} from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { toast } from 'react-toastify';
import styles from './MainLayout.module.css';

const MainLayout = () => {
  const { user, logout, socketConnected } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // Update window width on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      
      // Auto-close sidebar on larger screens
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Close sidebar when navigating on mobile
  useEffect(() => {
    if (windowWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, windowWidth]);
  
  // Navigation items
  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <FiHome size={20} /> },
    { path: '/campaigns', label: 'Campanhas', icon: <FiZap size={20} /> },
    { path: '/bots', label: 'Automações', icon: <FiMessageCircle size={20} /> },
    { path: '/plans', label: 'Planos', icon: <FiCreditCard size={20} /> },
    { path: '/profile', label: 'Meu Perfil', icon: <FiUser size={20} /> },
    { path: '/settings', label: 'Configurações', icon: <FiSettings size={20} /> },
  ];
  
  // Handle logout
  const handleLogout = () => {
    logout();
    toast.success("Desconectado com sucesso");
    navigate('/login');
  };
  
  // Check if navigation item is active
  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') {
      return true;
    }
    
    if (path !== '/dashboard' && location.pathname.startsWith(path)) {
      return true;
    }
    
    return false;
  };
  
  return (
    <div className={styles.layoutContainer}>
      {/* Mobile Header */}
      <header className={styles.mobileHeader}>
        <button 
          className={styles.menuButton}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
        
        <div className={styles.logo}>
          <h1>AnimusIA</h1>
        </div>
        
        <div className={styles.connectionStatus}>
          <div className={`${styles.statusDot} ${socketConnected ? styles.connected : styles.disconnected}`}></div>
        </div>
      </header>
      
      {/* Sidebar */}
      <nav className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.brandLogo}>
            <h2>AnimusIA</h2>
          </div>
          
          <button 
            className={styles.closeSidebarButton}
            onClick={() => setIsSidebarOpen(false)}
          >
            <FiX size={24} />
          </button>
        </div>
        
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            {user?.NOME ? user.NOME.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className={styles.userName}>
            <h3>{user?.NOME || 'Usuário'}</h3>
            <p>{user?.EMAIL || 'usuário@exemplo.com'}</p>
          </div>
        </div>
        
        <div className={styles.navigationContainer}>
          <ul className={styles.navigationList}>
            {navigationItems.map((item) => (
              <li key={item.path}>
                <button 
                  className={`${styles.navItem} ${isActive(item.path) ? styles.activeNavItem : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        <div className={styles.sidebarFooter}>
          <button 
            className={styles.logoutButton}
            onClick={handleLogout}
          >
            <FiLogOut size={20} />
            <span>Sair</span>
          </button>
          
          <div className={styles.connectionInfo}>
            <div className={`${styles.connectionDot} ${socketConnected ? styles.connected : styles.disconnected}`}></div>
            <span>{socketConnected ? 'Conectado' : 'Desconectado'}</span>
          </div>
        </div>
      </nav>
      
      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div 
          className={styles.backdrop}
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
      
      {/* Main content */}
      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;