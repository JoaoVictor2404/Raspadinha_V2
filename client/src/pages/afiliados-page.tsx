import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, UserCheck, DollarSign, Copy, Share2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Affiliate } from "@shared/schema";

export default function AfiliadosPage() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: affiliateStats } = useQuery<any>({
    queryKey: ["/api/affiliate/stats"],
  });

  const referralLink = affiliateStats?.referralCode
    ? `${window.location.origin}?ref=${affiliateStats.referralCode}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: "Link copiado!",
      description: "Compartilhe com seus amigos",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: "Raspadinha - Indique e Ganhe",
        text: "Jogue raspadinhas e ganhe prêmios incríveis!",
        url: referralLink,
      });
    } else {
      copyLink();
    }
  };

  const metrics = [
    {
      label: "Total de Indicações",
      value: affiliateStats?.referralsCount || 0,
      icon: Users,
      description: "Amigos que você convidou",
    },
    {
      label: "Amigos Ativos",
      value: affiliateStats?.activeReferralsCount || 0,
      icon: UserCheck,
      description: "Amigos que já fizeram depósito",
    },
    {
      label: "Comissão Total",
      value: `R$ ${affiliateStats?.totalCommissionEarned || "0,00"}`,
      icon: DollarSign,
      description: "Total ganho em comissões",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center rounded-full bg-primary/20 p-3 mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-3">Indique e Ganhe</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Convide seus amigos para se divertirem conosco! Quanto mais amigos você trouxer, mais recompensas você pode ganhar
            </p>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {metrics.map((metric, index) => (
              <Card key={index} className="p-6 text-center">
                <div className="flex justify-center mb-3">
                  <div className="rounded-full bg-primary/20 p-3">
                    <metric.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{metric.label}</p>
                <p className="text-3xl font-bold text-primary mb-1" data-testid={`metric-${metric.label.toLowerCase().replace(/\s/g, '-')}`}>
                  {metric.value}
                </p>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              </Card>
            ))}
          </div>

          {/* Referral Link */}
          <Card className="p-6 mb-8">
            <h3 className="font-semibold mb-4">Seu Link de Indicação</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Compartilhe este link com seus amigos para que eles se cadastrem
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={referralLink}
                readOnly
                className="flex-1"
                data-testid="input-referral-link"
              />
              <Button
                variant="outline"
                className="gap-2"
                onClick={copyLink}
                data-testid="button-copiar-link"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar
                  </>
                )}
              </Button>
              <Button className="gap-2" onClick={shareLink} data-testid="button-compartilhar-link">
                <Share2 className="h-4 w-4" />
                Compartilhar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Seu código: <span className="font-mono font-semibold">{affiliateStats?.referralCode || "..."}</span>
            </p>
          </Card>

          {/* How It Works */}
          <Card className="p-8">
            <h3 className="text-xl font-semibold mb-6 text-center">Como Funciona</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center rounded-full bg-primary/20 w-12 h-12 mb-4">
                  <span className="text-xl font-bold text-primary">1</span>
                </div>
                <h4 className="font-semibold mb-2">Compartilhe seu link</h4>
                <p className="text-sm text-muted-foreground">
                  Envie seu link de indicação para amigos e familiares
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center rounded-full bg-primary/20 w-12 h-12 mb-4">
                  <span className="text-xl font-bold text-primary">2</span>
                </div>
                <h4 className="font-semibold mb-2">Seus amigos se cadastram</h4>
                <p className="text-sm text-muted-foreground">
                  Quando eles clicam no seu link e criam uma conta, ficam vinculados a você
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center rounded-full bg-primary/20 w-12 h-12 mb-4">
                  <span className="text-xl font-bold text-primary">3</span>
                </div>
                <h4 className="font-semibold mb-2">Ganhe recompensas</h4>
                <p className="text-sm text-muted-foreground">
                  Receba benefícios especiais conforme seus amigos se tornam jogadores ativos
                </p>
              </div>
            </div>

            <div className="mt-8 p-4 rounded-lg bg-primary/10 text-center">
              <p className="text-sm text-muted-foreground">
                <strong>Dica:</strong> Quanto mais amigos você trouxer, melhores serão suas recompensas! Compartilhe a diversão e ganhe junto com seus amigos.
              </p>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
      <BottomNavigation />
    </div>
  );
}
