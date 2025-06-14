import React from "react";
import ChatSimulation from "../chatSimulation";
import styles from './header.module.css'
import Apk from '../../assets/App.svg'
import ImageApp from '../../assets/App.png'

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';


gsap.registerPlugin(TextPlugin);


function Header() {
    const textRef = useRef(null);
    const h1Ref = useRef();
 
    useEffect(() => {
        gsap.fromTo(h1Ref.current, 
            { opacity: 0, y: -50 }, 
            { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" }
          );

        const words = ["gerando tráfego", "captando clientes", "alavancando resultados", "automatizar", "otimizar", "transformar"];
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
    }, []);

    return (
        <>
            <div className={styles.container} id="header">
                <div className={styles.title}>
                    <h1 className={styles.mainTitle}>
                        <span ref={h1Ref}>Animus Chat<span className={styles.highlight2}>Pro.</span></span>
                    </h1>
                    <p className={styles.description}>
                        <span className={styles.firstLine}>
                            Eleve o SEO do seu projeto sem esforço com IA,
                        </span>
                        
                        <span className={styles.secondLine}>
                            <span className={styles.spanGradient} ref={textRef}></span> de forma inteligente.
                        </span>
                    </p>
                </div>

                <div className={styles.headerContainer} >
                    <div className={styles.phoneWrapper} data-aos="fade-right" data-aos-delay="500" >
                        <img className={styles.imageCelular} src={ImageApp} alt="imagem celular" />
                    </div>
                    <div ></div>

                    <div className={styles.chatSimulation} data-aos="zoom-in" data-aos-delay="1200">
                        <ChatSimulation />
                    </div>
                </div> 
                <div className={styles.containerButton}>
                    <button className={styles.btnFree}>EXPERIMENTE GRÁTIS</button>
                </div>
            </div>
        </>
    );
}



export default Header;