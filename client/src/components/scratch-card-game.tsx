import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScratchCardGameProps {
  prizeLabel: string;
  prizeAmount: number;
  category?: string;
  onComplete?: () => void;
  onPlayAgain?: () => void;
}

// Tema visual para cada categoria
const themeConfig: Record<string, {
  icons: string[];
  colors: string[];
}> = {
  "gold-rush": {
    icons: ["💰", "💎", "🪙", "✨", "🏆", "⭐"],
    colors: ["#FFD700", "#FFA500", "#FF8C00"]
  },
  "lucky-animals": {
    icons: ["🐼", "🦊", "🐯", "🦁", "🐻", "🐨"],
    colors: ["#4ECDC4", "#44A08D", "#FF6B6B"]
  },
  "vegas-lights": {
    icons: ["🎰", "🎲", "🃏", "🎪", "🎯", "🔔"],
    colors: ["#FF0080", "#7928CA", "#FF4D4D"]
  },
  "mythic-gods": {
    icons: ["⚡", "🔥", "⚔️", "👑", "🛡️", "💫"],
    colors: ["#667EEA", "#764BA2", "#F093FB"]
  },
  "crypto-scratch": {
    icons: ["₿", "🚀", "📈", "💸", "💰", "⚡"],
    colors: ["#F7931A", "#4A90E2", "#16FF4C"]
  },
  "candy-mania": {
    icons: ["🍭", "🍬", "🍫", "🧁", "🍰", "🎂"],
    colors: ["#FF69B4", "#FF1493", "#FFB6C1"]
  }
};

type GridCell = {
  icon: string;
  revealed: boolean;
};

