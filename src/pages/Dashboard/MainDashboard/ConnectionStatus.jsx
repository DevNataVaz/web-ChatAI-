// components/ConnectionStatus.jsx
import React from 'react';
import { useApp } from '../../../context/AppContext';

export default function ConnectionStatus() {
  const { isConnecting, error, isLoading } = useApp();

  if (!isConnecting && !error && !isLoading) {
    return null; // Não mostrar nada se estiver conectado com sucesso
  }

  return (
    <div style={styles.container}>
      {isConnecting && (
        <div style={styles.connectingOverlay}>
          <div style={styles.content}>
            <div style={styles.spinner}></div>
            <h3 style={styles.title}>Conectando ao servidor...</h3>
            <p style={styles.message}>Aguarde um momento.</p>
          </div>
        </div>
      )}
      
      {error && (
        <div style={styles.errorOverlay}>
          <div style={styles.content}>
            <h3 style={styles.title}>Erro de Conexão</h3>
            <p style={styles.message}>{error}</p>
            <button 
              style={styles.retryButton}
              onClick={() => window.location.reload()}
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 17, 36, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  connectingOverlay: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  errorOverlay: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  content: {
    textAlign: 'center',
    color: 'white',
    maxWidth: '400px',
    padding: '2rem',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(255, 255, 255, 0.3)',
    borderTop: '4px solid #8A63FF',
    borderRadius: '50%',
    margin: '0 auto 1rem',
    animation: 'spin 1s linear infinite',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
  },
  message: {
    color: '#8A8D9F',
    marginBottom: '1rem',
  },
  retryButton: {
    backgroundColor: '#8A63FF',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 1.5rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background-color 0.3s',
  },
};