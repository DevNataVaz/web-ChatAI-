import React, { useState, useEffect } from 'react';
import { FiX, FiAlertTriangle, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Criptografar, Descriptografar } from '../../../../../../Cripto/index';
import styles from './DeleteBot.module.css';

const DeleteBotConfirm = ({
  visible,
  botId,
  botName,
  onClose,
  socketService,
  user,
  onDelete
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      socketService.off('ResponseExcluirRobos');
    };
  }, []);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible) {
      setConfirmText('');
    }
  }, [visible]);

  // Handle delete bot action - CORRIGIDO para seguir padrão mobile exato
  const handleDeleteBot = async () => {
    if (confirmText !== botName) {
      toast.error("O nome inserido não corresponde ao nome do bot.");
      return;
    }

    try {
      setIsLoading(true);

      // Remove listeners anteriores
      socketService.off('ResponseExcluirBot');

      const deleteBotPromise = new Promise((resolve, reject) => {
        socketService.once('ResponseExcluirBot', (data) => {
          try {
            const result = Descriptografar(data.Response);
            const code = Descriptografar(data.Code);

            if (code !== '0896546879475861673215673') {
              reject(new Error("Código de resposta inválido"));
              return;
            }

            if (result.code === true) {
              resolve(true);
            } else {
              reject(new Error(result.mensagem || "Erro ao excluir o bot"));
            }
          } catch (err) {
            reject(err);
          }
        });

        // CORRIGIDO: Código específico para excluir bot baseado no handler
        socketService.emit('ExcluirRobos', {
          Code: Criptografar('5654665454665644'),
          Protocolo: Criptografar(botId),
          // Login: Criptografar(user.LOGIN)
        });

        setTimeout(() => {
          socketService.off('ResponseExcluirBot');
          reject(new Error("Tempo esgotado ao excluir o bot"));
        }, 15000);
      });

      await deleteBotPromise;

      toast.success("Bot excluído com sucesso");

      // Close modal and notify parent component
      onClose();
      if (onDelete) {
        onDelete(botId);
      }
    } catch (error) {
      // console.error("Error deleting bot:", error);
      toast.error(error.message || "Erro ao excluir o bot");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && confirmText === botName) {
      handleDeleteBot();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <div
      className={`${styles.modalBackdrop} ${visible ? styles.visible : ''}`}
      onClick={handleBackdropClick}
    >
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <div className={styles.headerWithIcon}>
            <FiAlertTriangle size={24} className={styles.warningIcon} />
            <h2>Excluir Bot</h2>
          </div>

          <button
            className={styles.closeButton}
            onClick={onClose}
            disabled={isLoading}
          >
            <FiX size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.warningSection}>
            <p>Esta ação <strong>não pode ser desfeita</strong>. Isso excluirá permanentemente o bot <strong>{botName}</strong>, incluindo todos os seus produtos, perguntas e configurações.</p>

            <div className={styles.confirmationBox}>
              <p>Por favor, digite <strong>{botName}</strong> para confirmar:</p>

              <input
                type="text"
                className={styles.confirmInput}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={`Digite "${botName}" para confirmar`}
                disabled={isLoading}
                autoFocus
              />

              {confirmText && confirmText !== botName && (
                <div className={styles.validationMessage}>
                  O nome inserido não corresponde ao nome do bot.
                </div>
              )}
            </div>
          </div>

          <div className={styles.actionButtons}>
            <button
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </button>

            <button
              className={styles.deleteButton}
              onClick={handleDeleteBot}
              disabled={isLoading || confirmText !== botName}
            >
              {isLoading ? (
                <div className={styles.buttonSpinner}></div>
              ) : (
                <>
                  <FiTrash2 size={16} />
                  <span>Excluir Permanentemente</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteBotConfirm;