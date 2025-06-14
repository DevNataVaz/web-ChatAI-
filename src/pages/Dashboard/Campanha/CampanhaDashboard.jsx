import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiPlus, FiZap, FiCalendar, FiHash, FiEye, FiActivity, FiTrendingUp } from 'react-icons/fi';
import { useApp } from '../../../context/AppContext';
import { socketService } from '../../../services/socketService';
import { Criptografar, Descriptografar } from '../../../Cripto/index';
import LoadingScreen from '../../../components/loading/LoadingScreen';
import CreateCampaignModal from '../Campanha/Modal/CampanhaModal';
import styles from './CampanhaDashboard.module.css';

const CampaignDashboard = ({ onSelectCampaign }) => {
  const navigate = useNavigate();
  const { user, isLoading, setIsLoading, safeEmit } = useApp();
  
  const [campaigns, setCampaigns] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load campaigns on component mount
  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Fetch campaigns from the server
  const fetchCampaigns = useCallback(async () => {
    if (!user?.LOGIN) {
      setError("User not authenticated");
      return;
    }

    try {
      setError(null);

      const get = {
        Code: '876543276543',
        Login: user.LOGIN,
      };

      // Create a promise to handle the async response
      const campaignsDataPromise = new Promise((resolve, reject) => {
        // Set up a one-time listener for the response
        socketService.socket.once('MinhasCampanhasResponse', (data) => {
          try {
            const { Code, Dados } = JSON.parse(Descriptografar(data));

            if (Code !== '987654321987') {
              reject(new Error("Invalid response code"));
              return;
            }
            
            if (Dados && Array.isArray(Dados)) {
              resolve(Dados);
            } else {
              resolve([]);
            }
          } catch (err) {
            reject(err);
          }
        });

        // Send the request
        socketService.socket.emit('MinhasCampanhas', Criptografar(JSON.stringify(get)));
      });

      // Wait for the response
      const campaignsData = await campaignsDataPromise;
      
      // Process the campaigns data
      const processedCampaigns = campaignsData.map((item, index) => ({
        id: String(index + 1),
        nome: item.NOME,
        descricao: item.DESCRICAO,
        protocolo: item.PROTOCOLO,
        dataCriacao: new Date(item.DATA_CRIACAO).toLocaleDateString('pt-BR'),
        status: item.STATUS
      }));

      setCampaigns(processedCampaigns);
    } catch (error) {
      // console.error("Error fetching campaigns:", error);
      setError("Failed to load campaigns. Please try again.");
    }
  }, [user, setIsLoading]);

  // Handle campaign creation success
  const handleCampaignCreated = () => {
    setShowCreateModal(false);
    fetchCampaigns();
    toast.success("Campanha criada com sucesso!");
  };

  // Delete a campaign
  const handleDeleteCampaign = (protocolo, event) => {
    event.stopPropagation(); // Prevent card click
    
    if (!window.confirm("Tem certeza que deseja excluir esta campanha?")) {
      return;
    }

    try {
      const req = {
        Code: '567891234567',
        Protocolo: Criptografar(protocolo),
        Login: user.LOGIN,
      };
      
      socketService.emit('ExcluirCampanha', Criptografar(JSON.stringify(req)));
      
      // Update local state immediately to improve UX
      setCampaigns(prev => prev.filter(camp => camp.protocolo !== protocolo));
      
      // Toast success message
      toast.success("Campanha excluída com sucesso!");
      
      // Refresh campaigns after a short delay
      setTimeout(() => {
        fetchCampaigns();
      }, 5000);
    } catch (error) {
      // console.error("Error deleting campaign:", error);
      toast.error("Erro ao excluir campanha");
    }
  };

  // Navigate to campaign details
  const handleOpenCampaign = (protocolo, event) => {
    event.stopPropagation(); // Prevent card click
    if (onSelectCampaign) {
      onSelectCampaign(protocolo);
    }
  };

  // Handle card click
  const handleCardClick = (protocolo) => {
    if (onSelectCampaign) {
      onSelectCampaign(protocolo);
    }
  };

  // Get status badge color and icon
  const getStatusInfo = (status) => {
    switch(status) {
      case 'ATIVA':
        return { 
          className: styles.statusActive, 
          icon: <FiActivity size={12} />,
          text: 'Ativa'
        };
      case 'PAUSADA':
        return { 
          className: styles.statusPaused, 
          icon: <FiZap size={12} />,
          text: 'Pausada'
        };
      default:
        return { 
          className: styles.statusInactive, 
          icon: <FiZap size={12} />,
          text: 'Inativa'
        };
    }
  };

  // Get campaign stats
  const getStats = () => {
    const active = campaigns.filter(c => c.status === 'ATIVA').length;
    const paused = campaigns.filter(c => c.status === 'PAUSADA').length;
    const inactive = campaigns.filter(c => c.status === 'INATIVA').length;
    
    return { active, paused, inactive, total: campaigns.length };
  };

  if (isLoading && !refreshing) {
    return <LoadingScreen />;
  }

  const stats = getStats();

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.headerGradient}>
        <div className={styles.headerContent}>
          <h1>Minhas Campanhas</h1>
          <p>Gerencie e monitore suas campanhas de marketing com facilidade</p>
          
          <div className={styles.campaignCountBadge}>
            <FiTrendingUp size={14} style={{ marginRight: '6px' }} />
            {stats.total} campanhas
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {error && (
          <div className={styles.errorContainer}>
            <p>{error}</p>
            <button className={styles.retryButton} onClick={fetchCampaigns}>
              Tentar novamente
            </button>
          </div>
        )}

        {!error && campaigns.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FiCalendar size={60} />
            </div>
            <p>Nenhuma campanha encontrada</p>
            <p>Clique no botão + para criar sua primeira campanha e começar a gerenciar seus projetos de marketing.</p>
          </div>
        ) : (
          <div className={styles.campaignsGrid}>
            {campaigns.map((campaign, index) => {
              const statusInfo = getStatusInfo(campaign.status);
              
              return (
                <div 
                  key={campaign.id} 
                  className={styles.campaignCard}
                  onClick={() => handleCardClick(campaign.protocolo)}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={styles.campaignContent}>
                    <div className={styles.campaignIconContainer}>
                      <div className={styles.campaignIcon}>
                        <FiZap size={22} />
                      </div>
                    </div>
                    
                    <div className={styles.campaignInfo}>
                      <h3 className={styles.campaignName}>{campaign.nome}</h3>
                      
                      {campaign.descricao && (
                        <p className={styles.campaignDescription}>{campaign.descricao}</p>
                      )}
                      
                      <div className={styles.campaignMeta}>
                        <div className={styles.metaItem}>
                          <FiCalendar size={12} />
                          <span>{campaign.dataCriacao}</span>
                        </div>
                        
                        <div className={styles.metaItem}>
                          <FiHash size={12} />
                          <span>{campaign.protocolo}</span>
                        </div>
                      </div>
                      
                      <div className={styles.campaignActions}>
                        <button 
                          className={styles.openButton} 
                          onClick={(e) => handleOpenCampaign(campaign.protocolo, e)}
                        >
                          <FiEye size={14} />
                          <span>Abrir</span>
                        </button>
                        
                        <div className={`${styles.statusBadge} ${statusInfo.className}`}>
                          {statusInfo.icon}
                          <span style={{ marginLeft: '4px' }}>{statusInfo.text}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={styles.deleteOverlay}
                    onClick={(e) => handleDeleteCampaign(campaign.protocolo, e)}
                  >
                    <span>Excluir</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button 
        className={styles.addButton}
        onClick={() => setShowCreateModal(true)}
        aria-label="Criar nova campanha"
        title="Criar nova campanha"
      >
        <FiPlus size={26} />
      </button>

      {showCreateModal && (
        <CreateCampaignModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCampaignCreated}
        />
      )}
    </div>
  );
};

export default CampaignDashboard;