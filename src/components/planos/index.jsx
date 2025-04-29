import React from "react";
import styles from './planos.module.css'
import Certo from '../../assets/icons/certo.svg'

function Planos() {
    return (
        <>
            <div className={styles.container} id="planos">
                <div className={styles.containerTitle} data-aos="fade-up">
                    <h1>Escolha nosso plano de assinatura</h1>
                    <p>Escolha o plano certo para atender às suas necessidades de SEO e comece a otimizar hoje mesmo.</p>
                </div>

                <div className={styles.containerPlanos}> 
                    {/* Plano 1 */}
                    <div className={styles.planos} data-aos="zoom-in" data-aos-delay="300">
                        <h2>Standard</h2>
                        <p className={styles.preco}>R$179,90/mês</p>
                        <div className={styles.divisor}></div>
                        <div className={styles.beneficios}>
                            <p><img src={Certo} alt="" /> Atendentes Simultâneos: 2</p>
                            <p><img src={Certo} alt="" /> Limite Mensagens: 5000</p>
                            <p><img src={Certo} alt="" /> Produtos ou Serviços Cadastrador: 10</p>
                            <p><img src={Certo} alt="" /> Automação por plataforma: 2</p>
                        </div>
                        <button className={styles.comprar}>EXPERIMENTE GRÁTIS</button>
                    </div>

                    {/* Plano 2 - DESTAQUE */}
                    <div className={`${styles.planos} ${styles.destaque}` } data-aos="zoom-in" data-aos-delay="400">

                        <h2>Pro</h2>
                        <p className={styles.preco}>R$269,99/mês</p>
                        <div className={styles.divisor}></div>
                        <div className={styles.beneficios}>
                            <p><img src={Certo} alt="" /> Atendentes Simultâneos: 5</p>
                            <p><img src={Certo} alt="" /> Limite Mensagens: 12000</p>
                            <p><img src={Certo} alt="" /> Produtos ou Serviços Cadastrador: 10</p>
                            <p><img src={Certo} alt="" /> Automação por plataforma: 2</p>
                            <p><img src={Certo} alt="" /> Sugestões de conteúdo</p>
                            <p><img src={Certo} alt="" /> Otimização de links</p>
                        </div>
                        <button className={styles.comprar}>EXPERIMENTE GRÁTIS</button>
                    </div>

                    {/* Plano 3 */}
                    <div className={styles.planos} data-aos="zoom-in" data-aos-delay="500">
                        <h2>Plus</h2>
                        <p className={styles.preco}>$547,99/mês</p>
                        <div className={styles.divisor}></div>
                        <div className={styles.beneficios}>
                            <p><img src={Certo} alt="" /> Atendentes Simultâneos: 10</p>
                            <p><img src={Certo} alt="" /> Limite Mensagens: 28000</p>
                            <p><img src={Certo} alt="" /> Produtos ou Serviços Cadastrador: 20</p>
                            <p><img src={Certo} alt="" /> Automação por plataforma: 4</p>
                            <p><img src={Certo} alt="" /> Sugestões de conteúdo</p>
                            <p><img src={Certo} alt="" /> Otimização de links</p>
                            <p><img src={Certo} alt="" /> Acesso multiusuário</p>
                            <p><img src={Certo} alt="" /> Integração API</p>
                        </div>
                        <button className={styles.comprar}>EXPERIMENTE GRÁTIS</button>
                    </div>
                    {/* Plano 4 */}
                    <div className={styles.planos} data-aos="zoom-in" data-aos-delay="600">
                        <h2>Advanced</h2>
                        <p className={styles.preco}>$1099,99/mês</p>
                        <div className={styles.divisor}></div>
                        <div className={styles.beneficios}>
                            <p><img src={Certo} alt="" /> Atendentes Simultâneos: 20</p>
                            <p><img src={Certo} alt="" /> Limite Mensagens: 52000</p>
                            <p><img src={Certo} alt="" /> Produtos ou Serviços Cadastrador: 30</p>
                            <p><img src={Certo} alt="" /> Automação por plataforma: 6</p>
                            <p><img src={Certo} alt="" /> Sugestões de conteúdo</p>
                            <p><img src={Certo} alt="" /> Otimização de links</p>
                            <p><img src={Certo} alt="" /> Acesso multiusuário</p>
                            <p><img src={Certo} alt="" /> Integração API</p>
                            <p><img src={Certo} alt="" /> Otimização de palavras-chave</p>
                            <p><img src={Certo} alt="" /> Meta tags automatizadas</p>
                        </div>
                        <button className={styles.comprar}>EXPERIMENTE GRÁTIS</button>
                    </div>
                </div>
                
            </div>

        </>

    );
}

export default Planos;