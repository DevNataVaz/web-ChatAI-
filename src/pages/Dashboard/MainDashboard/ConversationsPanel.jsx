// components/ConversationsPanel.jsx
import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';

// Componente de carregamento para quando o contexto não está disponível
const LoadingPanel = () => (
  <div className="loading-panel">
    <div className="loading-spinner"></div>
    <p>Carregando...</p>
    <style jsx>{`
      .loading-panel {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        gap: 1rem;
      }
      .loading-spinner {
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
      p {
        color: #6b7280;
      }
    `}</style>
  </div>
);

// Wrapper component para garantir que as funções estejam disponíveis
function ConversationsPanelWrapper() {
  const context = useApp();
  
  // Verificar se todas as dependências necessárias estão disponíveis
  const { user, socket, Criptografar, Descriptografar } = context || {};
  
  // Se alguma dependência crítica não estiver disponível, mostrar o carregamento
  if (!context || !Criptografar || !Descriptografar) {
    return <LoadingPanel />;
  }

  return <ConversationsPanel context={context} />;
}

// Componente principal
function ConversationsPanel({ context }) {
  const { user, socket, Criptografar, Descriptografar } = context;
  
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    // Somente inicializar se o socket estiver disponível
    if (socket && user) {
      fetchConversations();
    }
  }, [user, socket]);

  useEffect(() => {
    if (!socket) return;

    const setupSocketListeners = () => {
      socket.on('ResponseNovaConversa', handleConversationsResponse);
      socket.on('ResponseMensagens', handleMessagesResponse);
      socket.on('ResponseUpdateMensagens', handleMessageUpdates);
      socket.on('ResponseEnviarMensagem', handleSendMessageResponse);
      socket.on('responseExcluirConversa', handleDeleteConversationResponse);
    };

    setupSocketListeners();

    return () => {
      if (socket) {
        socket.removeAllListeners();
      }
    };
  }, [socket]);

  const fetchConversations = () => {
    try {
      const data = Criptografar(JSON.stringify({
        Code: '890878989048965048956089',
        Login: user.LOGIN,
        Limit: 20,
        Page: currentPage
      }));
      socket.emit('novaConversa', data);
    } catch (error) {
      console.error('Error in fetchConversations:', error);
    }
  };

  const fetchMessages = (conversation) => {
    setLoadingMessages(true);
    try {
      const data = Criptografar(JSON.stringify({
        code: '90343263779',
        protocolo: conversation.PROTOCOLO_CONVERSA,
        contador: 0
      }));
      socket.emit('requestMensagens', data);
    } catch (error) {
      console.error('Error in fetchMessages:', error);
      setLoadingMessages(false);
    }
  };

  const handleConversationsResponse = (data) => {
    try {
      const result = JSON.parse(Descriptografar(data));
      if (result.Code === '655434565435463544') {
        setConversations(result.GetInicial);
      }
      if (result.Code2 === '655434565435463545') {
        const updatedConversations = [...conversations];
        result.GetAtualizar.forEach(update => {
          const index = updatedConversations.findIndex(c => c.ID === update.ID);
          if (index > -1) {
            updatedConversations[index] = update;
          } else {
            updatedConversations.unshift(update);
          }
        });
        setConversations(updatedConversations);
      }
    } catch (error) {
      console.error('Error in handleConversationsResponse:', error);
    }
  };

  const handleMessagesResponse = (data) => {
    try {
      const result = JSON.parse(Descriptografar(data.Dados));
      setMessages(result);
      setLoadingMessages(false);
    } catch (error) {
      console.error('Error in handleMessagesResponse:', error);
      setLoadingMessages(false);
    }
  };

  const handleMessageUpdates = (data) => {
    try {
      const result = JSON.parse(Descriptografar(data));
      if (result.Code === '2473892748324' && result.Ativador === 'true') {
        const newMessages = JSON.parse(Descriptografar(result.Dados));
        if (selectedConversation) {
          fetchMessages(selectedConversation);
        }
      }
    } catch (error) {
      console.error('Error in handleMessageUpdates:', error);
    }
  };

  const handleSendMessageResponse = (data) => {
    try {
      const result = JSON.parse(Descriptografar(data));
      if (result.Code === '32564436525443565434') {
        setNewMessage('');
        if (selectedConversation) {
          fetchMessages(selectedConversation);
        }
      }
    } catch (error) {
      console.error('Error in handleSendMessageResponse:', error);
    }
  };

  const handleDeleteConversationResponse = (data) => {
    try {
      const result = JSON.parse(Descriptografar(data));
      if (result.Protocolo) {
        fetchConversations();
        if (selectedConversation?.PROTOCOLO_CONVERSA === result.Protocolo) {
          setSelectedConversation(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Error in handleDeleteConversationResponse:', error);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const data = Criptografar(JSON.stringify({
        Code: '32564436525443565434',
        Protocolo: selectedConversation.PROTOCOLO_CONVERSA,
        Mensagem: newMessage,
        Login: user.LOGIN,
        Bot_Protocolo: selectedConversation.PROTOCOLO_BOT,
        Plataforma: selectedConversation.PLATAFORMA
      }));

      socket.emit('enviarMensagem', data);
    } catch (error) {
      console.error('Error in sendMessage:', error);
    }
  };

  const deleteConversation = (conversation) => {
    if (window.confirm('Tem certeza que deseja excluir esta conversa?')) {
      try {
        const data = Criptografar(JSON.stringify({
          Code: '5659723568999234',
          Protocolo: conversation.PROTOCOLO_CONVERSA
        }));
        socket.emit('excluirConversa', data);
      } catch (error) {
        console.error('Error in deleteConversation:', error);
      }
    }
  };

  const markConversationAsRead = () => {
    if (selectedConversation) {
      const unreadMessages = messages.filter(msg => msg.LIDA === 'false');
      unreadMessages.forEach(msg => {
        try {
          const data = Criptografar(JSON.stringify({
            Code: '56345436545434',
            ID: msg.ID
          }));
          socket.emit('updateMensagensLida', data);
        } catch (error) {
          console.error('Error in markConversationAsRead:', error);
        }
      });
    }
  };

  // Se nenhuma das dependências críticas estiver disponível, mostrar carregamento
  if (!user || !socket) {
    return <LoadingPanel />;
  }

  const filteredConversations = conversations.filter(conv =>
    conv.NOME_CONTATO?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.MOTIVO_CONVERSA?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderPlatformIcon = (platform) => {
    switch (platform) {
      case '0':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="#075E54"/>
          </svg>
        );
      case '2':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.948-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" fill="#E1306C"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="conversations-panel">
    <div className="conversations-container">
      <div className="conversations-sidebar">
        <div className="search-container">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="conversations-list">
          {filteredConversations.map(conversation => (
            <div
              key={conversation.ID}
              className={`conversation-item ${selectedConversation?.ID === conversation.ID ? 'selected' : ''}`}
              onClick={() => {
                setSelectedConversation(conversation);
                fetchMessages(conversation);
                markConversationAsRead();
              }}
            >
              <div className="conversation-header">
                <div className="contact-info">
                  <div className="platform-icon">
                    {renderPlatformIcon(conversation.PLATAFORMA)}
                  </div>
                  <div className="contact-details">
                    <span className="contact-name">{conversation.NOME_CONTATO}</span>
                    <span className="conversation-time">
                      {new Date(`${conversation.DATA} ${conversation.HORAS}`).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="conversation-actions">
                  {conversation.NEW_MENSAGEM === 'true' && (
                    <span className="unread-badge">{conversation.QUANTIDADE}</span>
                  )}
                  <button
                    className="delete-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conversation);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6h18M8 6v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6m4-6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="conversation-preview">
                <span className="conversation-subject">{conversation.MOTIVO_CONVERSA}</span>
                <span className={`conversation-tag ${conversation.TAG.toLowerCase()}`}>
                  {conversation.TAG}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-container">
        {selectedConversation ? (
          <>
            <div className="chat-header">
              <div className="chat-contact-info">
                <div className="platform-icon large">
                  {renderPlatformIcon(selectedConversation.PLATAFORMA)}
                </div>
                <div>
                  <h3>{selectedConversation.NOME_CONTATO}</h3>
                  <span className="chat-status">{selectedConversation.MOTIVO_CONVERSA}</span>
                </div>
              </div>
              <div className="chat-actions">
                <span className={`conversation-tag ${selectedConversation.TAG.toLowerCase()}`}>
                  {selectedConversation.TAG}
                </span>
              </div>
            </div>

            <div className="messages-container">
              {loadingMessages ? (
                <div className="loading-messages">
                  <div className="spinner"></div>
                  <p>Carregando mensagens...</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={message.ID}
                    className={`message-bubble ${message.SEQUENCIA === '0' ? 'sent' : 'received'}`}
                  >
                    <div className="message-content">{message.MENSAGEM}</div>
                    <div className="message-time">
                      {new Date(`${message.DATA} ${message.HORA}`).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="message-input-container">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button 
                className="send-button" 
                onClick={sendMessage}
                disabled={!newMessage.trim()}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </>
        ) : (
          <div className="no-conversation-selected">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0034 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92176 4.44061 8.37485 5.27072 7.03255C6.10083 5.69025 7.28825 4.6056 8.7 3.9C9.87812 3.30493 11.1801 2.99656 12.5 3H13C15.0843 3.11499 17.053 3.99476 18.5291 5.47086C20.0052 6.94696 20.885 8.91565 21 11V11.5Z" stroke="#8A8D9F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3>Selecione uma conversa</h3>
            <p>Escolha uma conversa da lista para começar a visualizar as mensagens</p>
          </div>
        )}
      </div>
    </div>

    <style jsx>{`
      .conversations-panel {
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .conversations-container {
        display: flex;
        flex: 1;
        background: white;
        border-radius: 0.75rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }

      .conversations-sidebar {
        width: 350px;
        border-right: 1px solid #e5e7eb;
        display: flex;
        flex-direction: column;
      }

      .search-container {
        padding: 1rem;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .search-container input {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
      }

      .search-container input:focus {
        outline: none;
        border-color: #8A63FF;
        box-shadow: 0 0 0 2px rgba(138, 99, 255, 0.1);
      }

      .conversations-list {
        flex: 1;
        overflow-y: auto;
      }

      .conversation-item {
        padding: 1rem;
        border-bottom: 1px solid #e5e7eb;
        cursor: pointer;
        transition: background-color 0.3s;
      }

      .conversation-item:hover {
        background: #f9fafb;
      }

      .conversation-item.selected {
        background: #f3f4f6;
        border-left: 3px solid #8A63FF;
      }

      .conversation-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.5rem;
      }

      .contact-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .platform-icon {
        flex-shrink: 0;
      }

      .platform-icon.large {
        width: 32px;
        height: 32px;
      }

      .contact-details {
        display: flex;
        flex-direction: column;
      }

      .contact-name {
        font-weight: 500;
        color: #1f2937;
      }

      .conversation-time {
        font-size: 0.875rem;
        color: #6b7280;
      }

      .conversation-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .unread-badge {
        background: #8A63FF;
        color: white;
        border-radius: 50%;
        padding: 0.125rem 0.5rem;
        font-size: 0.75rem;
        font-weight: 500;
        min-width: 20px;
        text-align: center;
      }

      .delete-button {
        background: none;
        border: none;
        cursor: pointer;
        color: #6b7280;
        padding: 0.25rem;
        border-radius: 0.375rem;
        transition: all 0.3s;
      }

      .delete-button:hover {
        background: #f3f4f6;
        color: #dc2626;
      }

      .conversation-preview {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .conversation-subject {
        font-size: 0.875rem;
        color: #4b5563;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 200px;
      }

      .conversation-tag {
        padding: 0.125rem 0.5rem;
        border-radius: 0.375rem;
        font-size: 0.75rem;
        font-weight: 500;
      }

      .conversation-tag.atendimento {
        background: #e5e7eb;
        color: #4b5563;
      }

      .conversation-tag.finalizado {
        background: #dcfce7;
        color: #166534;
      }

      .conversation-tag.bot {
        background: #dbeafe;
        color: #1e40af;
      }

      .chat-container {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .chat-header {
        padding: 1rem;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f9fafb;
      }

      .chat-contact-info {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .chat-contact-info h3 {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
      }

      .chat-status {
        font-size: 0.875rem;
        color: #6b7280;
      }

      .messages-container {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .loading-messages {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        gap: 1rem;
      }

      .spinner {
        width: 30px;
        height: 30px;
        border: 3px solid #e5e7eb;
        border-top: 3px solid #8A63FF;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .message-bubble {
        max-width: 70%;
        padding: 0.75rem 1rem;
        border-radius: 1rem;
        margin-bottom: 0.5rem;
        position: relative;
      }

      .message-bubble.sent {
        background: #8A63FF;
        color: white;
        margin-left: auto;
        border-bottom-right-radius: 0.375rem;
      }

      .message-bubble.received {
        background: #f3f4f6;
        color: #1f2937;
        border-bottom-left-radius: 0.375rem;
      }

      .message-content {
        white-space: pre-wrap;
        word-break: break-word;
      }

      .message-time {
        font-size: 0.75rem;
        opacity: 0.7;
        margin-top: 0.25rem;
        text-align: right;
      }

      .message-input-container {
        padding: 1rem;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 0.75rem;
        background: white;
      }

      .message-input-container input {
        flex: 1;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        font-size: 0.875rem;
      }

      .message-input-container input:focus {
        outline: none;
        border-color: #8A63FF;
        box-shadow: 0 0 0 2px rgba(138, 99, 255, 0.1);
      }

      .send-button {
        background: #8A63FF;
        color: white;
        border: none;
        border-radius: 0.5rem;
        padding: 0.75rem 1.5rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.3s;
      }

      .send-button:hover:not(:disabled) {
        background: #7c59d6;
      }

      .send-button:disabled {
        background: #d1d5db;
        cursor: not-allowed;
      }

      .no-conversation-selected {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #6b7280;
        text-align: center;
        padding: 2rem;
      }

      .no-conversation-selected h3 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #374151;
        margin: 1rem 0 0.5rem;
      }

      .no-conversation-selected p {
        color: #6b7280;
      }
    `}</style>
  </div>
);
}

// Exportar o wrapper component
export default ConversationsPanelWrapper;