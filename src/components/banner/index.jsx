import ImageBanner from '../../assets/banner.jpeg'
import styles from './Banner.module.css'


function Banner() {
    return ( 
        <div className={styles.container} data-aos="flip-right" data-aos-delay="300">
        <img src={ImageBanner} className={styles.image} alt="banner" />
        </div>
     );
}

export default Banner;