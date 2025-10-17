import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import RaspadinhaDetailPage from "@/pages/raspadinha-detail-page";
import CarrinhoPage from "@/pages/carrinho-page";
import DepositoPage from "@/pages/deposito-page";
import SaquePage from "@/pages/saque-page";
import CarteiraPage from "@/pages/carteira-page";
import BonusPage from "@/pages/bonus-page";
import EntregasPage from "@/pages/entregas-page";
import AfiliadosPage from "@/pages/afiliados-page";
import ConfiguracoesPage from "@/pages/configuracoes-page";
import TermosPage from "@/pages/termos-page";
import PrivacidadePage from "@/pages/privacidade-page";
import TermosBonusPage from "@/pages/termos-bonus-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/termos" component={TermosPage} />
      <Route path="/privacidade" component={PrivacidadePage} />
      <Route path="/termos-de-bonus" component={TermosBonusPage} />

      {/* Public Routes - No auth required to browse */}
      <Route path="/" component={HomePage} />
      <Route path="/raspadinhas/:slug" component={RaspadinhaDetailPage} />
      
      {/* Protected Routes - Require authentication */}
      <ProtectedRoute path="/carrinho" component={CarrinhoPage} />
      <ProtectedRoute path="/deposito" component={DepositoPage} />
      <ProtectedRoute path="/saque" component={SaquePage} />
      <ProtectedRoute path="/carteira" component={CarteiraPage} />
      <ProtectedRoute path="/bonus" component={BonusPage} />
      <ProtectedRoute path="/entregas" component={EntregasPage} />
      <ProtectedRoute path="/afiliados" component={AfiliadosPage} />
      <ProtectedRoute path="/configuracoes" component={ConfiguracoesPage} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
