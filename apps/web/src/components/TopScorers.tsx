import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { apiGet } from '../lib/api';
import { Zap } from 'lucide-react';

type PlayerRow = {
  id: string;
  name: string;
  team: string;
  position: string;
  points: number;
};

export default function TopScorers() {
  const [rows, setRows] = useState<PlayerRow[]>([]);

  useEffect(() => {
    let mounted = true;
    let iv: number | undefined;

    async function fetchOnce() {
      try {
        const data = await apiGet<PlayerRow[]>('/api/scoring/top');
        if (!mounted) return;
        setRows(Array.isArray(data) ? data : []);
      } catch {
      }
    }

    fetchOnce();
    iv = window.setInterval(fetchOnce, 4000);

    return () => {
      mounted = false;
      if (iv) window.clearInterval(iv);
    };
  }, []);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-5">
        <Zap className="w-5 h-5 text-emerald-700" />
        <h3 className="text-base">Top 5 Players (Projected)</h3>
      </div>

      {rows.length === 0 ? (
        <div className="text-muted-foreground text-sm">
          No player data yet.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((p, idx) => (
            <div
              key={p.id}
              className={`flex items-center justify-between p-2 rounded border border-border ${
                idx === 0 ? 'bg-muted' : 'bg-card'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground w-6 text-right text-sm">
                  {idx + 1}.
                </span>
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {p.team} • {p.position}
                  </div>
                </div>
              </div>
              <div className="text-emerald-700 font-medium">
                {p.points.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
