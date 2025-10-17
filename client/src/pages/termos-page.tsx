import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Card } from "@/components/ui/card";

export default function TermosPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="p-8">
            <h1 className="text-3xl font-bold mb-6">Termos de Uso</h1>
            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground mb-4">Última atualização: Janeiro de 2025</p>
              
              <h2 className="text-xl font-semibold mt-6 mb-3">1. Aceitação dos Termos</h2>
              <p className="text-muted-foreground mb-4">
                Ao acessar e usar a plataforma Raspadinha, você concorda com estes termos de uso.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-3">2. Uso da Plataforma</h2>
              <p className="text-muted-foreground mb-4">
                Você deve ter 18 anos ou mais para usar esta plataforma. É proibido o uso de bots ou automação.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-3">3. Depósitos e Saques</h2>
              <p className="text-muted-foreground mb-4">
                Todos os depósitos são processados via PIX. Saques podem levar até 24 horas para serem processados.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-3">4. Prêmios</h2>
              <p className="text-muted-foreground mb-4">
                Os prêmios são distribuídos de forma aleatória. A plataforma reserva o direito de modificar os prêmios disponíveis.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-3">5. Responsabilidade</h2>
              <p className="text-muted-foreground mb-4">
                O uso da plataforma é de total responsabilidade do usuário. Jogue com responsabilidade.
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
