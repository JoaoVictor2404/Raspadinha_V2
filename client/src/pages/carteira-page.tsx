import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Wallet as WalletIcon, TrendingUp, Gift, Download, Upload, Trophy } from "lucide-react";
import type { Wallet, Transaction } from "@shared/schema";
import { Link } from "wouter";

interface PrizeHistory {
  id: string;
  prizeLabel: string;
  prizeWon: string;
  createdAt: string;
}

export default function CarteiraPage() {
  const [activeTab, setActiveTab] = useState<string>("transactions");

  const { data: wallet, isLoading: isLoadingWallet } = useQuery<Wallet>({
    queryKey: ["/api/wallet"],
    refetchOnMount: "always",
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions?type=all"],
    refetchOnMount: "always",
  });

  const { data: prizeHistory } = useQuery<PrizeHistory[]>({
    queryKey: ["/api/prizes/history"],
    refetchOnMount: "always",
  });

  const kpiCards = [
    {
      label: "Saldo Total",
      value: wallet?.balanceTotal ? parseFloat(wallet.balanceTotal) : 0,
      icon: WalletIcon,
      color: "text-primary",
      description: "Saldo disponível total",
    },
    {
      label: "Saldo Padrão",
      value: wallet?.balanceStandard ? parseFloat(wallet.balanceStandard) : 0,
      icon: WalletIcon,
      color: "text-blue-500",
      description: "Disponível para compras de raspadinhas",
    },
    {
      label: "Premiações",
      value: wallet?.balancePrizes ? parseFloat(wallet.balancePrizes) : 0,
      icon: TrendingUp,
      color: "text-green-500",
      description: "Disponível para saque e compras",
    },
    {
      label: "Saldo Bônus",
      value: wallet?.balanceBonus ? parseFloat(wallet.balanceBonus) : 0,
      icon: Gift,
      color: "text-warning",
      description: "Promoções ativas",
    },
  ];

  if (isLoadingWallet) {
    return (
      <div className="flex min-h-screen flex-col pb-16 md:pb-0">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-64 w-full max-w-4xl animate-pulse rounded-lg bg-card" />
        </div>
        <Footer />
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-3xl font-bold mb-8">Minha Carteira</h1>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {kpiCards.map((kpi, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className={`rounded-lg bg-muted p-2 ${kpi.color}`}>
                    <kpi.icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{kpi.label}</p>
                <p className="text-2xl font-bold text-primary mb-1" data-testid={`kpi-${kpi.label.toLowerCase().replace(/\s/g, '-')}`}>
                  R$ {kpi.value.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">{kpi.description}</p>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-8">
            <Link href="/deposito">
              <Button className="rounded-full" data-testid="button-depositar-wallet">
                <Download className="mr-2 h-4 w-4" />
                Depositar
              </Button>
            </Link>
            <Button variant="outline" className="rounded-full" data-testid="button-sacar">
              <Upload className="mr-2 h-4 w-4" />
              Sacar
            </Button>
          </div>

          {/* Tabs for Transactions and Prizes */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="transactions" data-testid="tab-transacoes">
                Transações
              </TabsTrigger>
              <TabsTrigger value="prizes" data-testid="tab-premios">
                Prêmios Ganhos
              </TabsTrigger>
            </TabsList>

            {/* Transactions Tab */}
            <TabsContent value="transactions">
              <Card className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Histórico de Transações</h2>
                  <p className="text-sm text-muted-foreground">
                    Visualize seu histórico de depósitos, compras e prêmios
                  </p>
                </div>

                {transactions && transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.map((transaction) => {
                      const isDeposit = transaction.type === 'deposit';
                      const isPrize = transaction.type === 'prize';
                      const isPurchase = transaction.type === 'purchase';
                      
                      return (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border hover-elevate"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`rounded-lg p-2 ${
                              isDeposit ? 'bg-primary/20' : 
                              isPrize ? 'bg-green-500/20' : 
                              'bg-muted'
                            }`}>
                              {isDeposit ? (
                                <Download className="h-4 w-4 text-primary" />
                              ) : isPrize ? (
                                <Trophy className="h-4 w-4 text-green-500" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{transaction.description || transaction.type}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(transaction.createdAt).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                          </div>
                          <p className={`font-semibold ${
                            isDeposit || isPrize ? 'text-primary' : 'text-muted-foreground'
                          }`}>
                            {isDeposit || isPrize ? '+' : '-'}R$ {parseFloat(transaction.amount).toFixed(2)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <WalletIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma transação encontrada</h3>
                    <p className="text-muted-foreground mb-6">
                      Suas transações aparecerão aqui
                    </p>
                    <Link href="/deposito">
                      <Button data-testid="button-fazer-deposito">Fazer Depósito</Button>
                    </Link>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Prizes Tab */}
            <TabsContent value="prizes">
              <Card className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Prêmios Ganhos</h2>
                  <p className="text-sm text-muted-foreground">
                    Histórico de todos os prêmios conquistados
                  </p>
                </div>

                {prizeHistory && prizeHistory.length > 0 ? (
                  <div className="space-y-3">
                    {prizeHistory.map((prize) => (
                      <div
                        key={prize.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-primary/30 bg-primary/5 hover-elevate"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg p-2 bg-primary/20">
                            <Trophy className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-primary">{prize.prizeLabel}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(prize.createdAt).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <p className="text-xl font-bold text-primary">
                          R$ {parseFloat(prize.prizeWon).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Trophy className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum prêmio ganho ainda</h3>
                    <p className="text-muted-foreground mb-6">
                      Continue jogando para ganhar prêmios incríveis!
                    </p>
                    <Link href="/">
                      <Button data-testid="button-jogar-agora">
                        <Trophy className="mr-2 h-4 w-4" />
                        Jogar Agora
                      </Button>
                    </Link>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
      <BottomNavigation />
    </div>
  );
}
