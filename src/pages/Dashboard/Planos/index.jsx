import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from './planos.module.css';
import Certo from '../../../assets/icons/certo.svg';
import { useApp } from "../../../context/AppContext";


function Planos() {
    const navigate = useNavigate();
    const { user, planos, loadPlans, initializing  } = useApp();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initializing) return;
        if (!user) {
            navigate('/login');
            return;
        }

        // Carregar planos se ainda não estiverem carregados
        if (planos.length === 0 && user.LOGIN) {
            setLoading(true);
            loadPlans(user.LOGIN).finally(() => setLoading(false));
        }
    }, [user, planos, loadPlans, navigate, initializing]);

    const handleEscolherPlano = (planoId) => {
        navigate(`/pagamento/${planoId}`);
    };

    // Planos estáticos como fallback
    const planosEstaticos = [
        {
            id: 2,
            PLANO: "Standard",
            PRECO_MES: "179,90",
            beneficios: [
                "Atendentes Simultâneos: 2",
                "Limite Mensagens: 5000",
                "Produtos ou Serviços Cadastrador: 10",
                "Automação por plataforma: 2"
            ]
        },
        {
            id: 3,
            PLANO: "Pro",
            PRECO_MES: "269,99",
            beneficios: [
                "Atendentes Simultâneos: 5",
                "Limite Mensagens: 12000",
                "Produtos ou Serviços Cadastrador: 10",
                "Automação por plataforma: 2",
                "Sugestões de conteúdo",
                "Otimização de links"
            ],
            destaque: true
        },
        {
            id: 4,
            PLANO: "Plus",
            PRECO_MES: "547,99",
            beneficios: [
                "Atendentes Simultâneos: 10",
                "Limite Mensagens: 28000",
                "Produtos ou Serviços Cadastrador: 20",
                "Automação por plataforma: 4",
                "Sugestões de conteúdo",
                "Otimização de links",
                "Acesso multiusuário",
                "Integração API"
            ]
        },
        {
            id: 5,
            PLANO: "Advanced",
            PRECO_MES: "1099,99",
            beneficios: [
                "Atendentes Simultâneos: 20",
                "Limite Mensagens: 52000",
                "Produtos ou Serviços Cadastrador: 30",
                "Automação por plataforma: 6",
                "Sugestões de conteúdo",
                "Otimização de links",
                "Acesso multiusuário",
                "Integração API",
                "Otimização de palavras-chave",
                "Meta tags automatizadas"
            ]
        }
    ];

    const planosParaExibir = planos.length > 0 ? planos : planosEstaticos;

    return (
        <div className={styles.container} id="planos">
            <div className={styles.containerTitle} data-aos="fade-up">
                <h1>Escolha nosso plano de assinatura</h1>
                <p>Escolha o plano certo para atender às suas necessidades de SEO e comece a otimizar hoje mesmo.</p>
            </div>

            {loading ? (
                <div className={styles.loading}>Carregando planos...</div>
            ) : (
                <div className={styles.containerPlanos}> 
                    {planosParaExibir.map((plano, index) => (
                        <div 
                            key={plano.id || plano.ID}
                            className={`${styles.planos} ${plano.destaque ? styles.destaque : ''}`} 
                            data-aos="zoom-in" 
                            data-aos-delay={300 + index * 100}
                        >
                            <h2>{plano.PLANO}</h2>
                            <p className={styles.preco}>R${plano.PRECO_MES}/mês</p>
                            <div className={styles.divisor}></div>
                            <div className={styles.beneficios}>
                                {plano.beneficios?.map((beneficio, idx) => (
                                    <p key={idx}>
                                        <img src={Certo} alt="" /> {beneficio}
                                    </p>
                                ))}
                            </div>
                            <button 
                                className={styles.comprar}
                                onClick={() => handleEscolherPlano(plano.id || plano.ID)}
                            >
                                ESCOLHER PLANO
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Planos;