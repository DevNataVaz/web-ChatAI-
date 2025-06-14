import React, { useState } from 'react';
import { Criptografar } from '../../../../Cripto/index';
import { useApp } from '../../../../context/AppContext'; 
import styles from './CreateAgentModal.module.css';

export default function CreateAgentModal({ socketService, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user } = useApp();
  const [formData, setFormData] = useState({
    empresa: '',
    atendente: '',
    objetivo: 'Vendas',
    redes: [],
    perguntas: [{ Pergunta: 'Comportamento', Resposta: 'Seja cordial e profissional ao atender clientes.' }],
    gatilho: [],
    dias: [],
    inicio: '08:00',
    fim: '18:00'
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
    { id: '0', label: 'WhatsApp', icon: 'whatsapp' },
    { id: '2', label: 'Instagram', icon: 'instagram' }
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
    } else {
      alert('Por favor, preencha todos os campos obrigatórios');
    }
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
      
      // Wait for response before calling onSuccess
      socketService.once('RespostaDaCriação', (response) => {
        if (response && response.Res) {
          onSuccess();
        } else {
          alert('Erro ao criar agente: ' + (response?.Error || 'Falha desconhecida'));
        }
        setLoading(false);
      });
      
      // Set a timeout in case we don't get a response
      setTimeout(() => {
        setLoading(false);
        onSuccess(); // Assume success if we don't hear back
      }, 5000);
      
    } catch (error) {
      // console.error('Erro ao criar agente:', error);
      alert('Erro ao criar agente');
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className={styles.stepContent}>
            <div className={styles.formGroup}>
              <label>Nome da Empresa</label>
              <input
                type="text"
                name="empresa"
                value={formData.empresa}
                onChange={handleInputChange}
                placeholder="Digite o nome da empresa"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Nome do Atendente AI</label>
              <input
                type="text"
                name="atendente"
                value={formData.atendente}
                onChange={handleInputChange}
                placeholder="Digite o nome do atendente"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className={styles.stepContent}>
            <div className={styles.formGroup}>
              <label>Objetivo do Agente</label>
              <select
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
            </div>
          </div>
        );

      case 3:
        return (
          <div className={styles.stepContent}>
            <div className={styles.platformsSelection}>
              {platforms.map(platform => (
                <label key={platform.id} className={styles.platformOption}>
                  <input
                    type="checkbox"
                    checked={formData.redes.includes(platform.id)}
                    onChange={() => handlePlatformChange(platform.id)}
                  />
                  <div className={styles.platformCard}>
                    {platform.id === '0' && (
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="#075E54"/>
                      </svg>
                    )}
                    {platform.id === '2' && (
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.948-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" fill="#E1306C"/>
                      </svg>
                    )}
                    <span>{platform.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className={styles.stepContent}>
            <div className={styles.perguntasSection}>
              <div className={styles.perguntasHeader}>
                <h3>Perguntas e Respostas</h3>
                <button type="button" onClick={addPergunta} className={styles.addButton}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Adicionar
                </button>
              </div>
              
              {formData.perguntas.map((p, index) => (
                <div key={index} className={styles.perguntaItem}>
                  <div className={styles.formGroup}>
                    <label>Pergunta {index + 1}</label>
                    <input
                      type="text"
                      value={p.Pergunta}
                      onChange={(e) => updatePergunta(index, 'Pergunta', e.target.value)}
                      placeholder="Digite a pergunta"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Resposta {index + 1}</label>
                    <textarea
                      value={p.Resposta}
                      onChange={(e) => updatePergunta(index, 'Resposta', e.target.value)}
                      placeholder="Digite a resposta"
                      rows={3}
                    />
                  </div>
                  {index > 0 && (
                    <button 
                      type="button"
                      onClick={() => removePergunta(index)} 
                      className={styles.removeButton}
                    >
                      Remover
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className={styles.stepContent}>
            <div className={styles.scheduleSection}>
              <h3>Dias de Funcionamento</h3>
              <div className={styles.daysGrid}>
                {weekDays.map(day => (
                  <label key={day.id} className={styles.dayOption}>
                    <input
                      type="checkbox"
                      checked={formData.dias.includes(day.id)}
                      onChange={() => handleDayChange(day.id)}
                    />
                    <span>{day.label}</span>
                  </label>
                ))}
              </div>
              
              <div className={styles.timeInputs}>
                <div className={styles.formGroup}>
                  <label>Horário de Início</label>
                  <input
                    type="time"
                    name="inicio"
                    value={formData.inicio}
                    onChange={handleInputChange}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Horário de Término</label>
                  <input
                    type="time"
                    name="fim"
                    value={formData.fim}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2>Criar Agente AI</h2>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className={styles.progressBar}>
          <div 
            className={styles.progress} 
            style={{ width: `${(step / (formData.objetivo === 'Agendamento' ? 5 : 4)) * 100}%` }}
          ></div>
        </div>

        <div className={styles.stepIndicator}>
          Etapa {step} de {formData.objetivo === 'Agendamento' ? 5 : 4}: {stepTitles[step]}
        </div>

        <div className={styles.modalBody}>
          {renderStep()}
        </div>

        <div className={styles.modalFooter}>
          {step > 1 && (
            <button 
              type="button"
              className={styles.backButton} 
              onClick={() => setStep(step - 1)}
              disabled={loading}
            >
              Voltar
            </button>
          )}
          <button 
            type="button"
            className={styles.nextButton} 
            onClick={handleNext}
            disabled={loading || !validateStep()}
          >
            {loading && 'Criando...'}
            {!loading && (step === 5 || (step === 4 && formData.objetivo !== 'Agendamento')) && 'Criar Agente'}
            {!loading && !((step === 5 || (step === 4 && formData.objetivo !== 'Agendamento'))) && 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  );
}