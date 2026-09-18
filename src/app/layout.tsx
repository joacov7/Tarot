import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tarot Híbrido · Lecturas con IA revisadas por tarotistas',
  description:
    'Lecturas de tarot como experiencia espiritual, recreativa y de reflexión: un borrador ' +
    'generado por IA y personalizado por un tarotista humano. No garantizamos predicciones.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
