import styles from './Tabs.module.css';

export default function Tabs() {
  return (
    <div className={styles.tabs}>
      {['Instruções', 'Configurações', 'Perfil da empresa'].map((tab, index) => (
        <button key={index} className={index === 1 ? styles.active : ''}>
          {tab}
        </button>
      ))}
    </div>
  );
}
