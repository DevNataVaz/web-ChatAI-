// // components/ContextGuard.jsx
// import React from 'react';
// import { useApp } from '../../../context/AppContext';


// // Estilos como objeto para evitar o erro de jsx
// const styles = {
//   contextLoading: {
//     display: 'flex',
//     flexDirection: 'column',
//     alignItems: 'center',
//     justifyContent: 'center',
//     minHeight: '200px',
//     gap: '1rem',
//     background: 'rgba(16, 20, 50, 0.4)',
//     borderRadius: '16px',
//     border: '1px solid rgba(255, 255, 255, 0.05)',
//     margin: '1rem',
//     padding: '2rem',
//   },
//   loadingSpinner: {
//     width: '32px',
//     height: '32px',
//     border: '3px solid #e5e7eb',
//     borderTop: '3px solid #8A63FF',
//     borderRadius: '50%',
//     animation: 'spin 1s linear infinite',
//   },
//   text: {
//     color: '#8A8D9F',
//     fontSize: '14px',
//   }
// };

// // Adicione o keyframe do spin ao CSS global
// const styleSheet = `
//   @keyframes spin {
//     0% { transform: rotate(0deg); }
//     100% { transform: rotate(360deg); }
//   }
// `;

// // Insere os estilos no document se ainda não existir
// if (typeof document !== 'undefined' && !document.getElementById('context-guard-styles')) {
//   const style = document.createElement('style');
//   style.id = 'context-guard-styles';
//   style.textContent = styleSheet;
//   document.head.appendChild(style);
// }

// // Componente que garante que as funções necessárias estejam disponíveis
// export function ContextGuard({ children, requiredFunctions = [] }) {
//   const context = useApp();
  
//   // Lista padrão de funções necessárias
//   const defaultRequired = ['Criptografar', 'Descriptografar'];
//   const required = requiredFunctions.length > 0 ? requiredFunctions : defaultRequired;
  
//   // Verificar se todas as funções necessárias estão disponíveis
//   const isReady = required.every(key => context && context[key]);
  
//   if (!isReady) {
//     return (
//       <div style={styles.contextLoading}>
//         <div style={styles.loadingSpinner}></div>
//         <p style={styles.text}>Inicializando sistema...</p>
//       </div>
//     );
//   }
  
//   return children;
// }

// // HOC para componentes que precisam de proteção
// export function withContextGuard(WrappedComponent, requiredFunctions = []) {
//   return function GuardedComponent(props) {
//     return (
//       <ContextGuard requiredFunctions={requiredFunctions}>
//         <WrappedComponent {...props} />
//       </ContextGuard>
//     );
//   };
// }

// // Exemplo de uso com um componente
// export const GuardedConversationsPanel = withContextGuard(
//   React.lazy(() => import('./ConversationsPanel')),
//   ['Criptografar', 'Descriptografar', 'socketConnected']
// );