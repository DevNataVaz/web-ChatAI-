import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socketService } from '../../../services/socketService';
import { Criptografar, Descriptografar } from '../../../Cripto/index';
import styles from './Produto.module.css';

const ProdutosDashboard = () => {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState([]);
  const [robots, setRobots] = useState([]);
  const [vinculacoes, setVinculacoes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [filteredProdutos, setFilteredProdutos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  // Load products and robots on component mount
  useEffect(() => {
    Promise.all([loadProdutos(), loadRobots()])
      .then(() => setIsLoading(false))
      .catch(error => {
        setIsLoading(false);
      });
      
    // Listen for real-time product updates
    socketService.on('ProdutoAtualizado', () => {
      loadProdutos();
    });
    
    return () => {
      socketService.off('ProdutoAtualizado');
    };
  }, []);

  // Update filtered products when products or filters change
  useEffect(() => {
    let filtered = [...produtos];
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(produto => 
        produto.NOME_PRODUTO.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto.CATEGORIA.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (selectedCategory !== 'Todos') {
      filtered = filtered.filter(produto => produto.CATEGORIA === selectedCategory);
    }
    
    setFilteredProdutos(filtered);
  }, [produtos, searchTerm, selectedCategory]);
  
  const loadProdutos = () => {
    return new Promise((resolve) => {
      // Obter informações do usuário logado
      const userLogin = "userLogin"; // Substituir pelo valor real
      const userProtocolo = "userProtocolo"; // Substituir pelo valor real
      
      // Preparar dados para envio
      const data = {
        Code: Criptografar(JSON.stringify('45635465344565344564562546762')),
        Login: Criptografar(JSON.stringify(userLogin)),
        Protocolo: Criptografar(JSON.stringify(userProtocolo))
      };
      
      // Enviar solicitação para receber produtos
      socketService.emit('ReceberProdutos', data);
      
      // Configurar ouvinte para resposta
      socketService.once('ResponseReceberProdutos', (response) => {
        // Processar resposta
        const res = JSON.parse(Descriptografar(response.Response));
        
        if (res.code) {
          setProdutos(res.mensagem);
          setFilteredProdutos(res.mensagem);
        } else {
          setProdutos([]);
          setFilteredProdutos([]);
        }
        
        resolve();
      });
    });
  };
  
  const loadRobots = () => {
    return new Promise((resolve) => {
      // Simulando carregamento de robôs
      // Em uma aplicação real, você buscaria isso do seu backend
      setTimeout(() => {
        const robotsList = [
          { id: '1', nome: 'Robô de Atendimento' },
          { id: '2', nome: 'Robô de Vendas' },
          { id: '3', nome: 'Robô de Suporte' }
        ];
        
        setRobots(robotsList);
        
        // Simular vinculações entre produtos e robôs
        // Em um ambiente real, isso viria do backend
        const mockVinculacoes = {};
        produtos.forEach(produto => {
          // Aleatoriamente atribuir ou não um robô a cada produto (apenas para simulação)
          if (Math.random() > 0.3) {
            const randomRobotIndex = Math.floor(Math.random() * robotsList.length);
            mockVinculacoes[produto.ID] = robotsList[randomRobotIndex].id;
          } else {
            mockVinculacoes[produto.ID] = '';
          }
        });
        
        setVinculacoes(mockVinculacoes);
        resolve();
      }, 500);
    });
  };
  
  // Função para obter o nome do robô a partir do ID
  const getRobotName = (robotId) => {
    if (!robotId) return 'Nenhum';
    const robot = robots.find(r => r.id === robotId);
    return robot ? robot.nome : 'Desconhecido';
  };

  // Função para obter categorias únicas para o filtro
  const getUniqueCategories = () => {
    return ['Todos', ...new Set(produtos.map(p => p.CATEGORIA))];
  };

  // Cálculo de métricas para o dashboard
  const getTotalProductsCount = () => produtos.length;
  const getLinkedProductsCount = () => Object.values(vinculacoes).filter(v => v !== '').length;
  const getCategoriesCount = () => [...new Set(produtos.map(p => p.CATEGORIA))].length;
  const getAveragePrice = () => {
    if (produtos.length === 0) return "0.00";
    const total = produtos.reduce((acc, produto) => acc + parseFloat(produto.VALOR || 0), 0);
    return (total / produtos.length).toFixed(2);
  };

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => navigate(-1)}
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1>Gestão de Produtos</h1>
      </header>
      
      <div className={styles.content}>
        {/* Dashboard Metrics */}
        <div className={styles.metricsContainer}>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(98, 0, 238, 0.1)' }}>
              <i className="fas fa-cube" style={{ color: '#bb86fc' }}></i>
            </div>
            <div className={styles.metricData}>
              <h3>{getTotalProductsCount()}</h3>
              <p>Total de Produtos</p>
            </div>
          </div>
          
          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(3, 218, 198, 0.1)' }}>
              <i className="fas fa-robot" style={{ color: '#03dac6' }}></i>
            </div>
            <div className={styles.metricData}>
              <h3>{getLinkedProductsCount()}</h3>
              <p>Produtos Vinculados</p>
            </div>
          </div>
          
          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(255, 110, 64, 0.1)' }}>
              <i className="fas fa-tags" style={{ color: '#ff6e40' }}></i>
            </div>
            <div className={styles.metricData}>
              <h3>{getCategoriesCount()}</h3>
              <p>Categorias</p>
            </div>
          </div>
          
          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(103, 196, 87, 0.1)' }}>
              <i className="fas fa-dollar-sign" style={{ color: '#67c457' }}></i>
            </div>
            <div className={styles.metricData}>
              <h3>R$ {getAveragePrice().replace('.', ',')}</h3>
              <p>Preço Médio</p>
            </div>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className={styles.actionBar}>
          <div className={styles.searchBar}>
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Buscar produtos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className={styles.filtersContainer}>
            <select 
              className={styles.categorySelect}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {getUniqueCategories().map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Product Cards */}
        <div className={styles.productsContainer}>
          <h2 className={styles.sectionTitle}>
            <i className="fas fa-cubes"></i>
            <span>Catálogo de Produtos</span>
            <span className={styles.productCount}>{filteredProdutos.length} produtos</span>
          </h2>
          
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Carregando produtos...</p>
            </div>
          ) : filteredProdutos.length > 0 ? (
            <div className={styles.productsGrid}>
              {filteredProdutos.map(produto => (
                <div key={produto.ID} className={styles.productCard}>
                  <div className={styles.productHeader}>
                    <span className={styles.category}>{produto.CATEGORIA}</span>
                    <span className={styles.productId}>ID: {produto.ID}</span>
                  </div>
                  
                  <div className={styles.productBody}>
                    <div className={styles.productImage}>
                      {produto.LINK_FOTOS ? (
                        <img 
                          src={`/images/${produto.LINK_FOTOS}`} 
                          alt={produto.NOME_PRODUTO} 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/no-image.jpg';
                          }}
                        />
                      ) : (
                        <div className={styles.noImage}>
                          <i className="fas fa-image"></i>
                        </div>
                      )}
                    </div>
                    
                    <div className={styles.productInfo}>
                      <h3>{produto.NOME_PRODUTO}</h3>
                      
                      <div className={styles.productPrice}>
                        <span>R$ {parseFloat(produto.VALOR).toFixed(2).replace('.', ',')}</span>
                      </div>
                      
                      {produto.DESCRIPTION && (
                        <p className={styles.description}>
                          {produto.DESCRIPTION.length > 120 
                            ? `${produto.DESCRIPTION.substring(0, 120)}...` 
                            : produto.DESCRIPTION}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className={styles.productFooter}>
                    <div className={styles.robotInfo}>
                      <i className="fas fa-robot"></i>
                      <span>{getRobotName(vinculacoes[produto.ID])}</span>
                    </div>
                    
                    <div className={styles.productActions}>
                      <button className={styles.actionButton} aria-label="Detalhes">
                        <i className="fas fa-eye"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <i className="fas fa-box-open"></i>
              <h3>Nenhum produto encontrado</h3>
              <p>Tente ajustar os filtros ou adicione novos produtos ao catálogo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProdutosDashboard;