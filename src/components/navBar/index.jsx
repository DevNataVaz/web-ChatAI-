import React, { useState } from "react";
import Logo from "../../assets/logo-Aa.png"
import styles from './navBar.module.css'
import AuthModal from '../../components/modal';
import Login from '../../pages/Login/index';
import { useNavigate } from "react-router-dom";


function NavBar() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const toggleMenu = () => setIsOpen(!isOpen);

    function scrollToSection(id) {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }

    const [showModal, setShowModal] = useState(false);


    return (

        <div className={styles.container}>
            <div className={styles.containerLogo} data-aos="fade-right" data-aos-delay="900">
                <img src={Logo} alt="logo" />
            </div>
            <div className={styles.menuContainer} data-aos="fade-down" data-aos-delay="500">
                <ul className={`${styles.navList} ${isOpen ? styles.open : ''}`}>
                    <li className={`${styles.navItem}  ${styles.active} `} onClick={() => scrollToSection("header")}>Inicio</li>
                    <li className={styles.navItem} onClick={() => scrollToSection("dashboard")}>Sobre</li>
                    <li className={styles.navItem} onClick={() => scrollToSection("planos")}>Planos</li>
                    <li className={styles.navItem} onClick={() => scrollToSection("feedbacks")}>Feedbacks</li>
                    <li className={styles.navItem} onClick={() => scrollToSection("contato")}>Contato</li>
                </ul>


            </div>
            <div className={styles.containerbuttons}>
                <div className={styles.containerbuttonLogin}>
                    <button className={styles.buttonLogin} onClick={() => navigate('/login')}>Login</button>
                </div>
                <div className={styles.containerButton} >

                    <button className={styles.button} onClick={() => navigate('/registro')}>EXPERIMENTE GRÁTIS</button>
                    {/* {showModal && <AuthModal onClose={() => setShowModal(false)} />} */}
                </div>
            </div>
            <div className={styles.hamburger} onClick={toggleMenu}>
                <div className={styles.bar}></div>
                <div className={styles.bar}></div>
                <div className={styles.bar}></div>
            </div>
        </div>

    );


}

export default NavBar;