import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Card } from "@/components/ui/card";

export default function TermosBonusPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="p-8">
            <h1 className="text-3xl font-bold mb-6">Termos de Bônus</h1>
            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground mb-4">Última atualização: Janeiro de 2025</p>
              
              <h2 className="text-xl font-semibold mt-6 mb-3">1. Bônus de Depósito</h2>
              <p className="text-muted-foreground mb-4">
                Bônus são creditados automaticamente após depósitos qualificados. Valores e condições podem variar.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-3">2. Requisitos de Rollover</h2>
              <p className="text-muted-foreground mb-4">
                Bônus podem estar sujeitos a requisitos de apostas antes de serem convertidos em saldo real.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-3">3. Validade</h2>
              <p className="text-muted-foreground mb-4">
                Bônus têm prazo de validade. Após expirar, o valor é removido da conta automaticamente.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-3">4. Restrições</h2>
              <p className="text-muted-foreground mb-4">
                Bônus não podem ser sacados diretamente. Devem ser usados nas condições especificadas.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-3">5. Modificações</h2>
              <p className="text-muted-foreground mb-4">
                A plataforma reserva o direito de modificar ou cancelar bônus a qualquer momento.
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
