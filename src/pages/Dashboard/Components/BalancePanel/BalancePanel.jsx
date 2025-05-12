import React, { useState, useEffect } from 'react';
import { Criptografar, Descriptografar } from '../../../../Cripto';
import styles from './BalancePanel.module.css'

export default function BalancePanel({ user, socket }) {
 
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawData, setWithdrawData] = useState({
    amount: '',
    pixKey: '',
    pixKeyType: 'CPF'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBalance();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('SaldoAtualresponse', handleBalanceResponse);
      socket.on('SaqueTransferenciaResponse', handleWithdrawResponse);
    }

    return () => {
      if (socket) {
        socket.removeAllListeners();
      }
    };
  }, [socket]);

  const fetchBalance = () => {
    const data = Criptografar(JSON.stringify({
      Code: '3214654132654746856474651',
      login: user.LOGIN
    }));
    socket.emit('saldoAtual', data);
  };

  const handleBalanceResponse = (data) => {
    const result = JSON.parse(Descriptografar(data));
    if (result.Code === '453436544565315323415332' && result.Dados.length > 0) {
      setBalance(result.Dados[0].SALDO);
    }
  };

  const handleWithdrawResponse = (data) => {
    const result = JSON.parse(Descriptografar(data));
    if (result.code === 200) {
      alert('Saque realizado com sucesso!');
      setShowWithdrawModal(false);
      fetchBalance();
    } else {
      setError('Erro ao realizar saque. Tente novamente.');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleWithdrawSubmit = async () => {
    if (!withdrawData.amount || !withdrawData.pixKey) {
      setError('Preencha todos os campos');
      return;
    }

    const amount = parseFloat(withdrawData.amount);
    if (amount <= 0 || amount > balance) {
      setError('Valor inválido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const withdrawPayload = {
        pixAddressKey: withdrawData.pixKey,
        pixAddressKeyType: withdrawData.pixKeyType,
        value: amount,
        description: `Saque - ${user.LOGIN}`
      };

      // Criar HMAC signature
      const signature = crypto.createHmac('sha256', '74k&^*nh#$FeLi')
        .update(JSON.stringify(withdrawPayload))
        .digest('hex');

      const data = Criptografar(JSON.stringify({
        data: withdrawPayload,
        signature: signature,
        Login: user.LOGIN
      }));

      socket.emit('Saque', data);
    } catch (err) {
      setError('Erro ao processar saque');
      setLoading(false);
    }
  };

  return (
    <div className={styles.balancePanel}>
      <div className={styles.balanceCard}>
        <div className={styles.balanceHeader}>
          <h2>Saldo Disponível</h2>
          <button className={styles.refreshButton} onClick={fetchBalance}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 4V10H7M23 20V14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20.49 9C19.9828 7.56678 19.1209 6.28828 17.9845 5.27111C16.8482 4.25394 15.4745 3.53462 13.9917 3.18525C12.5089 2.83588 10.9652 2.86768 9.49742 3.27816C8.02963 3.68863 6.68837 4.46273 5.60999 5.53L1 10M23 14L18.39 18.47C17.3116 19.5373 15.9704 20.3114 14.5026 20.7218C13.0348 21.1323 11.4911 21.1641 10.0083 20.8148C8.52547 20.4654 7.1518 19.7461 6.01547 18.7289C4.87913 17.7117 4.01717 16.4332 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div className={styles.balanceAmount}>
          {formatCurrency(balance)}
        </div>
        
        <div className={styles.balanceActions}>
          <button 
            className={styles.withdrawButton}
            onClick={() => setShowWithdrawModal(true)}
            disabled={balance <= 0}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1V23M19 12H5M19 12L14 7M19 12L14 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sacar Saldo
          </button>
        </div>
      </div>

      {showWithdrawModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <div className={styles.modalHeader}>
              <h3>Sacar Saldo</h3>
              <button 
                className={styles.closeButton} 
                onClick={() => setShowWithdrawModal(false)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.balanceInfo}>
                <span>Saldo disponível:</span>
                <strong>{formatCurrency(balance)}</strong>
              </div>
              
              <div className={styles.formGroup}>
                <label>Valor do Saque</label>
                <input
                  type="number"
                  value={withdrawData.amount}
                  onChange={(e) => setWithdrawData(prev => ({...prev, amount: e.target.value}))}
                  placeholder="0.00"
                  step="0.01"
                  max={balance}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Tipo de Chave PIX</label>
                <select
                  value={withdrawData.pixKeyType}
                  onChange={(e) => setWithdrawData(prev => ({...prev, pixKeyType: e.target.value}))}
                >
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                  <option value="EMAIL">Email</option>
                  <option value="PHONE">Telefone</option>
                  <option value="EVP">Chave Aleatória</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label>Chave PIX</label>
                <input
                  type="text"
                  value={withdrawData.pixKey}
                  onChange={(e) => setWithdrawData(prev => ({...prev, pixKey: e.target.value}))}
                  placeholder="Digite sua chave PIX"
                />
              </div>
              
              {error && <div className={styles.errorMessage}>{error}</div>}
            </div>
            
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton} 
                onClick={() => setShowWithdrawModal(false)}
              >
                Cancelar
              </button>
              <button 
                className={styles.submitButton}
                onClick={handleWithdrawSubmit}
                disabled={loading}
              >
                {loading ? 'Processando...' : 'Confirmar Saque'}
              </button>
            </div>
          </div>
        </div>
      )}

          </div>
  );
}