import type { MoFeatures } from '@/lib/types';

interface MoSummaryProps {
  mo: MoFeatures;
}

export function MoSummary({ mo }: MoSummaryProps) {
  const flags = [
    mo.num_autores ? `${mo.num_autores} autor(es)` : null,
    mo.arma_fuego ? 'arma de fuego' : null,
    mo.arma_blanca ? 'arma blanca' : null,
    mo.moto ? 'uso de moto' : null,
    mo.inhibidor ? 'inhibidor' : null,
  ].filter(Boolean);

  if (flags.length === 0) return null;

  return (
    <div className="resumen-text">
      <b style={{ color: 'var(--text)' }}>MO detectado:</b> {flags.join(', ')}
    </div>
  );
}
