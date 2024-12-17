import styles from './Footer.module.css';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.content}>
          <div className={styles.logo}>
            Union Democrate
          </div>
          <nav className={styles.nav}>
            <Link href="/about" className={styles.link}>À propos</Link>
            <Link href="/contact" className={styles.link}>Contact</Link>
            <Link href="/privacy" className={styles.link}>Politique de confidentialité</Link>
          </nav>
        </div>
        <div className={styles.copyright}>
          © {new Date().getFullYear()} Union Democrate. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}

