import React from "react";
import ChatSimulation from "../chatSimulação";
import styles from './header.module.css'
import Apk from '../../assets/App.svg'
import ImageApp from '../../assets/App.png'


function Header() {
    return (
        <>
            <div className={styles.container} id="header">
                <div className={styles.title}>
                    <h1 data-aos="fade-down">ATENDIMENTO IA</h1>
                    <p data-aos="fade-up" data-aos-delay="2000">Eleve a visibilidade do seu site sem esforço com a IA, onde a tecnologia inteligente atende às ferramentas de SEO fáceis de usar.</p>
                </div>
                <div className={styles.headerContainer} >
                    <div className={styles.phoneWrapper} data-aos="fade-right" data-aos-delay="500" >
                        <img className={styles.imageCelular} src={ImageApp} alt="imagem celular"  />
                    </div>
                    <div className={styles.phoneWrapper} data-aos="fade-left" data-aos-delay="900"></div>

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