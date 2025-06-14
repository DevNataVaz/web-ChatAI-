import React from 'react';
import { Star } from 'lucide-react';
import styles from './Feedbacks.module.css';

const Testimonials = () => {
  const testimonialsData = [
    {
      name: "Carlos Silva",
      role: "CEO - Tech Solutions",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      text: "Os Agentes IA revolucionaram nossa operação. Aumentamos as vendas em 300% e reduzimos custos operacionais drasticamente."
    },
   
    {
      name: "Roberto Costa",
      role: "Diretor Comercial - Vendas Inteligentes",
      avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&h=150&fit=crop&crop=face",
      text: "A capacidade dos Agentes IA de aprender e se adaptar é impressionante. Eles se tornaram parte essencial da nossa equipe."
    },
  
    
   
  ];

  return (
    <section className={styles.testimonialsSection}>
      <h2 className={styles.testimonialsTitle}>O que nossos clientes dizem</h2>
      <div className={styles.testimonialsGrid}>
        {testimonialsData.map((testimonial, index) => (
          <div key={index} className={styles.testimonialCard}>
            <div className={styles.testimonialHeader}>
              <img 
                src={testimonial.avatar}
                alt={testimonial.name}
                className={styles.testimonialAvatar}
              />
              <div className={styles.testimonialInfo}>
                <div className={styles.testimonialName}>{testimonial.name}</div>
                <div className={styles.testimonialRole}>{testimonial.role}</div>
              </div>
            </div>
            <div className={styles.testimonialStars}>
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  size={18} 
                  fill="#FFD700" 
                  color="#FFD700"
                />
              ))}
            </div>
            <p className={styles.testimonialText}>{testimonial.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;