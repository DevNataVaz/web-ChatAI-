import React, { useEffect, useState } from 'react';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';

initMercadoPago('SEU_PUBLIC_KEY'); // Chave pública do Mercado Pago

export default function PagamentoCartao() {
  const [status, setStatus] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');
    setSocket(ws);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'cartao_pagamento_status') {
        setStatus(`Status: ${data.status} (${data.status_detail})`);
      } else if (data.type === 'erro') {
        setStatus(`Erro: ${data.erro}`);
      }
    };

    return () => ws.close();
  }, []);

  const onSubmit = async ({ token, paymentMethodId, issuerId, installments }) => {
    socket?.send(
      JSON.stringify({
        type: 'criar_pagamento_cartao',
        valor: 100, // valor fixo para teste
        token,
        payment_method_id: paymentMethodId,
        parcelas: installments,
        email: 'cliente@teste.com',
      })
    );
  };

  return (
    <div>
      <h2>Pagamento com Cartão</h2>
      <CardPayment
        amount={100}
        onSubmit={onSubmit}
        onError={(error) => setStatus(`Erro: ${error.message}`)}
      />
      {status && <p>{status}</p>}
    </div>
  );
}
