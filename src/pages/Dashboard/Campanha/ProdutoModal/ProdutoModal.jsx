import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FiX, FiPlus, FiTrash2, FiEdit2, FiCheck, 
  FiUpload, FiPackage, FiDollarSign, FiSearch
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useApp } from '../../../../context/AppContext';
import { socketService } from '../../../../services/socketService';
import { Criptografar, Descriptografar } from '../../../../Cripto/index';
import styles from './ProdutoModal.module.css';

const ProductsModal = ({ 
  visible, 
  botId, 
  products = [], 
  onClose, 
  onProductsChange 
}) => {
  const { user, isLoading, setIsLoading } = useApp();
  const fileInputRef = useRef(null);
  
  // State
  const [modalProducts, setModalProducts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  
  // Form state
  const [editingProductId, setEditingProductId] = useState(null);
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productImage, setProductImage] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);
  
  // Update local products when prop changes
  useEffect(() => {
    setModalProducts(products);
  }, [products]);

  // Reset form
  const resetForm = () => {
    setProductName('');
    setProductDescription('');
    setProductPrice('');
    setProductImage(null);
    setProductImagePreview(null);
    setEditingProductId(null);
  };

  // Open add form
  const handleOpenAddForm = () => {
    resetForm();
    setShowAddForm(true);
    setShowEditForm(false);
  };

  // Open edit form
  const handleOpenEditForm = (product) => {
    resetForm();
    setEditingProductId(product.ID);
    setProductName(product.Titulo || '');
    setProductDescription(product.Descricao || '');
    setProductPrice(product.Valor ? String(product.Valor).replace('.', ',') : '');
    
    if (product.URL_FOTO) {
      setProductImagePreview(product.URL_FOTO);
    }
    
    setShowEditForm(true);
    setShowAddForm(false);
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.warning("A imagem deve ter no máximo 5MB");
      return;
    }
    
    setProductImage(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setProductImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setProductImage(null);
    setProductImagePreview(null);
  };

  // Parse price value
  const parsePrice = (value) => {
    // Allow only numbers and one comma
    const parsedValue = value.replace(/[^\d,]/g, '');
    
    // Ensure only one comma
    const commaCount = parsedValue.split(',').length - 1;
    if (commaCount > 1) {
      return productPrice; // Return previous value if invalid
    }
    
    return parsedValue;
  };

  // Format price for display
  const formatPrice = (price) => {
    if (!price) return '';
    
    // Convert comma to dot for calculation
    const numericPrice = price.replace(',', '.');
    
    // Check if it's a valid number
    if (isNaN(numericPrice)) return price;
    
    // Format with two decimal places
    return parseFloat(numericPrice).toFixed(2).replace('.', ',');
  };

  // Save product
  const handleSaveProduct = async () => {
    if (!productName.trim()) {
      toast.warning("O nome do produto é obrigatório");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Format price
      const formattedPrice = productPrice ? parseFloat(productPrice.replace(',', '.')) : 0;
      
      // Convert image to base64 if available
      let base64Image = null;
      if (productImage) {
        const reader = new FileReader();
        base64Image = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(productImage);
        });
      }
      
      if (showEditForm && editingProductId) {
        // Edit existing product
        const productData = {
          Code: Criptografar('76986784357345634'),
          ID: Criptografar(editingProductId),
          Titulo: Criptografar(productName),
          Descricao: Criptografar(productDescription || ''),
          Valor: Criptografar(formattedPrice.toString()),
          Imagem: base64Image ? Criptografar(base64Image) : null
        };
        
        // Create a promise to handle the async response
        const editProductPromise = new Promise((resolve, reject) => {
          // Set up a one-time listener for the response
          socketService.socket.once('ResponseEditarProduto', (data) => {
            try {
              const response = JSON.parse(Descriptografar(data));
              
              if (!response?.Res) {
                reject(new Error(response?.Mensagem || "Failed to update product"));
                return;
              }
              
              resolve(true);
            } catch (err) {
              reject(err);
            }
          });

          // Send the request
          socketService.socket.emit('EditarProduto', productData);
          
          // Add timeout in case of no response
          setTimeout(() => {
            socketService.socket.off('ResponseEditarProduto');
            reject(new Error("Timeout updating product"));
          }, 15000);
        });
        
        // Wait for the response
        await editProductPromise;
        toast.success("Produto atualizado com sucesso!");
      } else {
        // Create new product
        const productData = {
          Code: '45489644589644',
          Produtos: JSON.stringify([{
            Titulo: productName,
            Descricao: productDescription || '',
            Valor: formattedPrice,
            Imagem: base64Image
          }]),
          Login: user.LOGIN,
          Protocolo: botId
        };
        
        // Create a promise to handle the async response
        const createProductPromise = new Promise((resolve, reject) => {
          // Set up a one-time listener for the response
          socketService.socket.once('RespostaDaCriação', (data) => {
            try {
              const response = JSON.parse(Descriptografar(data));
              
              if (!response?.Res) {
                reject(new Error(response?.Mensagem || "Failed to create product"));
                return;
              }
              
              resolve(true);
            } catch (err) {
              reject(err);
            }
          });

          // Send the request
          socketService.socket.emit('CriarProdutos', Criptografar(JSON.stringify(productData)));
          
          // Add timeout in case of no response
          setTimeout(() => {
            socketService.socket.off('RespostaDaCriação');
            reject(new Error("Timeout creating product"));
          }, 15000);
        });
        
        // Wait for the response
        await createProductPromise;
        toast.success("Produto criado com sucesso!");
      }
      
      // Reset form and refresh products
      resetForm();
      setShowAddForm(false);
      setShowEditForm(false);
      
      if (onProductsChange) {
        onProductsChange();
      }
    } catch (error) {
      // console.error("Error saving product:", error);
      toast.error(error.message || "Erro ao salvar produto");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id, linkFotos) => {
    try {
      setIsLoading(true);
      
      // Create a promise to handle the async response
      const deleteProductPromise = new Promise((resolve, reject) => {
        // Set up a one-time listener for the response
        socketService.socket.once('ResponseExcluirProduto', (data) => {
          try {
            const response = JSON.parse(Descriptografar(data));
            
            if (!response?.Res) {
              reject(new Error(response?.Mensagem || "Failed to delete product"));
              return;
            }
            
            resolve(true);
          } catch (err) {
            reject(err);
          }
        });

        // Send the request
        socketService.socket.emit('ExcluirProduto', Criptografar(JSON.stringify({
          LINK_FOTOS: linkFotos
        })));
        
        // Add timeout in case of no response
        setTimeout(() => {
          socketService.socket.off('ResponseExcluirProduto');
          resolve(true); // Assume success to improve UX
        }, 10000);
      });
      
      // Wait for the response
      await deleteProductPromise;
      
      // Update local state
      setModalProducts(prev => prev.filter(product => product.ID !== id));
      toast.success("Produto excluído com sucesso!");
      
      if (onProductsChange) {
        onProductsChange();
      }
    } catch (error) {
      // console.error("Error deleting product:", error);
      toast.error(error.message || "Erro ao excluir produto");
    } finally {
      setIsLoading(false);
      setConfirmDeleteId(null);
    }
  };

  // Filter products based on search term
  const filteredProducts = modalProducts.filter(product => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (product.Titulo || '').toLowerCase().includes(searchLower) ||
      (product.Descricao || '').toLowerCase().includes(searchLower)
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
    return "";
  };

  return (
    <div 
      className={`${styles.modalBackdrop} ${visible ? styles.visible : ''}`} 
      onClick={handleBackdropClick}
    >
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2>{showAddForm || showEditForm ? getFormTitle() : "Gerenciar Produtos"}</h2>
          
          <div className={styles.headerActions}>
            {!showAddForm && !showEditForm && (
              <button 
                className={styles.addButton}
                onClick={handleOpenAddForm}
              >
                <FiPlus size={16} />
                <span>Adicionar</span>
              </button>
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
                <label htmlFor="productDescription">Descrição</label>
                <textarea
                  id="productDescription"
                  className={styles.textarea}
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="Digite a descrição do produto"
                  rows={4}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="productPrice">Preço (R$)</label>
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
                  disabled={isLoading || !productName.trim()}
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
              </div>
              
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
                            
                            {product.URL_FOTO ? (
                              <div className={styles.productImage}>
                                <img src={product.URL_FOTO} alt={product.Titulo} />
                              </div>
                            ) : (
                              <div className={styles.productImagePlaceholder}>
                                <FiPackage size={40} />
                              </div>
                            )}
                            
                            <div className={styles.productInfo}>
                              <h3 className={styles.productName}>{product.Titulo}</h3>
                              
                              {product.Descricao && (
                                <p className={styles.productDescription}>{product.Descricao}</p>
                              )}
                              
                              <p className={styles.productPrice}>
                                {typeof product.Valor === 'number'
                                  ? `R$ ${product.Valor.toFixed(2)}`.replace('.', ',')
                                  : product.Valor}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsModal;