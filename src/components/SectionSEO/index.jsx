import React from "react";
import styles from './sectionSEO.module.css';
import Speed from '../../assets/icons/speed.svg';
import List from '../../assets/icons/list.svg';
import Lapis from '../../assets/icons/lapis.svg';
import Grafic from '../../assets/icons/grafic.svg';
import Alvo from '../../assets/icons/alvo.svg';
import Mouse from '../../assets/icons/mouse.svg';
import Star from '../../assets/icons/star.svg';
import Sino from '../../assets/icons/sino.svg';
import Page from '../../assets/icons/page.svg';

const cards = [
  { img: Speed, title: "Painel fácil de usar", desc: "Painel fácil de usar" },
  { img: List, title: "Avaliação de conteúdo", desc: "Correções simples para melhorias imediatas." },
  { img: Lapis, title: "Assistente de Links", desc: "Orienta você na criação e gerenciamento de links." },
  { img: Grafic, title: "Relatórios visuais", desc: "Insights visuais do desempenho do site." },
  { img: Alvo, title: "Metas de SEO", desc: "Defina e alcance metas com assistência." },
  { img: Mouse, title: "Otimização 1 clique", desc: "Auditorias com um clique." },
  { img: Star, title: "Palavras-chave Inteligente", desc: "Sugestões automáticas de palavras-chave." },
  { img: Sino, title: "Alertas automatizados", desc: "Notificações sobre saúde do SEO." },
  { img: Page, title: "Concorrência", desc: "Relatórios de concorrentes." }
];

function SectionSEO() {
  const duplicated = [...cards, ...cards]; // permite loop visual

  return (
    <div className={styles.carouselContainer}>
      
      <div className={styles.containerTitle} data-aos="fade-right" data-aos-delay="900">
        <h1>Eleve seus esforços de <span >SEO</span>.</h1>
        <p>Colaboradores com IA vão além dos simples chatbots. Eles interagem por voz, organizam agendas, resgatam carrinhos esquecidos e oferecem diversas outras funções. Tudo para aumentar o engajamento e impulsionar suas conversões.</p>
      </div>
      <div className={styles.column}>
        {duplicated.map((card, i) => (
          <div className={styles.box} key={`left-${i}`}>
            <div className={styles.boxImage}>
              <img src={card.img} alt={card.title} />
              <h2>{card.title}</h2>
            </div>
            <p>{card.desc}</p>
          </div>
        ))}
      </div>

      <div className={styles.columnReverse}>
        {duplicated.map((card, i) => (
          <div className={styles.box} key={`center-${i}`}>
            <div className={styles.boxImage}>
              <img src={card.img} alt={card.title} />
              <h2>{card.title}</h2>
            </div>
            <p>{card.desc}</p>
          </div>
        ))}
      </div>

      <div className={styles.column}>
        {duplicated.map((card, i) => (
          <div className={styles.box} key={`right-${i}`}>
            <div className={styles.boxImage}>
              <img src={card.img} alt={card.title} />
              <h2>{card.title}</h2>
            </div>
            <p>{card.desc}</p>
          </div>
        ))}
      </div>

     
    </div>
  );
}

export default SectionSEO;
