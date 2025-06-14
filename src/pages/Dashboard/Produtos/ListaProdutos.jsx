import React, { useState, useEffect } from 'react';
import styles from './Produto.module.css';
import { socketService } from '../../../services/socketService'; 
import { Criptografar, Descriptografar } from '../../../Cripto/index';

const ListaProdutos = ({ onClose, onEdit, user, botId }) => {
  const [produtos, setProdutos] = useState([]);
  const [robots, setRobots] = useState([]);
  const [vinculacoes, setVinculacoes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadingRobots, setLoadingRobots] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentCategory, setCurrentCategory] = useState('Todos');
  
  // Categorias para filtro
  const categorias = ['Todos', 'Eletrônicos', 'Smartwatch', 'Vestuário', 'Casa', 'Alimentos', 'Geral'];
  
  useEffect(() => {
    if (user?.LOGIN && botId) {
      Promise.all([loadProdutos(), loadRobots()])
        .then(() => setIsLoading(false))
        .catch(error => {
          // console.error("Erro ao carregar dados:", error);
          setIsLoading(false);
        });
    }
    
    // Configurar ouvinte para atualizações em tempo real
    socketService.on('ProdutoAtualizado', () => {
      loadProdutos();
    });
    
    return () => {
      socketService.off('ProdutoAtualizado');
    };
  }, [user, botId]);
  
  const loadProdutos = () => {
    return new Promise((resolve, reject) => {
      if (!user?.LOGIN || !botId) {
        reject(new Error("Dados de usuário ou bot não disponíveis"));
        return;
      }

      try {
        // Configurar ouvinte para resposta
        socketService.once('ResponseReceberProdutos', (data) => {
          try {
            const result = JSON.parse(Descriptografar(data.Response));
            const code = JSON.parse(Descriptografar(data.Code));
            
            if (code !== '0896546879475861673215673') {
              reject(new Error("Código de resposta inválido"));
              return;
            }

            if (!result?.code || !result?.mensagem) {
              setProdutos([]);
              resolve([]);
              return;
            }

            // Obter lista de produtos da resposta
            const products = result.mensagem || [];
            setProdutos(products);
            resolve(products);
          } catch (err) {
            // console.error("Erro ao processar resposta de produtos:", err);
            reject(err);
          }
        });

        // Enviar solicitação para receber produtos
        socketService.emit('ReceberProdutos', {
          Code: Criptografar(JSON.stringify('45635465344565344564562546762')),
          Login: Criptografar(JSON.stringify(user.LOGIN)),
          Protocolo: Criptografar(JSON.stringify(botId))
        });

        // Timeout de segurança
        setTimeout(() => {
          socketService.off('ResponseReceberProdutos');
          resolve([]);
          // console.log("Timeout ao buscar produtos");
        }, 15000);
      } catch (error) {
        // console.error("Erro ao buscar produtos:", error);
        reject(error);
      }
    });
  };

  const loadRobots = () => {
    return new Promise((resolve, reject) => {
      if (!user?.LOGIN || !botId) {
        reject(new Error("Dados de usuário ou bot não disponíveis"));
        return;
      }

      try {
        setLoadingRobots(true);

        // Configurar ouvinte para resposta de robôs
        socketService.once('ResponseReceberRobots', (data) => {
          try {
            const result = JSON.parse(Descriptografar(data.Response));
            const code = JSON.parse(Descriptografar(data.Code));
            
            if (code !== '0896546879475861673215673') {
              reject(new Error("Código de resposta inválido para robôs"));
              return;
            }

            const robotsList = result?.mensagem || [];
            setRobots(robotsList);
            
            // Carregar vinculações após carregar robôs
            loadVinculacoes().then(() => {
              resolve(robotsList);
            }).catch(reject);
          } catch (err) {
            // console.error("Erro ao processar resposta de robôs:", err);
            reject(err);
          } finally {
            setLoadingRobots(false);
          }
        });

        // Enviar solicitação para receber robôs
        socketService.emit('ReceberRobots', {
          Code: Criptografar(JSON.stringify('45635465344565344564562546762')),
          Login: Criptografar(JSON.stringify(user.LOGIN)),
          Protocolo: Criptografar(JSON.stringify(botId))
        });

        // Timeout de segurança
        setTimeout(() => {
          socketService.off('ResponseReceberRobots');
          setLoadingRobots(false);
          resolve([]);
          // console.log("Timeout ao buscar robôs");
        }, 15000);
      } catch (error) {
        // console.error("Erro ao buscar robôs:", error);
        setLoadingRobots(false);
        reject(error);
      }
    });
  };

  const loadVinculacoes = () => {
    return new Promise((resolve, reject) => {
      try {
        // Configurar ouvinte para resposta de vinculações
        socketService.once('ResponseReceberVinculacoes', (data) => {
          try {
            const result = JSON.parse(Descriptografar(data.Response));
            const code = JSON.parse(Descriptografar(data.Code));
            
            if (code !== '0896546879475861673215673') {
              reject(new Error("Código de resposta inválido para vinculações"));
              return;
            }

            const vinculacoesList = result?.mensagem || [];
            
            // Converter array de vinculações em objeto para fácil acesso
            const vinculacoesObj = {};
            vinculacoesList.forEach(vinculacao => {
              vinculacoesObj[vinculacao.PRODUTO_ID] = vinculacao.ROBOT_ID;
            });
            
            setVinculacoes(vinculacoesObj);
            resolve(vinculacoesObj);
          } catch (err) {
            // console.error("Erro ao processar resposta de vinculações:", err);
            reject(err);
          }
        });

        // Enviar solicitação para receber vinculações
        socketService.emit('ReceberVinculacoes', {
          Code: Criptografar(JSON.stringify('45635465344565344564562546762')),
          Login: Criptografar(JSON.stringify(user.LOGIN)),
          Protocolo: Criptografar(JSON.stringify(botId))
        });

        // Timeout de segurança
        setTimeout(() => {
          socketService.off('ResponseReceberVinculacoes');
          resolve({});
          // console.log("Timeout ao buscar vinculações");
        }, 15000);
      } catch (error) {
        // console.error("Erro ao buscar vinculações:", error);
        reject(error);
      }
    });
  };
  
  const handleEdit = (produto) => {
    onEdit(produto);
  };
  
  const handleDelete = (produto) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${produto.NOME_PRODUTO}"?`)) {
      try {
        // Preparar dados para enviar ao backend - formato correto conforme primeiro código
        const deleteData = Criptografar(JSON.stringify({
          LINK_FOTOS: produto.LINK_FOTOS
        }));
        
        // Configurar ouvinte para resposta
        socketService.once('ResponseExcluirProduto', (data) => {
          try {
            const response = JSON.parse(Descriptografar(data));

            if (!response?.Res) {
              // console.error("Falha ao excluir produto:", response?.Mensagem);
              return;
            }

            // Atualizar lista local
            setProdutos(prev => prev.filter(p => p.ID !== produto.ID));
            
            // Recarregar produtos para garantir sincronização
            loadProdutos();
          } catch (err) {
            // console.error("Erro ao processar resposta de exclusão:", err);
          }
        });
        
        // Enviar solicitação de exclusão
        socketService.emit('ExcluirProduto', deleteData);
        
      } catch (error) {
        // console.error("Erro ao excluir produto:", error);
      }
    }
  };

  // Função para obter o nome do robô a partir do ID
  const getRobotName = (produtoId) => {
    const robotId = vinculacoes[produtoId];
    if (!robotId) return 'Nenhum robô vinculado';
    
    const robot = robots.find(r => r.ID === robotId || r.id === robotId);
    return robot ? (robot.NOME || robot.nome || `Robô ${robotId}`) : 'Robô não encontrado';
  };

  // Obter categorias únicas dos produtos carregados
  const getCategoriasFromProdutos = () => {
    const categoriasUnicas = [...new Set(produtos.map(p => p.CATEGORIA || 'Geral'))];
    return ['Todos', ...categoriasUnicas];
  };
  
  // Filtrar produtos por categoria e termo de busca
  const filteredProdutos = produtos.filter(produto => {
    const matchesCategory = currentCategory === 'Todos' || produto.CATEGORIA === currentCategory;
    const matchesSearch = 
      produto.NOME_PRODUTO?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.DESCRIPTION?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.CATEGORIA?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });
  
  return (
    <div className={styles.container}>
      <div className={styles.modalHeader}>
        <h2>Produtos Cadastrados ({produtos.length})</h2>
        {(isLoading || loadingRobots) && (
          <div className={styles.headerLoading}>
            <div className={styles.miniSpinner}></div>
            <span>Carregando...</span>
          </div>
        )}
      </div>
      
      <div className={styles.searchContainer}>
        <div className={styles.searchBar}>
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className={styles.clearSearchButton}
              onClick={() => setSearchTerm('')}
              title="Limpar busca"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        
        <div className={styles.categoryFilter}>
          {getCategoriasFromProdutos().map(categoria => (
            <button
              key={categoria}
              className={`${styles.categoryButton} ${currentCategory === categoria ? styles.active : ''}`}
              onClick={() => setCurrentCategory(categoria)}
            >
              {categoria}
            </button>
          ))}
        </div>
      </div>
      
      <div className={styles.productsGrid}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Carregando produtos...</p>
          </div>
        ) : filteredProdutos.length > 0 ? (
          filteredProdutos.map(produto => (
            <div key={produto.ID} className={styles.productCard}>
              <div className={styles.productImage}>
                {produto.URI_FOTO || produto.URL_FOTO ? (
                  <img 
                    src={produto.URI_FOTO || produto.URL_FOTO} 
                    alt={produto.NOME_PRODUTO} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/no-image.jpg';
                    }}
                  />
                ) : produto.LINK_FOTOS ? (
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
                <span className={styles.category}>{produto.CATEGORIA || 'Geral'}</span>
                <p className={styles.price}>
                  R$ {typeof produto.VALOR === 'number' 
                    ? produto.VALOR.toFixed(2).replace('.', ',')
                    : parseFloat(produto.VALOR || 0).toFixed(2).replace('.', ',')}
                </p>
                {produto.DESCRIPTION && (
                  <p className={styles.description}>
                    {produto.DESCRIPTION.length > 100 
                      ? `${produto.DESCRIPTION.substring(0, 100)}...`
                      : produto.DESCRIPTION}
                  </p>
                )}
                
                {/* Informação do robô vinculado */}
                <div className={styles.robotInfo}>
                  <i className="fas fa-robot"></i>
                  <span className={styles.robotName}>
                    {loadingRobots ? 'Verificando...' : getRobotName(produto.ID)}
                  </span>
                </div>
              </div>
              
              <div className={styles.productActions}>
                <button 
                  className={styles.editButton}
                  onClick={() => handleEdit(produto)}
                  title="Editar produto"
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button 
                  className={styles.deleteButton}
                  onClick={() => handleDelete(produto)}
                  title="Excluir produto"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <i className="fas fa-box-open"></i>
            <h2>
              {searchTerm || currentCategory !== 'Todos' 
                ? 'Nenhum produto encontrado' 
                : 'Nenhum produto cadastrado'}
            </h2>
            <p>
              {searchTerm || currentCategory !== 'Todos'
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece adicionando produtos ao seu catálogo!'}
            </p>
          </div>
        )}
      </div>
      
      <div className={styles.modalActions}>
        <button 
          className={styles.cancelButton}
          onClick={onClose}
        >
          <i className="fas fa-times-circle mr-2"></i>
          Fechar
        </button>
      </div>
    </div>
  );
};

export default ListaProdutos;