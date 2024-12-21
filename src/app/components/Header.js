import Link from 'next/link';
import Image from 'next/image';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className="container">
        <nav className={styles.nav}>
          <Link href="/" className={styles.logo}>
            <Image src="/logo.svg" alt="alt" width={55} height={42} />
          </Link>
          <div className={styles.links}>
            <Link href="/espace-adherents" className={styles.link}>
              Espace Adhérents
            </Link>
            <Link href="/adhesion" className={`${styles.link} ${styles.cta}`}>
              J'adhère
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
