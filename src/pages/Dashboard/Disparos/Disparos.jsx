import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../../context/AppContext';
import styles from './Disparos.module.css';

import {
  Upload,
  Send,
  Users,
  Mail,
  Phone,
  Info,
  HelpCircle,
  ArrowLeft,
  FileText,
  CheckCircle,
  Loader,
  Database,
  Zap,
  List,
  Edit2,
  Play,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import {
  FiArrowLeft
} from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { Criptografar, Descriptografar } from '../../../Cripto/index';
import GerenciadorMensagens from './GerenciadorMensagens';

const Disparos = ({ onBack, campaignId }) => {
  // Estados principais
  const [step, setStep] = useState(1);
  const [modoContatos, setModoContatos] = useState('novos'); // 'novos' ou 'existentes'
  const [modoAtivo, setModoAtivo] = useState('completo'); // 'completo' ou 'rapido'
  
  // Estados de contatos
  const [contacts, setContacts] = useState([]);
  const [contatosExistentes, setContatosExistentes] = useState([]);
  const [carregandoExistentes, setCarregandoExistentes] = useState(false);
  
  // Estados de mensagens
  const [mensagens, setMensagens] = useState(['Olá {nome}, tudo bem? Tenho uma oferta especial para você!']);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [usarMensagensExistentes, setUsarMensagensExistentes] = useState(false);
  const [mensagensExistentes, setMensagensExistentes] = useState([]);
  const [loadingMensagens, setLoadingMensagens] = useState(false);
  
  // Estados de interface
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageError, setMessageError] = useState(false);
  const [previewContact, setPreviewContact] = useState(null);
  const [expandedContact, setExpandedContact] = useState(null);
  const [expandedMsgIndex, setExpandedMsgIndex] = useState(0);
  
  // Estados de envio
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  
  // Estados de status da campanha
  const [statusCampanha, setStatusCampanha] = useState(null);
  const [carregandoStatus, setCarregandoStatus] = useState(false);
  
  // Estados do modal
  const [modalGerenciadorVisible, setModalGerenciadorVisible] = useState(false);
  
  // Constantes
  const MAX_CHARS = 2000;
  const MAX_MESSAGES = 50;

  // Context
  const { user, socketService } = useApp();

  // Refs
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);

  // Effects
  useEffect(() => {
    // console.log("🔄 Componente Disparos montado");
    buscarMensagensExistentes();
    verificarStatusCampanha();
  }, []);

  // Funções de busca de dados - MELHORADAS com base no código mobile
  const buscarMensagensExistentes = async () => {
    try {
      // console.log("📤 Buscando mensagens existentes...");
      setLoadingMensagens(true);
      const login = user?.LOGIN || '';
      
      if (!login) {
        // console.error("❌ Login não encontrado");
        setLoadingMensagens(false);
        return;
      }
      
      const dadosSolicitacao = {
        login: login,
        campanha: campaignId,
        acao: 'listar'
      };
      
      // console.log("📤 Enviando solicitação:", dadosSolicitacao);
      
      // Remover listeners anteriores para evitar duplicatas
      socketService.socket.off('RespostaListagemMensagens');
      
      socketService.emit("ListarMensagens", Criptografar(JSON.stringify(dadosSolicitacao)));
      
      // Usar .once() como no mobile
      socketService.socket.once('RespostaListagemMensagens', (data) => {
        try {
          // console.log("📥 Resposta recebida (mensagens)");
          const resultado = JSON.parse(Descriptografar(data));
          
          // console.log("📥 Mensagens descriptografadas:", resultado);
          
          if (resultado && resultado.mensagens) {
            setMensagensExistentes(resultado.mensagens);
            // console.log(`✅ ${resultado.mensagens.length} mensagens encontradas`);
          } else {
            setMensagensExistentes([]);
            // console.log("⚠️ Nenhuma mensagem encontrada");
          }
          
          setLoadingMensagens(false);
        } catch (error) {
          // console.error("❌ Erro ao processar lista de mensagens:", error);
          setLoadingMensagens(false);
          alert("Não foi possível carregar as mensagens existentes.");
        }
      });
      
      // Timeout para evitar travamento
      setTimeout(() => {
        if (loadingMensagens) {
          // console.log("⏰ Timeout ao buscar mensagens");
          setLoadingMensagens(false);
        }
      }, 10000);
      
    } catch (error) {
      // console.error("❌ Erro ao buscar mensagens:", error);
      setLoadingMensagens(false);
    }
  };

  const buscarContatosExistentes = async () => {
    try {
      // console.log("📤 Buscando contatos existentes...");
      setCarregandoExistentes(true);
      const login = user?.LOGIN || '';
      
      if (!login) {
        // console.error("❌ Login não encontrado");
        setCarregandoExistentes(false);
        alert("Você precisa estar logado para buscar contatos.");
        return;
      }
      
      const payload = {
        login: login,
        campanha: campaignId
      };
      
      // console.log("📤 Enviando solicitação de contatos:", payload);
      
      // Remover listeners anteriores
      socketService.socket.off('RetornoContatosExistentes');
      
      socketService.emit("BuscarContatosExistentes", Criptografar(JSON.stringify(payload)));
      
      socketService.socket.once('RetornoContatosExistentes', (data) => {
        try {
          // console.log("📥 Resposta recebida (contatos)");
          const resultado = JSON.parse(Descriptografar(data));
          
          // console.log("📥 Contatos descriptografados:", resultado);
          
          if (resultado.sucesso) {
            setContatosExistentes(resultado.contatos || []);
            // console.log(`✅ ${resultado.contatos?.length || 0} contatos encontrados`);
            
            if (!resultado.contatos || resultado.contatos.length === 0) {
              alert("Não foram encontrados contatos pendentes para esta campanha.");
            }
          } else {
            setContatosExistentes([]);
            alert(resultado.mensagem || "Não foram encontrados contatos existentes para esta campanha.");
          }
          
          setCarregandoExistentes(false);
        } catch (error) {
          // console.error("❌ Erro ao processar contatos existentes:", error);
          setCarregandoExistentes(false);
          alert("Não foi possível carregar os contatos existentes.");
        }
      });
      
      // Timeout
      setTimeout(() => {
        if (carregandoExistentes) {
          // console.log("⏰ Timeout ao buscar contatos");
          setCarregandoExistentes(false);
          alert("Tempo esgotado ao buscar contatos. Tente novamente.");
        }
      }, 10000);
      
    } catch (error) {
      // console.error("❌ Erro ao buscar contatos existentes:", error);
      setCarregandoExistentes(false);
      alert("Erro ao buscar contatos: " + error.message);
    }
  };

  const verificarStatusCampanha = async () => {
    try {
      // console.log("📤 Verificando status da campanha...");
      setCarregandoStatus(true);
      
      const login = user?.LOGIN || '';
      
      if (!login) {
        // console.error("❌ Login não encontrado");
        setCarregandoStatus(false);
        return;
      }
      
      const payload = { 
        login: login, 
        campanha: campaignId 
      };
      
      // console.log("📤 Enviando verificação de status:", payload);
      
      // Remover listeners anteriores
      socketService.socket.off('RetornoStatusCampanha');
      
      socketService.emit("VerificarStatusCampanha", Criptografar(JSON.stringify(payload)));
      
      const timeoutId = setTimeout(() => {
        // console.log("⏰ Timeout ao verificar status");
        setCarregandoStatus(false);
      }, 10000);
      
      socketService.socket.once('RetornoStatusCampanha', (data) => {
        try {
          clearTimeout(timeoutId);
          
          // console.log("📥 Resposta de status recebida");
          
          if (!data) {
            // console.error("❌ Dados recebidos são nulos");
            setCarregandoStatus(false);
            return;
          }
          
          const resultado = JSON.parse(Descriptografar(data));
          
          // console.log("📥 Status descriptografado:", resultado);
          
          if (resultado.sucesso) {
            setStatusCampanha(resultado.status);
            // console.log("✅ Status da campanha atualizado:", resultado.status);
          } else {
            // console.log("⚠️ Erro ao obter status:", resultado.mensagem);
          }
          
          setCarregandoStatus(false);
        } catch (error) {
          clearTimeout(timeoutId);
          // console.error("❌ Erro ao processar resposta de status:", error);
          setCarregandoStatus(false);
        }
      });
    } catch (error) {
      // console.error("❌ Erro ao verificar status:", error);
      setCarregandoStatus(false);
    }
  };

  // Função melhorada para lidar com mensagens salvas
  const salvarMensagensNaCampanha = async () => {
    try {
      const login = user?.LOGIN || '';
      
      if (!login) {
        alert("Você precisa estar logado para salvar mensagens.");
        return;
      }
      
      // Filtrar apenas mensagens não vazias
      const mensagensFiltradas = mensagens.filter(msg => msg.trim() !== '');
      
      if (mensagensFiltradas.length === 0) {
        alert("Adicione pelo menos uma mensagem antes de salvar.");
        return;
      }
      
      const payload = {
        login: login,
        campanha: campaignId,
        mensagens: mensagensFiltradas.map((msg, index) => ({
          id: `new_${Date.now()}_${index}`,
          mensagem: msg,
          nova: true
        }))
      };
      
      // console.log("📤 Salvando mensagens:", payload);
      
      // Remover listeners anteriores
      socketService.socket.off('RespostaSalvarMensagens');
      
      socketService.emit("SalvarMensagens", Criptografar(JSON.stringify(payload)));
      
      socketService.socket.once('RespostaSalvarMensagens', (data) => {
        try {
          const resultado = JSON.parse(Descriptografar(data));
          
          if (resultado.sucesso) {
            // console.log("✅ Mensagens salvas com sucesso");
            // Atualizar lista de mensagens existentes
            buscarMensagensExistentes();
          } else {
            // console.error("❌ Erro ao salvar mensagens:", resultado.mensagem);
          }
        } catch (error) {
          // console.error("❌ Erro ao processar resposta de salvamento:", error);
        }
      });
    } catch (error) {
      // console.error("❌ Erro ao salvar mensagens:", error);
    }
  };

  // Funções de manipulação de arquivos
  const handleSelectFile = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setFileName(file.name);
    setIsLoading(true);

    try {
      const data = await readExcelFile(file);

      if (data && data.length > 0) {
        const extractedContacts = processContacts(data);
        setContacts(extractedContacts);

        if (extractedContacts.length > 0) {
          setPreviewContact(extractedContacts[0]);
          alert(`✅ Sucesso! ${extractedContacts.length} contatos foram carregados.`);
        } else {
          alert("Não foram encontrados contatos válidos na planilha.");
        }
      }
    } catch (error) {
      alert(`Erro ao processar arquivo: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const processContacts = (data) => {
    const contacts = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (row && row.length >= 2) {
        const contact = {
          nome: row[0] ? String(row[0]).trim() : '',
          telefone: row[1] ? String(row[1]).trim() : '',
          email: row.length > 2 ? String(row[2] || '').trim() : ''
        };

        if (contact.nome && contact.telefone) {
          contacts.push(contact);
        }
      }
    }

    return contacts;
  };

  // Funções de manipulação de mensagens
  const addMessage = () => {
    if (mensagens.length < MAX_MESSAGES) {
      const newMessages = [...mensagens, ''];
      setMensagens(newMessages);
      setCurrentMessageIndex(newMessages.length - 1);
    } else {
      alert("Você atingiu o limite máximo de 50 mensagens.");
    }
  };

  const removeMessage = (index) => {
    if (mensagens.length > 1) {
      const newMessages = mensagens.filter((_, i) => i !== index);
      setMensagens(newMessages);
      if (currentMessageIndex >= newMessages.length) {
        setCurrentMessageIndex(newMessages.length - 1);
      }
    }
  };

  const updateMessage = (text, index) => {
    if (text.length <= MAX_CHARS) {
      const newMessages = [...mensagens];
      newMessages[index] = text;
      setMensagens(newMessages);

      if (messageError && text.trim() !== '') {
        setMessageError(false);
      }
    }
  };

  const insertVariable = (variable) => {
    const currentMessage = mensagens[currentMessageIndex] || '';
    const textarea = messageInputRef.current;

    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = currentMessage.substring(0, start) + variable + currentMessage.substring(end);

      updateMessage(newMessage, currentMessageIndex);

      setTimeout(() => {
        textarea.selectionStart = start + variable.length;
        textarea.selectionEnd = start + variable.length;
        textarea.focus();
      }, 0);
    } else {
      updateMessage(currentMessage + variable, currentMessageIndex);
    }
  };

  // Funções de navegação
  const validateAndContinue = () => {
    if (step === 1) {
      if (modoContatos === 'novos' && contacts.length === 0) {
        alert("Por favor, importe contatos antes de continuar.");
        return;
      }
      if (modoContatos === 'existentes' && contatosExistentes.length === 0) {
        alert("Não há contatos existentes para esta campanha.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (modoContatos === 'existentes') {
        // Para contatos existentes, pular para modo rápido
        setModoAtivo('rapido');
        setStep(3);
        return;
      }
      
      const filledMessages = mensagens.filter(msg => msg.trim().length > 0);

      if (!usarMensagensExistentes && filledMessages.length === 0) {
        setMessageError(true);
        messageInputRef.current?.focus();
        return;
      }

      if (usarMensagensExistentes && mensagensExistentes.length === 0) {
        alert("Não existem mensagens salvas para esta campanha. Crie pelo menos uma mensagem.");
        return;
      }

      if (!usarMensagensExistentes && filledMessages.length > 0) {
        const hasNameVariable = filledMessages.some(msg => msg.includes("{nome}"));
        if (!hasNameVariable) {
          const confirm = window.confirm("Nenhuma das suas mensagens inclui o marcador {nome}. Deseja continuar sem personalização?");
          if (!confirm) return;
        }
        
        // Salvar mensagens na campanha se estiver criando novas
        salvarMensagensNaCampanha();
      }

      setStep(3);
    }
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const backCampanha = () => {
    if (onBack) {
      onBack();
    }
  };

  // Funções de envio - MELHORADAS
  const startSending = async () => {
    const contactsToSend = modoContatos === 'existentes' ? contatosExistentes : contacts;
    
    if (contactsToSend.length === 0) {
      alert("Sem contatos para enviar.");
      return;
    }

    setSending(true);
    setProgress(0);
    setSentCount(0);

    try {
      const login = user?.LOGIN;

      if (!login) {
        alert("Você precisa estar logado para enviar mensagens.");
        setSending(false);
        return;
      }

      // console.log(`📤 Iniciando envio para ${contactsToSend.length} contatos`);

      // Remover listeners anteriores
      socketService.socket.off('RespostaDisparo');
      
      // Listener para respostas de disparo
      let successCount = 0;
      let errorCount = 0;
      
      socketService.socket.on('RespostaDisparo', (data) => {
        try {
          const resultado = JSON.parse(Descriptografar(data));
          if (resultado.sucesso) {
            successCount++;
          } else {
            errorCount++;
          }
          // console.log(`📥 Resposta disparo: ${resultado.sucesso ? '✅' : '❌'} ${resultado.mensagem || ''}`);
        } catch (error) {
          // console.error("❌ Erro ao processar resposta de disparo:", error);
        }
      });

      for (let i = 0; i < contactsToSend.length; i++) {
        const contact = contactsToSend[i];

        const payload = {
          nome: contact.nome,
          numero: formatPhoneForSending(contact.telefone || contact.numero),
          email: contact.email || '',
          link_carrinho: 'NENHUM',
          mensagem: usarMensagensExistentes ? "USAR_EXISTENTES" : "MULTI_TEMPLATE",
          login: login,
          bot_protocolo: 'NENHUM',
          valor_disparo: '0.30',
          campanha: campaignId
        };

        // console.log(`📤 Enviando para ${contact.nome} (${i + 1}/${contactsToSend.length})`);
        
        const encryptedPayload = Criptografar(JSON.stringify(payload));
        socketService.emit("DisparoViaApp", encryptedPayload);

        setSentCount(i + 1);
        setProgress(((i + 1) / contactsToSend.length) * 100);

        // Pequeno delay entre envios
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Remover listener após envios
      socketService.socket.off('RespostaDisparo');

      alert(`✅ Sucesso! ${contactsToSend.length} mensagens foram programadas para envio!\n\nSuas mensagens serão processadas pelo servidor e enviadas nos próximos minutos.`);

      // Reset
      setStep(1);
      setContacts([]);
      setContatosExistentes([]);
      setMensagens(['Olá {nome}, tudo bem? Tenho uma oferta especial para você!']);
      setFileName('');
      setModoContatos('novos');

    } catch (error) {
      // console.error("❌ Erro ao enviar mensagens:", error);
      alert(`Erro ao enviar mensagens: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const ativarRoboDisparo = async () => {
    try {
      setSending(true);
      
      const login = user?.LOGIN;
      
      if (!login) {
        alert("Você precisa estar logado para ativar o robô.");
        setSending(false);
        return;
      }
      
      const payload = {
        login: login,
        campanha: campaignId
      };
      
      // console.log("📤 Ativando robô de disparo:", payload);
      
      // Remover listeners anteriores
      socketService.socket.off('RetornoAtivarRobo');
      
      socketService.emit("AtivarRoboDisparo", Criptografar(JSON.stringify(payload)));
      
      socketService.socket.once('RetornoAtivarRobo', (data) => {
        try {
          const resultado = JSON.parse(Descriptografar(data));
          
          // console.log("📥 Resposta ativação robô:", resultado);
          
          setSending(false);
          
          if (resultado.sucesso) {
            alert(`✅ Sucesso! Robô ativado com sucesso!\n\n${resultado.total_pendentes} mensagens serão enviadas.`);
            backCampanha();
          } else {
            alert("❌ Erro: " + (resultado.mensagem || "Não foi possível ativar o robô de disparo."));
          }
        } catch (error) {
          // console.error("❌ Erro ao processar resposta de ativação do robô:", error);
          setSending(false);
          alert("❌ Erro: Não foi possível processar a resposta do servidor.");
        }
      });
      
      // Timeout
      setTimeout(() => {
        if (sending) {
          // console.log("⏰ Timeout ao ativar robô");
          setSending(false);
          alert("Tempo esgotado ao ativar o robô. Tente novamente.");
        }
      }, 10000);
      
    } catch (error) {
      // console.error("❌ Erro ao ativar robô:", error);
      setSending(false);
      alert("❌ Erro: " + error.message);
    }
  };

  // Funções auxiliares
  const formatPhoneNumber = (phone) => {
    const numbersOnly = phone.replace(/\D/g, "");

    if (numbersOnly.length === 11) {
      return `(${numbersOnly.substring(0, 2)}) ${numbersOnly.substring(2, 3)} ${numbersOnly.substring(3, 7)}-${numbersOnly.substring(7)}`;
    } else if (numbersOnly.length === 10) {
      return `(${numbersOnly.substring(0, 2)}) ${numbersOnly.substring(2, 6)}-${numbersOnly.substring(6)}`;
    }

    return phone;
  };

  const formatPhoneForSending = (phone) => {
    const numbersOnly = phone.replace(/\D/g, "");

    if ((numbersOnly.length === 11 || numbersOnly.length === 10) && !numbersOnly.startsWith("55")) {
      return "55" + numbersOnly;
    }

    return numbersOnly;
  };

  const toggleExpandContact = (index) => {
    if (expandedContact === index) {
      setExpandedContact(null);
    } else {
      setExpandedContact(index);
      setExpandedMsgIndex(0);
    }
  };

  const previewMessage = (contact, msgIndex) => {
    if (usarMensagensExistentes) {
      return `Uma das mensagens existentes para a campanha ${campaignId} será enviada para ${contact.nome}`;
    }
    
    const mensagensFiltradas = mensagens.filter(msg => msg.trim() !== '');
    const mensagem = mensagensFiltradas[msgIndex];
    if (!mensagem) return "";
    
    return mensagem
      .replace(/\{nome\}/gi, contact.nome)
      .replace(/\{email\}/gi, contact.email || 'email não disponível')
      .replace(/\{numero\}/gi, formatPhoneNumber(contact.telefone || contact.numero))
      .replace(/\{link_carrinho\}/gi, 'https://loja.exemplo.com/carrinho/123');
  };

  const navegarMensagens = (direction) => {
    if (usarMensagensExistentes) return;
    
    const mensagensFiltradas = mensagens.filter(msg => msg.trim() !== '');
    let novoIndice = expandedMsgIndex + direction;
    
    if (novoIndice < 0) {
      novoIndice = mensagensFiltradas.length - 1;
    } else if (novoIndice >= mensagensFiltradas.length) {
      novoIndice = 0;
    }
    
    setExpandedMsgIndex(novoIndice);
  };

  const showHelp = () => {
    alert(
      "Ajuda - Importação e Disparo de WhatsApp\n\n" +
      "1. Escolha entre importar novos contatos ou usar existentes\n" +
      "2. Para novos contatos: importe de uma planilha Excel (.xls ou .xlsx)\n" +
      "3. A planilha deve ter as colunas: Nome, Telefone e Email (opcional)\n" +
      "4. Configure suas mensagens ou use as existentes\n" +
      "5. Use {nome} para personalizar a mensagem com o nome do contato\n\n" +
      "Modo Rápido: ativa apenas o robô para contatos existentes\n" +
      "Modo Completo: permite visualizar todos os detalhes antes do envio"
    );
  };

  const remainingChars = MAX_CHARS - (mensagens[currentMessageIndex]?.length || 0);

  return (
    <>
      <button className={styles.backButtondois} onClick={backCampanha}>
        <FiArrowLeft size={20} />
        <span>Voltar</span>
      </button>
      
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <button className={styles.backButton} onClick={goBack} disabled={step === 1}>
            <ArrowLeft size={24} />
          </button>
          <h1 className={styles.title}>
            {step === 3 && modoAtivo === 'rapido' ? 'Disparo Rápido' : 'Importar Contatos'}
          </h1>
          <button className={styles.helpButton} onClick={showHelp}>
            <HelpCircle size={24} />
          </button>
        </header>

        {/* Tabs de Modo - mostrar apenas no step 3 */}
        {step === 3 && (
          <div className={styles.tabsContainer}>
            <button
              className={`${styles.tab} ${modoAtivo === 'completo' ? styles.tabActive : ''}`}
              onClick={() => setModoAtivo('completo')}
            >
              <List size={16} />
              <span>Modo Completo</span>
            </button>
            
            <button
              className={`${styles.tab} ${modoAtivo === 'rapido' ? styles.tabActive : ''}`}
              onClick={() => setModoAtivo('rapido')}
            >
              <Zap size={16} />
              <span>Modo Rápido</span>
            </button>
          </div>
        )}

        <div className={styles.content}>
          {/* Step indicator */}
          {modoAtivo === 'completo' && (
            <div className={styles.stepIndicator}>
              <div className={`${styles.stepItem} ${step >= 1 ? styles.active : ''}`}>
                <div className={styles.stepNumber}>1</div>
                <span className={styles.stepText}>Escolher contatos</span>
              </div>
              <div className={styles.stepConnector}></div>
              <div className={`${styles.stepItem} ${step >= 2 ? styles.active : ''}`}>
                <div className={styles.stepNumber}>2</div>
                <span className={styles.stepText}>Configurar mensagens</span>
              </div>
              <div className={styles.stepConnector}></div>
              <div className={`${styles.stepItem} ${step >= 3 ? styles.active : ''}`}>
                <div className={styles.stepNumber}>3</div>
                <span className={styles.stepText}>Confirmar e enviar</span>
              </div>
            </div>
          )}

          {/* Step 1: Contact Mode Selection */}
          {step === 1 && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                <Users className={styles.cardIcon} />
                📋 De onde vêm os contatos?
              </h2>
              <p className={styles.cardSubtitle}>
                Escolha a origem dos seus contatos para o disparo
              </p>

              <div className={styles.modeOptions}>
                <div 
                  className={`${styles.modeOption} ${modoContatos === 'novos' ? styles.modeOptionSelected : ''}`}
                  onClick={() => {
                    setModoContatos('novos');
                    setContacts([]);
                    setFileName('');
                  }}
                >
                  <div className={styles.modeOptionIcon}>
                    {modoContatos === 'novos' ? <CheckCircle size={24} /> : <div className={styles.circle} />}
                  </div>
                  <div className={styles.modeOptionContent}>
                    <h3 className={styles.modeOptionTitle}>Importar nova planilha</h3>
                    <p className={styles.modeOptionDescription}>
                      Carregar contatos de um arquivo Excel (.xls ou .xlsx)
                    </p>
                  </div>
                  <Upload size={20} />
                </div>
                
                <div 
                  className={`${styles.modeOption} ${modoContatos === 'existentes' ? styles.modeOptionSelected : ''}`}
                  onClick={() => {
                    setModoContatos('existentes');
                    buscarContatosExistentes();
                  }}
                >
                  <div className={styles.modeOptionIcon}>
                    {modoContatos === 'existentes' ? <CheckCircle size={24} /> : <div className={styles.circle} />}
                  </div>
                  <div className={styles.modeOptionContent}>
                    <h3 className={styles.modeOptionTitle}>Usar contatos existentes</h3>
                    <p className={styles.modeOptionDescription}>
                      Ativar robô para contatos já cadastrados na campanha {campaignId}
                    </p>
                  </div>
                  <Database size={20} />
                </div>
              </div>

              {/* Mostrar contatos existentes se essa opção estiver selecionada */}
              {modoContatos === 'existentes' && (
                <div className={styles.existingContactsContainer}>
                  {carregandoExistentes ? (
                    <div className={styles.loadingContainer}>
                      <Loader className={styles.spinIcon} size={20} />
                      <span>Carregando contatos...</span>
                    </div>
                  ) : contatosExistentes.length > 0 ? (
                    <div className={styles.existingContactsInfo}>
                      <div className={styles.existingContactsHeader}>
                        <CheckCircle size={20} color="var(--success-color)" />
                        <span className={styles.existingContactsTitle}>
                          {contatosExistentes.length} contatos encontrados
                        </span>
                      </div>
                      
                      <div className={styles.contactsPreview}>
                        {contatosExistentes.slice(0, 3).map((contato, index) => (
                          <div key={index} className={styles.previewContactItem}>
                            <div className={styles.contactAvatar}>
                              {contato.nome.charAt(0).toUpperCase()}
                            </div>
                            <div className={styles.contactInfo}>
                              <div className={styles.contactName}>{contato.nome}</div>
                              <div className={styles.contactPhone}>{contato.numero}</div>
                            </div>
                          </div>
                        ))}
                        
                        {contatosExistentes.length > 3 && (
                          <div className={styles.moreContacts}>
                            + {contatosExistentes.length - 3} outros contatos
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={styles.noContactsContainer}>
                      <Users size={24} />
                      <span>Não há contatos pendentes para esta campanha</span>
                    </div>
                  )}
                </div>
              )}

              {/* Seção de importação de planilha - só mostrar se modo 'novos' estiver selecionado */}
              {modoContatos === 'novos' && (
                <div className={styles.uploadSection}>
                  <h3 className={styles.sectionTitle}>📋 Selecione sua planilha</h3>
                  <p className={styles.sectionSubtitle}>
                    Selecione um arquivo Excel (.xls ou .xlsx) com seus contatos
                  </p>

                  <input
                    type="file"
                    ref={fileInputRef}
                    className={styles.hiddenInput}
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                  />

                  <button
                    className={styles.uploadButton}
                    onClick={handleSelectFile}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader className={styles.spinIcon} size={20} />
                        Processando...
                      </>
                    ) : (
                      <>
                        <FileText size={20} />
                        Selecionar Planilha Excel
                      </>
                    )}
                  </button>

                  <div className={styles.infoBox}>
                    <Info size={16} />
                    <span>Certifique-se que sua planilha tem pelo menos as colunas Nome, Telefone e Email</span>
                  </div>

                  {fileName && (
                    <div className={styles.filePreview}>
                      <div className={styles.fileIcon}>
                        <FileText size={24} />
                      </div>
                      <div className={styles.fileInfo}>
                        <div className={styles.fileName}>{fileName}</div>
                        <div className={styles.fileType}>
                          Planilha Excel • {fileName.endsWith('.xlsx') ? 'XLSX' : 'XLS'}
                        </div>
                      </div>
                    </div>
                  )}

                  {contacts.length > 0 && (
                    <div className={styles.contactsSummary}>
                      <div className={styles.contactsHeader}>
                        <h3>Contatos importados</h3>
                        <div className={styles.contactCount}>
                          {contacts.length}
                        </div>
                      </div>

                      <div className={styles.contactsList}>
                        {contacts.slice(0, 5).map((contact, index) => (
                          <div key={index} className={styles.contactItem}>
                            <div className={styles.contactAvatar}>
                              {contact.nome.charAt(0).toUpperCase()}
                            </div>
                            <div className={styles.contactInfo}>
                              <div className={styles.contactName}>{contact.nome}</div>
                              <div className={styles.contactPhone}>
                                <Phone size={12} /> {formatPhoneNumber(contact.telefone)}
                              </div>
                              {contact.email && (
                                <div className={styles.contactEmail}>
                                  <Mail size={12} /> {contact.email}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {contacts.length > 5 && (
                          <div className={styles.moreContacts}>
                            + {contacts.length - 5} outros contatos
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Message Configuration */}
          {step === 2 && (
            <div className={styles.card}>
              <div className={styles.optionSection}>
                <h2 className={styles.cardTitle}>
                  <Mail className={styles.cardIcon} />
                  Configurar mensagens
                </h2>
                <p className={styles.cardSubtitle}>
                  Escolha como configurar as mensagens para o disparo
                </p>

                <div className={styles.messageOptions}>
                  <div 
                    className={`${styles.optionItem} ${!usarMensagensExistentes ? styles.optionItemSelected : ''}`}
                    onClick={() => setUsarMensagensExistentes(false)}
                  >
                    <div className={styles.optionIcon}>
                      {!usarMensagensExistentes ? <CheckCircle size={24} /> : <div className={styles.circle} />}
                    </div>
                    <div className={styles.optionContent}>
                      <h3 className={styles.optionName}>Criar novas mensagens</h3>
                      <p className={styles.optionDescription}>
                        Digite mensagens personalizadas para esta campanha
                      </p>
                    </div>
                  </div>
                  
                  <div 
                    className={`${styles.optionItem} ${usarMensagensExistentes ? styles.optionItemSelected : ''}`}
                    onClick={() => setUsarMensagensExistentes(true)}
                  >
                    <div className={styles.optionIcon}>
                      {usarMensagensExistentes ? <CheckCircle size={24} /> : <div className={styles.circle} />}
                    </div>
                    <div className={styles.optionContent}>
                      <h3 className={styles.optionName}>Usar mensagens existentes</h3>
                      <p className={styles.optionDescription}>
                        {loadingMensagens ? (
                          <span style={{ display: 'flex', alignItems: 'center' }}>
                            <Loader className={styles.spinIcon} size={14} style={{ marginRight: '8px' }} />
                            Carregando mensagens...
                          </span>
                        ) : mensagensExistentes.length > 0 ? (
                          `Usar ${mensagensExistentes.length} mensagens já salvas para esta campanha`
                        ) : (
                          "Não há mensagens salvas para esta campanha"
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {usarMensagensExistentes && mensagensExistentes.length > 0 && (
                  <div className={styles.previewExistingMessages}>
                    <h4 className={styles.previewTitle}>Mensagens disponíveis:</h4>
                    
                    {mensagensExistentes.slice(0, 2).map((msg, idx) => (
                      <div key={idx} className={styles.existingMessageItem}>
                        <div className={styles.existingMessageNumber}>Mensagem {idx + 1}</div>
                        <div className={styles.existingMessageText}>
                          {msg.mensagem.length > 100 ? msg.mensagem.substring(0, 100) + '...' : msg.mensagem}
                        </div>
                      </div>
                    ))}
                    
                    {mensagensExistentes.length > 2 && (
                      <div className={styles.viewMoreButton}>
                        <span>Ver todas as {mensagensExistentes.length} mensagens</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!usarMensagensExistentes && (
                <div className={styles.messageSection}>
                  <div className={styles.messageHeader}>
                    <div>
                      <h3 className={styles.sectionTitle}>💬 Crie suas mensagens</h3>
                      <p className={styles.sectionSubtitle}>
                        Crie múltiplas mensagens personalizadas para seus contatos
                      </p>
                    </div>
                    <div className={styles.messageCounter}>
                      <span className={styles.messageCount}>({mensagens.length}/{MAX_MESSAGES})</span>
                      <button
                        className={styles.addMessageButton}
                        onClick={addMessage}
                        disabled={mensagens.length >= MAX_MESSAGES}
                      >
                        <Plus size={14} />
                        Adicionar
                      </button>
                    </div>
                  </div>

                  {/* Abas de mensagens */}
                  <div className={styles.messageTabs}>
                    {mensagens.map((_, index) => (
                      <div
                        key={index}
                        className={`${styles.messageTab} ${currentMessageIndex === index ? styles.activeMessageTab : ''}`}
                      >
                        <button
                          className={styles.messageTabButton}
                          onClick={() => setCurrentMessageIndex(index)}
                        >
                          Msg {index + 1}
                        </button>
                        {mensagens.length > 1 && (
                          <button
                            className={styles.removeMessageButton}
                            onClick={() => removeMessage(index)}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {messageError && (
                    <div className={styles.errorMessage}>
                      ⚠️ Por favor, adicione pelo menos uma mensagem antes de continuar
                    </div>
                  )}

                  <div className={styles.inputLabelContainer}>
                    <label className={styles.inputLabel}>
                      📝 Mensagem {currentMessageIndex + 1}
                    </label>
                    <span className={`${styles.charCounter} ${remainingChars < 200 ? styles.warningText : ''} ${remainingChars < 50 ? styles.dangerText : ''}`}>
                      {remainingChars}/{MAX_CHARS}
                    </span>
                  </div>

                  <div className={`${styles.inputWrapper} ${messageError ? styles.inputError : ''}`}>
                    <textarea
                      ref={messageInputRef}
                      className={styles.messageInput}
                      value={mensagens[currentMessageIndex] || ''}
                      onChange={(e) => updateMessage(e.target.value, currentMessageIndex)}
                      placeholder="Olá {nome}, tudo bem? Tenho uma oferta especial para você!"
                      rows={5}
                      maxLength={MAX_CHARS}
                    />
                  </div>

                  {/* Variáveis disponíveis */}
                  <div className={styles.variablesContainer}>
                    <h4 className={styles.variablesTitle}>Variáveis disponíveis</h4>
                    <div className={styles.variablesGrid}>
                      <div
                        className={styles.variableItem}
                        onClick={() => insertVariable('${nome}')}
                      >
                        <code className={styles.variableName}>{'${nome}'}</code>
                        <span className={styles.variableDesc}>Nome do cliente</span>
                      </div>
                      <div
                        className={styles.variableItem}
                        onClick={() => insertVariable('${email}')}
                      >
                        <code className={styles.variableName}>{'${email}'}</code>
                        <span className={styles.variableDesc}>Email do cliente</span>
                      </div>
                      <div
                        className={styles.variableItem}
                        onClick={() => insertVariable('${numero}')}
                      >
                        <code className={styles.variableName}>{'${numero}'}</code>
                        <span className={styles.variableDesc}>Telefone do cliente</span>
                      </div>
                      <div
                        className={styles.variableItem}
                        onClick={() => insertVariable('${link_carrinho}')}
                      >
                        <code className={styles.variableName}>{'${link_carrinho}'}</code>
                        <span className={styles.variableDesc}>Link do carrinho</span>
                      </div>
                    </div>
                  </div>

                  {/* Preview da mensagem */}
                  {mensagens[currentMessageIndex]?.trim() && previewContact && (
                    <div className={styles.messagePreview}>
                      <h4 className={styles.previewTitle}>📱 Pré-visualização no WhatsApp:</h4>
                      <div className={styles.whatsappPreview}>
                        <div className={styles.whatsappHeader}>
                          <div className={styles.contactAvatar}>
                            {previewContact.nome.charAt(0).toUpperCase()}
                          </div>
                          <div className={styles.contactInfo}>
                            <div className={styles.contactName}>{previewContact.nome}</div>
                            <div className={styles.contactStatus}>online</div>
                          </div>
                        </div>
                        <div className={styles.messageBubble}>
                          {mensagens[currentMessageIndex]
                            .replace(/\{nome\}/gi, previewContact.nome)
                            .replace(/\{email\}/gi, previewContact.email || 'email@exemplo.com')
                            .replace(/\{numero\}/gi, formatPhoneNumber(previewContact.telefone))
                            .replace(/\{link_carrinho\}/gi, 'https://loja.exemplo.com/carrinho/123')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review and Send */}
          {step === 3 && modoAtivo === 'completo' && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                <Send className={styles.cardIcon} />
                Resumo do envio
              </h2>
              <p className={styles.cardSubtitle}>
                Verifique os detalhes antes de iniciar o envio
              </p>

              {/* Stats Card */}
              <div className={styles.statsCard}>
                <div className={styles.statsRow}>
                  <div className={styles.statsColumn}>
                    <div className={styles.statsIcon}>
                      <Users size={24} />
                    </div>
                    <div className={styles.statsTitle}>Contatos</div>
                    <div className={styles.statsCount}>
                      {modoContatos === 'existentes' ? contatosExistentes.length : contacts.length}
                    </div>
                  </div>
                  
                  <div className={styles.statsColumn}>
                    <div className={styles.statsIcon}>
                      <Mail size={24} />
                    </div>
                    <div className={styles.statsTitle}>Mensagens</div>
                    <div className={styles.statsCount}>
                      {usarMensagensExistentes ? "Existentes" : mensagens.filter(msg => msg.trim() !== '').length}
                    </div>
                  </div>
                </div>
                
                <div className={styles.infoRow}>
                  <Info size={14} />
                  <span>
                    {sending 
                      ? `Enviando contato ${sentCount} de ${modoContatos === 'existentes' ? contatosExistentes.length : contacts.length}` 
                      : usarMensagensExistentes 
                        ? `Usando mensagens existentes da campanha ${campaignId}`
                        : "As mensagens serão enviadas aleatoriamente para cada contato"}
                  </span>
                </div>
              </div>

              {/* Progress Container */}
              {sending && (
                <div className={styles.progressContainer}>
                  <div className={styles.progressInfo}>
                    <span>Progresso do Envio</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill} 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  
                  <div className={styles.progressDetails}>
                    <span><CheckCircle size={14} /> {sentCount} enviados</span>
                    <span>{(modoContatos === 'existentes' ? contatosExistentes.length : contacts.length) - sentCount} pendentes</span>
                  </div>
                </div>
              )}

              {/* Messages Preview Card */}
              {!usarMensagensExistentes && (
                <div className={styles.messagesCard}>
                  <div className={styles.listHeader}>
                    <h3 className={styles.listTitle}>Mensagens Configuradas</h3>
                    <Info size={16} />
                  </div>
                  
                  {mensagens.filter(msg => msg.trim() !== '').length > 0 ? (
                    <div className={styles.messagesList}>
                      {mensagens.filter(msg => msg.trim() !== '').map((msg, index) => (
                        <div key={index} className={styles.messagePreviewCard}>
                          <div className={styles.messagePreviewNumber}>Msg {index + 1}</div>
                          <div className={styles.messagePreviewText}>
                            {msg.length > 60 ? msg.substring(0, 60) + '...' : msg}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyContainer}>
                      <Mail size={40} />
                      <span>Nenhuma mensagem configurada</span>
                    </div>
                  )}
                </div>
              )}

              {/* Contacts List */}
              <div className={styles.listContainer}>
                <div className={styles.listHeader}>
                  <h3 className={styles.listTitle}>Lista de Contatos</h3>
                  <Info size={16} />
                </div>
                
                {(modoContatos === 'existentes' ? contatosExistentes : contacts).length > 0 ? (
                  <div className={styles.contactsList}>
                    {(modoContatos === 'existentes' ? contatosExistentes : contacts).slice(0, 5).map((contact, index) => (
                      <div 
                        key={index} 
                        className={`${styles.contactItem} ${expandedContact === index ? styles.contactItemExpanded : ''}`}
                        onClick={() => toggleExpandContact(index)}
                      >
                        <div className={styles.contactHeader}>
                          <div className={styles.contactAvatar}>
                            {contact.nome.charAt(0).toUpperCase()}
                          </div>
                          
                          <div className={styles.contactInfo}>
                            <div className={styles.contactName}>{contact.nome}</div>
                            <div className={styles.contactPhone}>
                              <Phone size={12} /> {formatPhoneNumber(contact.telefone || contact.numero)}
                            </div>
                          </div>
                          
                          {expandedContact === index ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                        </div>
                        
                        {expandedContact === index && (
                          <div className={styles.expandedContent}>
                            <div className={styles.previewHeader}>
                              <span className={styles.previewTitle}>
                                {usarMensagensExistentes 
                                  ? "Preview (mensagens existentes):" 
                                  : `Preview Msg ${expandedMsgIndex + 1}/${mensagens.filter(msg => msg.trim() !== '').length}:`}
                              </span>
                              
                              {!usarMensagensExistentes && mensagens.filter(msg => msg.trim() !== '').length > 1 && (
                                <div className={styles.previewNavigation}>
                                  <button onClick={() => navegarMensagens(-1)}>
                                    <ChevronLeft size={20} />
                                  </button>
                                  <button onClick={() => navegarMensagens(1)}>
                                    <ChevronRight size={20} />
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            <div className={styles.previewBox}>
                              {previewMessage(contact, expandedMsgIndex)}
                            </div>
                            
                            {contact.email && (
                              <div className={styles.contactEmail}>
                                <Mail size={12} /> {contact.email}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {(modoContatos === 'existentes' ? contatosExistentes : contacts).length > 5 && (
                      <div className={styles.moreContacts}>
                        + {(modoContatos === 'existentes' ? contatosExistentes : contacts).length - 5} outros contatos
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.emptyContainer}>
                    <Users size={40} />
                    <span>Nenhum contato carregado</span>
                  </div>
                )}
              </div>

              <div className={styles.costSummary}>
                <div className={styles.costItem}>
                  <span>Custo por mensagem:</span>
                  <span>R$ 0,30</span>
                </div>
                <div className={styles.costTotal}>
                  <span>Custo total estimado:</span>
                  <span>R$ {((modoContatos === 'existentes' ? contatosExistentes.length : contacts.length) * 0.30).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Modo Rápido */}
          {step === 3 && modoAtivo === 'rapido' && (
            <div className={styles.card}>
              <div className={styles.quickModeContainer}>
                <div className={styles.quickModeHeader}>
                  <Zap size={36} />
                  <h2 className={styles.quickModeTitle}>Disparo Rápido</h2>
                  <p className={styles.quickModeDescription}>
                    Ative o robô para iniciar os disparos usando as mensagens já configuradas para a campanha {campaignId}.
                  </p>
                </div>
                
                {/* Status da Campanha */}
                {carregandoStatus ? (
                  <div className={styles.statusLoading}>
                    <Loader className={styles.spinIcon} size={20} />
                    <span>Carregando informações da campanha...</span>
                  </div>
                ) : statusCampanha ? (
                  <div className={styles.campaignStatusCard}>
                    <div className={styles.statusRow}>
                      <div className={styles.statusItem}>
                        <div className={styles.statusLabel}>Contatos</div>
                        <div className={styles.statusValue}>{statusCampanha.total_contatos}</div>
                      </div>
                      
                      <div className={styles.statusItem}>
                        <div className={styles.statusLabel}>Mensagens</div>
                        <div className={styles.statusValue}>{statusCampanha.total_mensagens}</div>
                      </div>
                      
                      <div className={styles.statusItem}>
                        <div className={styles.statusLabel}>Pendentes</div>
                        <div className={styles.statusValue}>{statusCampanha.pendentes}</div>
                      </div>
                    </div>
                    
                    <div className={styles.deliveryRate}>
                      <span className={styles.deliveryRateLabel}>Taxa de Entrega:</span>
                      <div className={styles.deliveryProgressContainer}>
                        <div 
                          className={styles.deliveryProgressBar} 
                          style={{ width: `${statusCampanha.taxa_entrega}%` }}
                        />
                      </div>
                      <span className={styles.deliveryRateValue}>{statusCampanha.taxa_entrega}%</span>
                    </div>
                    
                    {statusCampanha.pendentes > 0 && (
                      <div className={styles.statusAlert}>
                        <AlertCircle size={16} />
                        <span>Esta campanha tem {statusCampanha.pendentes} contatos pendentes. Ative o robô para continuar.</span>
                      </div>
                    )}
                    
                    {statusCampanha.total_mensagens === 0 && (
                      <div className={`${styles.statusAlert} ${styles.statusAlertError}`}>
                        <AlertTriangle size={16} />
                        <span>Não existem mensagens para esta campanha. Adicione mensagens antes de ativar o robô.</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.noStatusCard}>
                    <AlertTriangle size={24} />
                    <span>Não foi possível obter o status desta campanha.</span>
                  </div>
                )}
                
                {/* Contatos importados */}
                <div className={styles.quickContactsCard}>
                  <div className={styles.quickContactsHeader}>
                    <h3>Contatos Importados</h3>
                    <div className={styles.contactCount}>
                      {modoContatos === 'existentes' ? contatosExistentes.length : contacts.length}
                    </div>
                  </div>
                  
                  {(modoContatos === 'existentes' ? contatosExistentes : contacts).length > 0 && (
                    <div className={styles.quickContactsList}>
                      {(modoContatos === 'existentes' ? contatosExistentes : contacts).slice(0, 3).map((contato, index) => (
                        <div key={index} className={styles.quickContactItem}>
                          <div className={styles.contactAvatar}>
                            {contato.nome.charAt(0).toUpperCase()}
                          </div>
                          <div className={styles.contactInfo}>
                            <div className={styles.contactName}>{contato.nome}</div>
                            <div className={styles.contactPhone}>
                              {formatPhoneNumber(contato.telefone || contato.numero)}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {(modoContatos === 'existentes' ? contatosExistentes : contacts).length > 3 && (
                        <button 
                          className={styles.viewMoreContactsButton}
                          onClick={() => setModoAtivo('completo')}
                        >
                          Ver todos os {(modoContatos === 'existentes' ? contatosExistentes : contacts).length} contatos
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Botão de ação principal */}
                <button
                  className={`${styles.quickModeButton} ${(sending || statusCampanha?.total_mensagens === 0) ? styles.quickModeButtonDisabled : ''}`}
                  onClick={ativarRoboDisparo}
                  disabled={sending || statusCampanha?.total_mensagens === 0}
                >
                  {sending ? (
                    <>
                      <Loader className={styles.spinIcon} size={20} />
                      Ativando robô...
                    </>
                  ) : (
                    <>
                      <Play size={20} />
                      Ativar Robô de Disparos
                    </>
                  )}
                </button>
                
                <button 
                  className={styles.manageMessagesButton}
                  onClick={() => setModalGerenciadorVisible(true)}
                >
                  <Edit2 size={14} />
                  Gerenciar Mensagens
                </button>
                
                <div className={styles.quickModeInfo}>
                  <Info size={14} />
                  <span>
                    O robô usará as mensagens existentes da campanha {campaignId} para enviar aos contatos pendentes.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {modoAtivo === 'completo' && (
          <div className={styles.actionBar}>
            {step < 3 ? (
              <button
                className={styles.actionButton}
                onClick={validateAndContinue}
                disabled={
                  isLoading || 
                  (step === 1 && modoContatos === 'novos' && contacts.length === 0) ||
                  (step === 1 && modoContatos === 'existentes' && contatosExistentes.length === 0) ||
                  (step === 2 && !usarMensagensExistentes && mensagens.filter(msg => msg.trim() !== '').length === 0)
                }
              >
                {step === 1 ? 'Continuar para Mensagens' : 
                 step === 2 ? 'Continuar para Revisão' : 
                 'Iniciar Disparo WhatsApp'}
              </button>
            ) : (
              <button
                className={styles.sendButton}
                onClick={startSending}
                disabled={
                  sending || 
                  (modoContatos === 'existentes' ? contatosExistentes.length === 0 : contacts.length === 0)
                }
              >
                {sending ? (
                  <>
                    <Loader className={styles.spinIcon} size={20} />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    {modoContatos === 'existentes' ? 'Ativar Robô de Disparos' : 'Iniciar Disparo WhatsApp'}
                  </>
                )}
              </button>
            )}

            <div className={styles.disclaimer}>
              <Info size={12} />
              <span>
                {step === 3
                  ? `Serão cobrados R$ 0,30 por cada mensagem (total: R$ ${((modoContatos === 'existentes' ? contatosExistentes.length : contacts.length) * 0.30).toFixed(2)}).`
                  : 'Certifique-se de revisar suas mensagens antes do envio.'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modal para gerenciamento de mensagens */}
      <GerenciadorMensagens 
        visible={modalGerenciadorVisible}
        onClose={() => setModalGerenciadorVisible(false)}
        login={user?.LOGIN}
        campanha={campaignId}
        onMensagensAtualizadas={(mensagensAtualizadas) => {
          if (usarMensagensExistentes && mensagensAtualizadas && mensagensAtualizadas.length > 0) {
            const confirm = window.confirm("Você atualizou as mensagens da campanha. Deseja usar as mensagens atualizadas para este disparo?");
            if (confirm) {
              setMensagens(mensagensAtualizadas);
            }
          }
          // Atualizar lista de mensagens existentes
          buscarMensagensExistentes();
        }}
      />
    </>
  );
};

export default Disparos;
