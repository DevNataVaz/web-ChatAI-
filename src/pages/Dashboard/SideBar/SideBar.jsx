import styles from './Sidebar.module.css';

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>AnimusIA</div>
      <select className={styles.select}>
        <option>Conta agência</option>
      </select>
      <button className={styles.button}>Criar Agente AI</button>

      <nav className={styles.nav}>
        <span>CRM</span>
        <ul>
          <li>Ver conversas</li>
          <li>Ver funil</li>
          <li>Ver leads</li>
          <li>Ver métricas</li>
        </ul>
        <span>FUNCIONÁRIOS AI</span>
        <ul>
          <li>Seus Agentes AI</li>
        </ul>
      </nav>

      <div className={styles.credits}>
        <div>30 de 20K créditos</div>
        <button>Scale Up</button>
      </div>
    </aside>
  );
}
