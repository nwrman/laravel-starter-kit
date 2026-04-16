import { ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ActivityEntry } from '@/types/demo';

type Props = {
  items: ActivityEntry[];
};

export function RecentActivity({ items }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Actividad Reciente</CardTitle>
        <button className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
          Ver todo <ExternalLink className="size-3" />
        </button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3">
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="bg-muted text-xs font-medium">
                  {entry.initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-medium">{entry.name}</span>{' '}
                  <span className="text-muted-foreground">{entry.action}</span>
                </p>
                <p className="text-xs text-muted-foreground">{entry.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
