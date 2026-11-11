import type { LucideIcon } from 'lucide-react';
import { StatCard } from '@/components/demo/stat-card';
import type { KpiValue } from '@/types/demo';

export type KpiCard = {
  key: string;
  title: string;
  icon: LucideIcon;
};

type Props = {
  /** What each card is: known before any data, so its title and icon render at once. */
  cards: KpiCard[];
  /** The figures, matched on `key`; undefined while the deferred prop loads. */
  values?: KpiValue[];
  className: string;
};

/** A panel page's row of stat cards (docs/adr/0019): only the figures wait for the server. */
export function KpiRow({ cards, values, className }: Props) {
  return (
    <div className={className}>
      {cards.map((card) => (
        <StatCard
          key={card.key}
          title={card.title}
          icon={card.icon}
          stat={values?.find((value) => value.key === card.key)}
        />
      ))}
    </div>
  );
}
