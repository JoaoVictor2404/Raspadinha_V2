import { Card } from "@/components/ui/card";
import { Trophy, TrendingUp } from "lucide-react";

export function RecentWinners() {
  // Mock data de vencedores recentes
  const recentWinners = [
    {
      id: 1,
      name: "Daniel P******",
      prize: "Capinha de Celular",
      amount: 20.00,
      image: "💰",
    },
    {
      id: 2,
      name: "Bianca R*****",
      prize: "PIX na Conta",
      amount: 500.00,
      image: "💸",
    },
  ];

  return (
    <section className="py-8 md:py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-3 py-1.5 rounded-full animate-pulse">
            <div className="h-2 w-2 rounded-full bg-destructive" />
            <span className="text-xs font-bold uppercase tracking-wide">AO VIVO</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold">
            ÚLTIMOS <span className="text-primary">GANHOS</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentWinners.map((winner) => (
            <Card 
              key={winner.id} 
              className="p-4 hover-elevate transition-all bg-gradient-to-br from-card to-card/50"
              data-testid={`winner-card-${winner.id}`}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-3xl">
                  {winner.image}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {winner.name}
                  </p>
                  <p className="font-bold text-foreground mb-1">
                    {winner.prize}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    <span className="text-lg font-bold text-primary">
                      R$ {winner.amount.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {/* Card de incentivo */}
          <Card className="p-4 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30 flex items-center justify-center">
            <div className="text-center">
              <Trophy className="h-10 w-10 mx-auto mb-2 text-primary" />
              <p className="text-sm font-bold text-primary mb-1">
                Você pode ser o próximo!
              </p>
              <p className="text-xs text-muted-foreground">
                Jogue agora e ganhe prêmios
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
