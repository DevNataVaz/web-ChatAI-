import React from "react";
import styles from './sectionSEO.module.css'
import Speed from '../../assets/icons/speed.svg'
import List from '../../assets/icons/list.svg'
import Lapis from '../../assets/icons/lapis.svg'
import Grafic from '../../assets/icons/grafic.svg'
import Alvo from '../../assets/icons/alvo.svg'
import Mouse from '../../assets/icons/mouse.svg'
import Star from '../../assets/icons/star.svg'
import Sino from '../../assets/icons/sino.svg'
import Page from '../../assets/icons/page.svg'

function SectionSEO() {
    return (
        <>
        <div className={styles.containerGeral}>
            <div className={styles.containerTitle} data-aos="fade-right" data-aos-delay="900">
                <h1>Eleve seus esforços de SEO.</h1>
            </div>
            <div className={styles.container}>
                <div className={styles.box} data-aos="fade-right" data-aos-delay="300">
                    <div className={styles.boxImage} >
                        <img src={Speed} alt="speed" />
                        <h2>Painel fácil de usar</h2>
                    </div>
                    <p>Painel fácil de usar</p>
                </div>
                <div className={styles.box} data-aos="fade-down" data-aos-delay="900">
                    <div className={styles.boxImage}>
                        <img src={List} alt="lista" />
                        <h2>Avaliação de conteúdo</h2>
                    </div>
                    <p>Correções simples para melhorias imediatas.</p>
                </div>
                <div className={styles.box} data-aos="fade-left" data-aos-delay="300">
                    <div className={styles.boxImage}>
                        <img src={Lapis} alt="lapis" />
                        <h2>Assistente de Otimização de Link</h2>
                    </div>
                    <p>Orienta você através do processo de criação e gerenciamento de links.</p>
                </div>
                <div className={styles.box} data-aos="fade-right" data-aos-delay="600">
                    <div className={styles.boxImage}>
                        <img src={Grafic} alt="grafico" />
                        <h2>Relatórios visuais</h2>
                    </div>
                    <p>Insights visuais sobre o desempenho do seu site.</p>
                </div>
                <div className={styles.box} data-aos="flip-right" data-aos-delay="200">
                    <div className={styles.boxImage}>
                        <img src={Alvo} alt="alvo" />
                        <h2>Definição de metas de SEO</h2>
                    </div>
                    <p>Ajuda você a definir e alcançar metas de SEO com assistência guiada.</p>
                </div>
                <div className={styles.box} data-aos="fade-left" data-aos-delay="600">
                    <div className={styles.boxImage}>
                        <img src={Mouse} alt="mouse" />
                        <h2>Otimização com um clique</h2>
                    </div>
                    <p>Realize auditorias e otimizações complexas de SEO com um único clique.</p>
                </div>
                <div className={styles.box} data-aos="fade-right" data-aos-delay="900">
                    <div className={styles.boxImage}>
                        <img src={Star} alt="estrela" />
                        <h2>Gerador de Palavras-chave Inteligente</h2>
                    </div>
                    <p>Sugestões automáticas e as melhores palavras-chave para segmentar.</p>
                </div>
                <div className={styles.box} data-aos="fade-up" data-aos-delay="700">
                    <div className={styles.boxImage}>
                        <img src={Sino} alt="sino" />
                        <h2>Alertas automatizados</h2>
                    </div>
                    <p>Notificações automáticas sobre sua saúde de SEO, incluindo correções rápidas.</p>
                </div>
                <div className={styles.box} data-aos="fade-left" data-aos-delay="900">
                    <div className={styles.boxImage}>
                        <img src={Page} alt="pagina" />
                        <h2>Relatórios de concorrentes</h2>
                    </div>
                    <p>Fornece informações sobre as estratégias e classificação de palavras-chave competidores.</p>
                </div>
            </div>
            </div>
        </>
    );
}

export default SectionSEO;