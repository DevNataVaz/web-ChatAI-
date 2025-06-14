import React, { useState, useEffect } from 'react';
import { Criptografar, Descriptografar } from '../../../Cripto';

export default function AgentsPanel({ user, socket, botInstances, onConnect, onCreateAgent }) {

  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({});

  useEffect(() => {
    checkAgentStatus();
  }, [botInstances]);

  const checkAgentStatus = () => {
    if (socket && botInstances.length > 0) {
      botInstances.forEach(agent => {
        // Verificar status do WhatsApp
        const whatsappCode = Criptografar('17326186765984');
        socket.emit('StatusWhatsapp', {
          Code: whatsappCode,
          Identificador: Criptografar(agent.PROTOCOLO)
        });

        // Verificar status do Instagram
        const instagramCode = Criptografar('678984766951766581');
        socket.emit('StatusInstagram', {
          Code: instagramCode,
          Identificador: Criptografar(agent.PROTOCOLO)
        });
      });
    }
  };

  const handleConnect = async (agent, platform) => {
    setLoading(true);
    try {
      if (platform === 'whatsapp') {
        await onConnect.connectWhatsapp(agent.PROTOCOLO);
      } else if (platform === 'instagram') {
        await onConnect.connectInstagram(agent.PROTOCOLO);
      }
    } catch (error) {
      // console.error('Erro ao conectar:', error);
      alert(`Erro ao conectar ${platform}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAgent = async (agent) => {
    if (window.confirm('Tem certeza que deseja excluir este agente?')) {
      setLoading(true);
      try {
        const data = Criptografar(JSON.stringify({
          Code: '5654665454665644',
          Protocolo: agent.PROTOCOLO
        }));
        socket.emit('excluirRobos', data);
        
        // Refresh agents list
        requestMeusRobos();
      } catch (error) {
        // console.error('Erro ao excluir agente:', error);
        alert('Erro ao excluir agente');
      } finally {
        setLoading(false);
      }
    }
  };

  const requestMeusRobos = () => {
    const data = Criptografar(JSON.stringify({
      Code: '234645423654423465',
      Login: user.LOGIN
    }));
    socket.emit('meusRobos', data);
  };

  const renderAgentCard = (agent) => {
    const agentData = agent.DADOS[0];
    const objective = agentData.OBJETIVO;
    const platforms = agentData.REDE.split(',');

    return (
      <div key={agent.PROTOCOLO} className="agent-card">
        <div className="agent-header">
          <div className="agent-info">
            <div className="agent-name">
              <strong>{agentData.EMPRESA}</strong>
              <span className="agent-badge">{objective}</span>
            </div>
            <div className="agent-meta">
              <span>ID: {agent.PROTOCOLO}</span>
              <span className="divider"></span>
              <span>Atendente: {agentData.ATENDENTE}</span>
            </div>
          </div>
          <div className="agent-actions">
            <button 
              className="details-button"
              onClick={() => {
                setSelectedAgent(agent);
                setShowDetails(true);
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M9 9h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M9 12h6l-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Detalhes
            </button>
            <button 
              className="delete-button"
              onClick={() => handleDeleteAgent(agent)}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6h18M8 6v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6m4-6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Excluir
            </button>
          </div>
        </div>

        <div className="platform-connections">
          {platforms.includes('0') && (
            <div className="platform-item">
              <div className="platform-info">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="#075E54"/>
                </svg>
                <span>WhatsApp</span>
              </div>
              <div className="connection-status">
                {connectionStatus[`${agent.PROTOCOLO}-whatsapp`] ? (
                  <span className="status-indicator connected">Conectado</span>
                ) : (
                  <button 
                    className="connect-button"
                    onClick={() => handleConnect(agent, 'whatsapp')}
                    disabled={loading}
                  >
                    {loading ? 'Conectando...' : 'Conectar'}
                  </button>
                )}
              </div>
            </div>
          )}

          {platforms.includes('2') && (
            <div className="platform-item">
              <div className="platform-info">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.948-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" fill="#E1306C"/>
                </svg>
                <span>Instagram</span>
              </div>
              <div className="connection-status">
                {connectionStatus[`${agent.PROTOCOLO}-instagram`] ? (
                  <span className="status-indicator connected">Conectado</span>
                ) : (
                  <button 
                    className="connect-button"
                    onClick={() => handleConnect(agent, 'instagram')}
                    disabled={loading}
                  >
                    {loading ? 'Conectando...' : 'Conectar'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="agents-panel">
      <div className="panel-header">
        <div className="header-info">
          <h2>Agentes AI</h2>
          <p>Gerencie seus agentes inteligentes</p>
        </div>
        <button 
          className="create-agent-btn"
          onClick={onCreateAgent}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Criar Agente AI
        </button>
      </div>

      <div className="agents-grid">
        {botInstances.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="8" r="6" stroke="#8A8D9F" strokeWidth="2"/>
              <path d="M4 20v-4c0-2.2 1.8-4 4-4h8c2.2 0 4 1.8 4 4v4" stroke="#8A8D9F" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <h3>Nenhum agente AI criado</h3>
            <p>Crie seu primeiro agente para começar.</p>
            <button 
              className="create-agent-btn"
              onClick={onCreateAgent}
            >
              Criar Agente AI
            </button>
          </div>
        ) : (
          botInstances.map(renderAgentCard)
        )}
      </div>

      {showDetails && selectedAgent && (
        <div className="agent-details-modal">
          <div className="modal-overlay" onClick={() => setShowDetails(false)}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Detalhes do Agente</h3>
              <button 
                className="close-button"
                onClick={() => setShowDetails(false)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {/* Agent details content */}
              <pre>{JSON.stringify(selectedAgent, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .agents-panel {
          padding: 1.5rem;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .header-info h2 {
          font-size: 1.875rem;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .header-info p {
          color: #6b7280;
        }

        .create-agent-btn {
          background: #8A63FF;
          color: white;
          border: none;
          border-radius: 0.5rem;
          padding: 0.75rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .create-agent-btn:hover {
          background: #7c59d6;
        }

        .agents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .agent-card {
          background: white;
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          padding: 1.5rem;
          transition: all 0.3s;
        }

        .agent-card:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .agent-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .agent-name {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .agent-badge {
          background: #f3f4f6;
          color: #4b5563;
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .agent-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .divider {
          width: 4px;
          height: 4px;
          background: #d1d5db;
          border-radius: 50%;
        }

        .agent-actions {
          display: flex;
          gap: 0.5rem;
        }

        .details-button {
          padding: 0.5rem;
          border: none;
          background: #f3f4f6;
          color: #6b7280;
          border-radius: 0.375rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          transition: all 0.3s;
        }

        .details-button:hover {
          background: #e5e7eb;
        }

        .delete-button {
          padding: 0.5rem;
          border: none;
          background: #fee2e2;
          color: #dc2626;
          border-radius: 0.375rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          transition: all 0.3s;
        }

        .delete-button:hover {
          background: #fecaca;
        }

        .delete-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .platform-connections {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .platform-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #e5e7eb;
          padding-top: 0.75rem;
        }

        .platform-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .platform-info span {
          font-weight: 500;
          color: #374151;
        }

        .connection-status {
          display: flex;
          align-items: center;
        }

        .status-indicator {
          padding: 0.25rem 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .status-indicator.connected {
          background: #dcfce7;
          color: #166534;
        }

        .connect-button {
          background: #8A63FF;
          color: white;
          border: none;
          border-radius: 0.375rem;
          padding: 0.5rem 1rem;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .connect-button:hover {
          background: #7c59d6;
        }

        .connect-button:disabled {
          background: #d1d5db;
          cursor: not-allowed;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 3rem;
          background: white;
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
        }

        .empty-state svg {
          margin: 0 auto 1rem;
        }

        .empty-state h3 {
          font-size: 1.5rem;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: #6b7280;
          margin-bottom: 1.5rem;
        }

        .agent-details-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
        }

        .modal-content {
          background: white;
          border-radius: 0.5rem;
          padding: 1.5rem;
          width: 90%;
          max-width: 600px;
          position: relative;
          max-height: 80vh;
          overflow: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .modal-header h3 {
          font-size: 1.5rem;
          font-weight: bold;
          color: #1f2937;
        }

        .close-button {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
        }

        .close-button:hover {
          color: #374151;
        }

        .modal-body {
          padding: 1rem 0;
        }

        .modal-body pre {
          background: #f3f4f6;
          padding: 1rem;
          border-radius: 0.375rem;
          overflow: auto;
          color: #374151;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}