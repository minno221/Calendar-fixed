// pages/_app.js 위치에 넣어주세요.
import { IBM_Plex_Sans_KR } from 'next/font/google';
import '../styles/globals.css';

const font = IBM_Plex_Sans_KR({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
});

export default function App({ Component, pageProps }) {
  return (
    <div className={font.className}>
      <Component {...pageProps} />
    </div>
  );
}
