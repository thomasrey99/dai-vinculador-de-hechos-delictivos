import './globals.css';

export const metadata = {
  title: 'Vinculación de Hechos Delictivos — CABA',
  description: 'Dashboard interno de vinculación de hechos delictivos',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
