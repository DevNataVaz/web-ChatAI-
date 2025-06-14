// RocketSection.jsx
import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import styles from './RocketSection.module.css';
import Foguete from '../../assets/foguete.png'; 
import { useNavigate } from 'react-router-dom';

const RocketSection = () => {
  const rocketRef = useRef(null);
  const thrustRef = useRef(null);
  const backgroundRef = useRef(null);
  const textRef = useRef(null);
  const particlesRef = useRef([]);

const navigate = useNavigate();

  useEffect(() => {
    // Animação flutuante do foguete
    gsap.to(rocketRef.current, {
      y: -20,
      duration: 2.5,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1
    });

    // Rotação sutil do foguete
    gsap.to(rocketRef.current, {
      rotation: 3,
      duration: 4,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1
    });


    // Animação de entrada do texto
    gsap.fromTo(textRef.current, 
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1.2, ease: "power2.out", delay: 0.3 }
    );

    // Animação das partículas de fundo
    particlesRef.current.forEach((particle, index) => {
      if (particle) {
        gsap.to(particle, {
          y: -30,
          duration: 3 + index,
          ease: "power2.inOut",
          yoyo: true,
          repeat: -1,
          delay: index * 0.5
        });
      }
    });

  }, []);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Foguete Animado */}
        <div className={styles.rocketContainer} ref={rocketRef}>
            <img src={Foguete} alt="Foguete" className={styles.rocket} />
            <div className={styles.thrust} ref={thrustRef}></div>
        </div>

        {/* Conteúdo de texto */}
        <div className={styles.content} ref={textRef}>
          <p className={styles.subtitle}>COMECE AGORA</p>
          <h1 className={styles.title}>
            CRIE SUA <span className={styles.highlight}>CONTA</span><br />
            E GANHE <span className={styles.highlight2}>30 DIAS GRATIS</span> HOJE
          </h1>
          <p className={styles.description}>
           Comece agora a aproveitar todos os recursos da nossa plataforma sem pagar nada por 30 dias. Tenha acesso completo às funcionalidades premium, suporte exclusivo e muito mais para transformar sua experiência desde o primeiro dia.
          </p>
          <button className={styles.ctaButton}  onClick={() => navigate('/registro')}>
            Começar Agora
          </button>
        </div>
      </div>

      {/* Efeitos de fundo animados */}
   
    </section>
  );
};

export default RocketSection;