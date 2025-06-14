import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import styles from './Whatsapp.module.css';

const WhatsAppButton = () => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleWhatsAppClick = () => {
    const phoneNumber = "5561996674298"; 
    const message = "Olá! Gostaria de mais informações sobre os Agentes IA.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <button
      className={styles.whatsappButton}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={handleWhatsAppClick}
      aria-label="Contato via WhatsApp"
    >
      <div className={`${styles.whatsappTooltip} ${showTooltip ? styles.visible : ''}`}>
        Fale com nossa equipe 💬
      </div>
      <MessageCircle className={styles.whatsappIcon} size={28} />
    </button>
  );
};

export default WhatsAppButton;