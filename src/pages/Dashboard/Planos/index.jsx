import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from './planos.module.css';
import Certo from '../../../assets/icons/certo.svg';
import { useApp } from "../../../context/AppContext";
import { Descriptografar } from "../../../Cripto";

function Planos() {
    const navigate = useNavigate();
    const { user, planos, loadPlans, initializing } = useApp();
    const [loading, setLoading] = useState(false);
    const [planoAtual, setPlanoAtual] = useState(null);
    const [assinaturaId, setAssinaturaId] = useState(null);
    const [error, setError] = useState(null);
    const [planosBanco, setPlanosBanco] = useState([]);
    
    // Planos estáticos - sempre exibidos na interface
    const planosEstaticos = [
        {
            ID: 1,
            PLANO: "Started",
            PRECO_MES: "99,90",
            ATENDENTES: 1,
            LIMITE_MENSAGENS: 2000,
            PRODUTOS: 5,
            AUTOMACAO: 1,
            SUGESTAO_CONTEUDO: false,
            OTIMIZACAO_LINKS: false,
            ACESSO_MULTIUSUARIO: false,
            INTEGRACAO_API: false,
            OTIMIZACAO_KEYWORDS: false,
            META_TAGS: false,
            trial: true
        },
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
    
    // Função para obter usuário do localStorage
    const getUserFromLocalStorage = () => {
        try {
            const savedUser = localStorage.getItem('animusia_user');
            if (!savedUser) return null;
            
            const decryptedUser = Descriptografar(savedUser);
            return JSON.parse(decryptedUser);
        } catch (err) {
            return null;
        }
    };
    
    // Função para mapear plano do banco com plano estático
    const mapearPlanoComBanco = (nomePlano) => {
        const planoEstatico = planosEstaticos.find(p => 
            p.PLANO === nomePlano
        );
        return planoEstatico?.ID || null;
    };
    
    // Função para obter ID do plano baseado no nome (do usuário ou banco)
    const obterIdPlanoPorNome = (nomePlano) => {
        if (!nomePlano) return null;
        
        // Primeiro, procura nos planos do banco se disponível
        if (Array.isArray(planosBanco) && planosBanco.length > 0) {
            const planoBanco = planosBanco.find(p => 
                p.PLANO?.toLowerCase() === nomePlano.toLowerCase()
            );
            if (planoBanco?.ID) return planoBanco.ID;
        }
        
        // Se não encontrar no banco, mapeia com plano estático
        return mapearPlanoComBanco(nomePlano);
    };

    useEffect(() => {
        if (initializing) return;
        
        const localUser = user?.LOGIN ? user : getUserFromLocalStorage();
        
        if (localUser?.LOGIN) {
            setLoading(true);
            setError(null);
            
            loadPlans(localUser.LOGIN)
                .then(response => {
                    // Armazena os planos do banco para referência
                    if (Array.isArray(response)) {
                        setPlanosBanco(response);
                    } else if (response?.planos && Array.isArray(response.planos)) {
                        setPlanosBanco(response.planos);
                    }
                    
                    // Define assinatura e plano atual
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

    const handleEscolherPlano = (planoEstatico) => {
        const localUser = user || getUserFromLocalStorage();
        
        if (!localUser) {
            navigate('/login');
            return;
        }
        
        // Obter o ID correto do plano
        let planoIdParaEnviar = planoEstatico.ID;
        
        // Verificar se existe correspondência no banco e usar esse ID se disponível
        if (Array.isArray(planosBanco) && planosBanco.length > 0) {
            const planoBanco = planosBanco.find(p => 
                p.PLANO?.toLowerCase() === planoEstatico.PLANO.toLowerCase()
            );
            if (planoBanco?.ID) {
                planoIdParaEnviar = planoBanco.ID;
            }
        }
        
        // Verificar se já tem esse plano
        const planoAtualId = obterIdPlanoPorNome(user?.PLANO || planoAtual);
        if (planoIdParaEnviar === planoAtualId) {
            alert("Você já possui este plano!");
            return;
        }
        
        // Debug para verificar o ID que está sendo enviado
        console.log('Plano selecionado:', planoEstatico.PLANO);
        console.log('ID para enviar:', planoIdParaEnviar);
        
        // Redirecionar para pagamento
        navigate(`/pagamento/${planoIdParaEnviar}`);
    };

    // Formatação de preço
    const formatarPreco = (preco) => {
        if (typeof preco === 'number') {
            return preco.toFixed(2).replace('.', ',');
        }
        return typeof preco === 'string' ? preco.replace('.', ',') : '0,00';
    };

    // Mapear benefícios com base nas propriedades do plano
    const mapearBeneficios = (plano) => {
        const beneficios = [];
        
        if (plano.ATENDENTES) beneficios.push(`Atendentes Simultâneos: ${plano.ATENDENTES}`);
        if (plano.LIMITE_MENSAGENS) beneficios.push(`Limite Mensagens: ${plano.LIMITE_MENSAGENS}`);
        if (plano.PRODUTOS) beneficios.push(`Produtos ou Serviços Cadastrados: ${plano.PRODUTOS}`);
        if (plano.AUTOMACAO) beneficios.push(`Automação por plataforma: ${plano.AUTOMACAO}`);
        
        // Recursos extras baseados em flags booleanas
        if (plano.SUGESTAO_CONTEUDO) beneficios.push("Sugestões de conteúdo");
        if (plano.OTIMIZACAO_LINKS) beneficios.push("Otimização de links");
        if (plano.ACESSO_MULTIUSUARIO) beneficios.push("Acesso multiusuário");
        if (plano.INTEGRACAO_API) beneficios.push("Integração API");
        if (plano.OTIMIZACAO_KEYWORDS) beneficios.push("Otimização de palavras-chave");
        if (plano.META_TAGS) beneficios.push("Meta tags automatizadas");
        
        return beneficios;
    };
    
    // Verificar se é o plano atual do usuário
    const ehPlanoAtual = (planoEstatico) => {
        if (!user?.PLANO && !planoAtual) return false;
        
        const nomePlanoUsuario = user?.PLANO || planoAtual;
        return planoEstatico.PLANO === nomePlanoUsuario;
    };

    return (
        <div className={styles.container} id="planos">
            <div className={styles.containerTitle}>
                <h1>Escolha nosso plano de assinatura</h1>
                <p>Escolha o plano certo para atender às suas necessidades de SEO e comece a otimizar hoje mesmo.</p>
            </div>

            {loading ? (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Carregando planos...</p>
                </div>
            ) : error ? (
                <div className={styles.error}>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()} className={styles.retryBtn}>
                        Tentar novamente
                    </button>
                </div>
            ) : (
                <div className={styles.containerPlanos}> 
                    {planosEstaticos.map((plano, index) => {
                        const isPlanoAtual = ehPlanoAtual(plano);
                        const beneficios = mapearBeneficios(plano);
                        const ehPlanoStarted = plano.PLANO === "Started" || plano.trial;
                        
                        return (
                            <div 
                                key={plano.ID}
                                className={`${styles.planos} 
                                           ${plano.destaque ? styles.destaque : ''} 
                                           ${isPlanoAtual ? styles.planoAtual : ''}
                                           ${ehPlanoStarted ? styles.planoStarted : ''}`}
                            >
                                {isPlanoAtual && (
                                    <div className={styles.planoAtualContainer}>
                                        <div className={styles.planoAtualLabel}>
                                            <span>Seu plano atual</span>
                                        </div>
                                        <div className={styles.checkmark}></div>
                                    </div>
                                )}
                                
                                {ehPlanoStarted && (
                                    <div className={styles.trialRibbon}>
                                        <span>30 dias grátis</span>
                                    </div>
                                )}
                                
                                <div className={styles.planoHeader}>
                                    <h2>{plano.PLANO}</h2>
                                    <p className={styles.preco}>
                                        <span className={styles.moeda}>R$</span>
                                        <span className={styles.valor}>{formatarPreco(plano.PRECO_MES)}</span>
                                        <span className={styles.periodo}>/mês</span>
                                    </p>
                                </div>
                                
                                <div className={styles.divisor}></div>
                                
                                <div className={styles.beneficios}>
                                    {beneficios.map((beneficio, idx) => (
                                        <p key={idx} className={styles.beneficioItem}>
                                            <span className={styles.checkIcon}>
                                                <img src={Certo} alt="" />
                                            </span>
                                            <span>{beneficio}</span>
                                        </p>
                                    ))}
                                </div>
                                
                                <button 
                                    className={`${styles.comprar} 
                                              ${isPlanoAtual ? styles.desabilitado : ''}`}
                                    onClick={() => handleEscolherPlano(plano)}
                                    disabled={isPlanoAtual}
                                >
                                    {isPlanoAtual ? 'SEU PLANO ATUAL' : 'ESCOLHER PLANO'}
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