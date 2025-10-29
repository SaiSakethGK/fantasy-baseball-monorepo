import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Sparkles, Plus } from 'lucide-react';

export type SuggestionPlayer = {
  id: string;
  name: string;
  team: string;
  position: string;
  adp: number;
  projectedPoints: number;
};

type Props = {
  suggestions: SuggestionPlayer[];
  isUserPick: boolean;
  onDraft: (p: SuggestionPlayer) => void;
  onQueue: (p: SuggestionPlayer) => void;
  isDisabled: (p: SuggestionPlayer) => boolean;
};

export default function SuggestedPick({
  suggestions,
  isUserPick,
  onDraft,
  onQueue,
  isDisabled,
}: Props) {
  const [first, second, third] = suggestions;

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-700" />
          <h3 className="text-base">Suggested pick</h3>
        </div>
        <div className="text-xs text-muted-foreground">
          Based on projected points
        </div>
      </div>

      {/* Primary suggestion */}
      {!first ? (
        <div className="text-muted-foreground text-sm">
          No eligible players available.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted p-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline">{first.position}</Badge>
              <div>
                <div className="font-medium">{first.name}</div>
                <div className="text-muted-foreground text-sm">
                  {first.team} • ADP {first.adp}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-emerald-700 font-semibold">
                {first.projectedPoints.toFixed(2)} pts
              </div>
              <div className="flex gap-2 mt-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onQueue(first)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => onDraft(first)}
                  disabled={isDisabled(first)}
                  className={
                    isUserPick && !isDisabled(first)
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : undefined
                  }
                >
                  {isUserPick ? 'Draft' : 'Wait'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two secondary chips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {[second, third].filter(Boolean).map((p) => (
          <div
            key={p!.id}
            className="flex items-center justify-between p-2 rounded-lg border border-border bg-card"
          >
            <div className="flex items-center gap-3">
              <Badge variant="outline">{p!.position}</Badge>
              <div>
                <div className="font-medium">{p!.name}</div>
                <div className="text-muted-foreground text-sm">
                  {p!.team} • ADP {p!.adp}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-emerald-700 font-medium">
                {p!.projectedPoints.toFixed(2)} pts
              </div>
              <Button size="sm" variant="outline" onClick={() => onQueue(p!)}>
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => onDraft(p!)}
                disabled={isDisabled(p!)}
                className={
                  isUserPick && !isDisabled(p!)
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : undefined
                }
              >
                {isUserPick ? 'Draft' : 'Wait'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
