import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiMessageCircle, FiChevronUp,
  FiChevronDown, FiCheck, FiSave
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useApp } from '../../../../context/AppContext';
import { socketService } from '../../../../services/socketService';
import { Criptografar, Descriptografar } from '../../../../Cripto/index';
import LoadingScreen from '../../../../components/loading/LoadingScreen';
import styles from './Sequencia.module.css';

const SequenceConfiguration = ({ campaignId, onBack }) => {

  const navigate = useNavigate();
  const { user, isLoading, setIsLoading } = useApp();

  const [bots, setBots] = useState([]);
  const [activeBots, setActiveBots] = useState([]);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load bots on component mount
  useEffect(() => {
    if (campaignId) {
      fetchBots();
    }
  }, [campaignId]);

  // Fetch bots and their active status
  const fetchBots = useCallback(async () => {
    if (!user?.LOGIN || !campaignId) {
      return;
    }

    try {
      // setIsLoading(true);
      setError(null);

      // First fetch all bots
      const get = {
        Code: '234645423654423465',
        Login: user.LOGIN,
        Campanha: campaignId
      };


      // Create a promise to handle the async response
      const botsDataPromise = new Promise((resolve, reject) => {
        // Set up a one-time listener for the response
        socketService.socket.once('MeusRobosResponse', (data) => {
          try {
            const { Code, Dados } = JSON.parse(Descriptografar(data));

            if (Code !== '6253442653442365') {
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
        socketService.socket.emit('MeusRobos', Criptografar(JSON.stringify(get)));

        // Add timeout in case of no response
        setTimeout(() => {
          socketService.socket.off('MeusRobosResponse');
          reject(new Error("Timeout fetching bots"));
        }, 15000);
      });

      // Wait for the response
      const botsData = await botsDataPromise;

      // Process the bots data
      const processedBots = botsData.map((item, index) => ({
        id: item.DADOS[0]?.ID || String(index + 1),
        name: item.DADOS[0]?.EMPRESA || `Bot ${index + 1}`,
        platform: item.DADOS[0]?.REDE || '0',
        protocol: item.PROTOCOLO,
        login: item.DADOS[0]?.LOGIN,
        isActive: false, // Default inactive, will update after fetching sequence
        order: 0 // Default order
      }));

      setBots(processedBots);

      // Then fetch active sequence
      const getDisparos = {
        Code: '9876541234567543',
        Login: user.LOGIN,
        Campanha: campaignId
      };

      // Create a promise to handle the async response
      const sequenceDataPromise = new Promise((resolve, reject) => {
        // Set up a one-time listener for the response
        socketService.socket.once('ListarDisparosResponse', (data) => {
          try {
            const { Code, Dados } = JSON.parse(Descriptografar(data));

            if (Code !== '9876548765987612') {
              reject(new Error("Invalid response code"));
              return;
            }

            resolve(Dados || []);
          } catch (err) {
            reject(err);
          }
        });

        // Send the request
        socketService.socket.emit('ListarDisparos', Criptografar(JSON.stringify(getDisparos)));

        // Add timeout in case of no response
        setTimeout(() => {
          socketService.socket.off('ListarDisparosResponse');
          reject(new Error("Timeout fetching sequence"));
        }, 15000);
      });

      // Wait for the response
      const sequenceData = await sequenceDataPromise;

      // Update bots with active status and order
      const updatedBots = processedBots.map(bot => {
        const activeBot = sequenceData.find(item =>
          item.id === bot.id || item.protocolo === bot.protocol
        );

        if (activeBot) {
          return {
            ...bot,
            isActive: true,
            order: activeBot.ordem || 0
          };
        }
        return bot;
      });

      // Sort bots by active status and order
      const sortedBots = updatedBots.sort((a, b) => {
        if (a.isActive && b.isActive) {
          return a.order - b.order;
        }
        if (a.isActive) return -1;
        if (b.isActive) return 1;
        return 0;
      });

      setBots(sortedBots);
      setActiveBots(sortedBots.filter(bot => bot.isActive));
    } catch (error) {



    } finally {
      setIsLoading(false);
    }
  }, [user, campaignId, setIsLoading]);


  const handleBackClick = () => {
    if (onBack) {
      onBack();
    }
  };

  // Toggle bot active status
  const handleToggleActive = (botId) => {
    setBots(prevBots => {
      const newBots = [...prevBots];

      // Find the bot to toggle
      const botIndex = newBots.findIndex(bot => bot.id === botId);
      if (botIndex === -1) return prevBots;

      // Toggle active status
      const updatedBot = {
        ...newBots[botIndex],
        isActive: !newBots[botIndex].isActive
      };

      // If activating, set order
      if (updatedBot.isActive) {
        const activeBots = newBots.filter(bot => bot.isActive);
        updatedBot.order = activeBots.length + 1;
      } else {
        // If deactivating, set order to 0
        updatedBot.order = 0;
      }

      newBots[botIndex] = updatedBot;

      // Sort bots by active status and order
      const sortedBots = newBots.sort((a, b) => {
        if (a.isActive && b.isActive) {
          return a.order - b.order;
        }
        if (a.isActive) return -1;
        if (b.isActive) return 1;
        return 0;
      });

      // Update active bots list
      setActiveBots(sortedBots.filter(bot => bot.isActive));

      return sortedBots;
    });
  };

  // Move bot up or down in the sequence
  const handleMoveBot = (botId, direction) => {
    setBots(prevBots => {
      const newBots = [...prevBots];

      // Get active bots only
      const activeBots = newBots.filter(bot => bot.isActive);

      // Find the bot to move
      const botIndex = activeBots.findIndex(bot => bot.id === botId);
      if (botIndex === -1) return prevBots;

      // Check if movement is possible
      if (direction === 'up' && botIndex === 0) return prevBots;
      if (direction === 'down' && botIndex === activeBots.length - 1) return prevBots;

      // Get the index to swap with
      const swapIndex = direction === 'up' ? botIndex - 1 : botIndex + 1;

      // Get the bots to swap
      const bot = activeBots[botIndex];
      const swapBot = activeBots[swapIndex];

      // Swap orders
      const tempOrder = bot.order;
      bot.order = swapBot.order;
      swapBot.order = tempOrder;

      // Update bots in the original array
      for (let i = 0; i < newBots.length; i++) {
        if (newBots[i].id === bot.id) {
          newBots[i] = bot;
        } else if (newBots[i].id === swapBot.id) {
          newBots[i] = swapBot;
        }
      }

      // Sort bots by active status and order
      const sortedBots = newBots.sort((a, b) => {
        if (a.isActive && b.isActive) {
          return a.order - b.order;
        }
        if (a.isActive) return -1;
        if (b.isActive) return 1;
        return 0;
      });

      // Update active bots list
      setActiveBots(sortedBots.filter(bot => bot.isActive));

      return sortedBots;
    });
  };

  // Save sequence configuration
  const saveSequence = async () => {
    try {
      setSaving(true);

      // Get active bots
      const activeBotsList = bots.filter(bot => bot.isActive);

      if (activeBotsList.length === 0) {
        toast.warning("Selecione pelo menos um bot para a sequência");
        setSaving(false);
        return;
      }

      const data = {
        Code: '5436543665436512',
        Login: user.LOGIN.toLowerCase(),

        Robos: activeBotsList.map(bot => ({
          id: bot.id,
          protocolo: bot.protocol.toLowerCase(),
          nome: bot.name.toLowerCase(),
          ordem: bot.order,
          campanha: String(campaignId).toLowerCase(),
        })),
      };

      // console.log(data)
      // Create a promise to handle the async response
      const saveSequencePromise = new Promise((resolve, reject) => {
        // Set up a one-time listener for the response
        socketService.socket.once('AtualizarSequenciaDisparoResponse', (responseData) => {
          try {
            const response = JSON.parse(Descriptografar(responseData));

            if (response?.Code !== '5436543234512') {
              reject(new Error("Failed to update sequence"));
              return;
            }

            resolve(true);
          } catch (err) {
            reject(err);
          }
        });

        // Send the request
        socketService.socket.emit('AtualizarSequenciaDisparo', Criptografar(JSON.stringify(data)));

        // Add timeout in case of no response
        setTimeout(() => {
          socketService.socket.off('AtualizarSequenciaDisparoResponse');
          reject(new Error("Timeout updating sequence"));
        }, 15000);
      });

      // Wait for the response
      await saveSequencePromise;

      toast.success("Sequência de disparo atualizada com sucesso!");
    } catch (error) {
      // console.error("Error saving sequence:", error);
      toast.error(error.message || "Erro ao salvar sequência");
    } finally {
      setSaving(false);
    }
  };

  // Get platform name
  const getPlatformName = (platform) => {
    switch (platform) {
      case '0':
        return 'WhatsApp';
      case '2':
        return 'Instagram';
      default:
        return 'Aplicativo';
    }
  };

  if (isLoading && bots.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerGradient}>
        <div className={styles.headerContent}>
          <button
            className={styles.backButton}
            onClick={handleBackClick}
          >
            <FiArrowLeft size={20} />
            <span>Voltar</span>
          </button>

          <h1>Sequência de Disparo</h1>
          <p>Gerencie a ordem dos robôs para automação</p>

          <div className={styles.activeBotsBadge}>
            <span>{activeBots.length} robôs ativos</span>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {error && (
          <div className={styles.errorContainer}>
            <p>{error}</p>
            <button
              className={styles.retryButton}
              onClick={fetchBots}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {bots.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FiMessageCircle size={60} />
            </div>
            <p>Nenhum robô encontrado.</p>
            <p>Crie robôs na tela de automações para configurar a sequência.</p>
          </div>
        ) : (
          <>
            <div className={styles.helpTip}>
              <p>
                <strong>Dica:</strong> Ative os robôs que deseja usar na sequência.
                Use as setas para reorganizar a ordem de disparo.
              </p>
            </div>

            <div className={styles.botsList}>
              {bots.map((bot, index) => (
                <div
                  key={bot.id}
                  className={`${styles.botItem} ${bot.isActive ? styles.activeBot : ''}`}
                >
                  {/* Order controls for active bots */}
                  {bot.isActive && (
                    <div className={styles.orderControls}>
                      <button
                        className={`${styles.orderButton} ${index === 0 || !bot.isActive ? styles.disabledButton : ''}`}
                        onClick={() => handleMoveBot(bot.id, 'up')}
                        disabled={index === 0 || !bot.isActive}
                      >
                        <FiChevronUp size={16} />
                      </button>

                      <button
                        className={`${styles.orderButton} ${index === activeBots.length - 1 || !bot.isActive ? styles.disabledButton : ''}`}
                        onClick={() => handleMoveBot(bot.id, 'down')}
                        disabled={index === activeBots.length - 1 || !bot.isActive}
                      >
                        <FiChevronDown size={16} />
                      </button>
                    </div>
                  )}

                  {/* Order number for active bots */}
                  {bot.isActive && (
                    <div className={styles.orderBadge}>
                      {bot.order}
                    </div>
                  )}

                  {/* Bot info */}
                  <div className={styles.botInfo}>
                    <h3 className={styles.botName}>{bot.name}</h3>
                    <div className={styles.botPlatform}>
                      <FiMessageCircle size={12} />
                      <span>{getPlatformName(bot.platform)}</span>
                    </div>
                  </div>

                  {/* Toggle switch */}
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={bot.isActive}
                      onChange={() => handleToggleActive(bot.id)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <button
        className={styles.saveButton}
        onClick={saveSequence}
        disabled={saving || activeBots.length === 0}
      >
        {saving ? (
          <div className={styles.spinner}></div>
        ) : (
          <>
            <FiSave size={20} />
            <span>Salvar</span>
          </>
        )}
      </button>
    </div>
  );
};

export default SequenceConfiguration;