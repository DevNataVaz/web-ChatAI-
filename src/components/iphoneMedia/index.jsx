// IphoneShowcase.jsx
import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './IphoneShowcase.module.css';

// Importando imagens (substitua pelos caminhos corretos das suas imagens)
import iphoneBack from '../../assets/Iphone/tras.webp';
import iphoneLeft from '../../assets/Iphone/direita.png';
import iphoneRight from '../../assets/Iphone/esquerda.png';

gsap.registerPlugin(ScrollTrigger);
gsap.registerPlugin(TextPlugin);

const IphoneShowcase = () => {
  const sectionRef = useRef(null);
  const iphoneBackRef = useRef(null);
  const iphoneLeftRef = useRef(null);
  const iphoneRightRef = useRef(null);

  const textRef = useRef(null);
  // const h1Ref = useRef();


  //efeitos para imagem
  useEffect(() => {

    // Efeito de flutuação contínua para os iPhones
    gsap.to(iphoneBackRef.current, {
      y: "-=22",
      duration: 2.2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 0.5
    });

    gsap.to(iphoneLeftRef.current, {
      y: "-=22",
      duration: 2.2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 0.5
    });

    gsap.to(iphoneRightRef.current, {
      y: "-=22",
      duration: 2.2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 0.5
    });


    const words = ["Criativas", "Intuitivas"];
    let wordIndex = 0;

    const animateText = () => {
        gsap.to(textRef.current, {
            duration: 1,
            text: words[wordIndex],
            ease: "none",
            onComplete: () => {
                gsap.to(textRef.current, {
                    delay: 1,
                    duration: 0.5,
                    text: '',
                    onComplete: () => {
                        wordIndex = (wordIndex + 1) % words.length;
                        animateText();
                    }
                });
            }
        });
    };

    animateText();




    return () => {
      // Limpar animações quando o componente desmontar
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      gsap.killTweensOf([
        iphoneBackRef.current,
        iphoneLeftRef.current,
        iphoneRightRef.current
      ]);
    };
  }, []);

  return (
    <section ref={sectionRef} className={styles.showcase}>
      <div className={styles.container}>
        <div className={styles.headerText}  >
          <h1 data-aos="fade-down" data-aos-delay="400">Transforme sua experiência digital</h1>
          <p data-aos="fade-up" data-aos-delay="600">Acesse nosso App de alta performance, com telas<br/> <span className={styles.spanGradient} ref={textRef}></span>  para elevar seu projeto ao próximo nível</p>
        </div>
        <div  className={styles.phonesContainer}>
          {/* iPhone traseiro */}
          <div  ref={iphoneBackRef} className={styles.phoneBack}>
            <img src={iphoneBack} alt="iPhone principal" />
          </div>

          {/* iPhone esquerdo */}
          <div  ref={iphoneLeftRef} className={styles.phoneLeft}>
            <img src={iphoneLeft} alt="iPhone com recursos" />

          </div>

          {/* iPhone direito */}
          <div  ref={iphoneRightRef} className={styles.phoneRight}>
            <img src={iphoneRight} alt="iPhone com performance" />

          </div>
        </div>

      </div>
    </section>
  );
};

export default IphoneShowcase;