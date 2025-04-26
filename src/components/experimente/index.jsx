import React from "react";
import styles from './experimente.module.css'

function Experimente() {
    return (
        <>
            <div className={styles.container} id="feedbacks">
                <h1 data-aos="fade-down" data-aos-delay="700">SEO orientado por IA para todos.</h1>
                <div className={styles.input}>
                    <input type="email" className={styles.email} placeholder="Seu Melhor Email" data-aos="fade-right" data-aos-delay="900"/>
                    <button className={styles.enviar} data-aos="fade-left" data-aos-delay="200">EXPERIMENTE GRÁTIS</button>
                </div>
                <p data-aos="fade-up" data-aos-delay="900">Não é necessário cartão de crédito · 30 Dias de teste grátis</p>
            </div>
        </>
    );
}

export default Experimente;