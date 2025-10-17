import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, ShoppingCart, Wallet, Trophy, User, Menu, ArrowDownToLine, ArrowUpFromLine, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { logoutMutation } = useAuth();
  const { toast } = useToast();

  const navItems = [
    {
      icon: Home,
      label: "Início",
      path: "/",
      testId: "bottom-nav-home",
    },
    {
      icon: ShoppingCart,
      label: "Carrinho",
      path: "/carrinho",
      testId: "bottom-nav-cart",
    },
    {
      icon: Menu,
      label: "Menu",
      testId: "bottom-nav-menu",
      isCenter: true,
    },
    {
      icon: Trophy,
      label: "Prêmios",
      path: "/entregas",
      testId: "bottom-nav-prizes",
    },
    {
      icon: User,
      label: "Perfil",
      path: "/configuracoes",
      testId: "bottom-nav-profile",
    },
  ];

  const menuOptions = [
    {
      icon: Wallet,
      label: "Carteira",
      path: "/carteira",
      testId: "menu-option-wallet",
    },
    {
      icon: ArrowDownToLine,
      label: "Depósito",
      path: "/deposito",
      testId: "menu-option-deposit",
    },
    {
      icon: ArrowUpFromLine,
      label: "Saques",
      path: "/saque",
      testId: "menu-option-withdrawal",
    },
  ];

  const handleMenuOptionClick = (path: string) => {
    setLocation(path);
    setMenuOpen(false);
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setMenuOpen(false);
        setLocation("/");
        toast({
          title: "Logout realizado",
          description: "Você saiu da sua conta com sucesso.",
        });
      },
    });
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            if (item.isCenter) {
              return (
                <Button
                  key="menu-button"
                  onClick={() => setMenuOpen(true)}
                  className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90"
                  data-testid={item.testId}
                >
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </Button>
              );
            }

            if (!item.path) return null;

            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                data-testid={item.testId}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="bottom" className="rounded-t-[18px]">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>
              Acesse sua carteira, faça depósitos ou saques
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-2">
            {menuOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Button
                  key={option.path}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-14 text-base hover-elevate"
                  onClick={() => handleMenuOptionClick(option.path)}
                  data-testid={option.testId}
                >
                  <Icon className="h-5 w-5" />
                  {option.label}
                </Button>
              );
            })}
            
            <div className="border-t border-border pt-2 mt-4">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-14 text-base text-destructive hover:text-destructive hover-elevate"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                data-testid="menu-option-logout"
              >
                <LogOut className="h-5 w-5" />
                {logoutMutation.isPending ? "Saindo..." : "Sair da conta"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
