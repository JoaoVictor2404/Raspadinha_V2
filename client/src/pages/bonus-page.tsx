import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Bonus } from "@shared/schema";

export default function BonusPage() {
  const { data: bonuses = [] } = useQuery<Bonus[]>({
    queryKey: ["/api/bonuses"],
  });

  const pendingBonuses = bonuses.filter(b => b.status === "pending");
  const claimedBonuses = bonuses.filter(b => b.status === "claimed" || b.status === "active");
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Meus Bônus</h1>
            <p className="text-muted-foreground">
              Gerencie seus bônus disponíveis e resgatados
            </p>
          </div>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="info" data-testid="tab-informacoes">
                Informações
              </TabsTrigger>
              <TabsTrigger value="pending" data-testid="tab-pendentes">
                Pendentes
              </TabsTrigger>
              <TabsTrigger value="claimed" data-testid="tab-resgatados">
                Resgatados
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <Card className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="rounded-full bg-primary/20 p-4">
                    <Gift className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">Bônus automáticos</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Os bônus agora são creditados automaticamente na sua carteira após o depósito. 
                  Não é necessário resgate manual.
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="pending">
              {pendingBonuses.length > 0 ? (
                <div className="space-y-4">
                  {pendingBonuses.map((bonus) => (
                    <Card key={bonus.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{bonus.type}</h3>
                          <p className="text-sm text-muted-foreground">{bonus.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">R$ {parseFloat(bonus.amount).toFixed(2)}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <Gift className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum bônus pendente</h3>
                  <p className="text-muted-foreground">
                    Você não possui bônus pendentes no momento
                  </p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="claimed">
              {claimedBonuses.length > 0 ? (
                <div className="space-y-4">
                  {claimedBonuses.map((bonus) => (
                    <Card key={bonus.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{bonus.type}</h3>
                          <p className="text-sm text-muted-foreground">{bonus.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">R$ {parseFloat(bonus.amount).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground capitalize">{bonus.status}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <Gift className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum bônus resgatado</h3>
                  <p className="text-muted-foreground">
                    Você ainda não resgatou nenhum bônus
                  </p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
      <BottomNavigation />
    </div>
  );
}
