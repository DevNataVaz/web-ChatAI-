import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from './planos.module.css';
import Certo from '../../../assets/icons/certo.svg';
import { useApp } from "../../../context/AppContext";
import { Descriptografar } from "../../../Cripto"; // Ensure this path is correct

function Planos() {
    const navigate = useNavigate();
    const { user, planos, loadPlans, initializing } = useApp();
    const [loading, setLoading] = useState(false);
    const [planoAtual, setPlanoAtual] = useState(null);
    const [assinaturaId, setAssinaturaId] = useState(null);
    const [error, setError] = useState(null);
    
    // Função para obter usuário do localStorage
    const getUserFromLocalStorage = () => {
        try {
            const savedUser = localStorage.getItem('animusia_user');
            if (!savedUser) return null;
            
            const decryptedUser = Descriptografar(savedUser);
            return JSON.parse(decryptedUser);
        } catch (err) {
            console.error("Erro ao recuperar usuário do localStorage:", err);
            return null;
        }
    };

    useEffect(() => {
        if (initializing) return;
        
        // Tenta obter usuário do localStorage se não estiver no contexto
        const localUser = user?.LOGIN ? user : getUserFromLocalStorage();
        
        // Carregar planos se tiver usuário (do contexto ou localStorage)
        if (localUser?.LOGIN) {
            setLoading(true);
            setError(null);
            
            loadPlans(localUser.LOGIN)
                .then(response => {
                    if (response?.Id_Assinatura) {
                        setAssinaturaId(response.Id_Assinatura);
                    }
                    if (response?.Plano_atual) {
                        setPlanoAtual(response.Plano_atual);
                    }
                })
                .catch(error => {
                    console.error("Erro ao carregar planos:", error);
                    setError("Não foi possível carregar os planos. Por favor, tente novamente mais tarde.");
                })
                .finally(() => setLoading(false));
        }
    }, [user, loadPlans, initializing]);

    const handleEscolherPlano = (planoId) => {
        // Verificar se usuário está autenticado (contexto ou localStorage)
        const localUser = user || getUserFromLocalStorage();
        
        if (!localUser) {
            // Redirecionar para login se não houver usuário
            navigate('/login');
            return;
        }
        
        // Verificar se já tem esse plano
        if (planoId === planoAtual) {
            alert("Você já possui este plano!");
            return;
        }
        
        // Redirecionar para pagamento se estiver logado
        navigate(`/pagamento/${planoId}/${assinaturaId || ''}`);
    };

    // Formatação de preço
    const formatarPreco = (preco) => {
        if (typeof preco === 'number') {
            return preco.toFixed(2).replace('.', ',');
        }
        // Se já for string, garantir formato correto
        return typeof preco === 'string' ? preco.replace('.', ',') : '0,00';
    };

    // Mapear benefícios com base nas propriedades do plano
    const mapearBeneficios = (plano) => {
        const beneficios = [];
        
        if (plano.ATENDENTES) beneficios.push(`Atendentes Simultâneos: ${plano.ATENDENTES}`);
        if (plano.LIMITE_MENSAGENS) beneficios.push(`Limite Mensagens: ${plano.LIMITE_MENSAGENS}`);
        if (plano.PRODUTOS) beneficios.push(`Produtos ou Serviços Cadastrados: ${plano.PRODUTOS}`);
        if (plano.AUTOMACAO) beneficios.push(`Automação por plataforma: ${plano.AUTOMACAO}`);
        
        // Adicionar recursos extras baseados em flags booleanas
        if (plano.SUGESTAO_CONTEUDO) beneficios.push("Sugestões de conteúdo");
        if (plano.OTIMIZACAO_LINKS) beneficios.push("Otimização de links");
        if (plano.ACESSO_MULTIUSUARIO) beneficios.push("Acesso multiusuário");
        if (plano.INTEGRACAO_API) beneficios.push("Integração API");
        if (plano.OTIMIZACAO_KEYWORDS) beneficios.push("Otimização de palavras-chave");
        if (plano.META_TAGS) beneficios.push("Meta tags automatizadas");
        
        return beneficios;
    };

    // Planos estáticos como fallback
    const planosEstaticos = [
        {
            ID: 2,
            PLANO: "Standard",
            PRECO_MES: "179,90",
            ATENDENTES: 2,
            LIMITE_MENSAGENS: 5000,
            PRODUTOS: 10,
            AUTOMACAO: 2,
            SUGESTAO_CONTEUDO: false,
            OTIMIZACAO_LINKS: false,
            ACESSO_MULTIUSUARIO: false,
            INTEGRACAO_API: false,
            OTIMIZACAO_KEYWORDS: false,
            META_TAGS: false
        },
        {
            ID: 3,
            PLANO: "Pro",
            PRECO_MES: "269,99",
            ATENDENTES: 5,
            LIMITE_MENSAGENS: 12000,
            PRODUTOS: 10,
            AUTOMACAO: 2,
            SUGESTAO_CONTEUDO: true,
            OTIMIZACAO_LINKS: true,
            ACESSO_MULTIUSUARIO: false,
            INTEGRACAO_API: false,
            OTIMIZACAO_KEYWORDS: false,
            META_TAGS: false,
            destaque: true
        },
        {
            ID: 4,
            PLANO: "Plus",
            PRECO_MES: "547,99",
            ATENDENTES: 10,
            LIMITE_MENSAGENS: 28000,
            PRODUTOS: 20,
            AUTOMACAO: 4,
            SUGESTAO_CONTEUDO: true,
            OTIMIZACAO_LINKS: true,
            ACESSO_MULTIUSUARIO: true,
            INTEGRACAO_API: true,
            OTIMIZACAO_KEYWORDS: false,
            META_TAGS: false
        },
        {
            ID: 5,
            PLANO: "Advanced",
            PRECO_MES: "1099,99",
            ATENDENTES: 20,
            LIMITE_MENSAGENS: 52000,
            PRODUTOS: 30,
            AUTOMACAO: 6,
            SUGESTAO_CONTEUDO: true,
            OTIMIZACAO_LINKS: true,
            ACESSO_MULTIUSUARIO: true,
            INTEGRACAO_API: true,
            OTIMIZACAO_KEYWORDS: true,
            META_TAGS: true
        }
    ];

    // Verificação defensiva para garantir que planos seja tratado como array
    const planosParaExibir = Array.isArray(planos) && planos.length > 0 ? planos : planosEstaticos;

    return (
        <div className={styles.container} id="planos">
            <div className={styles.containerTitle} >
                <h1>Escolha nosso plano de assinatura</h1>
                <p>Escolha o plano certo para atender às suas necessidades de SEO e comece a otimizar hoje mesmo.</p>
            </div>

            {loading ? (
                <div className={styles.loading}>Carregando planos...</div>
            ) : error ? (
                <div className={styles.error}>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>Tentar novamente</button>
                </div>
            ) : (
                <div className={styles.containerPlanos}> 
                    {planosParaExibir.map((plano, index) => {
                        // Determinar se é o plano atual do usuário
                        const ehPlanoAtual = planoAtual && (plano.ID == planoAtual);
                        // Gerar benefícios dinamicamente com base nas propriedades do plano
                        const beneficios = plano.beneficios || mapearBeneficios(plano);
                        
                        return (
                            <div 
                                key={plano.ID}
                                className={`${styles.planos} ${plano.destaque ? styles.destaque : ''} ${ehPlanoAtual ? styles.planoAtual : ''}`} 
                                
                            >
                                {ehPlanoAtual && <div className={styles.planoAtualLabel}>Seu plano atual</div>}
                                <h2>{plano.PLANO}</h2>
                                <p className={styles.preco}>R${formatarPreco(plano.PRECO_MES)}/mês</p>
                                <div className={styles.divisor}></div>
                                <div className={styles.beneficios}>
                                    {beneficios.map((beneficio, idx) => (
                                        <p key={idx}>
                                            <img src={Certo} alt="" /> {beneficio}
                                        </p>
                                    ))}
                                </div>
                                <button 
                                    className={`${styles.comprar} ${ehPlanoAtual ? styles.desabilitado : ''}`}
                                    onClick={() => handleEscolherPlano(plano.ID)}
                                    disabled={ehPlanoAtual}
                                >
                                    {ehPlanoAtual ? 'SEU PLANO ATUAL' : 'ESCOLHER PLANO'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default Planos;