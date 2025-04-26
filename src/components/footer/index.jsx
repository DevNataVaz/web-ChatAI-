import React from 'react';
import styles from './Footer.module.css';
import AnimusLogo from '../../assets/Logo.svg'; 
import Celular from '../../assets/icons/celular.svg'
import Email from '../../assets/icons/mail.svg'
import { Smartphone, Mail } from 'lucide-react';


const Footer = () => {
  return (
    <footer className={styles.footer} id='contato'>
      <div className={styles.container}>
        {/* Seção do Logo e Slogan */}
        <div className={styles.brandSection}>
          <div className={styles.logoContainer}>
            <img src={AnimusLogo} alt="Animus Logo" className={styles.logo} />
            <h2 className={styles.brandName}>AnimusIA.</h2>
          </div>
          <p className={styles.slogan}>
            Aqui, transformamos desafios em soluções personalizadas, impulsionando seu negócio para o sucesso com inovação e eficiência.
          </p>
        </div>

        {/* Seção da Empresa */}
        <div className={styles.linksSection}>
          <h3 className={styles.sectionTitle}>Empresa</h3>
          <ul className={styles.linksList}>
            <li><a href="#">Início</a></li>
            <li><a href="#">Sobre</a></li>
            <li>
              <div className={styles.planLinkContainer}>
                <a href="#">Planos</a>
                <span className={styles.newBadge}>New</span>
              </div>
            </li>
            <li><a href="#">Contato</a></li>
          </ul>
        </div>

        {/* Seção de Contato */}
        <div className={styles.linksSection}>
          <h3 className={styles.sectionTitle}>Contato</h3>
          <ul className={styles.linksList}>
            <li>
              <a href="tel:+556195069-8966" className={styles.contactLink}>
              <Smartphone /> +55 (61) 95069-8966
              </a>
            </li>
            <li>
              <a href="mailto:contato@animus.com.br" className={styles.contactLink}>
              <Mail /> contato@animus.com.br 
              </a>
            </li>
          </ul>
        </div>

        {/* Seção de Políticas */}
        <div className={styles.linksSection}>
          <h3 className={styles.sectionTitle}>Políticas</h3>
          <ul className={styles.linksList}>
            <li><a href="#">Termos de uso</a></li>
            <li><a href="#">Política de Privacidade</a></li>
          </ul>
        </div>
      </div>

      {/* Seção de Copyright */}
      <div className={styles.copyrightSection}>
        <div className={styles.copyrightContainer}>
          <p className={styles.copyright}>
            © 2025 Copyright – AnimusIA Todos os direitos reservados.
          </p>
          
          {/* Ícones de Redes Sociais */}
          <div className={styles.socialIcons}>
            <a href="#" className={styles.socialIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.icon}>
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                <path d="M12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4z"/>
              </svg>
            </a>
            <a href="#" className={styles.socialIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.icon}>
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
              </svg>
            </a>
            <a href="#" className={styles.socialIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.icon}>
                <path d="M16.5 5.5h2.5v-2.5c-.4-.1-1.9-.5-3.6-.5-3.6 0-6 2.2-6 6.2v3.8h-4v4.8h4v12.2h5v-12.2h3.9l.6-4.8h-4.5v-3.3c0-1.4.4-2.4 2.4-2.4z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;