import styles from './Content.module.css';

export default function Content() {
  return (
    <div className={styles.content}>
      <h2>Configurações</h2>
      <label>Como o agente deve se comportar:</label>
      <textarea defaultValue={`Seu(a) funcionário(a) é responsável pelo atendimento e vendas da loja Saúde e Beleza.

Sua linguagem deve ser amigável, atenciosa e gentil. Responda de forma direta e eficiente, sem verbosidade.`}></textarea>
    </div>
  );
}
