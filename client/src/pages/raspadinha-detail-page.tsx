import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { ScratchCardGame } from "@/components/scratch-card-game";
import { AuthModal } from "@/components/auth-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShoppingCart, Lock } from "lucide-react";
import type { Raspadinha, Prize } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function RaspadinhaDetailPage() {
  const [, params] = useRoute("/raspadinhas/:slug");
  const { toast } = useToast();
  const { user } = useAuth();
  const [gameData, setGameData] = useState<{ purchaseId: string; prizeLabel: string; prizeWon: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { data: raspadinha, isLoading } = useQuery<Raspadinha>({
    queryKey: [`/api/raspadinhas/${params?.slug}`],
    enabled: !!params?.slug,
  });

  const { data: prizes } = useQuery<Prize[]>({
    queryKey: [`/api/raspadinhas/${params?.slug}/prizes`],
    enabled: !!raspadinha && !!params?.slug,
  });

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/raspadinhas/${params?.slug}/purchase`, {});
      return res.json();
    },
    onSuccess: (data) => {
      // Show scratch card game
      setGameData(data);
    },
    onError: (error: Error) => {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes("insufficient balance") || errorMessage.includes("saldo")) {
        toast({
          title: "Saldo insuficiente",
          description: "Você não tem saldo suficiente. Faça um depósito para continuar jogando!",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao comprar",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const revealMutation = useMutation({
    mutationFn: async (purchaseId: string) => {
      const res = await apiRequest("POST", `/api/purchases/${purchaseId}/reveal`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
  });

  const handleGameComplete = () => {
    if (gameData?.purchaseId) {
      revealMutation.mutate(gameData.purchaseId);
    }
  };

  const handlePlayAgain = () => {
    // Reset game data to go back to purchase screen
    setGameData(null);
  };

  const handleBuyClick = () => {
    // Check if user is authenticated
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    // User is authenticated, proceed with purchase
    purchaseMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-64 w-full max-w-2xl animate-pulse rounded-lg bg-card" />
        </div>
        <Footer />
        <BottomNavigation />
      </div>
    );
  }

  if (!raspadinha) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Raspadinha não encontrada</h2>
            <p className="text-muted-foreground">Esta raspadinha não existe ou foi removida</p>
          </div>
        </div>
        <Footer />
        <BottomNavigation />
      </div>
    );
  }

  const price = parseFloat(raspadinha.price);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Show game if purchased, otherwise show preview */}
          {gameData ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2" data-testid="title-detail">
                  {raspadinha.title}
                </h1>
                {raspadinha.description && (
                  <p className="text-muted-foreground">{raspadinha.description}</p>
                )}
              </div>
              <ScratchCardGame
                prizeLabel={gameData.prizeLabel}
                prizeAmount={parseFloat(gameData.prizeWon)}
                category={raspadinha.category}
                onComplete={handleGameComplete}
                onPlayAgain={handlePlayAgain}
              />
            </>
          ) : (
            <Card className="p-8 mb-8">
              <div className="relative aspect-video rounded-lg bg-gradient-to-br from-muted to-card overflow-hidden mb-6">
                {raspadinha.imageUrl ? (
                  <img
                    src={raspadinha.imageUrl}
                    alt={raspadinha.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎰</div>
                      <p className="text-lg font-medium text-muted-foreground">RASPE AQUI!</p>
                    </div>
                  </div>
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <Lock className="h-12 w-12 text-white mb-3 mx-auto" />
                    <p className="text-white text-lg font-semibold">Compre para jogar</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold mb-2" data-testid="title-detail">
                    {raspadinha.title}
                  </h1>
                  {raspadinha.description && (
                    <p className="text-muted-foreground">{raspadinha.description}</p>
                  )}
                </div>
                <Button
                  size="lg"
                  className="rounded-full"
                  onClick={handleBuyClick}
                  disabled={purchaseMutation.isPending}
                  data-testid="button-comprar-raspadinha"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {purchaseMutation.isPending ? "Processando..." : `Comprar por R$ ${price.toFixed(2)}`}
                </Button>
              </div>
            </Card>
          )}

          {!gameData && (
            <Card className="p-6 mb-8 border-primary/30 bg-primary/5">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/20 p-3">
                  <span className="text-2xl">💰</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">PIX na conta</h3>
                  <p className="text-sm text-muted-foreground">
                    Ganhou? Receba direto em sua conta via PIX instantâneo até R${parseFloat(raspadinha.maxPrize).toLocaleString("pt-BR")} diretamente no seu CPF
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Prizes Grid - Only show if not playing */}
          {!gameData && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-6">CONTEÚDO DESSA RASPADINHA+</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {prizes && prizes.length > 0 ? (
                  prizes.map((prize) => (
                    <Card key={prize.id} className="p-4 text-center">
                      <div className="text-3xl mb-2">
                        {prize.imageUrl ? (
                          <img src={prize.imageUrl} alt={prize.label} className="w-full h-16 object-contain" />
                        ) : (
                          "💵"
                        )}
                      </div>
                      <p className="font-semibold text-sm" data-testid={`prize-${prize.label}`}>
                        {prize.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        R$ {parseFloat(prize.amount).toFixed(2)}
                      </p>
                    </Card>
                  ))
                ) : (
                  <>
                    {["2 Mil Reais", "Mil Reais", "500 Reais", "200 Reais", "100 Reais", "60 Reais", "20 Reais", "10 Reais", "5 Reais", "2 Reais", "1 Real", "50 Centavos"].map((label, i) => (
                      <Card key={i} className="p-4 text-center">
                        <div className="text-3xl mb-2">💵</div>
                        <p className="font-semibold text-sm">{label}</p>
                      </Card>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <BottomNavigation />

      {/* Auth Modal - Opens when user tries to buy without authentication */}
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        onSuccess={() => {
          // After successful login, trigger purchase
          purchaseMutation.mutate();
        }}
      />
    </div>
  );
}