export function ScratchCardGame({ prizeLabel, prizeAmount, category = "gold-rush", onComplete, onPlayAgain }: ScratchCardGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [winningRow, setWinningRow] = useState<number | null>(null);
  const { toast } = useToast();
  
  const theme = themeConfig[category] || themeConfig["gold-rush"];
  const wonPrize = prizeAmount > 0;

  // Gerar grid 3x3 (3 linhas, 3 colunas)
  useEffect(() => {
    const newGrid: GridCell[][] = [];
    let luckyRow = -1;
    
    if (wonPrize) {
      luckyRow = Math.floor(Math.random() * 3);
      setWinningRow(luckyRow);
    } else {
      setWinningRow(null);
    }
    
    for (let row = 0; row < 3; row++) {
      const rowCells: GridCell[] = [];
      
      if (wonPrize && row === luckyRow) {
        const winIcon = theme.icons[Math.floor(Math.random() * theme.icons.length)];
        for (let col = 0; col < 3; col++) {
          rowCells.push({ icon: winIcon, revealed: false });
        }
      } else {
        const shuffled = [...theme.icons].sort(() => Math.random() - 0.5);
        for (let col = 0; col < 3; col++) {
          rowCells.push({ icon: shuffled[col], revealed: false });
        }
      }
      
      newGrid.push(rowCells);
    }
    
    setGrid(newGrid);
  }, [wonPrize, theme]);

  // Ajustar canvas para cobrir 100% do grid
  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      const gridEl = gridRef.current;
      if (!canvas || !gridEl) return;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      const rect = gridEl.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, theme.colors[0]);
      gradient.addColorStop(0.5, theme.colors[1]);
      gradient.addColorStop(1, theme.colors[2] || theme.colors[0]);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 8;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.font = `bold ${Math.min(canvas.width, canvas.height) / 10}px Inter`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("RASPE AQUI", canvas.width / 2, canvas.height / 2);
    };

    // Aguardar renderização do DOM antes de calcular tamanho
    setTimeout(updateCanvasSize, 0);
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [theme, grid, isRevealed]);

  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (x - rect.left) * scaleX;
    const canvasY = (y - rect.top) * scaleY;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, 60, 0, Math.PI * 2);
    ctx.fill();

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparent = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparent++;
    }

    const percent = (transparent / (pixels.length / 4)) * 100;
    setScratchPercent(percent);

    if (percent > 60 && !isRevealed) {
      revealAll();
    }
  };

  const revealAll = () => {
    setIsRevealed(true);
    setScratchPercent(100);
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    setTimeout(() => {
      if (wonPrize) {
        toast({
          title: "🎉 VOCÊ GANHOU!",
          description: `${prizeLabel} - R$ ${prizeAmount.toFixed(2).replace('.', ',')}`,
          duration: 5000,
        });
      } else {
        toast({
          title: "😔 Não foi dessa vez",
          description: "Continue tentando! A sorte está chegando.",
          variant: "destructive",
          duration: 4000,
        });
      }
      
      if (onComplete) {
        setTimeout(onComplete, 500);
      }
    }, 300);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsScratching(true);
    scratch(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isScratching) scratch(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    setIsScratching(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsScratching(true);
    const touch = e.touches[0];
    scratch(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (isScratching) {
      const touch = e.touches[0];
      scratch(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    setIsScratching(false);
  };

  return (
    <Card className="p-4 md:p-6 max-w-2xl md:mx-auto">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">
            {isRevealed ? "Resultado" : "Raspe para revelar"}
          </h3>
          {scratchPercent > 0 && !isRevealed && (
            <span className="text-sm text-muted-foreground">
              {scratchPercent.toFixed(0)}%
            </span>
          )}
        </div>
        {scratchPercent > 30 && !isRevealed && (
          <Button
            variant="outline"
            size="sm"
            onClick={revealAll}
            className="text-xs"
            data-testid="button-reveal-all"
          >
            Revelar Tudo
          </Button>
        )}
      </div>

      <div className="relative">
        {/* Container do grid com canvas sobreposto */}
        <div 
          ref={gridRef}
          className="relative rounded-2xl overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-card to-muted p-3 md:p-4"
        >
          {/* Grid de ícones 3x3 */}
          <div className="grid grid-rows-3 gap-2 md:gap-3">
            {grid.map((row, rowIndex) => (
              <div 
                key={rowIndex} 
                className={`grid grid-cols-3 gap-2 md:gap-3 p-2 rounded-xl transition-all duration-500 ${
                  isRevealed && rowIndex === winningRow 
                    ? 'bg-primary/20 ring-4 ring-primary shadow-2xl shadow-primary/50' 
                    : 'bg-card/50'
                }`}
              >
                {row.map((cell, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`aspect-square rounded-xl flex items-center justify-center text-3xl md:text-4xl transition-all duration-500 ${
                      isRevealed && rowIndex === winningRow
                        ? 'bg-primary/30 scale-110'
                        : 'bg-muted/50'
                    }`}
                    style={{
                      perspective: '1000px',
                    }}
                  >
                    <span 
                      className="emoji-3d"
                      style={{
                        display: 'inline-block',
                        animation: isRevealed && rowIndex === winningRow 
                          ? 'bounce3d 0.6s ease-in-out infinite, glow 2s ease-in-out infinite' 
                          : 'float3d 3s ease-in-out infinite',
                        animationDelay: `${(rowIndex * 3 + colIndex) * 0.1}s`,
                      }}
                    >
                      {cell.icon}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Canvas de raspar - cobre 100% do container pai */}
          {!isRevealed && (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full cursor-crosshair touch-none z-10"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          )}
        </div>
      </div>

      {isRevealed && wonPrize && (
        <div className="mt-6 text-center animate-in fade-in duration-500">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Trophy className="h-6 w-6 md:h-8 md:w-8 text-primary animate-bounce" />
            <p className="text-xl md:text-2xl font-bold text-primary">
              LINHA {(winningRow || 0) + 1} COMBINOU!
            </p>
            <Trophy className="h-6 w-6 md:h-8 md:w-8 text-primary animate-bounce" />
          </div>
          <p className="text-base md:text-lg font-semibold text-primary">
            R$ {prizeAmount.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-xs md:text-sm text-muted-foreground mt-2 mb-4">
            🎉 Parabéns! O valor foi creditado na sua carteira
          </p>
          {onPlayAgain && (
            <Button
              onClick={onPlayAgain}
              className="w-full md:w-auto"
              size="lg"
              data-testid="button-jogar-novamente"
            >
              Jogar Novamente
            </Button>
          )}
        </div>
      )}

      {isRevealed && !wonPrize && (
        <div className="mt-6 text-center animate-in fade-in duration-500">
          <p className="text-base md:text-lg font-semibold text-muted-foreground mb-2">
            Nenhuma linha combinou
          </p>
          <p className="text-xs md:text-sm text-muted-foreground mb-4">
            Continue tentando! A sorte está próxima 🍀
          </p>
          {onPlayAgain && (
            <Button
              onClick={onPlayAgain}
              className="w-full md:w-auto"
              size="lg"
              data-testid="button-jogar-novamente"
            >
              Tentar Novamente
            </Button>
          )}
        </div>
      )}

      <style>{`
        @keyframes float3d {
          0%, 100% {
            transform: perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px);
          }
          25% {
            transform: perspective(1000px) rotateY(5deg) rotateX(5deg) translateZ(10px);
          }
          50% {
            transform: perspective(1000px) rotateY(0deg) rotateX(-5deg) translateZ(20px);
          }
          75% {
            transform: perspective(1000px) rotateY(-5deg) rotateX(5deg) translateZ(10px);
          }
        }

        @keyframes bounce3d {
          0%, 100% {
            transform: perspective(1000px) rotateY(0deg) translateY(0) scale(1);
          }
          50% {
            transform: perspective(1000px) rotateY(360deg) translateY(-10px) scale(1.1);
          }
        }

        @keyframes glow {
          0%, 100% {
            filter: drop-shadow(0 0 5px rgba(22, 255, 76, 0.5));
          }
          50% {
            filter: drop-shadow(0 0 20px rgba(22, 255, 76, 0.8));
          }
        }

        .emoji-3d {
          transform-style: preserve-3d;
        }
      `}</style>
    </Card>
  );
}
