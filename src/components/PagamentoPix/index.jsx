import React, { useState } from 'react';
import exemploImagem from '../../assets/qr-code.png';
import usePagamentoPix from '../../hooks/Pagamentos.pix';

export default function PagamentoPix() {
  const [qrCode, setQrCode] = useState(null);
  const [erro, setErro] = useState(null);

  const { solicitarPagamento } = usePagamentoPix(
    (pix) => setQrCode(pix.qr_code_base64),
    (err) => setErro(err)
  );

  const handleClick = () => {
    solicitarPagamento({
      valor: 100,
      email: 'cliente@teste.com',
      nome: 'Cliente Teste',
    });
  };

  return (
    <div>
      <button onClick={handleClick}>Gerar Pix</button>
      {qrCode && <img src={exemploImagem} alt="Exemplo" /> }
      {erro && <p style={{ color: 'red' }}>{erro}</p>}
      {/* <img src={`data:image/png;base64,${qrCode}`} alt="QR Code Pix" /> */}
    </div>
  );
}
