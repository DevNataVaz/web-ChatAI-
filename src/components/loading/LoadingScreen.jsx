// components/LoadingScreen.js
import React from 'react';
import styles from './LoadingScreen.module.css';
import LogoRoxa from '../../assets/logo-roxa.png';

const LoadingScreen = () => {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingContent}>
        <div className={styles.loadingLogo}>
         <img style={{ width: '50px', height: '50px' }} src={LogoRoxa} alt="logo" />
        </div>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Carregando...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;