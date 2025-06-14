import React, { useState, useEffect } from 'react';
import styles from './CreateAgentModal.module.css';
import { Criptografar, Descriptografar } from '../../../Cripto';
import { useApp } from '../../../context/AppContext';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';
import { FiPlus, FiX, FiChevronLeft, FiChevronRight, FiCheck, FiHelpCircle, FiAlertCircle, FiLink, FiShoppingBag } from 'react-icons/fi';
import { socketService } from '../../../services/socketService';

export default function CreateAgentModal({ socket, onClose, onSuccess, campaignId }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useApp();
  const [formData, setFormData] = useState({
    empresa: '',
    atendente: '',
    objetivo: 'Venda_Digital',
    redes: [],
    perguntas: [],
    gatilho: '',
    dias: [],
    inicio: '',
    fim: '',
    produtos: []
  });

  // Set up socket listener for response
  useEffect(() => {
    const handleBotCreationResponse = (data) => {
      if (Descriptografar(data.Code) !== '365445365454436') return;
      
      setLoading(false);
      if (Descriptografar(data.Res) === true) {
        onSuccess();
      } else {
        setError('Erro ao criar o bot. Tente novamente.');
        // console.error('Erro na resposta do servidor');
      }
    };

    socketService.on('RespostaDaCriação', handleBotCreationResponse);

    return () => {
      socketService.off('RespostaDaCriação', handleBotCreationResponse);
    };
  }, [onSuccess]);

  const stepTitles = {
    1: 'Informações Básicas',
    2: 'Configurar Objetivo',
    3: 'Configurar Gatilho',
    4: 'Selecionar Plataformas',
    5: 'Configurar Respostas',
    6: 'Configurar Horários', 
    7: 'Adicionar Produtos'
  };

  const objectives = [
    // { value: 'Vendas', label: 'Vendas' },
    // { value: 'Agendamento', label: 'Agendamento' },
    { value: 'Venda_Digital', label: 'Vendas Digitais' }
  ];

  const platforms = [
    { id: '0', label: 'WhatsApp', icon: <FaWhatsapp className={styles.platformIcon} /> },
    { id: '2', label: 'Instagram', icon: <FaInstagram className={styles.platformIcon} /> }
  ];

  const weekDays = [
    { id: 0, label: 'Domingo' },
    { id: 1, label: 'Segunda' },
    { id: 2, label: 'Terça' },
    { id: 3, label: 'Quarta' },
    { id: 4, label: 'Quinta' },
    { id: 5, label: 'Sexta' },
    { id: 6, label: 'Sábado' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePlatformChange = (platformId) => {
    setFormData(prev => ({
      ...prev,
      redes: prev.redes.includes(platformId)
        ? prev.redes.filter(id => id !== platformId)
        : [...prev.redes, platformId]
    }));
  };

  const handleDayChange = (dayId) => {
    setFormData(prev => ({
      ...prev,
      dias: prev.dias.includes(dayId)
        ? prev.dias.filter(id => id !== dayId)
        : [...prev.dias, dayId]
    }));
  };

  const addPergunta = () => {
    if (formData.newPergunta && formData.newResposta) {
      setFormData(prev => ({
        ...prev,
        perguntas: [
          ...prev.perguntas, 
          { Pergunta: prev.newPergunta, Resposta: prev.newResposta }
        ],
        newPergunta: '',
        newResposta: ''
      }));
    } else {
      setError('Por favor, preencha a pergunta e resposta antes de adicionar.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const updatePergunta = (index, field, value) => {
    setFormData(prev => {
      const newPerguntas = [...prev.perguntas];
      newPerguntas[index] = { ...newPerguntas[index], [field]: value };
      return { ...prev, perguntas: newPerguntas };
    });
  };

  const removePergunta = (index) => {
    setFormData(prev => ({
      ...prev,
      perguntas: prev.perguntas.filter((_, i) => i !== index)
    }));
  };

  // Novo - Funções para gerenciar produtos (para objetivo Venda_Digital)
  const [newProduct, setNewProduct] = useState({
    produto: '',
    preco: '',
    categoria: '',
    descricao: '',
    imagem: null
  });

  const [showProductForm, setShowProductForm] = useState(false);

  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addProduct = () => {
    // Validação simples dos campos do produto
    if (!newProduct.produto || !newProduct.preco || !newProduct.categoria || !newProduct.descricao) {
      setError('Por favor, preencha todos os campos do produto.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Gerar ID único para o produto
    const productId = Date.now().toString();
    
    setFormData(prev => ({
      ...prev,
      produtos: [...prev.produtos, {
        id: productId,
        Produto: newProduct.produto,
        Preco: newProduct.preco,
        Categoria: newProduct.categoria,
        Descricao: newProduct.descricao,
        Imagem: newProduct.imagem
      }]
    }));

    // Resetar o formulário de produto
    setNewProduct({
      produto: '',
      preco: '',
      categoria: '',
      descricao: '',
      imagem: null
    });

    setShowProductForm(false);
  };

  const removeProduct = (productId) => {
    setFormData(prev => ({
      ...prev,
      produtos: prev.produtos.filter(p => p.id !== productId)
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({
          ...prev,
          imagem: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Formata o preço para o formato de moeda brasileira
  const formatCurrency = (value) => {
    if (!value) return '';
    
    // Remove todos os caracteres não numéricos
    const numericValue = value.replace(/\D/g, '');
    
    // Converte para número e formata como moeda
    const number = parseFloat(numericValue) / 100;
    return number.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handlePriceChange = (e) => {
    const rawValue = e.target.value;
    const numericValue = rawValue.replace(/\D/g, '');
    const formattedValue = formatCurrency(numericValue);
    
    setNewProduct(prev => ({
      ...prev,
      preco: formattedValue
    }));
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        return formData.empresa && formData.atendente;
      case 2:
        return formData.objetivo;
      case 3:
        return formData.gatilho && formData.gatilho.trim() !== '';
      case 4:
        return formData.redes.length > 0;
      case 5:
        return formData.perguntas.length > 0 && formData.perguntas.every(p => p.Pergunta && p.Resposta);
      case 6:
        return formData.objetivo === 'Agendamento' ? 
          (formData.dias.length > 0 && formData.inicio && formData.fim) : true;
      case 7:
        return formData.objetivo === 'Venda_Digital' ? 
          (formData.produtos.length > 0) : true;
      default:
        return true;
    }
  };

  const getMaxStep = () => {
    if (formData.objetivo === 'Venda_Digital') {
      return 7; // Incluindo a etapa de produtos
    } else if (formData.objetivo === 'Agendamento') {
      return 6; // Incluindo a etapa de horários
    } else {
      return 5; // Para outros objetivos, parar após configurar respostas
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      const maxStep = getMaxStep();
      
      if (step === maxStep) {
        handleSubmit();
      } else {
        setStep(step + 1);
      }
    }
  };

  const handleBack = () => {
    setStep(Math.max(1, step - 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    // Adicione um timeout para evitar carregamento infinito
    setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('Tempo limite excedido. Tente novamente.');
      }
    }, 15000);
    
    try {
      // Use Date.now() for unique protocol
      const protocolo = Date.now().toString();
      
      // Prepare perguntas array - importante: NÃO use JSON.stringify aqui
      const perguntasPreparadas = formData.perguntas.map(p => ({
        Pergunta: p.Pergunta || '',
        Resposta: p.Resposta || ''
      }));
      
      // Utilize código diferente para os diferentes objetivos
      if (formData.objetivo === 'Agendamento') {
        socketService.emit('CriarBot', {
          Code: Criptografar('3654534655434565434'),
          Empresa: Criptografar(formData.empresa),
          Atendente: Criptografar(formData.atendente),
          Protocolo: Criptografar(protocolo),
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
        // console.log('Enviando dados de agendamento');
      } else if (formData.objetivo === 'Venda_Digital') {
        // Primeiro enviar os dados do bot
        socketService.emit('CriarBot', {
          Code: Criptografar('658467658467865671'),
          Empresa: Criptografar(formData.empresa),
          Atendente: Criptografar(formData.atendente),
          Protocolo: Criptografar(protocolo),
          Login: Criptografar(user.LOGIN),
          Redes: Criptografar(formData.redes.join(',')),
          Objetivo: Criptografar(formData.objetivo),
          Perguntas: Criptografar(perguntasPreparadas),
          Gatilho: Criptografar(formData.gatilho),
          Campanha: Criptografar(campaignId) || null
        });
        
        // Depois enviar os produtos um a um
        formData.produtos.forEach(produto => {
          socketService.emit('CriarProdutos', {
            Code: Criptografar('45489644589644'),
            Produtos: Criptografar(JSON.stringify({
              nomeFoto: produto.id,
              Produto: produto.Produto,
              Preco: produto.Preco,
              Categoria: produto.Categoria,
              Descricao: produto.Descricao,
              Base64: produto.Imagem
            })),
            Login: Criptografar(user.LOGIN),
            Protocolo: Criptografar(protocolo),
          });
        });
        
        // console.log('Enviando dados de vendas digitais com produtos');
      } else {
        socketService.emit('CriarBot', {
          Code: Criptografar('658467658467865671'),
          Empresa: Criptografar(formData.empresa),
          Atendente: Criptografar(formData.atendente),
          Protocolo: Criptografar(protocolo),
          Login: Criptografar(user.LOGIN),
          Redes: Criptografar(formData.redes.join(',')),
          Objetivo: Criptografar(formData.objetivo),
          Perguntas: Criptografar(perguntasPreparadas),
          Gatilho: Criptografar(formData.gatilho),
          Campanha: Criptografar(campaignId) || null
        });
        // console.log('Enviando dados de vendas');
      }
    } catch (error) {
      // console.error('Erro ao criar agente:', error);
      setLoading(false);
      setError(`Erro: ${error.message || 'Falha ao criar o bot'}`);
    }
  };

  // Componente para exibir erros
  const renderError = () => {
    if (!error) return null;
    
    return (
      <div className={styles.errorMessage}>
        <FiAlertCircle size={16} />
        <span>{error}</span>
        <button 
          onClick={() => setError(null)} 
          className={styles.dismissErrorButton}
          aria-label="Fechar mensagem de erro"
        >
          <FiX size={14} />
        </button>
      </div>
    );
  };

  // Calcular a porcentagem de progresso com base no objetivo e etapa atual
  const calculateProgress = () => {
    const maxStep = getMaxStep();
    return Math.round((step / maxStep) * 100);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className={styles.stepContent}>
            <div className={styles.formGroup}>
              <label htmlFor="empresa">Nome da Empresa</label>
              <input
                id="empresa"
                type="text"
                name="empresa"
                value={formData.empresa}
                onChange={handleInputChange}
                placeholder="Digite o nome da empresa"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="atendente">Nome do Atendente AI</label>
              <input
                id="atendente"
                type="text"
                name="atendente"
                value={formData.atendente}
                onChange={handleInputChange}
                placeholder="Digite o nome do atendente"
              />
              <div className={styles.helpText}>
                <FiHelpCircle size={14} />
                <span>Este será o nome que aparecerá para seus clientes</span>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className={styles.stepContent}>
            <div className={styles.formGroup}>
              <label htmlFor="objetivo">Objetivo do Agente</label>
              <select
                id="objetivo"
                name="objetivo"
                value={formData.objetivo}
                onChange={handleInputChange}
              >
                {objectives.map(obj => (
                  <option key={obj.value} value={obj.value}>
                    {obj.label}
                  </option>
                ))}
              </select>
              <div className={styles.helpText}>
                <FiHelpCircle size={14} />
                <span>O objetivo determina como o agente será configurado</span>
              </div>
            </div>
            
            <div className={styles.objectiveDescription}>
              {formData.objetivo === 'Vendas' && (
                <div className={styles.objectiveCard}>
                  <h4>Vendas</h4>
                  <p>Ideal para atendimento ao cliente, divulgação de produtos ou serviços e conversão de leads em vendas.</p>
                </div>
              )}
              {formData.objetivo === 'Agendamento' && (
                <div className={styles.objectiveCard}>
                  <h4>Agendamento</h4>
                  <p>Perfeito para clinicas, salões ou serviços que necessitam de marcação de horários e gestão de agenda.</p>
                </div>
              )}
              {formData.objetivo === 'Venda_Digital' && (
                <div className={styles.objectiveCard}>
                  <h4>Vendas Digitais</h4>
                  <p>Otimizado para marketing digital, venda de infoprodutos e cursos online com integração para pagamentos.</p>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className={styles.stepContent}>
            <div className={styles.formGroup}>
              <label htmlFor="gatilho">Gatilho de Finalização</label>
              <div className={styles.gatilhoInputContainer}>
                <FiLink size={16} className={styles.gatilhoIcon} />
                <input
                  id="gatilho"
                  type="text"
                  name="gatilho"
                  value={formData.gatilho}
                  onChange={handleInputChange}
                  placeholder="Digite o link de finalização (ex: https://meusite.com/pagamento)"
                  className={styles.gatilhoInput}
                />
              </div>
              
              <div className={styles.alertBox}>
                <FiAlertCircle size={16} className={styles.alertIcon} />
                <div className={styles.alertContent}>
                  <p className={styles.alertTitle}>Muita atenção</p>
                  <p className={styles.alertText}>
                    O gatilho é enviado sempre que a venda é finalizada. Este link será enviado quando a inteligência entender que existe possibilidade de venda. Coloque algum link para direcionar seu cliente.
                  </p>
                </div>
              </div>
              
              <div className={styles.helpText}>
                <FiHelpCircle size={14} />
                <span>Use um link completo, incluindo http:// ou https://</span>
              </div>
              
              <div className={styles.exampleSection}>
                <h4 className={styles.exampleTitle}>Exemplos de gatilhos:</h4>
                <ul className={styles.exampleList}>
                  <li className={styles.exampleItem}>Link do seu site com página de pagamento</li>
                  <li className={styles.exampleItem}>Link do WhatsApp com mensagem pré-definida</li>
                  <li className={styles.exampleItem}>Link encurtado para formulário de compra</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className={styles.stepContent}>
            <p className={styles.sectionDescription}>Selecione as plataformas onde seu agente irá operar:</p>
            
            <div className={styles.platformsGrid}>
              {platforms.map(platform => (
                <div 
                  key={platform.id} 
                  className={`${styles.platformCard} ${formData.redes.includes(platform.id) ? styles.platformSelected : ''}`}
                  onClick={() => handlePlatformChange(platform.id)}
                >
                  <div className={styles.platformIconWrapper}>
                    {platform.icon}
                  </div>
                  <span className={styles.platformLabel}>{platform.label}</span>
                  
                  {formData.redes.includes(platform.id) && (
                    <div className={styles.selectedCheck}>
                      <FiCheck size={16} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className={styles.helpText}>
              <FiHelpCircle size={14} />
              <span>Você pode selecionar múltiplas plataformas</span>
            </div>
          </div>
        );

      case 5:
        return (
          <div className={styles.stepContent}>
            <div className={styles.perguntasSection}>
              <div className={styles.perguntasSectionHeader}>
                <h4>Perguntas Frequentes</h4>
                <p className={styles.sectionDescription}>
                  Adicione perguntas frequentes e respostas para o seu agente AI
                </p>
              </div>
              
              <div className={styles.addPerguntaCard}>
                <div className={styles.formGroup}>
                  <label htmlFor="novaPergunta">Pergunta</label>
                  <input
                    id="novaPergunta"
                    type="text"
                    placeholder="Ex: Qual o prazo de entrega?"
                    value={formData.newPergunta || ''}
                    onChange={(e) => setFormData(prev => ({...prev, newPergunta: e.target.value}))}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="novaResposta">Resposta</label>
                  <textarea
                    id="novaResposta"
                    placeholder="Ex: Nosso prazo é de 3 dias úteis para todo o Brasil."
                    rows={3}
                    value={formData.newResposta || ''}
                    onChange={(e) => setFormData(prev => ({...prev, newResposta: e.target.value}))}
                  ></textarea>
                </div>
                
                <button 
                  className={styles.addButton}
                  onClick={addPergunta}
                >
                  <FiPlus size={18} />
                  <span>Adicionar Pergunta</span>
                </button>
              </div>
              
              {formData.perguntas.length > 0 && (
                <div className={styles.perguntasList}>
                  <h4>Perguntas cadastradas ({formData.perguntas.length})</h4>
                  
                  <div className={styles.perguntasScrollContainer}>
                    {formData.perguntas.map((pergunta, index) => (
                      <div key={index} className={styles.perguntaItem}>
                        <div className={styles.perguntaHeader}>
                          <span className={styles.perguntaLabel}>Pergunta:</span>
                          <button 
                            className={styles.removeButton}
                            onClick={() => removePergunta(index)}
                            aria-label="Remover pergunta"
                          >
                            <FiX size={16} />
                          </button>
                        </div>
                        <p className={styles.perguntaText}>{pergunta.Pergunta}</p>
                        
                        <span className={styles.perguntaLabel}>Resposta:</span>
                        <p className={styles.respostaText}>{pergunta.Resposta}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className={styles.stepContent}>
            <div className={styles.schedulingSection}>
              <h4>Dias de Funcionamento</h4>
              <p className={styles.sectionDescription}>
                Selecione os dias e horários em que o agente estará ativo para agendamentos
              </p>
              
              <div className={styles.daysGrid}>
                {weekDays.map(day => (
                  <div 
                    key={day.id} 
                    className={`${styles.dayCard} ${formData.dias.includes(day.id) ? styles.daySelected : ''}`}
                    onClick={() => handleDayChange(day.id)}
                  >
                    {day.label}
                    
                    {formData.dias.includes(day.id) && (
                      <div className={styles.selectedCheck}>
                        <FiCheck size={14} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className={styles.timeInputs}>
                <div className={styles.formGroup}>
                  <label htmlFor="inicio">Horário de Início</label>
                  <input
                    id="inicio"
                    type="time"
                    name="inicio"
                    value={formData.inicio}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="fim">Horário de Término</label>
                  <input
                    id="fim"
                    type="time"
                    name="fim"
                    value={formData.fim}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className={styles.helpText}>
                <FiHelpCircle size={14} />
                <span>O agente só oferecerá horários dentro do período configurado</span>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className={styles.stepContent}>
            <div className={styles.produtosSection}>
              <div className={styles.produtosSectionHeader}>
                <h4>Cadastro de Produtos</h4>
                <p className={styles.sectionDescription}>
                  Adicione os produtos que serão oferecidos pelo seu agente de vendas digital
                </p>
              </div>
              
              {!showProductForm ? (
                <button 
                  className={styles.addProductButton}
                  onClick={() => setShowProductForm(true)}
                >
                  <FiPlus size={18} />
                  <span>Adicionar Novo Produto</span>
                </button>
              ) : (
                <div className={styles.productForm}>
                  <h4 className={styles.productFormTitle}>Novo Produto</h4>
                  
                  <div className={styles.imageUploadSection}>
                    <label htmlFor="productImage" className={styles.imageUploadLabel}>
                      {newProduct.imagem ? (
                        <div className={styles.previewImageContainer}>
                          <img
                            src={newProduct.imagem}
                            alt="Preview"
                            className={styles.previewImage}
                          />
                          <div className={styles.changeImageOverlay}>
                            <FiPlus size={24} />
                          </div>
                        </div>
                      ) : (
                        <div className={styles.uploadPlaceholder}>
                          <FiPlus size={24} />
                          <span>Adicionar imagem</span>
                        </div>
                      )}
                    </label>
                    <input
                      id="productImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="produto">Nome do Produto</label>
                    <input
                      id="produto"
                      type="text"
                      name="produto"
                      value={newProduct.produto}
                      onChange={handleProductChange}
                      placeholder="Ex: Camiseta Básica"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="preco">Preço</label>
                    <input
                      id="preco"
                      type="text"
                      name="preco"
                      value={newProduct.preco}
                      onChange={handlePriceChange}
                      placeholder="Ex: R$ 99,90"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="categoria">Categoria</label>
                    <input
                      id="categoria"
                      type="text"
                      name="categoria"
                      value={newProduct.categoria}
                      onChange={handleProductChange}
                      placeholder="Ex: Vestuário"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="descricao">Descrição</label>
                    <textarea
                      id="descricao"
                      name="descricao"
                      rows={3}
                      value={newProduct.descricao}
                      onChange={handleProductChange}
                      placeholder="Descreva os detalhes do produto..."
                    ></textarea>
                  </div>
                  
                  <div className={styles.productFormButtons}>
                    <button 
                      className={styles.cancelButton}
                      onClick={() => setShowProductForm(false)}
                    >
                      <FiX size={16} />
                      <span>Cancelar</span>
                    </button>
                    
                    <button 
                      className={styles.saveButton}
                      onClick={addProduct}
                    >
                      <FiCheck size={16} />
                      <span>Salvar Produto</span>
                    </button>
                  </div>
                </div>
              )}
              
              {formData.produtos.length > 0 && (
                <div className={styles.produtosList}>
                  <h4>Produtos cadastrados ({formData.produtos.length})</h4>
                  
                  <div className={styles.produtosGrid}>
                    {formData.produtos.map((produto, index) => (
                      <div key={produto.id} className={styles.produtoCard}>
                        {produto.Imagem && (
                          <div className={styles.produtoImageContainer}>
                            <img
                              src={produto.Imagem}
                              alt={produto.Produto}
                              className={styles.produtoImage}
                            />
                          </div>
                        )}
                        
                        <div className={styles.produtoContent}>
                          <div className={styles.produtoHeader}>
                            <h5 className={styles.produtoTitle}>{produto.Produto}</h5>
                            <button 
                              className={styles.removeProdutoButton}
                              onClick={() => removeProduct(produto.id)}
                              aria-label="Remover produto"
                            >
                              <FiX size={16} />
                            </button>
                          </div>
                          
                          <p className={styles.produtoPreco}>{produto.Preco}</p>
                          
                          <div className={styles.produtoCategoria}>
                            {produto.Categoria}
                          </div>
                          
                          <p className={styles.produtoDescricao}>
                            {produto.Descricao.length > 100
                              ? `${produto.Descricao.substring(0, 100)}...`
                              : produto.Descricao}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Calculate the total number of steps based on objective
  const totalSteps = getMaxStep();
  const progressPercentage = calculateProgress();

  return (
    <div className={styles.modalOverlay} onClick={() => !loading && onClose()}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Criar Agente AI {campaignId ? '- Campanha' : ''}</h2>
          {!loading && (
            <button className={styles.closeButton} onClick={onClose} aria-label="Fechar">
              <FiX size={24} />
            </button>
          )}
        </div>

        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progressPercentage}%` }}></div>
          </div>
          <div className={styles.stepIndicator}>
            <span>Etapa {step} de {totalSteps}</span>
            <span className={styles.stepTitle}>{stepTitles[step]}</span>
          </div>
        </div>

        <div className={styles.modalBody}>
          {renderError()}
          {renderStep()}
        </div>

        <div className={styles.modalFooter}>
          {step > 1 && (
            <button 
              className={styles.backButton} 
              onClick={handleBack}
              disabled={loading}
            >
              <FiChevronLeft size={18} />
              <span>Voltar</span>
            </button>
          )}
          
          <button 
            className={styles.nextButton} 
            onClick={handleNext}
            disabled={loading || !validateStep()}
          >
            {loading ? (
              <>
                <div className={styles.buttonSpinner}></div>
                <span>Criando...</span>
              </>
            ) : (
              <>
                <span>
                  {step === totalSteps
                    ? 'Criar Agente' 
                    : 'Próximo'}
                </span>
                {step === totalSteps
                  ? <FiCheck size={18} />
                  : <FiChevronRight size={18} />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}