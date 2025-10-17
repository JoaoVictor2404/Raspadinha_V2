import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1 */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Navegação</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors" 
                  data-testid="footer-link-raspadinhas"
                >
                  Raspadinhas
                </Link>
              </li>
              <li>
                <Link 
                  href="/carrinho" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors" 
                  data-testid="footer-link-carrinho"
                >
                  Carrinho
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Conta</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/carteira" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors" 
                  data-testid="footer-link-carteira"
                >
                  Carteira
                </Link>
              </li>
              <li>
                <Link 
                  href="/deposito" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors" 
                  data-testid="footer-link-deposito"
                >
                  Depósito
                </Link>
              </li>
              <li>
                <Link 
                  href="/entregas" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors" 
                  data-testid="footer-link-saques"
                >
                  Saques
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/termos" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors" 
                  data-testid="footer-link-termos"
                >
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacidade" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors" 
                  data-testid="footer-link-privacidade"
                >
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link 
                  href="/termos-de-bonus" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors" 
                  data-testid="footer-link-termos-bonus"
                >
                  Termos de Bônus
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary mb-4">
              <span className="text-xl font-bold text-primary-foreground">R</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Raspadinha é a maior e melhor plataforma de raspadinhas do Brasil
            </p>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © 2025 Raspadinha. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
