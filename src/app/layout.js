import Header from './components/Header';
import Footer from './components/Footer';
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet" />
        <meta name="description" content="Votre description du site ici." />
      </head>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}

