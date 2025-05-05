import React, { useState, useEffect } from 'react';
import { useApp } from '../auth';

export default function ProductsPanel({ user, socket }) {
  const { Criptografar, Descriptografar } = useApp();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    NOME_PRODUTO: '',
    CATEGORIA: '',
    VALOR: '',
    DESCRIPTION: '',
    image: null,
    DURATION: ''
  });
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      fetchProducts();
    }
  }, [selectedAgent]);

  useEffect(() => {
    if (socket) {
      socket.on('ResponseReceberProdutos', handleProductsResponse);
      socket.on('RespostaDaCriação', handleCreationResponse);
      socket.on('ResponseEditarProduto', handleEditResponse);
      socket.on('MeusRobosResponse', handleAgentsResponse);
    }

    return () => {
      if (socket) {
        socket.removeAllListeners();
      }
    };
  }, [socket]);

  const fetchAgents = () => {
    const data = Criptografar(JSON.stringify({
      Code: '234645423654423465',
      Login: user.LOGIN
    }));
    socket.emit('meusRobos', data);
  };

  const fetchProducts = () => {
    if (!selectedAgent) return;

    setLoading(true);
    const data = Criptografar(JSON.stringify({
      Code: '45635465344565344564562546762',
      Protocolo: selectedAgent.PROTOCOLO,
      Login: user.LOGIN
    }));
    socket.emit('receberProdutos', data);
  };

  const handleAgentsResponse = (data) => {
    const result = JSON.parse(Descriptografar(data));
    setAgents(result.Dados);
  };

  const handleProductsResponse = (data) => {
    const result = JSON.parse(Descriptografar(data.Response));
    if (result.code) {
      setProducts(result.mensagem);
    }
    setLoading(false);
  };

  const handleCreationResponse = (data) => {
    const result = JSON.parse(Descriptografar(data.Res));
    if (result) {
      setShowAddModal(false);
      fetchProducts();
      resetForm();
    }
  };

  const handleEditResponse = (data) => {
    const result = JSON.parse(Descriptografar(data.Response));
    if (result.code) {
      setEditingProduct(null);
      fetchProducts();
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      NOME_PRODUTO: '',
      CATEGORIA: '',
      VALOR: '',
      DESCRIPTION: '',
      image: null,
      DURATION: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image: reader.result,
          nomeFoto: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!selectedAgent) {
      alert('Selecione um agente primeiro');
      return;
    }

    const produtoData = {
      Produto: formData.NOME_PRODUTO,
      Categoria: formData.CATEGORIA,
      Preco: formData.VALOR,
      Descricao: formData.DESCRIPTION,
      Base64: formData.image,
      nomeFoto: formData.nomeFoto || `produto-${Date.now()}`,
      Duration: formData.DURATION
    };

    if (editingProduct) {
      // Edit product
      const editData = Criptografar(JSON.stringify({
        Code: '31223123243146556474679894798',
        Nome: formData.NOME_PRODUTO,
        Categoria: formData.CATEGORIA,
        Valor: formData.VALOR,
        base64: formData.image || null,
        Protocolo: selectedAgent.PROTOCOLO,
        Login: user.LOGIN,
        ID: editingProduct.ID,
        Link: formData.nomeFoto + '.jpg',
        Descricao: formData.DESCRIPTION
      }));
      socket.emit('editarProduto', editData);
    } else {
      // Create product
      const createData = Criptografar(JSON.stringify({
        Code: '45489644589644',
        Produtos: JSON.stringify(produtoData),
        Login: user.LOGIN,
        Protocolo: selectedAgent.PROTOCOLO
      }));
      socket.emit('criarProdutos', createData);
    }
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      NOME_PRODUTO: product.NOME_PRODUTO,
      CATEGORIA: product.CATEGORIA,
      VALOR: product.VALOR,
      DESCRIPTION: product.DESCRIPTION,
      image: null,
      DURATION: product.DURATION || ''
    });
    setShowAddModal(true);
  };

  const deleteProduct = (product) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      const data = Criptografar(JSON.stringify({
        LINK_FOTOS: product.LINK_FOTOS
      }));
      socket.emit('excluirProdutos', data);
      setTimeout(() => fetchProducts(), 500);
    }
  };

  return (
    <div className="products-panel">
      <div className="products-header">
        <h2>Gerenciamento de Produtos</h2>
        <div className="header-actions">
          <select 
            className="agent-select" 
            onChange={(e) => {
              const agent = agents.find(a => a.PROTOCOLO === e.target.value);
              setSelectedAgent(agent);
            }}
            value={selectedAgent?.PROTOCOLO || ''}
          >
            <option value="">Selecione um agente</option>
            {agents.map(agent => (
              <option key={agent.PROTOCOLO} value={agent.PROTOCOLO}>
                {agent.DADOS[0]?.EMPRESA} ({agent.PROTOCOLO})
              </option>
            ))}
          </select>
          <button 
            className="add-product-btn" 
            onClick={() => {
              resetForm();
              setEditingProduct(null);
              setShowAddModal(true);
            }}
            disabled={!selectedAgent}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Adicionar Produto
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando produtos...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          {!selectedAgent ? (
            <>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="#8A8D9F" strokeWidth="2"/>
                <line x1="9" y1="9" x2="15" y2="9" stroke="#8A8D9F" strokeWidth="2" strokeLinecap="round"/>
                <line x1="9" y1="15" x2="15" y2="15" stroke="#8A8D9F" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <h3>Selecione um agente</h3>
              <p>Para gerenciar produtos, primeiro selecione um agente acima.</p>
            </>
          ) : (
            <>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="3" width="20" height="14" rx="2" stroke="#8A8D9F" strokeWidth="2"/>
                <line x1="6" y1="6" x2="12" y2="6" stroke="#8A8D9F" strokeWidth="2" strokeLinecap="round"/>
                <line x1="6" y1="10" x2="18" y2="10" stroke="#8A8D9F" strokeWidth="2" strokeLinecap="round"/>
                <line x1="6" y1="14" x2="18" y2="14" stroke="#8A8D9F" strokeWidth="2" strokeLinecap="round"/>
                <line x1="8" y1="20" x2="16" y2="20" stroke="#8A8D9F" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <h3>Nenhum produto encontrado</h3>
              <p>Este agente ainda não possui produtos cadastrados.</p>
              <button className="add-product-btn" onClick={() => setShowAddModal(true)}>
                Adicionar Primeiro Produto
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="products-grid">
          {products.map(product => (
            <div key={product.ID} className="product-card">
              <div className="product-image">
                {product.BASE64 ? (
                  <img src={`https://your-domain.com/${product.LINK_FOTOS}`} alt={product.NOME_PRODUTO} />
                ) : (
                  <div className="placeholder-image">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="3" width="18" height="18" rx="2" stroke="#9CA3AF" strokeWidth="2"/>
                      <line x1="9" y1="9" x2="15" y2="9" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="9" y1="15" x2="15" y2="15" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
              </div>
              <div className="product-info">
                <div className="product-header">
                  <h3>{product.NOME_PRODUTO}</h3>
                  <div className="product-actions">
                    <button className="edit-btn" onClick={() => editProduct(product)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button className="delete-btn" onClick={() => deleteProduct(product)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6m4-6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="product-description">{product.DESCRIPTION}</p>
                <div className="product-details">
                  <div className="product-price">
                    R$ {Number(product.VALOR).toFixed(2)}
                  </div>
                  <div className="product-category">
                    {product.CATEGORIA}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>{editingProduct ? 'Editar Produto' : 'Adicionar Produto'}</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nome do Produto</label>
                <input
                  type="text"
                  name="NOME_PRODUTO"
                  value={formData.NOME_PRODUTO}
                  onChange={handleInputChange}
                  placeholder="Digite o nome do produto"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Categoria</label>
                  <input
                    type="text"
                    name="CATEGORIA"
                    value={formData.CATEGORIA}
                    onChange={handleInputChange}
                    placeholder="Ex: Eletrônicos"
                  />
                </div>
                <div className="form-group">
                  <label>Valor (R$)</label>
                  <input
                    type="number"
                    name="VALOR"
                    value={formData.VALOR}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Descrição</label>
                <textarea
                  name="DESCRIPTION"
                  value={formData.DESCRIPTION}
                  onChange={handleInputChange}
                  placeholder="Descreva o produto"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Imagem do Produto</label>
                <div className="image-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    id="product-image"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="product-image" className="upload-label">
                    {formData.image ? (
                      <div className="image-preview">
                        <img src={formData.image} alt="Preview" />
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M17 8L12 3M12 3L7 8M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>Clique para enviar uma imagem</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label>Duração (opcional)</label>
                <input
                  type="text"
                  name="DURATION"
                  value={formData.DURATION}
                  onChange={handleInputChange}
                  placeholder="Ex: 30 dias"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowAddModal(false)}>
                Cancelar
              </button>
              <button className="save-btn" onClick={handleSubmit}>
                {editingProduct ? 'Salvar Alterações' : 'Adicionar Produto'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .products-panel {
          padding: 1.5rem;
        }

        .products-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .products-header h2 {
          font-size: 1.875rem;
          font-weight: bold;
          color: #1f2937;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
        }

        .agent-select {
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          background: white;
          font-size: 0.875rem;
          min-width: 200px;
        }

        .agent-select:focus {
          outline: none;
          border-color: #8A63FF;
          box-shadow: 0 0 0 2px rgba(138, 99, 255, 0.1);
        }

        .add-product-btn {
          background: #8A63FF;
          color: white;
          border: none;
          border-radius: 0.5rem;
          padding: 0.75rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .add-product-btn:hover:not(:disabled) {
          background: #7c59d6;
        }

        .add-product-btn:disabled {
          background: #d1d5db;
          cursor: not-allowed;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 0;
          gap: 1rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #8A63FF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 0;
          text-align: center;
          background: white;
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
        }

        .empty-state svg {
          margin-bottom: 1rem;
          color: #9ca3af;
        }

        .empty-state h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: #6b7280;
          margin-bottom: 1.5rem;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .product-card {
          background: white;
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          transition: all 0.3s;
        }

        .product-card:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .product-image {
          height: 200px;
          overflow: hidden;
          background: #f3f4f6;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .placeholder-image {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .product-info {
          padding: 1.5rem;
        }

        .product-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }

        .product-header h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
        }

        .product-actions {
          display: flex;
          gap: 0.5rem;
        }

        .edit-btn, .delete-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.375rem;
          transition: all 0.3s;
        }

        .edit-btn {
          color: #6b7280;
        }

        .edit-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .delete-btn {
          color: #dc2626;
        }

        .delete-btn:hover {
          background: #fee2e2;
        }

        .product-description {
          color: #6b7280;
          font-size: 0.875rem;
          margin-bottom: 1rem;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .product-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #e5e7eb;
          padding-top: 1rem;
        }

        .product-price {
          font-size: 1.25rem;
          font-weight: bold;
          color: #1f2937;
        }

        .product-category {
          background: #f3f4f6;
          color: #4b5563;
          padding: 0.25rem 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
        }

        .modal-container {
          background: white;
          border-radius: 0.75rem;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
        }

        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
          padding: 0.5rem;
          border-radius: 0.375rem;
          transition: all 0.3s;
        }

        .close-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          transition: all 0.3s;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #8A63FF;
          box-shadow: 0 0 0 2px rgba(138, 99, 255, 0.1);
        }

        .form-row {
          display: flex;
          gap: 1rem;
        }

        .form-row .form-group {
          flex: 1;
        }

        .image-upload {
          border: 2px dashed #d1d5db;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .upload-label {
          display: block;
          cursor: pointer;
        }

        .upload-placeholder {
          padding: 3rem;
          text-align: center;
          color: #6b7280;
        }

        .upload-placeholder svg {
          margin-bottom: 0.5rem;
        }

        .image-preview {
          height: 200px;
        }

        .image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .cancel-btn {
          background: none;
          border: 1px solid #d1d5db;
          color: #374151;
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: all 0.3s;
        }

        .cancel-btn:hover {
          background: #f3f4f6;
        }

        .save-btn {
          background: #8A63FF;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .save-btn:hover {
          background: #7c59d6;
        }
      `}</style>
    </div>
  );
}