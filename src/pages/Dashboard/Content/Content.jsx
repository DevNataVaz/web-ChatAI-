import React, { useState } from 'react';
import styles from './Content.module.css';

export default function Content({ activeTab }) {
  const [saveStatus, setSaveStatus] = useState(null);
  const [behaviorText, setBehaviorText] = useState(
    `Seu(a) funcionário(a) é responsável pelo atendimento e vendas da loja Saúde e Beleza.

Sua linguagem deve ser amigável, atenciosa e gentil. Responda de forma direta e eficiente, sem verbosidade.`
  );

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    }, 1000);
  };

  if (activeTab !== 'configuracoes') {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyStateIcon}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#8A8D9F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13" stroke="#8A8D9F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 17H12.01" stroke="#8A8D9F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3>Conteúdo não disponível</h3>
        <p>Esta seção está em desenvolvimento. Por favor, selecione a aba "Configurações".</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.contentHeader}>
          <h2>Configurações</h2>
          <div className={styles.contentActions}>
            <button 
              className={`${styles.saveButton} ${saveStatus ? styles[saveStatus] : ''}`}
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' && (
                <svg className={styles.spinnerIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="none" strokeWidth="4" stroke="currentColor" strokeDasharray="32" strokeDashoffset="32"></circle>
                </svg>
              )}
              {saveStatus === 'saved' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              <span>{saveStatus === 'saving' ? 'Salvando...' : saveStatus === 'saved' ? 'Salvo' : 'Salvar alterações'}</span>
            </button>
          </div>
        </div>
        
        <div className={styles.configSection}>
          <div className={styles.sectionHeader}>
            <h3>Comportamento do Agente</h3>
            <span className={styles.sectionBadge}>Obrigatório</span>
          </div>
          <p className={styles.sectionDescription}>
            Defina como seu agente AI deve se comportar e responder aos clientes.
          </p>
          
          <div className={styles.formGroup}>
            <label htmlFor="agentBehavior">Como o agente deve se comportar:</label>
            <div className={styles.textareaWrapper}>
              <textarea 
                id="agentBehavior" 
                value={behaviorText}
                onChange={(e) => setBehaviorText(e.target.value)}
                placeholder="Descreva o comportamento do seu agente..."
              ></textarea>
              <div className={styles.textareaActions}>
                <button className={styles.clearButton} onClick={() => setBehaviorText('')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Limpar</span>
                </button>
              </div>
            </div>
            <div className={styles.helpText}>
              Seja específico sobre o tom, estilo e conhecimento do seu agente.
            </div>
          </div>
        </div>
        
        <div className={styles.configSection}>
          <div className={styles.sectionHeader}>
            <h3>Configurações Avançadas</h3>
            <span className={styles.sectionBadge}>Opcional</span>
          </div>
          
          <div className={styles.toggleGroup}>
            <div className={styles.toggle}>
              <input type="checkbox" id="toggle1" className={styles.toggleInput} />
              <label htmlFor="toggle1" className={styles.toggleLabel}>
                <span className={styles.toggleTrack}>
                  <span className={styles.toggleIndicator}></span>
                </span>
                <div className={styles.toggleInfo}>
                  <span>Modo automático</span>
                  <span className={styles.toggleDescription}>Permite que o agente responda sem aprovação prévia</span>
                </div>
              </label>
            </div>
            
            <div className={styles.toggle}>
              <input type="checkbox" id="toggle2" className={styles.toggleInput} defaultChecked />
              <label htmlFor="toggle2" className={styles.toggleLabel}>
                <span className={styles.toggleTrack}>
                  <span className={styles.toggleIndicator}></span>
                </span>
                <div className={styles.toggleInfo}>
                  <span>Análise de sentimento</span>
                  <span className={styles.toggleDescription}>Identifica o humor do cliente para respostas adaptativas</span>
                </div>
              </label>
            </div>
            
            <div className={styles.toggle}>
              <input type="checkbox" id="toggle3" className={styles.toggleInput} />
              <label htmlFor="toggle3" className={styles.toggleLabel}>
                <span className={styles.toggleTrack}>
                  <span className={styles.toggleIndicator}></span>
                </span>
                <div className={styles.toggleInfo}>
                  <span>Memorização avançada</span>
                  <span className={styles.toggleDescription}>Memoriza detalhes de conversas anteriores</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.metricsWidget}>
        <div className={styles.metricsHeader}>
          <h3>Métricas de Desempenho</h3>
          <span className={styles.periodSelector}>
            <span className={styles.periodActive}>Esta semana</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
        
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(138, 99, 255, 0.1)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="#8A63FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricValue}>570</span>
              <span className={styles.metricLabel}>Mensagens</span>
            </div>
            <div className={`${styles.metricTrend} ${styles.positive}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>12%</span>
            </div>
          </div>
          
          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(76, 175, 80, 0.1)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18457 2.99721 7.13633 4.39828 5.49707C5.79935 3.85782 7.69279 2.71538 9.79619 2.24015C11.8996 1.76491 14.1003 1.98234 16.07 2.86" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 4L12 14.01L9 11.01" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricValue}>93%</span>
              <span className={styles.metricLabel}>Satisfação</span>
            </div>
            <div className={`${styles.metricTrend} ${styles.positive}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>3%</span>
            </div>
          </div>
          
          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(255, 87, 87, 0.1)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#FF5757" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 9L9 15" stroke="#FF5757" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 9L15 15" stroke="#FF5757" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricValue}>2.3%</span>
              <span className={styles.metricLabel}>Taxa de Erro</span>
            </div>
            <div className={`${styles.metricTrend} ${styles.negative}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>0.5%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
