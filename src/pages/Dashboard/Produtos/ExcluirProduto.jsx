import React, { useState, useEffect } from 'react';
import styles from './Produto.module.css';
import { socketService } from '../../../services/socketService'; 
import { Criptografar, Descriptografar } from '../../../Cripto/index';

const ExcluirProduto = ({ onClose }) => {
  const [produtos, setProdutos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    loadProdutos();
  }, []);
  
  const loadProdutos = () => {
    setIsLoading(true);
    
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
      setIsLoading(false);
      
      // Processar resposta
      const res = JSON.parse(Descriptografar(response.Response));
      
      if (res.code) {
        setProdutos(res.mensagem);
      } else {
        // console.error('Erro ao carregar produtos:', res.mensagem);
        setProdutos([]);
      }
    });
  };
  
  const handleDelete = (produto) => {
    if (isDeleting) return;
    
    if (window.confirm(`Tem certeza que deseja excluir o produto "${produto.NOME_PRODUTO}"?`)) {
      setIsDeleting(true);
      
      // Preparar dados para enviar ao backend
      const data = {
        LINK_FOTOS: Criptografar(JSON.stringify(produto.LINK_FOTOS))
      };
      
      // Enviar solicitação de exclusão
      socketService.emit('ExcluirProdutos', data);
      
      // Como não temos um retorno específico para exclusão,
      // vamos assumir sucesso após um tempo
      setTimeout(() => {
        // Atualizar lista local
        setProdutos(produtos.filter(p => p.ID !== produto.ID));
        setIsDeleting(false);
      }, 1000);
    }
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
          <i className="fas fa-trash mr-2 text-danger"></i>
          Excluir Produtos
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
        Toque em um produto para removê-lo da sua lista.
      </p>
      
      <div className={styles.productList}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Carregando produtos...</p>
          </div>
        ) : filteredProdutos.length > 0 ? (
          filteredProdutos.map(produto => (
            <div 
              key={produto.ID} 
              className={styles.productItem}
              onClick={() => handleDelete(produto)}
            >
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
              
              <div className={styles.deleteIcon}>
                <i className="fas fa-trash"></i>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <i className="fas fa-box-open"></i>
            <h2>Nenhum produto encontrado</h2>
            <p>Não há produtos cadastrados para excluir.</p>
          </div>
        )}
      </div>
      
      <div className={styles.modalActions}>
        <button 
          className={styles.closeButton}
          onClick={onClose}
        >
          <i className="fas fa-check-circle mr-2"></i>
          Concluir
        </button>
      </div>
    </div>
  );
};

export default ExcluirProduto;