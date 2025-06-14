import React, { useState } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';
import { useApp } from '../../../../context/AppContext';
import { socketService } from '../../../../services/socketService';
import { Criptografar, Descriptografar } from '../../../../Cripto/index';
import { toast } from 'react-toastify';
import styles from './CampanhaModal.module.css';

const CreateCampaignModal = ({ onClose, onSuccess }) => {
  const { user } = useApp();
  const [nomeCampanha, setNomeCampanha] = useState('');
  const [descricaoCampanha, setDescricaoCampanha] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Create a new campaign
  const handleCreateCampaign = async () => {
    if (!nomeCampanha.trim()) {
      toast.warning('Por favor, informe um nome para a campanha');
      return;
    }

    try {
      setIsLoading(true);

      if (!user?.LOGIN) {
        toast.error('Usuário não autenticado');
        return;
      }

      const novaCampanha = {
        Code: '654321987654',
        Login: user.LOGIN,
        Nome: nomeCampanha,
        Descricao: descricaoCampanha
      };

      // Create a promise to handle the async response
      const createCampaignPromise = new Promise((resolve, reject) => {
        // Set up a one-time listener for the response
        socketService.socket.once('CriarCampanhaResponse', (data) => {
          try {
            const { Code, Sucesso, Mensagem } = JSON.parse(Descriptografar(data));

            if (Code !== '123456789123') {
              reject(new Error("Invalid response code"));
              return;
            }
            
            if (Sucesso) {
              resolve(true);
            } else {
              reject(new Error(Mensagem || 'Erro ao criar campanha'));
            }
          } catch (err) {
            reject(err);
          }
        });

        // Send the request
        socketService.socket.emit('CriarCampanha', Criptografar(JSON.stringify(novaCampanha)));
        
        // Add timeout in case of no response
        setTimeout(() => {
          socketService.socket.off('CriarCampanhaResponse');
          reject(new Error("Timeout creating campaign"));
        }, 15000);
      });

      // Wait for the response
      await createCampaignPromise;
      
      // If successful, call the onSuccess callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // console.error("Error creating campaign:", error);
      toast.error(error.message || "Erro ao criar campanha");
    } finally {
      setIsLoading(false);
    }
  };

  // Close modal on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCreateCampaign();
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
      <div className={styles.modalContainer} onKeyDown={handleKeyDown}>
        <div className={styles.modalHeader}>
          <h2>Nova Campanha</h2>
          <button 
            className={styles.closeButton} 
            onClick={onClose}
            aria-label="Fechar"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label htmlFor="nomeCampanha">Nome da Campanha *</label>
            <input
              type="text"
              id="nomeCampanha"
              className={styles.input}
              value={nomeCampanha}
              onChange={(e) => setNomeCampanha(e.target.value)}
              placeholder="Informe o nome da campanha"
              autoFocus
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="descricaoCampanha">Descrição (opcional)</label>
            <textarea
              id="descricaoCampanha"
              className={styles.textarea}
              value={descricaoCampanha}
              onChange={(e) => setDescricaoCampanha(e.target.value)}
              placeholder="Descreva o objetivo da campanha"
              rows={4}
            />
          </div>
        </div>
        
        <div className={styles.modalFooter}>
          <button 
            className={styles.cancelButton} 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </button>
          
          <button 
            className={styles.createButton} 
            onClick={handleCreateCampaign}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className={styles.spinner}></div>
            ) : (
              <>
                <FiCheck size={16} />
                <span>Criar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaignModal;