import { Link, useLocation } from "wouter";
import { User, Wallet, Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import type { Wallet as WalletType } from "@shared/schema";
import { useState } from "react";
import { AuthModal } from "@/components/auth-modal";

export function Header() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");

  const { data: wallet } = useQuery<WalletType>({
    queryKey: ["/api/wallet"],
    enabled: !!user,
    refetchOnMount: "always",
  });

  const balance = wallet?.balanceTotal ? parseFloat(wallet.balanceTotal) : 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-3 md:px-4">
        {/* Logo - Ludix */}
        <Link 
          href="/" 
          className="flex items-center space-x-2 md:space-x-3 hover-elevate rounded-lg px-2 md:px-3 py-2 transition-all" 
          data-testid="link-home"
        >
          <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
            <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
          </div>
          <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Ludix
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center space-x-1 md:flex">
          <Link 
            href="/" 
            className="rounded-full px-4 py-2 text-sm font-medium hover-elevate active-elevate-2 transition-all" 
            data-testid="link-raspadinhas"
          >
            Raspadinhas
          </Link>
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {user ? (
            <>
              {/* Balance Display - Sempre visível, compacto em mobile */}
              <div className="flex items-center gap-1.5 md:gap-2 rounded-full bg-primary/10 border border-primary/20 px-2.5 md:px-4 py-1.5 md:py-2" data-testid="display-balance">
                <Wallet className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                <span className="text-xs md:text-sm font-bold text-primary">
                  R$ {balance.toFixed(2).replace('.', ',')}
                </span>
              </div>

              {/* Deposit Button - Compacto em mobile */}
              <Link href="/deposito">
                <Button size="sm" className="rounded-full h-8 md:h-9 text-xs md:text-sm" data-testid="button-depositar">
                  Depositar
                </Button>
              </Link>

              {/* User Menu - Apenas desktop */}
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setLocation("/configuracoes")} data-testid="menu-item-perfil">
                      Ver perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/carteira")} data-testid="menu-item-carteira">
                      Carteira
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/saque")} data-testid="menu-item-saque">
                      Sacar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/bonus")} data-testid="menu-item-bonus">
                      Bônus
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/afiliados")} data-testid="menu-item-afiliados">
                      Afiliados
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/entregas")} data-testid="menu-item-entregas">
                      Entregas
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => logoutMutation.mutate()}
                      className="text-destructive"
                      data-testid="menu-item-logout"
                    >
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* User Icon Mobile - Apenas ícone */}
              <Link href="/configuracoes" className="md:hidden">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" data-testid="button-user-mobile">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-full h-8 md:h-9 text-xs md:text-sm" 
                onClick={() => {
                  setAuthModalTab("login");
                  setShowAuthModal(true);
                }}
                data-testid="button-entrar"
              >
                Entrar
              </Button>
              <Button 
                size="sm" 
                className="rounded-full h-8 md:h-9 text-xs md:text-sm" 
                onClick={() => {
                  setAuthModalTab("register");
                  setShowAuthModal(true);
                }}
                data-testid="button-cadastrar"
              >
                Cadastrar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal}
        defaultTab={authModalTab}
      />
    </header>
  );
}
