import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { apiGet } from '../lib/api';
import { Trophy } from 'lucide-react';

type TeamRow = { userId: string; name: string; points: number };

export default function Leaderboard() {
  const [rows, setRows] = useState<TeamRow[]>([]);

  useEffect(() => {
    let mounted = true;
    let iv: number | undefined;

    async function fetchOnce() {
      try {
        const data = await apiGet<TeamRow[]>('/api/teams');
        if (!mounted) return;
        setRows(Array.isArray(data) ? data : []);
      } catch {
      }
    }

    fetchOnce();
    iv = window.setInterval(fetchOnce, 2000);

    return () => {
      mounted = false;
      if (iv) window.clearInterval(iv);
    };
  }, []);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <Trophy className="w-5 h-5 text-emerald-700" />
        <h3 className="text-base">Leaderboard</h3>
      </div>

      {rows.length === 0 ? (
        <div className="text-muted-foreground text-sm">No teams yet.</div>
      ) : (
        <div className="space-y-2">
          {rows.map((t, idx) => (
            <div
              key={t.userId}
              className={`flex items-center justify-between p-2 rounded border border-border ${
                idx === 0 ? 'bg-muted' : 'bg-card'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground w-6 text-right text-sm">
                  {idx + 1}.
                </span>
                <span className="font-medium">{t.name}</span>
              </div>
              <div className="text-emerald-700 font-medium">{t.points.toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
