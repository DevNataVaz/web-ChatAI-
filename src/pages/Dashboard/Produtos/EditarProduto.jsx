import React, { useState, useRef, useEffect } from 'react';
import styles from './Produto.module.css';
import { socketService } from '../../../services/socketService'; 
import { Criptografar, Descriptografar } from '../../../Cripto/index';

const EditarProduto = ({ produto, onClose }) => {
  const fileInputRef = useRef(null);
  
  // Inicializa com os dados do produto ou valores vazios
  const [produtoData, setProdutoData] = useState(produto || {
    ID: '',
    NOME_PRODUTO: '',
    CATEGORIA: '',
    VALOR: '',
    DESCRIPTION: '',
    LINK_FOTOS: '',
    BASE64: null
  });
  
  const [previewImg, setPreviewImg] = useState(
    produtoData.LINK_FOTOS ? `/images/${produtoData.LINK_FOTOS}` : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [base64Changed, setBase64Changed] = useState(false);
  const [robots, setRobots] = useState([]);
  const [selectedRobot, setSelectedRobot] = useState('');
  
  // Mock de robôs para selecionar (substituir por chamada real à API)
  useEffect(() => {
    // Simular carregamento de robôs do backend
    setRobots([
      { id: '1', nome: 'Robô de Atendimento' },
      { id: '2', nome: 'Robô de Vendas' },
      { id: '3', nome: 'Robô de Suporte' }
    ]);
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setProdutoData({
      ...produtoData,
      [name]: value
    });
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target.result;
      setPreviewImg(base64String);
      setProdutoData({
        ...produtoData,
        BASE64: base64String
      });
      setBase64Changed(true);
    };
    reader.readAsDataURL(file);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Preparar dados para envio
    // Obter informações do usuário logado
    const userLogin = "userLogin"; // Substituir pelo valor real
    const userProtocolo = "userProtocolo"; // Substituir pelo valor real
    
    // Gerar link de foto baseado no nome se a imagem foi alterada
    let linkFoto = produtoData.LINK_FOTOS;
    if (base64Changed && !linkFoto) {
      // Gerar um nome de arquivo único
      const timestamp = new Date().getTime();
      linkFoto = `produto_${produtoData.ID || timestamp}`;
    }
    
    const data = {
      data: Criptografar(JSON.stringify({
        Code: '31223123243146556474679894798',
        Nome: produtoData.NOME_PRODUTO,
        Categoria: produtoData.CATEGORIA,
        Valor: produtoData.VALOR,
        base64: base64Changed ? produtoData.BASE64 : null,
        Protocolo: userProtocolo,
        Login: userLogin,
        ID: produtoData.ID,
        Link: linkFoto,
        Descricao: produtoData.DESCRIPTION
      }))
    };
    
    // Enviar solicitação para editar produto
    socketService.emit('EditarProduto', data);
    
    // Configurar ouvinte para resposta
    socketService.once('ResponseEditarProduto', (response) => {
      setIsLoading(false);
      
      // Processar resposta
      const res = JSON.parse(Descriptografar(response.Response));
      
      if (res.code) {
        alert('Produto atualizado com sucesso!');
        onClose();
      } else {
        alert(`Erro ao atualizar produto: ${res.mensagem}`);
      }
    });
  };
  
  if (isLoading && !produtoData.NOME_PRODUTO) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Carregando produto...</p>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.modalHeader}>
        <h2>Editar Produto</h2>
      </div>
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="NOME_PRODUTO">
            <i className="fas fa-tag mr-2"></i>
            Nome do Produto
          </label>
          <input
            type="text"
            id="NOME_PRODUTO"
            name="NOME_PRODUTO"
            value={produtoData.NOME_PRODUTO}
            onChange={handleChange}
            placeholder="Nome do produto"
            required
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="CATEGORIA">
            <i className="fas fa-folder mr-2"></i>
            Categoria
          </label>
          <select
            id="CATEGORIA"
            name="CATEGORIA"
            value={produtoData.CATEGORIA}
            onChange={handleChange}
            required
          >
            <option value="">Selecione uma categoria</option>
            <option value="Eletrônicos">Eletrônicos</option>
            <option value="Smartwatch">Smartwatch</option>
            <option value="Vestuário">Vestuário</option>
            <option value="Casa">Casa</option>
            <option value="Alimentos">Alimentos</option>
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="VALOR">
            <i className="fas fa-dollar-sign mr-2"></i>
            Preço (R$)
          </label>
          <input
            type="number"
            id="VALOR"
            name="VALOR"
            value={produtoData.VALOR}
            onChange={handleChange}
            placeholder="0,00"
            step="0.01"
            min="0"
            required
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="DESCRIPTION">
            <i className="fas fa-align-left mr-2"></i>
            Descrição
          </label>
          <textarea
            id="DESCRIPTION"
            name="DESCRIPTION"
            value={produtoData.DESCRIPTION || ''}
            onChange={handleChange}
            placeholder="Descreva o produto..."
            rows="4"
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="robot">
            <i className="fas fa-robot mr-2"></i>
            Vincular a Robô (opcional)
          </label>
          <select
            id="robot"
            value={selectedRobot}
            onChange={(e) => setSelectedRobot(e.target.value)}
          >
            <option value="">Selecione um robô</option>
            {robots.map(robot => (
              <option key={robot.id} value={robot.id}>
                {robot.nome}
              </option>
            ))}
          </select>
        </div>
        
        <div className={styles.imageUploadContainer}>
          <div className={styles.uploadArea} onClick={() => fileInputRef.current.click()}>
            {previewImg ? (
              <img src={previewImg} alt="Preview" className={styles.imagePreview} />
            ) : (
              <div className={styles.uploadPlaceholder}>
                <i className="fas fa-upload"></i>
                <p>Clique para adicionar uma imagem</p>
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className={styles.fileInput}
          />
        </div>
        
        <div className={styles.buttonContainer}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
          >
            <i className="fas fa-times-circle mr-2"></i>
            Cancelar
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Salvando...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                Atualizar Produto
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditarProduto;