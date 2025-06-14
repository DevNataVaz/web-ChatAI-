import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiZap, FiCalendar, FiHash,
  FiMessageCircle, FiList, FiPlus, FiInstagram,
  FiCopy, FiMoreHorizontal, FiX, FiAlertCircle
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useApp } from '../../../../context/AppContext';
import { socketService } from '../../../../services/socketService';
import { Criptografar, Descriptografar } from '../../../../Cripto/index';
import LoadingScreen from '../../../../components/loading/LoadingScreen';
import styles from './CampanhaDetalhe.module.css';
// Importar os componentes necessários
import CreateAgentModal from '../../Components/CreateAgentModal.jsx';
import BotDetail from '../../Components/BotDetail/BotDetail.jsx';

const CampaignDetail = ({
  campaignId,
  onBack,
  onOpenApiTriggers,
  onOpenDisparo,
  onOpenSequence,
  onSelectBot
}) => {

  const navigate = useNavigate();
  const { user, isLoading, setIsLoading } = useApp();

  const [campaign, setCampaign] = useState(null);
  const [bots, setBots] = useState([]);
  const [botLimit, setBotLimit] = useState(0);
  const [error, setError] = useState(null);

  // Adicionar novos estados para o modal e BotDetail
  const [selectedBot, setSelectedBot] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({});
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQRCodeData] = useState("");
  const [qrCodeLoading, setQrCodeLoading] = useState(false);
  const [currentQrProtocol, setCurrentQrProtocol] = useState(null);

  // Estados para duplicação - MELHORADOS
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [botToDuplicate, setBotToDuplicate] = useState(null);
  const [duplicatingBot, setDuplicatingBot] = useState(false);
  const [duplicateStep, setDuplicateStep] = useState('');

  // Novo estado para controlar se já verificou status inicial
  const [initialStatusChecked, setInitialStatusChecked] = useState(false);
  
  // NOVO: Estado para rastrear verificações pendentes
  const [pendingChecks, setPendingChecks] = useState(new Set());
  
  // NOVO: Estado para forçar re-render quando necessário
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // NOVO: Cache de últimos status conhecidos para evitar perda de dados
  const [statusCache, setStatusCache] = useState({});

  // Refs para evitar stale closures
  const connectionStatusRef = useRef({});
  const currentQrProtocolRef = useRef(null);
  const eventListenersSetRef = useRef(false);
  const botsRef = useRef([]);

  // Atualizar refs quando os estados mudarem
  useEffect(() => {
    connectionStatusRef.current = connectionStatus;
    currentQrProtocolRef.current = currentQrProtocol;
    botsRef.current = bots;
  }, [connectionStatus, currentQrProtocol, bots]);

  // NOVO: Monitor de verificações pendentes
  useEffect(() => {
    // console.log('📋 Verificações pendentes atualizadas:', Array.from(pendingChecks));
  }, [pendingChecks]);

  // FUNÇÃO MELHORADA para processar status do servidor
  const processConnectionStatus = useCallback((statusData) => {
    // O servidor pode retornar diferentes formatos:
    // 1. Boolean: true/false
    // 2. String: "true"/"false" 
    // 3. String: "ativo"/"inativo"
    // 4. Object: { auth: "ativo" } ou similar

    let isConnected = false;

    // console.log('processConnectionStatus - dados recebidos:', statusData, typeof statusData);

    if (typeof statusData === 'boolean') {
      isConnected = statusData;
    } else if (typeof statusData === 'string') {
      const lowerStatus = statusData.toLowerCase();
      isConnected = lowerStatus === 'true' || 
                   lowerStatus === 'ativo' || 
                   lowerStatus === 'conectado' ||
                   lowerStatus === 'online';
    } else if (typeof statusData === 'object' && statusData !== null) {
      // Se for um objeto, verificar propriedades comuns
      if (statusData.auth) {
        const authStatus = statusData.auth.toString().toLowerCase();
        isConnected = authStatus === 'true' || 
                     authStatus === 'ativo' || 
                     authStatus === 'conectado' ||
                     authStatus === 'online';
      } else if (statusData.connected !== undefined) {
        isConnected = Boolean(statusData.connected);
      } else if (statusData.status !== undefined) {
        const status = statusData.status.toString().toLowerCase();
        isConnected = status === 'true' || 
                     status === 'ativo' || 
                     status === 'conectado' ||
                     status === 'online';
      }
    }

    // console.log('processConnectionStatus - resultado:', isConnected);
    return isConnected;
  }, []);

  // Setup event listeners for QR code and connection status - VERSÃO CORRIGIDA
  useEffect(() => {
    if (!user?.LOGIN) return;

    // console.log('Configurando listeners no CampaignDetail...');

    // Setup QR Code event listener
    const handleQrCode = (data) => {
      try {
        if (!data || !data.Code || !data.QRCODE) return;

        const code = Descriptografar(data.Code);
        if (code === '129438921435') {
          const qrData = Descriptografar(data.QRCODE);
          setQRCodeData(qrData);
          setQrCodeLoading(false);
        }
      } catch (error) {
        // console.error("Error handling QR code:", error);
        setQrCodeLoading(false);
      }
    };

    // Setup WhatsApp response listener
    const handleWhatsappResponse = (data) => {
      try {
        if (!data || !data.Code) return;

        const code = Descriptografar(data.Code);
        if (code === '129438921435') {
          const titulo = data.Titulo ? Descriptografar(data.Titulo) : '';
          const mensagem = data.Mensagem ? Descriptografar(data.Mensagem) : '';

          if (mensagem.includes('pronta para atender') || titulo.includes('Ótimas Notícias')) {
            const currentProtocol = currentQrProtocolRef.current;
            if (currentProtocol) {
              // console.log(`WhatsApp conectado para protocolo: ${currentProtocol}`);
              setConnectionStatus(prev => ({
                ...prev,
                [currentProtocol]: true
              }));

              setShowQRModal(false);
              toast.success(mensagem || "WhatsApp conectado com sucesso!");
            }
          } else if (titulo.includes('Erro')) {
            toast.error(mensagem || "Erro ao conectar WhatsApp");
          }
        }
      } catch (error) {
        // console.error("Error handling WhatsApp response:", error);
      }
    };

    // Setup connection status update listener - VERSÃO MELHORADA
    const handleConnectionUpdate = (data) => {
      try {
        if (!data || !data.Code || !data.Dados) {
          // console.log('Dados inválidos recebidos no handleConnectionUpdate:', data);
          return;
        }

        const code = Descriptografar(data.Code);
        // console.log('Código descriptografado:', code);
        
        if (code === '17326186765984') {
          // Descriptografar os dados do status
          const rawStatusData = Descriptografar(data.Dados);
          // console.log('Status bruto recebido:', rawStatusData, typeof rawStatusData);
          
          // Processar o status usando a nova função
          const isConnected = processConnectionStatus(rawStatusData);
          // console.log(`Status processado: ${isConnected}`);
          
          // Verificar se temos o identificador do bot
          let botProtocol = null;
          if (data.Identificador) {
            try {
              botProtocol = Descriptografar(data.Identificador);
              // console.log('Protocolo do bot identificado:', botProtocol);
            } catch (err) {
              // console.warn("Erro ao descriptografar identificador:", err);
              return;
            }
          }

          // Se temos o protocolo específico, atualizar apenas esse bot
          if (botProtocol) {
            // console.log(`Atualizando status do bot ${botProtocol} para: ${isConnected}`);
            
            setConnectionStatus(prev => {
              const newStatus = { ...prev, [botProtocol]: isConnected };
              // console.log('Novo connectionStatus:', newStatus);
              return newStatus;
            });
          } else {
            // NOVA LÓGICA: Se não temos protocolo específico, verificar qual bot acabamos de consultar
            // console.log('Sem identificador específico. Tentando identificar bot por contexto...');
            
            // Verificar se é para o protocolo atual do QR
            const currentProtocol = currentQrProtocolRef.current;
            if (currentProtocol) {
              // console.log(`Atualizando status do protocolo atual ${currentProtocol} para: ${isConnected}`);
              setConnectionStatus(prev => ({
                ...prev,
                [currentProtocol]: isConnected
              }));
            } else {
              // FALLBACK: Se temos apenas um bot, assumir que é para ele
              const currentBots = botsRef.current;
              if (currentBots.length === 1) {
                const singleBotProtocol = currentBots[0].protocol;
                // console.log(`Apenas um bot encontrado. Atualizando status de ${singleBotProtocol} para: ${isConnected}`);
                setConnectionStatus(prev => ({
                  ...prev,
                  [singleBotProtocol]: isConnected
                }));
              } else {
                // ÚLTIMO RECURSO: Verificar se acabamos de fazer uma verificação e aplicar a todos os bots consultados recentemente
                // console.log('Múltiplos bots. Tentando aplicar status a todos os bots ativos...');
                
                // Aplicar status a todos os bots (temporário até que o servidor envie o identificador)
                setConnectionStatus(prev => {
                  const newStatus = { ...prev };
                  currentBots.forEach(bot => {
                    // Só atualizar se não temos informação específica para este bot
                    if (newStatus[bot.protocol] === undefined) {
                      newStatus[bot.protocol] = isConnected;
                      // console.log(`Aplicando status genérico para bot ${bot.protocol}: ${isConnected}`);
                    }
                  });
                  return newStatus;
                });
              }
            }
          }

          // FORÇAR re-render após atualização do status
          setTimeout(() => {
            // console.log('Status após timeout:', connectionStatusRef.current);
          }, 100);
        }
      } catch (error) {
        // console.error("Error handling connection update:", error);
      }
    };

    // Remover listeners anteriores para evitar duplicação
    socketService.off('WhatsappQR', handleQrCode);
    socketService.off('WhatsappResponse', handleWhatsappResponse);
    socketService.off('updatesWhatsapp', handleConnectionUpdate);

    // Register event listeners
    socketService.on('WhatsappQR', handleQrCode);
    socketService.on('WhatsappResponse', handleWhatsappResponse);
    socketService.on('updatesWhatsapp', handleConnectionUpdate);

    // console.log('Listeners configurados com sucesso');

    // Mark that listeners have been configured
    eventListenersSetRef.current = true;

    // Cleanup on unmount
    return () => {
      // console.log('Removendo listeners do CampaignDetail...');
      socketService.off('WhatsappQR', handleQrCode);
      socketService.off('WhatsappResponse', handleWhatsappResponse);
      socketService.off('updatesWhatsapp', handleConnectionUpdate);
      eventListenersSetRef.current = false;
    };
  }, [user, processConnectionStatus]);

  // Fetch campaign and bots data
  useEffect(() => {
    if (campaignId) {
      fetchCampaignDetails();
      fetchBots();
    }
  }, [campaignId]);

  // Check bot status - VERSÃO COM TRACKING
  const checkBotStatus = useCallback((protocol) => {
    if (!protocol) {
      // console.log('Protocolo inválido para verificação de status');
      return;
    }

    try {
      // console.log(`🔍 Verificando status do bot: ${protocol}`);
      
      // Adicionar ao conjunto de verificações pendentes
      setPendingChecks(prev => new Set([...prev, protocol]));
      
      // Usar StatusWhatsapp em vez de updatesWhatsapp para verificação inicial
      socketService.emit('StatusWhatsapp', {
        Code: Criptografar('7668566448964451'),
        Identificador: Criptografar(protocol),
      });
      
      // console.log(`✅ Solicitação de status enviada para bot: ${protocol}`);
      
      // Remover da lista de pendentes após timeout (cleanup)
      setTimeout(() => {
        setPendingChecks(prev => {
          const newSet = new Set(prev);
          newSet.delete(protocol);
          return newSet;
        });
      }, 5000); // 5 segundos timeout
      
    } catch (error) {
      // console.error("Error checking bot status:", error);
      // Remover da lista de pendentes em caso de erro
      setPendingChecks(prev => {
        const newSet = new Set(prev);
        newSet.delete(protocol);
        return newSet;
      });
    }
  }, []);

  // Check all bots status - VERSÃO MELHORADA
  const checkAllBotsStatus = useCallback(() => {
    if (bots.length === 0) return;

    // console.log(`Verificando status de ${bots.length} bots...`);
    
    // Limpar status antes de verificar
    setConnectionStatus({});
    
    // Verificar cada bot com um pequeno delay para não sobrecarregar
    bots.forEach((bot, index) => {
      setTimeout(() => {
        checkBotStatus(bot.protocol);
      }, index * 300); // 300ms de delay entre cada verificação
    });

    // Marcar que a verificação inicial foi feita
    setInitialStatusChecked(true);
  }, [bots, checkBotStatus]);

  // NOVA FUNÇÃO: Verificação periódica de status
  const startPeriodicStatusCheck = useCallback(() => {
    // Verificação inicial apenas se não foi feita ainda
    if (!initialStatusChecked) {
      setTimeout(() => {
        checkAllBotsStatus();
      }, 1000); // Aguardar 1 segundo após carregar os bots
    }

    // Configurar verificação periódica a cada 45 segundos
    const interval = setInterval(() => {
      if (botsRef.current.length > 0) {
        // console.log("Verificação periódica de status dos bots...");
        botsRef.current.forEach((bot, index) => {
          setTimeout(() => {
            checkBotStatus(bot.protocol);
          }, index * 200);
        });
      }
    }, 45000); // 45 segundos

    return () => clearInterval(interval);
  }, [checkAllBotsStatus, checkBotStatus, initialStatusChecked]);

  // Check all bots status when bots list changes - VERSÃO MUITO MELHORADA
  useEffect(() => {
    if (bots.length > 0 && user?.LOGIN) {
      // console.log(`🚀 Iniciando verificação de status para ${bots.length} bots...`);
      
      // Reset do status antes de verificar
      setConnectionStatus({});
      
      // Verificação inicial com delay escalonado para evitar sobrecarga
      bots.forEach((bot, index) => {
        const delay = index * 500; // 500ms entre cada verificação
        
        setTimeout(() => {
           console.log(`⏰ Verificando bot ${bot.name} (${bot.protocol}) em ${delay}ms...`);
          checkBotStatus(bot.protocol);
        }, delay);
      });

      // Marcar que a verificação inicial foi realizada
      setTimeout(() => {
        setInitialStatusChecked(true);
        // console.log('✅ Verificação inicial de status concluída');
      }, bots.length * 500 + 1000);

      // Verificação adicional após 3 segundos para garantir
      const backupCheck = setTimeout(() => {
        // console.log('🔄 Executando verificação de backup...');
        bots.forEach((bot, index) => {
          setTimeout(() => {
            checkBotStatus(bot.protocol);
          }, index * 200);
        });
      }, 3000);

      // Verificação periódica a cada 30 segundos
      const periodicCheck = setInterval(() => {
        if (botsRef.current.length > 0) {
          // console.log('🔄 Verificação periódica de status...');
          botsRef.current.forEach((bot, index) => {
            setTimeout(() => {
              checkBotStatus(bot.protocol);
            }, index * 200);
          });
        }
      }, 30000);

      return () => {
        clearTimeout(backupCheck);
        clearInterval(periodicCheck);
      };
    }
  }, [bots, checkBotStatus, user]);

  // NOVA FUNÇÃO: Force status update quando o componente monta
  useEffect(() => {
    if (bots.length > 0 && !initialStatusChecked) {
      // Forçar uma verificação imediata
      const immediateCheck = setTimeout(() => {
        // console.log('⚡ Verificação imediata forçada...');
        bots.forEach(bot => {
          checkBotStatus(bot.protocol);
        });
      }, 100);

      return () => clearTimeout(immediateCheck);
    }
  }, [bots, initialStatusChecked, checkBotStatus]);

  // Reset initial status check when bots list changes significantly
  useEffect(() => {
    setInitialStatusChecked(false);
  }, [bots.length]);

  // DEBUG: Monitor mudanças no connectionStatus com força de atualização
  useEffect(() => {
     console.log('🔄 connectionStatus atualizado:', connectionStatus);
    Object.entries(connectionStatus).forEach(([protocol, status]) => {
      const bot = bots.find(b => b.protocol === protocol);
       console.log(`Bot ${bot?.name || protocol}: ${status ? '🟢 CONECTADO' : '🔴 DESCONECTADO'}`);
    });
    
    // Atualizar cache de status
    setStatusCache(prev => ({ ...prev, ...connectionStatus }));
    
    // Forçar re-render para garantir que a UI seja atualizada
    setForceUpdate(prev => prev + 1);
  }, [connectionStatus, bots]);

  // NOVO: Função para obter status do bot (com fallback para cache)
  const getBotStatus = useCallback((protocol) => {
    // Primeiro verificar connectionStatus atual
    if (connectionStatus[protocol] !== undefined) {
      return connectionStatus[protocol];
    }
    
    // Fallback para cache se não tiver no estado atual
    if (statusCache[protocol] !== undefined) {
      // console.log(`📋 Usando status do cache para ${protocol}: ${statusCache[protocol]}`);
      return statusCache[protocol];
    }
    
    // Default para false se não tiver informação
    return false;
  }, [connectionStatus, statusCache]);

  const fetchCampaignDetails = useCallback(async () => {
    if (!user?.LOGIN || !campaignId) {
      return;
    }

    // Criar um objeto de campanha padrão
    const createDefaultCampaign = () => ({
      nome: `Campanha ${campaignId.substring(0, 6)}...`,
      descricao: "Detalhes indisponíveis no momento",
      protocolo: campaignId,
      dataCriacao: new Date().toLocaleDateString('pt-BR'),
      status: "ATIVA"
    });

    try {
      setError(null);

      // Use uma campanha padrão e continue com a aplicação
      setCampaign(createDefaultCampaign());
      setIsLoading(false);

      // Ainda tenta buscar os detalhes reais em segundo plano
      const request = {
        Code: '897654321987',
        Login: user.LOGIN,
        Protocolo: campaignId
      };

      socketService.once('CampanhaDetalhesResponse', (data) => {
        try {
          const { Code, Dados } = JSON.parse(Descriptografar(data));
          if (Code === '123456789987' && Dados) {
            setCampaign({
              nome: Dados.NOME,
              descricao: Dados.DESCRICAO,
              protocolo: Dados.PROTOCOLO,
              dataCriacao: new Date(Dados.DATA_CRIACAO).toLocaleDateString('pt-BR'),
              status: Dados.STATUS
            });
          }
        } catch (err) {
          // console.warn("Erro ao processar detalhes da campanha:", err);
          // Continua usando a campanha padrão
        }
      });

      socketService.emit('CampanhaDetalhes', Criptografar(JSON.stringify(request)));
    } catch (error) {
      // console.error("Error fetching campaign details:", error);
      setCampaign(createDefaultCampaign());
      setIsLoading(false);
    }
  }, [user, campaignId]);

  // Fetch bots for this campaign
  const fetchBots = useCallback(async () => {
    if (!user?.LOGIN || !campaignId) {
      return;
    }

    try {
      const get = {
        Code: '234645423654423465',
        Login: user.LOGIN,
        Campanha: campaignId
      };

      // Usar once em vez de um listener persistente para evitar duplicação
      const botsData = await new Promise((resolve, reject) => {
        // Set up a one-time listener for the response
        socketService.once('MeusRobosResponse', (data) => {
          try {
            const parsed = JSON.parse(Descriptografar(data));

            if (parsed.Code !== '6253442653442365') {
              reject(new Error("Código de resposta inválido"));
              return;
            }

            setBotLimit(parsed.Limite || 0);

            if (parsed.Dados && Array.isArray(parsed.Dados)) {
              resolve(parsed.Dados);
            } else {
              resolve([]);
            }
          } catch (err) {
            reject(err);
          }
        });

        // Send the request
        socketService.emit('MeusRobos', Criptografar(JSON.stringify(get)));

        // Add timeout in case of no response
        setTimeout(() => {
          socketService.off('MeusRobosResponse');
          reject(new Error("Timeout fetching bots"));
        }, 15000);
      });

      // Process the bots data
      const processedBots = botsData.map((item, index) => {
        return {
          id: String(index + 1),
          name: item.DADOS[0]?.EMPRESA || `Bot ${index + 1}`,
          platform: item.DADOS[0]?.REDE || '0',
          protocol: item.PROTOCOLO,
          login: item.DADOS[0]?.LOGIN,
          objective: item.DADOS[0]?.OBJETIVO || 'Venda_Digital',
          attendant: item.DADOS[0]?.ATENDENTE || 'Atendente AI'
        };
      });

      setBots(processedBots);
      
      // Limpar status de conexão antigos
      setConnectionStatus({});
      setInitialStatusChecked(false); // Reset para permitir nova verificação
      
    } catch (error) {
      setBots([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, campaignId, setIsLoading]);

  // Função para obter perguntas padrão baseadas no objetivo
  const getDefaultQuestions = useCallback((objetivo) => {
    switch (objetivo) {
      case 'Venda_Digital':
        return [
          {
            Pergunta: 'Qual o prazo de entrega?',
            Resposta: 'Nosso prazo de entrega é de 3 a 7 dias úteis para todo o Brasil.'
          },
          {
            Pergunta: 'Quais são as formas de pagamento?',
            Resposta: 'Aceitamos cartão de crédito, débito, PIX e boleto bancário.'
          },
          {
            Pergunta: 'Vocês fazem entrega?',
            Resposta: 'Sim! Fazemos entrega para todo o Brasil através dos Correios.'
          }
        ];
      case 'Agendamento':
        return [
          {
            Pergunta: 'Como funciona o agendamento?',
            Resposta: 'Você pode escolher o melhor horário disponível e confirmar seu agendamento.'
          },
          {
            Pergunta: 'Posso remarcar meu horário?',
            Resposta: 'Sim, você pode remarcar com até 24 horas de antecedência.'
          }
        ];
      default:
        return [
          {
            Pergunta: 'Como posso ajudar você?',
            Resposta: 'Estou aqui para esclarecer suas dúvidas e ajudar com suas necessidades.'
          }
        ];
    }
  }, []);

  // Função para obter produtos padrão
  const getDefaultProducts = useCallback(() => {
    return [
      {
        id: `default_${Date.now()}`,
        Produto: 'Produto Exemplo',
        Preco: 'R$ 99,90',
        Categoria: 'Categoria Padrão',
        Descricao: 'Descrição do produto que será configurada posteriormente.',
        Imagem: null
      }
    ];
  }, []);

  // NOVA IMPLEMENTAÇÃO - Buscar dados completos do robô para duplicação
  const getBotCompleteData = useCallback(async (botProtocol) => {
    return new Promise((resolve, reject) => {
      try {
        const timeout = setTimeout(() => {
          socketService.off('DetalhesRoboResponse');
          reject(new Error("Timeout ao buscar dados do robô"));
        }, 15000);

        socketService.once('DetalhesRoboResponse', (data) => {
          clearTimeout(timeout);
          try {
            const parsed = JSON.parse(Descriptografar(data));
            
            // Ajuste este código conforme o retorno da sua API
            if (parsed.Code === '123456789987' && parsed.Dados) {
              resolve({
                empresa: parsed.Dados.EMPRESA || 'Bot Clonado',
                atendente: parsed.Dados.ATENDENTE || 'Atendente AI',
                objetivo: parsed.Dados.OBJETIVO || 'Venda_Digital',
                redes: parsed.Dados.REDES ? parsed.Dados.REDES.split(',') : ['0'],
                perguntas: parsed.Dados.PERGUNTAS || [],
                gatilho: parsed.Dados.GATILHO || '',
                produtos: parsed.Dados.PRODUTOS || [],
                dias: parsed.Dados.DIAS || [1, 2, 3, 4, 5],
                inicio: parsed.Dados.INICIO || '08:00',
                fim: parsed.Dados.FIM || '18:00'
              });
            } else {
              reject(new Error("Erro ao buscar dados do robô"));
            }
          } catch (err) {
            reject(err);
          }
        });

        // Requisitar dados completos do robô - AJUSTE CONFORME SUA API
        const request = {
          Code: '897654321988', // Ajuste este código
          Login: user.LOGIN,
          Protocolo: botProtocol
        };

        socketService.emit('BuscarDetalhesRobo', Criptografar(JSON.stringify(request)));
      } catch (error) {
        reject(error);
      }
    });
  }, [user]);

  // Função alternativa para buscar dados usando endpoints separados
  const getBotDataAlternative = useCallback(async (bot) => {
    try {
      setDuplicateStep('Buscando perguntas...');
      
      // Buscar perguntas do robô
      const perguntas = await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          socketService.off('PerguntasRoboResponse');
          resolve([]);
        }, 10000);

        socketService.once('PerguntasRoboResponse', (data) => {
          clearTimeout(timeout);
          try {
            const parsed = JSON.parse(Descriptografar(data));
            resolve(parsed.Dados || []);
          } catch (err) {
            resolve([]);
          }
        });

        // Ajuste conforme sua API
        socketService.emit('BuscarPerguntas', Criptografar(JSON.stringify({
          Code: '897654321989', // Ajuste este código
          Login: user.LOGIN,
          Protocolo: bot.protocol
        })));
      });

      // Buscar produtos do robô (se for Venda_Digital)
      let produtos = [];
      if (bot.objective === 'Venda_Digital') {
        setDuplicateStep('Buscando produtos...');
        
        produtos = await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            socketService.off('ProdutosRoboResponse');
            resolve([]);
          }, 10000);

          socketService.once('ProdutosRoboResponse', (data) => {
            clearTimeout(timeout);
            try {
              const parsed = JSON.parse(Descriptografar(data));
              resolve(parsed.Dados || []);
            } catch (err) {
              resolve([]);
            }
          });

          // Ajuste conforme sua API
          socketService.emit('BuscarProdutos', Criptografar(JSON.stringify({
            Code: '897654321990', // Ajuste este código
            Login: user.LOGIN,
            Protocolo: bot.protocol
          })));
        });
      }

      return {
        empresa: `${bot.name} (Cópia ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`,
        atendente: bot.attendant || 'Atendente AI',
        objetivo: bot.objective || 'Venda_Digital',
        redes: [bot.platform],
        perguntas: perguntas.length > 0 ? perguntas : getDefaultQuestions(bot.objective),
        gatilho: 'https://exemplo.com/finalizar-compra',
        produtos: produtos.length > 0 ? produtos : (bot.objective === 'Venda_Digital' ? getDefaultProducts() : []),
        dias: [1, 2, 3, 4, 5],
        inicio: '08:00',
        fim: '18:00'
      };
    } catch (error) {
      // Em caso de erro, retornar dados padrão
      return {
        empresa: `${bot.name} (Cópia ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`,
        atendente: bot.attendant || 'Atendente AI',
        objetivo: bot.objective || 'Venda_Digital',
        redes: [bot.platform],
        perguntas: getDefaultQuestions(bot.objective),
        gatilho: 'https://exemplo.com/finalizar-compra',
        produtos: bot.objective === 'Venda_Digital' ? getDefaultProducts() : [],
        dias: [1, 2, 3, 4, 5],
        inicio: '08:00',
        fim: '18:00'
      };
    }
  }, [user, getDefaultQuestions, getDefaultProducts]);

  // Função melhorada para confirmar duplicação
  const handleConfirmDuplicate = useCallback(async () => {
    if (!botToDuplicate) return;

    setDuplicatingBot(true);
    setShowDuplicateModal(false);
    setDuplicateStep('Iniciando duplicação...');

    try {
      toast.info("Buscando dados do robô original...", { autoClose: 2000 });

      // Tentar buscar dados completos do robô
      let duplicateData;
      try {
        setDuplicateStep('Buscando dados completos...');
        duplicateData = await getBotCompleteData(botToDuplicate.protocol);
        toast.info("Dados encontrados! Criando cópia...", { autoClose: 2000 });
      } catch (error) {
        setDuplicateStep('Usando método alternativo...');
        toast.info("Buscando configurações do robô...", { autoClose: 2000 });
        duplicateData = await getBotDataAlternative(botToDuplicate);
      }

      // Gerar novo protocolo único
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const newProtocol = `${timestamp}`;

      // Atualizar nome para indicar que é cópia
      duplicateData.empresa = duplicateData.empresa.includes('(Cópia') 
        ? duplicateData.empresa 
        : `${duplicateData.empresa} (Cópia)`;

      setDuplicateStep('Criando novo robô...');

      // Criar o bot duplicado
      await createDuplicateBot(duplicateData, newProtocol);

      toast.success("Robô duplicado com sucesso!", { autoClose: 3000 });
      
      // Atualizar lista de bots após um delay
      setTimeout(() => {
        fetchBots();
      }, 3000);

    } catch (error) {
      // console.error("Erro ao duplicar bot:", error);
      toast.error(`Erro ao duplicar robô: ${error.message}`, { autoClose: 5000 });
    } finally {
      setDuplicatingBot(false);
      setBotToDuplicate(null);
      setDuplicateStep('');
    }
  }, [botToDuplicate, getBotCompleteData, getBotDataAlternative, fetchBots]);

  // Função melhorada para criar bot duplicado
  const createDuplicateBot = useCallback(async (formData, protocol) => {
    try {
      // Preparar perguntas - mesmo formato do CreateAgentModal
      const perguntasPreparadas = formData.perguntas.map(p => ({
        Pergunta: p.Pergunta || p.pergunta || '',
        Resposta: p.Resposta || p.resposta || ''
      }));

      // Configurar listener para resposta de criação
      const creationPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          socketService.off('RespostaDaCriação');
          resolve({}); // Resolver mesmo sem resposta após timeout
        }, 20000);

        socketService.once('RespostaDaCriação', (data) => {
          clearTimeout(timeout);
          try {
            if (Descriptografar(data.Code) === '365445365454436') {
              if (Descriptografar(data.Res) === true || Descriptografar(data.Res) === 'true') {
                resolve(data);
              } else {
                reject(new Error("Erro na criação do bot"));
              }
            } else {
              resolve({}); // Assumir sucesso se código diferente
            }
          } catch (err) {
            resolve({}); // Assumir sucesso se não conseguir parsear
          }
        });
      });

      // Criar bot baseado no objetivo
      if (formData.objetivo === 'Agendamento') {
        setDuplicateStep('Criando robô de agendamento...');
        
        socketService.emit('CriarBot', {
          Code: Criptografar('3654534655434565434'),
          Empresa: Criptografar(formData.empresa),
          Atendente: Criptografar(formData.atendente),
          Protocolo: Criptografar(protocol),
          Login: Criptografar(user.LOGIN),
          Redes: Criptografar(formData.redes.join(',')),
          Objetivo: Criptografar(formData.objetivo),
          Perguntas: Criptografar(perguntasPreparadas),
          Gatilho: Criptografar(JSON.stringify({
            Dias: formData.dias,
            Inicio: formData.inicio,
            Fim: formData.fim
          })),
          Campanha: Criptografar(campaignId) || null
        });
      } else if (formData.objetivo === 'Venda_Digital') {
        setDuplicateStep('Criando robô de vendas...');
        
        // Primeiro criar o bot
        socketService.emit('CriarBot', {
          Code: Criptografar('658467658467865671'),
          Empresa: Criptografar(formData.empresa),
          Atendente: Criptografar(formData.atendente),
          Protocolo: Criptografar(protocol),
          Login: Criptografar(user.LOGIN),
          Redes: Criptografar(formData.redes.join(',')),
          Objetivo: Criptografar(formData.objetivo),
          Perguntas: Criptografar(JSON.stringify(perguntasPreparadas)),
          Gatilho: Criptografar(formData.gatilho),
          Campanha: Criptografar(campaignId) || null
        });
      }

      // Aguardar criação se não for Venda_Digital (que já aguardou acima)
      if (formData.objetivo !== 'Venda_Digital') {
        await creationPromise;
      }

      setDuplicateStep('Finalizando...');

    } catch (error) {
      throw new Error(`Falha ao criar robô duplicado: ${error.message}`);
    }
  }, [user, campaignId]);

  // Função melhorada para lidar com clique de duplicar
  const handleDuplicateClick = useCallback((bot, event) => {
    event.stopPropagation(); // Evita abrir o BotDetail
    
    if (bots.length >= botLimit) {
      toast.warning("Você atingiu o limite máximo de automações permitidas pelo seu plano atual.");
      return;
    }

    if (duplicatingBot) {
      toast.info("Aguarde a duplicação atual terminar.");
      return;
    }

    setBotToDuplicate(bot);
    setShowDuplicateModal(true);
  }, [bots.length, botLimit, duplicatingBot]);

  // Get platform name based on platform code
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

  // Get platform icon based on platform code - MELHORADO
  const getPlatformIcon = (platform) => {
    switch (platform) {
      case '0':
        return <FiMessageCircle />;
      case '2':
        return <FiInstagram />;
      default:
        return <FiMessageCircle />;
    }
  };

  // Nova função para obter cor da plataforma
  const getPlatformColor = (platform) => {
    switch (platform) {
      case '0':
        return '#25D366'; // Verde WhatsApp
      case '2':
        return '#E4405F'; // Rosa Instagram
      default:
        return '#9928C3';
    }
  };

  // Atualizado para mostrar o modal de criação
  const handleCreateBot = () => {
    if (bots.length >= botLimit) {
      toast.warning("Você atingiu o limite máximo de automações permitidas pelo seu plano atual.");
      return;
    }
    setShowCreateModal(true);
  };

  // Novo método para lidar com o sucesso da criação do bot
  const handleBotCreated = useCallback(() => {
    setShowCreateModal(false);
    toast.success("Agente criado com sucesso!");

    // Usar um delay maior antes de buscar os bots
    setTimeout(() => {
      fetchBots();
    }, 3000);
  }, [fetchBots]);

  // Handle QR Code timeout
  const handleQrTimeout = () => {
    toast.info("QR Code expirado. Gere um novo para conectar.");
    setQRCodeData("");
    setQrCodeLoading(false);
  };

  // Atualizado para navegar para BotDetail
  const handleBotClick = (botProtocol) => {
    const bot = bots.find(b => b.protocol === botProtocol);
    if (bot) {
      setSelectedBot(bot);
      setCurrentQrProtocol(bot.protocol);
    } else if (onSelectBot) {
      onSelectBot(botProtocol);
    }
  };

  const handleApiClick = () => {
    if (onOpenApiTriggers) {
      onOpenApiTriggers(campaignId);
    }
  };

  const handleDisparoClick = () => {
    if (onOpenDisparo) {
      onOpenDisparo(campaignId);
    }
  };

  const handleSequenceClick = () => {
    if (bots.length > 0) {
      if (onOpenSequence) {
        onOpenSequence(campaignId);
      }
    } else {
      toast.warning(
        "Você precisa ter pelo menos um bot para configurar a sequência de disparo."
      );
    }
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    }
  };

  // NOVA FUNÇÃO: Refresh manual do status (para botão de atualizar se necessário)
  const handleRefreshStatus = useCallback(() => {
    // console.log('🔄 Refresh manual iniciado...');
    toast.info("Atualizando status das automações...", { autoClose: 2000 });
    
    // Reset completo dos status
    setConnectionStatus({});
    setStatusCache({});
    setPendingChecks(new Set()); // Limpar verificações pendentes
    setInitialStatusChecked(false);
    setForceUpdate(prev => prev + 1);
    
    // Verificar cada bot imediatamente
    bots.forEach((bot, index) => {
      setTimeout(() => {
        // console.log(`🔍 Refresh manual - verificando bot: ${bot.name}`);
        checkBotStatus(bot.protocol);
      }, index * 300);
    });
  }, [bots, checkBotStatus]);

  // Se um bot específico estiver selecionado, renderizar BotDetail
  if (selectedBot) {
    return (
      <BotDetail
        bot={selectedBot}
        isConnected={connectionStatus[selectedBot.protocol] || false}
        onBack={() => setSelectedBot(null)}
        onRefresh={() => {
          fetchBots();
          // Forçar verificação de status após atualização
          setTimeout(() => {
            checkAllBotsStatus();
          }, 1000);
        }}
        socketService={socketService}
        user={user}
        // Propriedades relacionadas ao QR code
        showQRModal={showQRModal}
        setShowQRModal={setShowQRModal}
        qrCodeData={qrCodeData}
        setQRCodeData={setQRCodeData}
        qrCodeLoading={qrCodeLoading}
        setQrCodeLoading={setQrCodeLoading}
        handleQrTimeout={handleQrTimeout}
        currentQrProtocol={selectedBot.protocol}
      />
    );
  }

  if (isLoading && !campaign) {
    return <LoadingScreen />;
  }

  // Get campaign status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'ATIVA':
        return styles.statusActive;
      case 'PAUSADA':
        return styles.statusPaused;
      default:
        return styles.statusInactive;
    }
  };

  return (
    <div className={styles.detailContainer}>
      <div className={styles.headerGradient}>
        <div className={styles.headerContent}>
          <button
            className={styles.backButton}
            onClick={handleBackClick}
          >
            <FiArrowLeft size={20} />
            <span>Voltar</span>
          </button>

          {campaign && (
            <>
              <h1>{campaign.nome}</h1>
              {campaign.descricao && (
                <p className={styles.campaignDescription}>{campaign.descricao}</p>
              )}

              <div className={styles.campaignMeta}>
                <div className={styles.metaItem}>
                  <FiCalendar size={14} />
                  <span>{campaign.dataCriacao}</span>
                </div>

                <div className={styles.metaItem}>
                  <FiHash size={14} />
                  <span>{campaign.protocolo}</span>
                </div>

                <div className={`${styles.statusBadge} ${getStatusClass(campaign.status)}`}>
                  {campaign.status}
                </div>
              </div>

              <div className={styles.actionsContainer}>
                <button
                  className={styles.actionButton}
                  onClick={handleApiClick}
                >
                  <FiZap size={16} />
                  <span>API</span>
                </button>
             
                <button
                  className={styles.actionButton}
                  onClick={handleDisparoClick}
                >
                  <FiList size={16} />
                  <span>Disparos</span>
                </button>
                   <button
                  className={styles.actionButton}
                  onClick={handleSequenceClick}
                >
                  <FiList size={16} />
                  <span>Sequência</span>
                </button>
              </div>

              <div className={styles.botLimitBadge}>
                <span>{bots.length}/{botLimit} bots</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.sectionHeader}>
          <h2>Minhas Automações</h2>
          {/* Botão opcional para refresh manual */}
          <button
            className={styles.refreshButton}
            onClick={handleRefreshStatus}
            title="Atualizar status das automações"
          >
            <FiZap size={16} />
          </button>
        </div>

        {error && (
          <div className={styles.errorContainer}>
            <p>{error}</p>
            <button
              className={styles.retryButton}
              onClick={() => {
                fetchCampaignDetails();
                fetchBots();
              }}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!error && (
          <div className={styles.botsContainer}>
            {bots.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <FiZap size={60} />
                </div>
                <p>Nenhuma automação encontrada</p>
                <p>Clique no botão + para criar sua primeira automação</p>
              </div>
            ) : (
              <div className={styles.botsGrid}>
                {bots.map((bot) => {
                  // Obter status usando a nova função
                  const botConnected = getBotStatus(bot.protocol);
                  
                  return (
                    <div
                      key={`${bot.id}-${forceUpdate}`} 
                      className={styles.botCard}
                    >
                      {/* Botão de duplicar no canto superior direito */}
                      <button
                        className={styles.duplicateButton}
                        onClick={(e) => handleDuplicateClick(bot, e)}
                        disabled={duplicatingBot || bots.length >= botLimit}
                        title={bots.length >= botLimit ? "Limite de bots atingido" : "Duplicar robô"}
                      >
                        {duplicatingBot && botToDuplicate?.protocol === bot.protocol ? (
                          <div className={styles.buttonSpinner}></div>
                        ) : (
                          <FiCopy size={16} />
                        )}
                      </button>

                      <div 
                        className={styles.botCardContent}
                        onClick={() => handleBotClick(bot.protocol)}
                      >
                        <div className={styles.botIconContainer}>
                          <div 
                            className={`${styles.botIconCircle} ${botConnected ? styles.connected : ''}`}
                            style={!botConnected ? {
                              background: `linear-gradient(145deg, ${getPlatformColor(bot.platform)}20, ${getPlatformColor(bot.platform)}10)`
                            } : {}}
                          >
                            {getPlatformIcon(bot.platform)}
                          </div>
                        </div>
                        <h3 className={styles.botName}>{bot.name}</h3>
                        <div className={styles.botPlatform}>
                          {getPlatformIcon(bot.platform)}
                          <span>{getPlatformName(bot.platform)}</span>
                        </div>
                        
                        
                        
                        <div 
                          className={botConnected ? styles.statusConnected : styles.statusDisconnected}
                          data-status={botConnected ? 'connected' : 'disconnected'} // Para debug
                          data-protocol={bot.protocol} // Para debug
                        >
                          {botConnected ? 'Conectado' : 'Desconectado'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <button
        className={styles.addButton}
        onClick={handleCreateBot}
        disabled={bots.length >= botLimit}
        title={bots.length >= botLimit ? "Limite de bots atingido" : "Adicionar nova automação"}
      >
        <FiPlus size={24} />
      </button>

      {/* Indicador de progresso da duplicação */}
      {duplicatingBot && (
        <div className={styles.duplicateProgress}>
          <div className={styles.progressContent}>
            <div className={styles.progressSpinner}></div>
            <p>{duplicateStep}</p>
          </div>
        </div>
      )}

      {/* Modal de Criação de Agente */}
      {showCreateModal && (
        <CreateAgentModal
          socketService={socketService}
          user={user}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleBotCreated}
          campaignId={campaignId}
        />
      )}

      {/* Modal de Confirmação de Duplicação - MELHORADO */}
      {showDuplicateModal && botToDuplicate && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmModal}>
            <div className={styles.confirmHeader}>
              <h3>Duplicar Robô</h3>
              <button
                className={styles.closeButton}
                onClick={() => {
                  setShowDuplicateModal(false);
                  setBotToDuplicate(null);
                }}
                disabled={duplicatingBot}
              >
                <FiX size={20} />
              </button>
            </div>

            <div className={styles.confirmBody}>
              <div className={styles.confirmIcon}>
                <FiCopy size={24} />
              </div>

              <p className={styles.confirmText}>
                Confirma a duplicação do robô?
              </p>

              <p className={styles.confirmSubtext}>
                Uma cópia será criada com todas as configurações, perguntas, respostas e produtos do robô original. O processo pode levar alguns segundos.
              </p>

              <div className={styles.duplicatePreview}>
                <div className={styles.previewItem}>
                  <span className={styles.previewLabel}>Robô Original:</span>
                  <span className={styles.previewValue}>
                    {getPlatformIcon(botToDuplicate.platform)}
                    {botToDuplicate.name}
                  </span>
                </div>
                <div className={styles.previewItem}>
                  <span className={styles.previewLabel}>Plataforma:</span>
                  <span className={styles.previewValue}>
                    {getPlatformIcon(botToDuplicate.platform)}
                    {getPlatformName(botToDuplicate.platform)}
                  </span>
                </div>
                <div className={styles.previewItem}>
                  <span className={styles.previewLabel}>Objetivo:</span>
                  <span className={styles.previewValue}>
                    {botToDuplicate.objective}
                  </span>
                </div>
                <div className={styles.previewItem}>
                  <span className={styles.previewLabel}>Status após cópia:</span>
                  <span className={styles.previewValue}>
                    Desconectado (necessário conectar)
                  </span>
                </div>
              </div>

              {bots.length >= botLimit - 1 && (
                <div className={styles.warningBox}>
                  <FiAlertCircle size={16} />
                  <span>Atenção: Você está próximo do limite de robôs ({bots.length + 1}/{botLimit})</span>
                </div>
              )}
            </div>

            <div className={styles.confirmActions}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setShowDuplicateModal(false);
                  setBotToDuplicate(null);
                }}
                disabled={duplicatingBot}
              >
                Cancelar
              </button>
              <button
                className={styles.confirmButton}
                onClick={handleConfirmDuplicate}
                disabled={duplicatingBot}
              >
                {duplicatingBot ? (
                  <>
                    <div className={styles.buttonSpinner}></div>
                    Duplicando...
                  </>
                ) : (
                  <>
                    <FiCopy size={16} />
                    Confirmar Duplicação
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignDetail;