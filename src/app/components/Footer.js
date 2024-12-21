'use client'

import styles from './Footer.module.css'
import Image from 'next/image'
import { Facebook, Twitter, Instagram, Send } from 'lucide-react'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div>

            <div className={styles.logo}><Image src="/logo.svg" alt="alt" width={52} height={42} /><span className="">Union démocrate</span></div>
            <div className={styles.organization}>
              Organisation Universitaire<br />
              & Parti National
            </div>
          </div>

          <div className={styles.links}>
            <h3>Liens</h3>
            <ul className={styles.linkList}>
              <li><a href="/accueil">Accueil</a></li>
              <li><a href="/projet-etudiant">Projet étudiant</a></li>
              <li><a href="/programme-national">Programme National</a></li>
              <li><a href="/financement">Financement</a></li>
            </ul>
          </div>

          <div className={styles.contact}>
            <h3>Nous contacter</h3>
            <ul className={styles.linkList}>
              <li>Phone (en formation)</li>
              <li>contact@uniondemocrate.com</li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <div className={styles.legal}>
            <span>© 2024 UNION DÉMOCRATE</span>
            <a href="https://ud-ld.framer.website/mentions-légales">Mentions légales</a>
            <a href="https://ud-ld.framer.website/ppd">Politique Données</a>
            <a href="https://ud-ld.framer.website/cgu ">CGU</a>
          </div>

          <div className={styles.social}>
            <a href="#" aria-label="Twitter"><Twitter size={20} /></a>
            <a href="#" aria-label="Telegram"><Send size={20} /></a>
            <a href="#" aria-label="Facebook"><Facebook size={20} /></a>
            <a href="#" aria-label="Instagram"><Instagram size={20} /></a>
          </div>
        </div>
      </div>
    </footer>
  )
}

