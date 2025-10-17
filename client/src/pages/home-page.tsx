import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { LiveTicker } from "@/components/live-ticker";
import { RecentWinners } from "@/components/recent-winners";
import { ScratchCard } from "@/components/scratch-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Zap } from "lucide-react";
import type { Raspadinha } from "@shared/schema";
import { Link } from "wouter";

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("gold-rush");

  const { data: raspadinhas, isLoading } = useQuery<Raspadinha[]>({
    queryKey: [`/api/raspadinhas?category=${selectedCategory}`],
  });

  const categories = [
    { value: "gold-rush", label: "🪙 Gold Rush", emoji: "💎" },
    { value: "lucky-animals", label: "🐼 Lucky Animals", emoji: "🦊" },
    { value: "vegas-lights", label: "🎰 Vegas Lights", emoji: "🎲" },
    { value: "mythic-gods", label: "⚡ Mythic Gods", emoji: "🔥" },
    { value: "crypto-scratch", label: "₿ Crypto Scratch", emoji: "🚀" },
    { value: "candy-mania", label: "🍭 Candy Mania", emoji: "🍬" },
  ];

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-background py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center lg:flex-row lg:text-left lg:items-center lg:justify-between gap-8">
            <div className="flex-1 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-1.5 mb-6">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Novidade</span>
              </div>
              <h1 className="text-4xl font-bold mb-4 lg:text-5xl xl:text-6xl">
                Já garantiu sua raspadinha hoje?
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl">
                Ganhe prêmios incríveis! PIX na conta, eletrônicos, veículos e muito mais. Deposite agora e comece a jogar.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/deposito">
                  <Button size="lg" className="rounded-full w-full sm:w-auto" data-testid="button-hero-depositar">
                    <Zap className="mr-2 h-5 w-5" />
                    Depositar Agora
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="rounded-full w-full sm:w-auto" data-testid="button-hero-raspadinhas">
                  Ver Raspadinhas
                </Button>
              </div>
            </div>
            <div className="flex-1 flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <div className="relative text-8xl lg:text-9xl">🍀</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Ticker - Apenas Desktop */}
      <div className="hidden md:block">
        <LiveTicker />
      </div>

      {/* Últimos Ganhos - Apenas Mobile */}
      <div className="block md:hidden">
        <RecentWinners />
      </div>

      {/* Category Tabs & Cards Grid */}
      <section className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
              <TabsList className="inline-flex mb-8 bg-card border border-border w-max md:w-auto">
                {categories.map((cat) => (
                  <TabsTrigger
                    key={cat.value}
                    value={cat.value}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full whitespace-nowrap"
                    data-testid={`tab-${cat.value}`}
                  >
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>

          {/* Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="h-80 rounded-lg border border-card-border bg-card animate-pulse"
                />
              ))}
            </div>
          ) : raspadinhas && raspadinhas.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {raspadinhas.map((raspadinha) => (
                <ScratchCard key={raspadinha.id} raspadinha={raspadinha} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-6xl mb-4">🎰</div>
              <h3 className="text-xl font-semibold mb-2">Nenhuma raspadinha disponível</h3>
              <p className="text-muted-foreground">
                Volte mais tarde para ver novas raspadinhas
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
      <BottomNavigation />
    </div>
  );
}
