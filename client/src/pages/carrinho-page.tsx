import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Calendar, Trophy, Eye, EyeOff, Play } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Purchase, Raspadinha } from "@shared/schema";

interface PurchaseWithRaspadinha extends Purchase {
  raspadinha: Raspadinha;
}

export default function CarrinhoPage() {
  const [filter, setFilter] = useState<"all" | "revealed" | "pending">("all");
  const [, navigate] = useLocation();

  const { data: purchases = [], isLoading } = useQuery<PurchaseWithRaspadinha[]>({
    queryKey: ["/api/purchases"],
  });

  const filteredPurchases = purchases.filter((purchase) => {
    if (filter === "all") return true;
    if (filter === "revealed") return purchase.isRevealed;
    if (filter === "pending") return !purchase.isRevealed;
    return true;
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Minhas Compras</h1>
          </div>
          
          <p className="text-muted-foreground mb-6">
            Histórico de todas as suas raspadinhas compradas
          </p>

          {/* Filter Buttons */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              data-testid="filter-all"
            >
              Todas
            </Button>
            <Button
              variant={filter === "revealed" ? "default" : "outline"}
              onClick={() => setFilter("revealed")}
              data-testid="filter-revealed"
            >
              <Eye className="h-4 w-4 mr-2" />
              Reveladas
            </Button>
            <Button
              variant={filter === "pending" ? "default" : "outline"}
              onClick={() => setFilter("pending")}
              data-testid="filter-pending"
            >
              <EyeOff className="h-4 w-4 mr-2" />
              Pendentes
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="flex gap-4">
                    <div className="h-20 w-20 rounded-lg bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-32 bg-muted rounded" />
                      <div className="h-4 w-24 bg-muted rounded" />
                      <div className="h-4 w-40 bg-muted rounded" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Purchases List */}
          {!isLoading && filteredPurchases.length > 0 && (
            <div className="space-y-4">
              {filteredPurchases.map((purchase) => (
                <Card key={purchase.id} className="p-6 hover-elevate" data-testid={`purchase-${purchase.id}`}>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Scratch card image */}
                    {purchase.raspadinha.imageUrl ? (
                      <img
                        src={purchase.raspadinha.imageUrl}
                        alt={purchase.raspadinha.title}
                        className="h-20 w-20 rounded-lg object-cover flex-shrink-0"
                        data-testid={`purchase-image-${purchase.id}`}
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                        <Trophy className="h-10 w-10 text-primary/70" />
                      </div>
                    )}

                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-lg" data-testid={`purchase-title-${purchase.id}`}>
                            {purchase.raspadinha.title}
                          </h3>
                          <p className="text-sm text-muted-foreground" data-testid={`purchase-price-${purchase.id}`}>
                            R$ {parseFloat(purchase.raspadinha.price).toFixed(2)}
                          </p>
                        </div>
                        {purchase.isRevealed ? (
                          <Badge variant="default" data-testid={`badge-revealed-${purchase.id}`}>
                            <Eye className="h-3 w-3 mr-1" />
                            Revelada
                          </Badge>
                        ) : (
                          <Badge variant="secondary" data-testid={`badge-pending-${purchase.id}`}>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span data-testid={`purchase-date-${purchase.id}`}>
                          {formatDistanceToNow(new Date(purchase.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>

                      {purchase.isRevealed ? (
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-primary" data-testid={`prize-label-${purchase.id}`}>
                            {purchase.prizeLabel}
                          </span>
                          {parseFloat(purchase.prizeWon || "0") > 0 && (
                            <span className="text-sm text-muted-foreground" data-testid={`prize-amount-${purchase.id}`}>
                              (R$ {parseFloat(purchase.prizeWon || "0").toFixed(2)})
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => navigate(`/raspadinhas/${purchase.raspadinha.slug}`)}
                            data-testid={`button-play-${purchase.id}`}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Jogar Agora
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredPurchases.length === 0 && (
            <Card className="p-12 text-center">
              <ShoppingCart className="h-20 w-20 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">
                {filter === "all" && "Nenhuma compra encontrada"}
                {filter === "revealed" && "Nenhuma raspadinha revelada"}
                {filter === "pending" && "Nenhuma raspadinha pendente"}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                {filter === "all" 
                  ? "Você ainda não comprou nenhuma raspadinha. Explore nossas opções e tente a sorte!"
                  : filter === "revealed"
                  ? "Você ainda não revelou nenhuma raspadinha. Compre e raspe para descobrir seus prêmios!"
                  : "Todas as suas raspadinhas foram reveladas. Compre mais para continuar jogando!"
                }
              </p>
              <Button asChild data-testid="button-browse-raspadinhas">
                <a href="/">Ver Raspadinhas</a>
              </Button>
            </Card>
          )}
        </div>
      </main>

      <Footer />
      <BottomNavigation />
    </div>
  );
}
