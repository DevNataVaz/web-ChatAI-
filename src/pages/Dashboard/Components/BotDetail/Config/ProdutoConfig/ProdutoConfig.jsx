import React, { useState, useEffect, useRef } from 'react';
import {
  FiX, FiPlus, FiTrash2, FiEdit2, FiCheck, FiSearch,
  FiUpload, FiPackage, FiDollarSign
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Criptografar, Descriptografar } from '../../../../../../Cripto/index';
import styles from './ProdutoConfig.module.css';

const ProdutoConfig = ({
  visible,
  botId,
  onClose,
  socketService,
  user,
  product
}) => {
  const fileInputRef = useRef(null);

  // State
  const [modalProducts, setModalProducts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Form state
  const [editingProductId, setEditingProductId] = useState(null);
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productImage, setProductImage] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);
  const [productCategory, setProductCategory] = useState('');
  const [productDuration, setProductDuration] = useState('');
  const [productImageBase64, setProductImageBase64] = useState(null);

  // Lista de produtos para envio em lote (do primeiro código)
  const [productsList, setProductsList] = useState([]);

  // Função para gerar hash único
  const generateUniqueHash = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 999999);
    return `${timestamp}${random}`;
  };

  // Função para formatar preço
  const formatPrice = (value) => {
    if (!value) return '';
    
    const numericValue = parseFloat(value.toString().replace(/[^\d]/g, '')) / 100;
    return numericValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Função para parsear preço
  const parsePrice = (value) => {
    if (!value) return '';
    
    const numericValue = value.replace(/[^\d]/g, '');
    const number = parseFloat(numericValue) / 100;
    return number.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Função para obter a URL completa da imagem
  const getImageUrl = (linkFotos) => {
    if (!linkFotos) return null;
    return `https://animuschatpro.up.railway.app/images?image=${linkFotos}`;
  };

  // Cleanup listeners
  const cleanupListeners = () => {
    socketService.off('ResponseReceberProdutos');
    socketService.off('RespostaDaCriação');
    socketService.off('ResponseEditarProduto');
  };

  // Fetch products on component mount
  useEffect(() => {
    if (visible && botId) {
      fetchProducts();
    }
    
    // Cleanup on unmount
    return () => {
      cleanupListeners();
    };
  }, [visible, botId]);

  // Fetch products from backend
  const fetchProducts = async () => {
    if (!user?.LOGIN || !botId) return;

    try {
      setLoadingProducts(true);
      cleanupListeners(); // Limpar listeners antes de criar novos

      // console.log('Fetching products for:', { login: user.LOGIN, botId });

      const productsDataPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          // console.log("Timeout fetching products");
          resolve([]);
        }, 15000);

        socketService.once('ResponseReceberProdutos', (data) => {
          clearTimeout(timeout);
          
          try {
            // console.log('Raw response:', data);
            
            const result = JSON.parse(Descriptografar(data.Response));
            const code = JSON.parse(Descriptografar(data.Code));
            
            // console.log('Parsed response:', { result, code });
            
            // if (code !== '0896546879475861673215673') {
              // console.error("Invalid response code:", code);
            //   resolve([]);
            //   return;
            // }

            // if (!result?.code) {
              // console.log("Server error:", result?.mensagem);
            //   resolve([]);
            //   return;
            // }

            const products = result.mensagem || [];
            // console.log('Products received:', products);
            resolve(products);
          } catch (err) {
            // console.error("Error processing response:", err);
            // resolve([]);
          }
        });

        socketService.emit('ReceberProdutos', {
          Code: Criptografar(JSON.stringify('45635465344565344564562546762')),
          Login: Criptografar(JSON.stringify(user.LOGIN)),
          Protocolo: Criptografar(JSON.stringify(botId))
        });
      });

      const productsData = await productsDataPromise;
      // console.log('Setting products:', productsData);
      setModalProducts(productsData);
    } catch (error) {
      // console.error("Error fetching products:", error);
      toast.error("Erro ao carregar lista de produtos");
      // setModalProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Handle image selection
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Resize image if needed
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const maxDimension = 800;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64Data = resizedDataUrl.split(',')[1];
        
        setProductImagePreview(resizedDataUrl);
        setProductImageBase64(base64Data);
        setProductImage(file);
      };
      
      img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
  };

  // Handle remove image
  const handleRemoveImage = () => {
    setProductImage(null);
    setProductImagePreview(null);
    setProductImageBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Reset form
  const resetForm = () => {
    setProductName('');
    setProductDescription('');
    setProductPrice('');
    setProductCategory('');
    setProductDuration('');
    setProductImage(null);
    setProductImagePreview(null);
    setProductImageBase64(null);
    setEditingProductId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle open add form
  const handleOpenAddForm = () => {
    resetForm();
    setShowAddForm(true);
    setShowEditForm(false);
  };

  // Handle open edit form
  const handleOpenEditForm = (product) => {
    setEditingProductId(product.ID);
    setProductName(product.NOME_PRODUTO || '');
    setProductDescription(product.DESCRIPTION || '');
    setProductPrice(product.VALOR || '');
    setProductCategory(product.CATEGORIA || '');
    setProductDuration(product.DURATION || '');
    
    // Set image preview if product has image
    if (product.LINK_FOTOS) {
      setProductImagePreview(getImageUrl(product.LINK_FOTOS));
    }
    
    setShowEditForm(true);
    setShowAddForm(false);
  };

  // Add product to temporary list - Implementado do primeiro código
  const addProductToList = async () => {
    if (!productName.trim()) {
      toast.warning("O nome do produto é obrigatório");
      return;
    }

    try {
      setIsLoading(true);

      // Format price - ensure it's a number for the server
      const formattedPrice = productPrice ? parseFloat(productPrice.replace(/[^\d]/g, '')) / 100 : 0;

      // Convert image to base64 if available
      let base64Image = null;
      if (productImageBase64) {
        base64Image = productImageBase64;
      } else if (productImage) {
        const reader = new FileReader();
        base64Image = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(productImage);
        });
      }

      // Generate unique name for image - similar to mobile version's hash
      const uniqueFileName = `produto_${Date.now()}`;

      // Create new product object in the format expected by the server - aligned with mobile format
      const newProduct = {
        Produto: productName,
        Categoria: productCategory || 'Geral', // Categoria padrão se não fornecida
        Preco: formattedPrice,
        Descricao: productDescription || '',
        Duration: productDuration || '0', // Duração padrão
        Base64: base64Image,
        nomeFoto: uniqueFileName
      };

      // Add to temporary product list
      setProductsList(prev => [...prev, newProduct]);
      
      // Reset form
      resetForm();
      setShowAddForm(false);
      
      toast.success("Produto adicionado à lista!");
    } catch (error) {
      // console.error("Erro ao adicionar produto:", error);
      toast.error(error.message || "Erro ao adicionar produto");
    } finally {
      setIsLoading(false);
    }
  };

  // Save products in batch - Implementado do primeiro código
  const handleSaveProducts = async () => {
    if (productsList.length < 1) {
      toast.warning("Adicione pelo menos 1 produto antes de salvar");
      return;
    }
    
    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      // Remover listener anterior, se existir
      socketService.off('RespostaDaCriação');
      
      // Criar um novo Promise para aguardar todas as respostas
      const savePromises = productsList.map((newProduct, index) => {
        return new Promise((resolve) => {
          // Função para processar resposta
          const handleResponse = (data) => {
            try {
              const code = JSON.parse(Descriptografar(data.Code));
              const response = JSON.parse(Descriptografar(data.Res));
              
              if (code === '365445365454436' && response === true) {
                successCount++;
                resolve(true);
              } else {
                errorCount++;
                resolve(false);
              }
            } catch (error) {
              errorCount++;
              resolve(false);
            } finally {
              socketService.off('RespostaDaCriação', handleResponse);
            }
          };
          
          // Registrar ouvinte com referência nomeada para poder remover depois
          socketService.once('RespostaDaCriação', handleResponse);
          
          // Enviar produto para o servidor - usando formato explícito
          socketService.emit('CriarProdutos', {
             Code: Criptografar('45489644589644'),
            Produtos: Criptografar(JSON.stringify(newProduct)),
            Login: Criptografar(user.LOGIN),
            Protocolo: Criptografar(botId)
          });
          // console.log("Enviando produto:", newProduct, user.LOGIN, botId);
         
          // Timeout de segurança para cada produto
          setTimeout(() => {
            socketService.off('RespostaDaCriação', handleResponse);
            errorCount++;
            resolve(false);
          }, 2000);
        });
      });
      
      // Aguardar todas as promessas serem resolvidas
      await Promise.all(savePromises);
      
      if (successCount === productsList.length) {
        toast.success(`${successCount} produto(s) salvo(s) com sucesso!`);
        setProductsList([]);
        fetchProducts();
      } else if (successCount > 0) {
        toast.warning(`Salvos ${successCount} de ${productsList.length} produtos`);
        // Remover os produtos salvos da lista
        setProductsList(prev => prev.slice(successCount));
        fetchProducts();
      } else {
        toast.error("Não foi possível salvar nenhum produto");
      }
    } catch (error) {
      // console.error("Erro ao salvar produtos:", error);
      toast.error("Erro ao salvar produtos");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle save product - Modificado para usar sistema de lote ou edição
  const handleSaveProduct = async () => {
    // Validate required fields
    if (!productName.trim()) {
      toast.error('Nome do produto é obrigatório');
      return;
    }

    if (!productPrice.trim()) {
      toast.error('Preço é obrigatório');
      return;
    }

    if (!productCategory.trim()) {
      toast.error('Categoria é obrigatória');
      return;
    }

    setIsLoading(true);

    try {
      if (showEditForm && editingProductId) {
        // Se estiver editando, usar a função de edição do segundo código
        await handleEditProduct();
      } else {
        // Se estiver adicionando, usar sistema de lote do primeiro código
        await addProductToList();
      }
    } catch (error) {
      // console.error('Error saving product:', error);
      toast.error('Erro ao salvar produto');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit product (mantido do segundo código)
  const handleEditProduct = async () => {
    const dadosParaEnviar = {
      Code: "31223123243146556474679894798",
      ID: editingProductId,
      Nome: productName.trim(),
      Categoria: productCategory.trim(),
      Valor: productPrice,
      Descricao: productDescription.trim(),
      base64: productImageBase64,
      Link: productImageBase64 ? generateUniqueHash() + '.jpg' : null,
      Protocolo: botId,
      Login: user.LOGIN,
    };

    // console.log('Editing product:', dadosParaEnviar);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        // console.log('Timeout editing product');
        socketService.off('ResponseEditarProduto');
        reject(new Error('Timeout editing product'));
      }, 15000);

      socketService.once('ResponseEditarProduto', (data) => {
        clearTimeout(timeout);
        
        try {
          // console.log('Edit response:', data);
          
          const result = JSON.parse(Descriptografar(data.Response));
          const code = JSON.parse(Descriptografar(data.Code));

          // console.log('Parsed edit response:', { result, code });

          if (code !== '0896546879475861673215673') {
            reject(new Error('Invalid response code'));
            return;
          }

          if (result.code === true) {
            toast.success('Produto atualizado com sucesso!');
            
            // Update local product list
            setModalProducts(prev => prev.map(product => 
              product.ID === editingProductId 
                ? {
                    ...product,
                    NOME_PRODUTO: productName.trim(),
                    CATEGORIA: productCategory.trim(),
                    VALOR: productPrice,
                    DESCRIPTION: productDescription.trim(),
                    LINK_FOTOS: dadosParaEnviar.Link || product.LINK_FOTOS
                  }
                : product
            ));

            resetForm();
            setShowEditForm(false);
            
            // Refresh products to get updated images
            setTimeout(() => {
              fetchProducts();
            }, 1000);
            
            resolve();
          } else {
            toast.error(result.mensagem || 'Erro ao atualizar produto');
            reject(new Error(result.mensagem));
          }
        } catch (error) {
          // console.error('Error processing edit response:', error);
          toast.error('Erro ao processar resposta do servidor');
          reject(error);
        }
      });

      socketService.emit('EditarProduto', Criptografar(JSON.stringify(dadosParaEnviar)));
    });
  };

  // Handle delete product (mantido do segundo código)
  const handleDeleteProduct = async (productId, linkFotos) => {
    setIsLoading(true);

    try {
      // console.log('Deleting product:', { productId, linkFotos });

      // Remove from local state immediately for better UX
      setModalProducts(prev => prev.filter(product => product.ID !== productId));
      setConfirmDeleteId(null);

      socketService.emit('ExcluirProduto', {
        Code: Criptografar(JSON.stringify("31223123243146556474679894798")),
        LINK_FOTOS: Criptografar(JSON.stringify(linkFotos))
      });
      
      toast.success('Produto excluído com sucesso');
    } catch (error) {
      // console.error('Error deleting product:', error);
      toast.error('Erro ao excluir produto');
      
      // Refresh products on error
      fetchProducts();
    } finally {
      setIsLoading(false);
    }
  };

  // Filter products based on search term
  const filteredProducts = modalProducts.filter(product => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      (product.NOME_PRODUTO || '').toLowerCase().includes(searchLower) ||
      (product.DESCRIPTION || '').toLowerCase().includes(searchLower) ||
      (product.CATEGORIA || '').toLowerCase().includes(searchLower)
    );
  });

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Get form title
  const getFormTitle = () => {
    if (showAddForm) return "Adicionar Produto";
    if (showEditForm) return "Editar Produto";
    return "Gerenciar Produtos";
  };

  if (!visible) return null;

  return (
    <div
      className={`${styles.modalBackdrop} ${visible ? styles.visible : ''}`}
      onClick={handleBackdropClick}
    >
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2>{getFormTitle()}</h2>

          <div className={styles.headerActions}>
            {!showAddForm && !showEditForm && (
              <>
                <button
                  className={styles.addButton}
                  onClick={handleOpenAddForm}
                >
                  <FiPlus size={16} />
                  <span>Adicionar</span>
                </button>

                {/* Botão para salvar produtos em lote - Do primeiro código */}
                {productsList.length > 0 && (
                  <button
                    className={styles.saveButton}
                    onClick={handleSaveProducts}
                    disabled={isLoading}
                  >
                    <FiCheck size={16} />
                    <span>Salvar {productsList.length} Produto(s)</span>
                  </button>
                )}
              </>
            )}

            <button
              className={styles.closeButton}
              onClick={onClose}
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        <div className={styles.modalBody}>
          {/* Temporary product list - Do primeiro código */}
          {!showAddForm && !showEditForm && productsList.length > 0 && (
            <div className={styles.tempProductsList}>
              <h3>Produtos para Salvar ({productsList.length})</h3>
              <div className={styles.tempProductsGrid}>
                {productsList.map((product, index) => (
                  <div key={index} className={styles.tempProductCard}>
                    <h4>{product.Produto}</h4>
                    <p className={styles.productCategory}>{product.Categoria}</p>
                    <p className={styles.productPrice}>
                      R$ {product.Preco.toFixed(2).replace('.', ',')}
                    </p>
                    <button
                      className={styles.removeTempProductButton}
                      onClick={() => setProductsList(prev => prev.filter((_, i) => i !== index))}
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showAddForm || showEditForm ? (
            <div className={styles.productForm}>
              <div className={styles.formGroup}>
                <label htmlFor="productName">Nome do Produto *</label>
                <input
                  type="text"
                  id="productName"
                  className={styles.input}
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Digite o nome do produto"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="productCategory">Categoria *</label>
                <input
                  type="text"
                  id="productCategory"
                  className={styles.input}
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  placeholder="Digite a categoria do produto"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="productDuration">Duração (minutos)</label>
                <input
                  type="number"
                  id="productDuration"
                  className={styles.input}
                  value={productDuration}
                  onChange={(e) => setProductDuration(e.target.value)}
                  placeholder="Duração do serviço em minutos"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="productDescription">Descrição</label>
                <textarea
                  id="productDescription"
                  className={styles.textarea}
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="Digite a descrição do produto"
                  rows={4}
                  maxLength={2000}
                />
                <div className={styles.characterCount}>
                  {productDescription.length}/2000
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="productPrice">Preço (R$) *</label>
                <div className={styles.priceInputContainer}>
                  <FiDollarSign size={16} className={styles.priceIcon} />
                  <input
                    type="text"
                    id="productPrice"
                    className={styles.priceInput}
                    value={productPrice}
                    onChange={(e) => setProductPrice(parsePrice(e.target.value))}
                    onBlur={() => setProductPrice(formatPrice(productPrice))}
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Imagem do Produto</label>
                {productImagePreview ? (
                  <div className={styles.imagePreviewContainer}>
                    <img
                      src={productImagePreview}
                      alt="Preview"
                      className={styles.imagePreview}
                    />
                    <button
                      className={styles.removeImageButton}
                      onClick={handleRemoveImage}
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    className={styles.imageUploadContainer}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FiUpload size={30} />
                    <p>Clique para fazer upload da imagem</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className={styles.fileInput}
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                  </div>
                )}
              </div>

              <div className={styles.formActions}>
                <button
                  className={styles.cancelFormButton}
                  onClick={() => {
                    resetForm();
                    setShowAddForm(false);
                    setShowEditForm(false);
                  }}
                  disabled={isLoading}
                >
                  Cancelar
                </button>

                <button
                  className={styles.saveFormButton}
                  onClick={handleSaveProduct}
                  disabled={isLoading || !productName.trim() || !productPrice.trim() || !productCategory.trim()}
                >
                  {isLoading ? (
                    <div className={styles.buttonSpinner}></div>
                  ) : (
                    <>
                      <FiCheck size={16} />
                      <span>{showEditForm ? "Atualizar" : "Adicionar"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.searchContainer}>
                <div className={styles.searchInputContainer}>
                  <FiSearch size={16} className={styles.searchIcon} />
                  <input
                    type="text"
                    className={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Pesquisar produtos..."
                  />
                  {searchTerm && (
                    <button
                      className={styles.clearSearchButton}
                      onClick={() => setSearchTerm('')}
                    >
                      <FiX size={16} />
                    </button>
                  )}
                </div>
                
                {/* <button
                  className={styles.refreshButton}
                  onClick={fetchProducts}
                  disabled={loadingProducts}
                >
                  🔄 Atualizar
                </button> */}
              </div>

              {loadingProducts ? (
                <div className={styles.loadingProducts}>
                  <div className={styles.spinner}></div>
                  <p>Carregando produtos...</p>
                </div>
              ) : (
                <div className={styles.productsList}>
                  {filteredProducts.length === 0 ? (
                    <div className={styles.emptyProducts}>
                      <FiPackage size={40} />
                      <p>
                        {searchTerm
                          ? "Nenhum produto encontrado para a pesquisa."
                          : "Nenhum produto cadastrado."}
                      </p>
                      <button
                        className={styles.addFirstButton}
                        onClick={handleOpenAddForm}
                      >
                        <FiPlus size={16} />
                        <span>Adicionar Produto</span>
                      </button>
                    </div>
                  ) : (
                    <div className={styles.productsGrid}>
                      {filteredProducts.map((product) => (
                        <div key={product.ID} className={styles.productCard}>
                          {confirmDeleteId === product.ID ? (
                            <div className={styles.confirmDelete}>
                              <p>Excluir produto?</p>
                              <div className={styles.confirmButtons}>
                                <button
                                  className={styles.cancelDeleteButton}
                                  onClick={() => setConfirmDeleteId(null)}
                                >
                                  Cancelar
                                </button>
                                <button
                                  className={styles.confirmDeleteButton}
                                  onClick={() => handleDeleteProduct(product.ID, product.LINK_FOTOS)}
                                  disabled={isLoading}
                                >
                                  {isLoading ? (
                                    <div className={styles.buttonSpinner}></div>
                                  ) : (
                                    "Excluir"
                                  )}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className={styles.productActions}>
                                <button
                                  className={styles.editProductButton}
                                  onClick={() => handleOpenEditForm(product)}
                                >
                                  <FiEdit2 size={16} />
                                </button>
                                <button
                                  className={styles.deleteProductButton}
                                  onClick={() => setConfirmDeleteId(product.ID)}
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              </div>

                              {product.LINK_FOTOS ? (
                                <div className={styles.productImage}>
                                  <img 
                                    src={getImageUrl(product.LINK_FOTOS)} 
                                    alt={product.NOME_PRODUTO}
                                    onError={(e) => {
                                      // console.log('Error loading image:', getImageUrl(product.LINK_FOTOS));
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                    onLoad={() => {
                                      // console.log('Image loaded successfully:', getImageUrl(product.LINK_FOTOS));
                                    }}
                                  />
                                  <div className={styles.productImagePlaceholder} style={{display: 'none'}}>
                                    <FiPackage size={40} />
                                  </div>
                                </div>
                              ) : (
                                <div className={styles.productImagePlaceholder}>
                                  <FiPackage size={40} />
                                </div>
                              )}

                              <div className={styles.productInfo}>
                                <h3 className={styles.productName}>{product.NOME_PRODUTO}</h3>
                                <p className={styles.productCategory}>{product.CATEGORIA}</p>
                                {product.DESCRIPTION && (
                                  <p className={styles.productDescription}>{product.DESCRIPTION}</p>
                                )}
                                <p className={styles.productPrice}>
                                  {typeof product.VALOR === 'number'
                                    ? `R$ ${product.VALOR.toFixed(2)}`.replace('.', ',')
                                    : `R$ ${product.VALOR}`}
                                </p>
                                {product.DURATION && product.DURATION !== '0' && (
                                  <p className={styles.productDuration}>
                                    Duração: {product.DURATION} min
                                  </p>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProdutoConfig;