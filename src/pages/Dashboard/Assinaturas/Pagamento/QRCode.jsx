import React, { useEffect, useRef } from 'react';

/**
 * Componente QR Code usando biblioteca QR.js
 * Para usar este componente, instale: npm install qrcode
 */

const QRCodeComponent = ({ value, size = 200, className = '' }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const generateQR = async () => {
      if (!value || !canvasRef.current) return;

      try {
        // Importação dinâmica do QRCode
        const QRCode = await import('qrcode');
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Limpar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Gerar QR Code
        await QRCode.toCanvas(canvas, value, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        });
      } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
        
        // Fallback: desenhar placeholder
        drawPlaceholder();
      }
    };

    const drawPlaceholder = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Limpar e definir fundo branco
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);
      
      // Desenhar borda
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, size - 20, size - 20);
      
      // Desenhar cantos do QR Code
      const cornerSize = 30;
      const cornerOffset = 20;
      
      ctx.fillStyle = '#374151';
      ctx.lineWidth = 3;
      
      // Canto superior esquerdo
      ctx.strokeRect(cornerOffset, cornerOffset, cornerSize, cornerSize);
      ctx.fillRect(cornerOffset + 8, cornerOffset + 8, 14, 14);
      
      // Canto superior direito
      ctx.strokeRect(size - cornerOffset - cornerSize, cornerOffset, cornerSize, cornerSize);
      ctx.fillRect(size - cornerOffset - cornerSize + 8, cornerOffset + 8, 14, 14);
      
      // Canto inferior esquerdo
      ctx.strokeRect(cornerOffset, size - cornerOffset - cornerSize, cornerSize, cornerSize);
      ctx.fillRect(cornerOffset + 8, size - cornerOffset - cornerSize + 8, 14, 14);
      
      // Centro
      const centerSize = 20;
      const centerX = (size - centerSize) / 2;
      const centerY = (size - centerSize) / 2;
      ctx.fillRect(centerX, centerY, centerSize, centerSize);
      
      // Texto
      ctx.fillStyle = '#6B7280';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('QR Code', size / 2, size - 30);
      ctx.fillText('PIX', size / 2, size - 15);
    };

    generateQR();
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        background: '#FFFFFF'
      }}
    />
  );
};

/**
 * Hook personalizado para gerar QR Code como Data URL
 */
export const useQRCode = (value, options = {}) => {
  const [qrCodeUrl, setQrCodeUrl] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const generateQR = async () => {
      if (!value) {
        setQrCodeUrl(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const QRCode = await import('qrcode');
        
        const url = await QRCode.toDataURL(value, {
          width: options.size || 200,
          margin: options.margin || 2,
          color: {
            dark: options.darkColor || '#000000',
            light: options.lightColor || '#FFFFFF'
          },
          errorCorrectionLevel: options.errorLevel || 'M'
        });
        
        setQrCodeUrl(url);
      } catch (err) {
        console.error('Erro ao gerar QR Code:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    generateQR();
  }, [value, options]);

  return { qrCodeUrl, loading, error };
};

/**
 * Componente QR Code usando hook
 */
export const QRCodeImage = ({ 
  value, 
  size = 200, 
  className = '',
  onError,
  onLoad 
}) => {
  const { qrCodeUrl, loading, error } = useQRCode(value, { size });

  React.useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  React.useEffect(() => {
    if (qrCodeUrl && onLoad) {
      onLoad();
    }
  }, [qrCodeUrl, onLoad]);

  if (loading) {
    return (
      <div 
        className={className}
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F3F4F6',
          borderRadius: '8px',
          border: '1px solid #E5E7EB'
        }}
      >
        <div style={{ textAlign: 'center', color: '#6B7280' }}>
          <div style={{ 
            width: '20px', 
            height: '20px', 
            border: '2px solid #E5E7EB',
            borderTop: '2px solid #3B82F6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 8px'
          }} />
          <small>Gerando QR Code...</small>
        </div>
      </div>
    );
  }

  if (error || !qrCodeUrl) {
    return (
      <div 
        className={className}
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FEF2F2',
          borderRadius: '8px',
          border: '1px solid #FCA5A5',
          color: '#DC2626',
          textAlign: 'center'
        }}
      >
        <div>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
          <small>Erro ao gerar QR Code</small>
        </div>
      </div>
    );
  }

  return (
    <img
      src={qrCodeUrl}
      alt="QR Code"
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '8px',
        border: '1px solid #E5E7EB'
      }}
    />
  );
};

// Adicionar animação CSS globalmente
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default QRCodeComponent;

/**
 * Exemplo de uso:
 * 
 * // Usando o componente Canvas
 * <QRCodeComponent value="00020126580014br.gov.bcb.pix0136..." size={200} />
 * 
 * // Usando o componente Image com hook
 * <QRCodeImage 
 *   value="00020126580014br.gov.bcb.pix0136..." 
 *   size={200}
 *   onLoad={() => console.log('QR Code carregado')}
 *   onError={(err) => console.error('Erro:', err)}
 * />
 * 
 * // Usando apenas o hook
 * const { qrCodeUrl, loading, error } = useQRCode(pixCode);
 */