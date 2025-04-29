import styles from './Header.module.css';

export default function Header() {
  return (
    <div className={styles.header}>
      <img src="https://via.placeholder.com/40" alt="avatar" />
      <div>
        <strong>Flora</strong>
        <div>Saúde e Beleza<br />ID do Agente: 00000 - 570 mensagens trocadas</div>
      </div>
    </div>
  );
}
