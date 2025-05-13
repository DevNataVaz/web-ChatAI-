// import React from 'react';
// import styles from './Tabs.module.css';

// export default function Tabs({ activeTab, setActiveTab }) {
//   const tabs = [
//     { id: 'instrucoes', label: 'Instruções' },
//     { id: 'configuracoes', label: 'Configurações' },
//     { id: 'perfil', label: 'Perfil da empresa' }
//   ];
  
//   return (
//     <div className={styles.tabsContainer}>
//       <div className={styles.tabs}>
//         {tabs.map((tab) => (
//           <button 
//             key={tab.id} 
//             className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
//             onClick={() => setActiveTab(tab.id)}
//           >
//             {tab.label}
//             {activeTab === tab.id && <div className={styles.activeIndicator}></div>}
//           </button>
//         ))}
//       </div>
      
//       <button className={styles.paymentButton} onClick={() => window.location.href = '/planos'}>
//         <span className={styles.paymentIcon}>
//           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//             <path d="M21 4H3C1.89543 4 1 4.89543 1 6V18C1 19.1046 1.89543 20 3 20H21C22.1046 20 23 19.1046 23 18V6C23 4.89543 22.1046 4 21 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//             <path d="M1 10H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//           </svg>
//         </span>
//         <span>Planos</span>
//       </button>
//     </div>
//   );
// }