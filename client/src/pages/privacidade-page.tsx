import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Card } from "@/components/ui/card";

export default function PrivacidadePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="p-8">
            <h1 className="text-3xl font-bold mb-6">Política de Privacidade</h1>
            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground mb-4">Última atualização: Janeiro de 2025</p>
              
              <h2 className="text-xl font-semibold mt-6 mb-3">1. Coleta de Dados</h2>
              <p className="text-muted-foreground mb-4">
                Coletamos informações necessárias para fornecer nossos serviços, incluindo nome, email e dados de pagamento.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-3">2. Uso dos Dados</h2>
              <p className="text-muted-foreground mb-4">
                Seus dados são usados para processar transações, melhorar nossos serviços e comunicações relacionadas à plataforma.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-3">3. Proteção de Dados</h2>
              <p className="text-muted-foreground mb-4">
                Implementamos medidas de segurança para proteger suas informações pessoais contra acesso não autorizado.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-3">4. Compartilhamento</h2>
              <p className="text-muted-foreground mb-4">
                Não compartilhamos seus dados com terceiros, exceto quando necessário para processar pagamentos.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-3">5. Seus Direitos</h2>
              <p className="text-muted-foreground mb-4">
                Você tem direito de acessar, corrigir ou excluir seus dados pessoais a qualquer momento.
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
