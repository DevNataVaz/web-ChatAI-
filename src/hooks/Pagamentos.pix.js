import { useEffect, useRef } from 'react';

export default function usePagamentoPix(onPixGerado, onErro) {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = new WebSocket('ws://localhost:3001');

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'pix_gerado') {
        onPixGerado(data);
      } else if (data.type === 'erro') {
        onErro(data.erro);
      }
    };

    return () => socketRef.current?.close();
  }, []);

  const solicitarPagamento = (dados) => {
    socketRef.current?.send(
      JSON.stringify({
        type: 'criar_pagamento_pix',
        valor: dados.valor,
        email: dados.email,
        nome: dados.nome,
      })
    );
  };

  return { solicitarPagamento };
}
