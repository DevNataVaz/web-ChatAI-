import React from 'react';
import styles from './DownloadPage.module.css';
import Apple from '../../assets/app-store.svg';
import Google from '../../assets/google-play.svg';
import Logo from '../../assets/Logo.svg'

function DownloadPage() {
  return (
    <div className={styles.container}>
      <h1>Bem-vindo!</h1>
      <p>Faça o download dos nossos aplicativos abaixo para continuar com o free Tier de 30 dias</p>
      <a href='https://apps.apple.com/br/app/animus-chatpro/id6744873159'>
        <div className={styles.card}>
          <div className={styles.containerImage}>
            <img src={Apple} alt=" App Store" />
          </div>
          <div className={styles.containerDownload}>
            <h3>App Store</h3>
            <h4>Disponivel na App Store.</h4>
          </div>
        </div>
      </a>
      <a href="https://play.google.com/store/apps/details?id=com.seuapp">
        <div className={styles.card}>
          <div className={styles.containerImage}>
            <img src={Google} alt="Google play" />
          </div>
          <div className={styles.containerDownload}>
            <h3>Google Play</h3>
            <h4>Disponível na Play Store</h4>
          </div>
        </div>
      </a>
      <div className={styles.logo}>
        <img src={Logo} alt="logo" />
      </div>
    </div>
  );

}

export default DownloadPage;