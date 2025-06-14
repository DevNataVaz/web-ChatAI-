import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './Duvidas.module.css';

const FAQ = () => {
  const [openFAQ, setOpenFAQ] = useState(null);

  const faqData = [
    {
      question: "Posso substituir totalmente minha equipe de vendas e atendimento por Agentes IA?",
      answer: "Sim, nossos Agentes IA podem automatizar completamente o processo de vendas e atendimento, trabalhando 24/7 com alta conversão e sem custos de pessoal."
    },
    {
      question: "Como os Agentes IA lidam com perguntas complexas ou específicas?",
      answer: "Nossos Agentes IA são treinados com uma vasta base de conhecimento e podem aprender continuamente, permitindo que respondam a perguntas complexas e específicas de forma eficaz."
    },
    {
      question: "É possível integrar os Agentes IA com meu CRM ou outras ferramentas?",
      answer: "Sim, oferecemos integrações com os principais CRMs e ferramentas de marketing, facilitando a gestão e análise dos dados coletados pelos Agentes IA."
    },
    {
      question: "Quais são os benefícios de usar Agentes IA em vez de humanos?",
      answer: "Os Agentes IA oferecem disponibilidade 24/7, redução de custos operacionais, aumento da eficiência e capacidade de lidar com grandes volumes de interações sem perda de qualidade."
    },
    {
      question: "Como posso começar a usar os Agentes IA no meu negócio?",
      answer: "Você pode entrar em contato conosco para uma demonstração gratuita e discutir como nossos Agentes IA podem ser personalizados para atender às necessidades do seu negócio."
    }
   
  ];

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <section className={styles.faqSection}>
      <h2 className={styles.faqTitle}>Dúvidas Frequentes</h2>
      {faqData.map((faq, index) => (
        <div key={index} className={styles.faqItem}>
          <div 
            className={styles.faqQuestion}
            onClick={() => toggleFAQ(index)}
          >
            <span>{faq.question}</span>
            <ChevronDown 
              className={`${styles.faqIcon} ${openFAQ === index ? styles.rotated : ''}`}
              size={24}
            />
          </div>
          <div className={`${styles.faqAnswer} ${openFAQ === index ? styles.open : ''}`}>
            <p className={styles.faqAnswerText}>{faq.answer}</p>
          </div>
        </div>
      ))}
    </section>
  );
};

export default FAQ;