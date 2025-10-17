import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Raspadinha } from "@shared/schema";

interface ScratchCardProps {
  raspadinha: Raspadinha;
}

export function ScratchCard({ raspadinha }: ScratchCardProps) {
  const price = parseFloat(raspadinha.price);
  const maxPrize = parseFloat(raspadinha.maxPrize);

  return (
    <div className="group relative overflow-hidden rounded-lg border border-card-border bg-card transition-all hover-elevate active-elevate-2">
      {/* Badge */}
      {raspadinha.badge && (
        <div className="absolute top-3 right-3 z-10">
          <Badge
            variant="default"
            className="bg-warning text-warning-foreground border-0 rounded-sm text-xs font-semibold"
            data-testid={`badge-${raspadinha.slug}`}
          >
            {raspadinha.badge}
          </Badge>
        </div>
      )}

      {/* Image */}
      <div className="aspect-video w-full overflow-hidden bg-muted">
        {raspadinha.imageUrl ? (
          <img
            src={raspadinha.imageUrl}
            alt={raspadinha.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl">🎰</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-medium text-base mb-1" data-testid={`title-${raspadinha.slug}`}>
            {raspadinha.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            PRÊMIOS ATÉ{" "}
            <span className="text-primary font-semibold">
              R$ {maxPrize.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-2xl font-bold text-primary" data-testid={`price-${raspadinha.slug}`}>
              R$ {price.toFixed(2)}
            </p>
          </div>
          <Link href={`/raspadinhas/${raspadinha.slug}`}>
            <Button
              size="default"
              className="rounded-full"
              data-testid={`button-jogar-${raspadinha.slug}`}
            >
              Jogar Raspadinha
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
