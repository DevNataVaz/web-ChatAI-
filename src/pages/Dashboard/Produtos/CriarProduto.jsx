import React, { useState, useRef } from 'react';
import styles from './Produto.module.css';
import { socketService } from '../../../services/socketService'; 
import { Criptografar, Descriptografar } from '../../../Cripto/index';

const CriarProduto = ({ onClose }) => {
  const fileInputRef = useRef(null);
  
  const [produto, setProduto] = useState({
    Produto: '',
    Categoria: '',
    Preco: '',
    Descricao: '',
    Duration: '0',
    Base64: null,
    nomeFoto: ''
  });
  
  const [previewImg, setPreviewImg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [robots, setRobots] = useState([]);
  const [selectedRobot, setSelectedRobot] = useState('');
  
  // Mock de robôs para selecionar (substituir por chamada real à API)
  React.useEffect(() => {
    // Simular carregamento de robôs do backend
    setRobots([
      { id: '1', nome: 'Robô de Atendimento' },
      { id: '2', nome: 'Robô de Vendas' },
      { id: '3', nome: 'Robô de Suporte' }
    ]);
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduto({
      ...produto,
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
      setProduto({
        ...produto,
        Base64: base64String,
        nomeFoto: file.name.split('.')[0]
      });
    };
    reader.readAsDataURL(file);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Aqui você precisará obter o Login e o Protocolo do usuário logado
    // Adaptando para seu contexto específico
    const userLogin = "userLogin"; // Substituir por valor real da sessão
    const userProtocolo = "userProtocolo"; // Substituir por valor real da sessão
    
    const data = {
      Code: Criptografar('45489644589644'),
      Produtos: Criptografar(JSON.stringify(produto)),
      Login: Criptografar(userLogin),
      Protocolo: Criptografar(userProtocolo)
    };
    
    // Enviando para o backend via socket
    socketService.emit('CriarProdutos', data);
    
    // Ouvindo a resposta do servidor
    socketService.once('RespostaDaCriação', (response) => {
      setIsLoading(false);
      
      // Processar resposta do servidor
      // Assumindo que você tenha uma função para descriptografar
      const res = JSON.parse(Descriptografar(response.Res));
      
      if (res === true) {
        alert('Produto criado com sucesso!');
        onClose();
      } else {
        alert('Erro ao criar produto. Tente novamente.');
      }
    });
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.modalHeader}>
        <h2>Cadastro de Produtos</h2>
      </div>
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="produto">
            <i className="fas fa-tag mr-2"></i>
            Nome do Produto
          </label>
          <input
            type="text"
            id="produto"
            name="Produto"
            value={produto.Produto}
            onChange={handleChange}
            placeholder="Nome do produto"
            required
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="categoria">
            <i className="fas fa-folder mr-2"></i>
            Categoria
          </label>
          <select
            id="categoria"
            name="Categoria"
            value={produto.Categoria}
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
          <label htmlFor="preco">
            <i className="fas fa-dollar-sign mr-2"></i>
            Preço (R$)
          </label>
          <input
            type="number"
            id="preco"
            name="Preco"
            value={produto.Preco}
            onChange={handleChange}
            placeholder="0,00"
            step="0.01"
            min="0"
            required
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="descricao">
            <i className="fas fa-align-left mr-2"></i>
            Descrição
          </label>
          <textarea
            id="descricao"
            name="Descricao"
            value={produto.Descricao}
            onChange={handleChange}
            placeholder="Descreva o produto..."
            rows="4"
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="duration">
            <i className="fas fa-calendar-alt mr-2"></i>
            Duração (opcional)
          </label>
          <input
            type="number"
            id="duration"
            name="Duration"
            value={produto.Duration}
            onChange={handleChange}
            placeholder="Duração em dias (0 = sem expiração)"
            min="0"
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
                Salvar Produto
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CriarProduto;