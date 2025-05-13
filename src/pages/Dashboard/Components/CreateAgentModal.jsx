// CreateAgentModal.jsx
import React, { useState } from 'react';
import styles from './CreateAgentModal.module.css';
import { Criptografar } from '../../../Cripto';
import { useApp } from '../../../context/AppContext';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';
import { FiPlus, FiX, FiChevronLeft, FiChevronRight, FiCheck, FiHelpCircle } from 'react-icons/fi';
import { socketService } from '../../../services/socketService';

export default function CreateAgentModal({ socket, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user } = useApp();
  const [formData, setFormData] = useState({
    empresa: '',
    atendente: '',
    objetivo: 'Vendas',
    redes: [],
    perguntas: [],
    gatilho: [],
    dias: [],
    inicio: '',
    fim: ''
  });

  const stepTitles = {
    1: 'Informações Básicas',
    2: 'Configurar Objetivo',
    3: 'Selecionar Plataformas',
    4: 'Configurar Respostas',
    5: 'Configurar Horários'
  };

  const objectives = [
    { value: 'Vendas', label: 'Vendas' },
    { value: 'Agendamento', label: 'Agendamento' },
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
    setFormData(prev => ({
      ...prev,
      perguntas: [...prev.perguntas, { Pergunta: '', Resposta: '' }]
    }));
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

  const validateStep = () => {
    switch (step) {
      case 1:
        return formData.empresa && formData.atendente;
      case 2:
        return formData.objetivo;
      case 3:
        return formData.redes.length > 0;
      case 4:
        return formData.perguntas.length > 0 && formData.perguntas.every(p => p.Pergunta && p.Resposta);
      case 5:
        return formData.objetivo === 'Agendamento' ? 
          (formData.dias.length > 0 && formData.inicio && formData.fim) : true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      if (step === 5 || (step === 4 && formData.objetivo !== 'Agendamento')) {
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
    try {
      const protocolo = Date.now().toString();
      
      let dataToSend;
      
      if (formData.objetivo === 'Agendamento') {
        dataToSend = Criptografar(JSON.stringify({
          Code: '3654534655434565434',
          Empresa: formData.empresa,
          Atendente: formData.atendente,
          Protocolo: protocolo,
          Login: user.LOGIN,
          Redes: formData.redes.join(','),
          Objetivo: formData.objetivo,
          Perguntas: formData.perguntas,
          Gatilho: {
            Dias: formData.dias,
            Inicio: formData.inicio,
            Fim: formData.fim
          }
        }));
      } else {
        dataToSend = Criptografar(JSON.stringify({
          Code: '658467658467865671',
          Empresa: formData.empresa,
          Atendente: formData.atendente,
          Protocolo: protocolo,
          Login: user.LOGIN,
          Redes: formData.redes.join(','),
          Objetivo: formData.objetivo,
          Perguntas: formData.perguntas,
          Gatilho: formData.objetivo
        }));
      }

      socketService.emit('criarBot', dataToSend);
      setTimeout(() => {
        setLoading(false);
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error('Erro ao criar agente:', error);
      setLoading(false);
    }
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

      case 4:
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
                  onClick={() => {
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
                    }
                  }}
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

      case 5:
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

      default:
        return null;
    }
  };

  // Calculate the total number of steps based on objective
  const totalSteps = formData.objetivo === 'Agendamento' ? 5 : 4;
  const progressPercentage = (step / totalSteps) * 100;

  return (
    <div className={styles.modalOverlay} onClick={() => !loading && onClose()}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Criar Agente AI</h2>
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
                  {(step === 5 || (step === 4 && formData.objetivo !== 'Agendamento')) 
                    ? 'Criar Agente' 
                    : 'Próximo'}
                </span>
                {(step === 5 || (step === 4 && formData.objetivo !== 'Agendamento')) 
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