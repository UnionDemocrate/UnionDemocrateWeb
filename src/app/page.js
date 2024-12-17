import styles from './page.module.css';
import Link from 'next/link';

export default function Home() {
  return (
    <main className={styles.main}>
      <div className="container">
        <section className={`${styles.hero} fade-in`}>
          <h1>Bienvenue à l'Union Democrate</h1>
          <p>Ensemble, construisons un avenir meilleur pour tous.</p>
          <Link href="/adhesion" className="btn">
            Rejoignez-nous
          </Link>
        </section>

        <section className={styles.features}>
          <div className={styles.feature}>
            <h2>Notre Vision</h2>
            <p>Une société juste, équitable et durable pour tous les citoyens.</p>
          </div>
          <div className={styles.feature}>
            <h2>Nos Actions</h2>
            <p>Des initiatives concrètes pour améliorer la vie de chacun.</p>
          </div>
          <div className={styles.feature}>
            <h2>Votre Voix</h2>
            <p>Participez activement à la construction de notre avenir commun.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
