import { Practicum } from './types';
import PracticumCard from './PracticumCard';

interface PracticumGridProps {
  practicums: Practicum[];
}

export default function PracticumGrid({ practicums }: PracticumGridProps) {
  return (
    <div className="practicum-grid">
      {practicums.map((p) => (
        <PracticumCard key={p.id} practicum={p} />
      ))}
    </div>
  );
}
