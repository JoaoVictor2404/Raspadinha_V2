import { useEffect, useRef, useState } from "react";
import { Trophy, TrendingUp } from "lucide-react";

interface TickerItem {
  id: string;
  username: string;
  prize: string;
  type: string;
  timestamp: Date;
}

export function LiveTicker() {
  const [items] = useState<TickerItem[]>([
    { id: "1", username: "João V.", prize: "R$ 500,00", type: "PIX", timestamp: new Date() },
    { id: "2", username: "Maria S.", prize: "R$ 1.000,00", type: "PIX", timestamp: new Date() },
    { id: "3", username: "Pedro A.", prize: "R$ 50,00", type: "PIX", timestamp: new Date() },
    { id: "4", username: "Ana L.", prize: "R$ 200,00", type: "PIX", timestamp: new Date() },
    { id: "5", username: "Carlos M.", prize: "R$ 2.000,00", type: "PIX", timestamp: new Date() },
    { id: "6", username: "Juliana R.", prize: "R$ 100,00", type: "PIX", timestamp: new Date() },
  ]);

  const tickerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const ticker = tickerRef.current;
    if (!ticker) return;

    let animationId: number;
    let scrollPosition = 0;

    const animate = () => {
      if (!isPaused && ticker) {
        scrollPosition += 0.5;
        if (scrollPosition >= ticker.scrollWidth / 2) {
          scrollPosition = 0;
        }
        ticker.scrollLeft = scrollPosition;
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [isPaused]);

  return (
    <div className="w-full border-y border-border bg-card/50 py-3">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-primary">AO VIVO</span>
          </div>
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        
        <div
          ref={tickerRef}
          className="flex gap-4 overflow-x-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Duplicate items for infinite scroll effect */}
          {[...items, ...items].map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2 min-w-fit"
            >
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <Trophy className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{item.username}</span>
                <span className="text-xs text-muted-foreground">
                  Ganhou <span className="text-primary font-semibold">{item.prize}</span> • {item.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
