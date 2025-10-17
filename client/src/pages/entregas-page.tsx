import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package } from "lucide-react";

export default function EntregasPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Minhas Entregas</h1>
          <p className="text-muted-foreground mb-6">
            Acompanhe o status das suas solicitações de entrega
          </p>

          {/* Filter */}
          <Card className="p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Package className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Filtrar por Status</span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="processing">Processando</SelectItem>
                    <SelectItem value="shipped">Enviado</SelectItem>
                    <SelectItem value="delivered">Entregue</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="default" data-testid="button-filtrar">
                  Filtrar
                </Button>
                <Button variant="outline" data-testid="button-limpar">
                  Limpar
                </Button>
              </div>
            </div>
          </Card>

          {/* Empty State */}
          <Card className="p-12 text-center">
            <Package className="h-20 w-20 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3">Nenhuma entrega encontrada</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Você ainda não possui solicitações de entrega. Ganhe prêmios nas raspadinhas para solicitar entregas!
            </p>
          </Card>
        </div>
      </main>

      <Footer />
      <BottomNavigation />
    </div>
  );
}
