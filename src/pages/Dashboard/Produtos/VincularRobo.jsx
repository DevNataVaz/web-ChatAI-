import React, { useState, useEffect } from 'react';
import styles from './Produto.module.css';
import { socketService } from '../../../services/socketService'; 
import { Criptografar, Descriptografar } from '../../../Cripto/index';

const VincularRobo = ({ onClose }) => {
  const [produtos, setProdutos] = useState([]);
  const [robots, setRobots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [vinculacoes, setVinculacoes] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    // Carregar produtos e robôs
    Promise.all([loadProdutos(), loadRobots()])
      .then(() => setIsLoading(false))
      .catch(error => {
        // console.error('Erro ao carregar dados:', error);
        setIsLoading(false);
      });
  }, []);
  
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
          
          // Inicializar vinculações existentes (simular)
          const vinculos = {};
          res.mensagem.forEach(produto => {
            // Aqui estamos simulando, mas em um ambiente real,
            // você poderia ter um campo no produto que indica o robô vinculado
            vinculos[produto.ID] = ''; // Inicialmente sem vinculação
          });
          
          setVinculacoes(vinculos);
        } else {
          // console.error('Erro ao carregar produtos:', res.mensagem);
          setProdutos([]);
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
        setRobots([
          { id: '1', nome: 'Robô de Atendimento' },
          { id: '2', nome: 'Robô de Vendas' },
          { id: '3', nome: 'Robô de Suporte' }
        ]);
        resolve();
      }, 500);
    });
  };
  
  const handleVinculacaoChange = (produtoId, robotId) => {
    setVinculacoes({
      ...vinculacoes,
      [produtoId]: robotId
    });
  };
  
  const handleSave = () => {
    setIsSaving(true);
    
    // Aqui você implementaria a lógica para salvar as vinculações no backend
    // Como essa funcionalidade não está nos handlers fornecidos, 
    // vamos simular um tempo de processamento
    
    setTimeout(() => {
      setIsSaving(false);
      alert('Vinculações salvas com sucesso!');
      onClose();
    }, 1500);
  };
  
  // Filtrar produtos por termo de busca
  const filteredProdutos = produtos.filter(produto => 
    produto.NOME_PRODUTO?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.DESCRIPTION?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.CATEGORIA?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className={styles.container}>
      <div className={styles.modalHeader}>
        <h2>
          <i className="fas fa-link mr-2 text-warning"></i>
          Vincular Produtos a Robôs
        </h2>
      </div>
      
      <div className={styles.searchBar}>
        <i className="fas fa-search"></i>
        <input
          type="text"
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <p className={styles.instructions}>
        <i className="fas fa-info-circle mr-2 text-info"></i>
        Selecione um robô para cada produto que deseja vincular.
      </p>
      
      <div className={styles.productList}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Carregando dados...</p>
          </div>
        ) : filteredProdutos.length > 0 ? (
          filteredProdutos.map(produto => (
            <div key={produto.ID} className={styles.productItem}>
              <div className={styles.productInfo}>
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
                
                <div className={styles.productDetails}>
                  <h3>{produto.NOME_PRODUTO}</h3>
                  <p className={styles.category}>{produto.CATEGORIA}</p>
                  <p className={styles.price}>
                    R$ {parseFloat(produto.VALOR).toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>
              
              <div className={styles.robotSelector}>
                <select
                  value={vinculacoes[produto.ID] || ''}
                  onChange={(e) => handleVinculacaoChange(produto.ID, e.target.value)}
                >
                  <option value="">Selecione um robô</option>
                  {robots.map(robot => (
                    <option key={robot.id} value={robot.id}>
                      {robot.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <i className="fas fa-box-open"></i>
            <h2>Nenhum produto encontrado</h2>
            <p>Não há produtos cadastrados para vincular.</p>
          </div>
        )}
      </div>
      
      {filteredProdutos.length > 0 && (
        <div className={styles.actionButtons}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
          >
            <i className="fas fa-times-circle mr-2"></i>
            Cancelar
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Salvando...
              </>
            ) : (
              <>
                <i className="fas fa-link mr-2"></i>
                Salvar Vinculações
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default VincularRobo;