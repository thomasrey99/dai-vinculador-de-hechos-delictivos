export function LoadingScreen() {
  return (
    <div className="loading-screen loading-screen--logo" role="status" aria-live="polite">
      <img
        className="loading-logo"
        src="/escudo-dai.png"
        alt="Escudo de la División Análisis de Imágenes"
      />
      <div>Cargando y vinculando hechos desde las planillas…</div>
    </div>
  );
}