import React from "react";
import Anel from '../../assets/anel-SEO.svg'
import Dashboard from '../../assets/dashboard-demonstracao.png'
import Grafico from '../../assets/grafico.svg'
import Retangle from '../../assets/retangle.svg'
import GraficoDois from '../../assets/dashboard.webp'
import styles from './SectionDashboard.module.css'

function SectionDashboard() {
    return (
        <>
            <div className={styles.containerDashboard} id="dashboard">
                <div className={styles.containerTitle} data-aos="fade-right" data-aos-delay="900">
                    <h1 className={styles.title}>Aproveite o poder da IA, tornando a otimização de mecanismos de pesquisa intuitiva e eficaz para todos os níveis de habilidade.</h1>
                </div>
                
                {/* Primeiro bloco */}
                <div className={styles.containerImages}>
                    <div className={styles.containerDescription} data-aos="fade-right" data-aos-delay="200">
                        <img src={Anel} alt="anel SEO" />
                        <h2>Definição de metas de SEO</h2>
                        <p>Ajuda você a definir e alcançar metas de SEO com assistência guiada.</p>
                    </div>
                    <div className={styles.containerDescriptionBack} data-aos="fade-left" data-aos-delay="700">
                        <img src={Dashboard} className={styles.imageDashboard} alt="dashboard demonstração" />
                    </div>
                </div>
                
                {/* Segundo bloco */}
                <div className={styles.containerImages}>
                    <div className={styles.containerDescriptionBack} data-aos="fade-right" data-aos-delay="900">
                        <img src={GraficoDois} className={styles.imageDashboard} alt="retangulo visual" />
                        <img src={Grafico} className={styles.imageDashboard2} alt="grafico visual" />
                    </div>
                    <div className={styles.containerDescription} data-aos="fade-left" data-aos-delay="400">  
                        <img src={Retangle} alt="retangulo visual" />
                        <h2>Gerador de Palavras-chave Inteligente</h2>
                        <p>Sugestões automáticas e as melhores palavras-chave para segmentar.</p>
                    </div>
                </div>
            </div>
        </>
    );
}

export default SectionDashboard;