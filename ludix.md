# Ludix - Plataforma de Raspadinhas Online

## Visão Geral
Ludix é uma plataforma completa de raspadinhas online com design Blue Rush moderno, autenticação opcional via modal, depósitos e saques via PIX, carteira digital e programa de afiliados.

## Stack Tecnológica

### Frontend
- **React 18** com Vite
- **TypeScript** para type safety
- **Tailwind CSS** para estilização
- **Shadcn/UI** para componentes
- **Wouter** para roteamento
- **TanStack Query** para gerenciamento de estado assíncrono
- **React Hook Form** para formulários

### Backend
- **Node.js** com Express
- **PostgreSQL** (Neon) como banco de dados
- **Drizzle ORM** para queries e migrations
- **Passport.js** para autenticação
- **Express Session** para gerenciamento de sessões

### Design System - Blue Rush Theme
- **Brand**: Ludix
- **Cores Base**: 
  - Background: #0B0E11 (dark blue-black)
  - Secondary: #12161C (dark blue-gray)
  - Cards: #23262B (slate)
- **Cores Primárias**:
  - Neon Green: #00FF85
  - Cyan Blue: #00C6FF
  - Yellow: #FFD300
  - Red/Orange: #FF4B2B
- **Gradientes**:
  - Primary: linear-gradient(135deg, #0F2027, #203A43, #2C5364)
  - Secondary: linear-gradient(135deg, #00C6FF, #0072FF)
- **Tipografia**: Inter/Outfit (Google Fonts)
- **Bordas**: 18px (cards), fully rounded (buttons)
- **Responsivo**: Mobile-first, breakpoints 360/768/1024/1280px

## Estrutura de Dados

### Schemas Principais
1. **users** - Usuários da plataforma
2. **raspadinhas** - Jogos disponíveis
3. **prizes** - Prêmios de cada raspadinha
4. **wallets** - Carteira digital dos usuários
5. **transactions** - Histórico de transações
6. **purchases** - Compras de raspadinhas
7. **bonuses** - Sistema de bônus
8. **affiliates** - Programa de afiliados
9. **deliveries** - Entregas de prêmios físicos

## Funcionalidades Implementadas (MVP)

### Autenticação
- [x] **Autenticação opcional** - Site navegável sem login
- [x] **Modal unificado** - Login/Registro em abas no mesmo modal (abre ao tentar jogar)
- [x] Registro de usuários
- [x] Login com username/password
- [x] Proteção de rotas financeiras (carteira, depósito, saque)
- [x] Sessões persistentes

### Páginas Principais
- [x] **Home** (pública) - Hero banner, ticker ao vivo, abas de categorias, grade de raspadinhas
- [x] **Raspadinha Detalhe** (pública) - Preview do jogo, botão comprar com auth check
- [x] **Carrinho** - Histórico de compras, status de revelação, botão "Jogar Agora" para pendentes
- [x] **Depósito** - Opções rápidas, valor customizado, modal PIX com QR Code
- [x] **Saque** - Formulário PIX, validações, tipos de chave (CPF/Email/Telefone/Aleatória)
- [x] **Carteira** - 4 KPI cards, botões depositar/sacar, histórico de transações
- [x] **Bônus** - Abas (Informações/Pendentes/Resgatados)
- [x] **Entregas** - Filtro de status, estado vazio
- [x] **Afiliados** - Métricas, link de indicação, "Como Funciona"
- [x] **Configurações** - Abas (Perfil/Senha/Aparência)

### Componentes Reutilizáveis
- [x] **Header Ludix** - Logo com gradiente, saldo, botão depositar, menu usuário
- [x] **AuthModal** - Modal split com promo à esquerda e formulário à direita (abas Login/Registro)
- [x] Footer minimalista com links
- [x] **BottomNavigation** - Navegação mobile responsiva (5 ícones) presente em TODAS as páginas
  - Início (/) - Home
  - Carrinho (/carrinho) - Histórico de compras
  - **Menu (central)** - Botão verde circular que abre Sheet com opções:
    - 💰 Carteira → /carteira
    - ⬇️ Depósito → /deposito
    - ⬆️ Saques → /saque
    - 🚪 Sair da conta → Logout (texto vermelho, separador visual)
  - Prêmios (/entregas) - Entregas
  - Perfil (/configuracoes) - Configurações
  - Mobile-only (md:hidden), fixado no bottom em todos os estados de página (loading, error, success)
  - Sheet abre de baixo para cima com bordas arredondadas (18px)
  - Logout usa logoutMutation do useAuth (centralizado, sincronização correta)
- [x] LiveTicker - Auto-scroll de ganhadores recentes (apenas desktop)
- [x] RecentWinners - Seção "ÚLTIMOS GANHOS" com cards de vencedores (apenas mobile)
- [x] ScratchCard - Card de raspadinha com badges
- [x] ScratchCardGame - Jogo interativo 3x3 grid com canvas (raspar prêmio)
- [x] PixModal - Modal de geração de PIX

### Design & UX
- [x] Dark mode permanente com Blue Rush Theme
- [x] Gradientes cyan/neon green para brand
- [x] Responsividade mobile-first
- [x] Estados vazios em todas as páginas
- [x] Loading states com skeletons
- [x] **Toasts com swipe-to-dismiss no mobile**
  - Duração de 10 segundos
  - Indicador visual de swipe (ChevronRight com pulse) apenas mobile
  - Swipe horizontal para direita para dispensar
  - Radix Toast com suporte nativo a gestos touch
- [x] Hover effects com glow cyan/green
- [x] Bordas arredondadas (18px)

## Rotas da Aplicação

### Públicas
- `/` - Home (navegável sem login)
- `/raspadinhas/:slug` - Detalhe da raspadinha (navegável sem login, mas comprar exige auth)
- `/auth` - Login/Registro (deprecated - agora usa modal)
- `/termos` - Termos de Uso
- `/privacidade` - Política de Privacidade
- `/termos-de-bonus` - Termos de Bônus

### Protegidas (requer autenticação)
- `/carrinho` - Histórico de compras (purchases)
- `/deposito` - Página de depósito PIX
- `/saque` - Página de saque PIX
- `/carteira` - Carteira digital
- `/bonus` - Gerenciamento de bônus
- `/entregas` - Acompanhamento de entregas
- `/afiliados` - Programa de indicação
- `/configuracoes` - Configurações do perfil

## API Endpoints Implementados

### Auth
- ✅ POST `/api/register` - Criar conta (cria user + wallet + affiliate)
- ✅ POST `/api/login` - Login com username/password
- ✅ POST `/api/logout` - Logout e destruir sessão
- ✅ GET `/api/user` - Dados do usuário autenticado

### Raspadinhas
- ✅ GET `/api/raspadinhas?category=<cat>` - Lista por categoria
- ✅ GET `/api/raspadinhas/:slug` - Detalhe de raspadinha
- ✅ GET `/api/raspadinhas/:slug/prizes` - Prêmios da raspadinha
- ✅ POST `/api/raspadinhas/:slug/purchase` - Comprar (retorna prizeWon mas não revela)
- ✅ GET `/api/raspadinhas/:slug/stats` - Estatísticas (RTP, win rate, etc.)

### Purchases & Prizes
- ✅ GET `/api/purchases` - Lista todas as compras do usuário (com dados de raspadinha)
- ✅ POST `/api/purchases/:id/reveal` - Revelar prêmio e creditar wallet
- ✅ GET `/api/prizes/history` - Histórico de prêmios ganhos

### Wallet & Transactions
- ✅ GET `/api/wallet` - Carteira do usuário (4 saldos: total, padrão, prêmios, bônus)
- ✅ GET `/api/transactions?type=<type>` - Histórico (all, deposit, withdrawal, purchase, prize)
- ✅ POST `/api/deposits` - Criar depósito PIX (mock auto-complete 2s)

### Afiliados
- ✅ GET `/api/affiliate` - Dados de afiliado (criado automaticamente no registro)
- ✅ GET `/api/affiliate/stats` - Estatísticas completas (comissões, indicações, etc.)
- ✅ GET `/api/affiliate/commissions` - Histórico de comissões
- ✅ GET `/api/affiliate/validate/:code` - Validar código de indicação
- ✅ POST `/api/register` - Aceita `referralCode` opcional para rastreamento

### Bônus
- ✅ GET `/api/bonuses` - Lista de bônus do usuário

## Comandos Úteis

```bash
# Instalar dependências
npm install

# Rodar aplicação (frontend + backend)
npm run dev

# Push schema para database
npm run db:push

# Force push schema (se houver conflitos)
npm run db:push --force
```

## Variáveis de Ambiente

As seguintes variáveis já estão configuradas:
- `DATABASE_URL` - Connection string do PostgreSQL
- `SESSION_SECRET` - Secret para sessões
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - Credenciais do DB

## Arquitetura de Componentes

```
client/src/
├── components/
│   ├── layout/
│   │   ├── header.tsx        # Header fixo com navegação
│   │   └── footer.tsx        # Footer com links
│   ├── ui/                    # Componentes Shadcn
│   ├── live-ticker.tsx       # Ticker de ganhadores
│   └── scratch-card.tsx      # Card de raspadinha
├── pages/                     # Todas as páginas da aplicação
├── hooks/
│   └── use-auth.tsx          # Hook de autenticação
├── lib/
│   ├── protected-route.tsx   # HOC para rotas protegidas
│   └── queryClient.ts        # Config do TanStack Query
└── App.tsx                    # Router principal

server/
├── routes.ts                  # Definição de rotas API
├── auth.ts                    # Lógica de autenticação
├── storage.ts                 # Interface de storage
└── db.ts                      # Config do Drizzle

shared/
└── schema.ts                  # Schemas compartilhados (Drizzle + Zod)
```

## Status do Projeto

✅ **Backend Completo**: Schema, API & Autenticação
- Todos os modelos de dados definidos e migrados
- Database PostgreSQL configurado
- Autenticação com Passport.js (LocalStrategy)
- Todos os endpoints implementados
- Seed com 7 raspadinhas e 49 prêmios

✅ **Sistema de Jogo Interativo**: Scratch Card Real
- Componente ScratchCardGame com canvas HTML5
- Animação de raspar com mouse/touch
- Revelação progressiva de prêmios (auto-reveal 70%)
- Endpoint de compra (cria purchase não revelado)
- Endpoint de reveal (marca revelado e credita wallet)

✅ **Sistema de Premiações Completo**
- Sorteio ponderado com probabilidades configuráveis
- Validação de ganhos (validatePrize)
- Cálculo de RTP (Return to Player)
- Separação wallet: saldo padrão vs prêmios
- Histórico de prêmios ganhos (GET /api/prizes/history)
- Estatísticas por raspadinha (GET /api/raspadinhas/:slug/stats)

✅ **Sistema de Afiliados Funcional**
- Geração de códigos únicos de afiliado (baseado em username + timestamp)
- Rastreamento via URL query params (?ref=codigo)
- Hook useReferralTracking com localStorage (expira em 30 dias)
- Cálculo automático de comissões (10% sobre depósitos de indicados)
- Tabelas: affiliates, referrals, commissions
- Endpoints: /api/affiliate/stats, /api/affiliate/commissions, /api/affiliate/validate/:code
- Integração no registro (aceita referralCode, cria referral inativo)
- Integração no depósito (ativa referral no 1º depósito + processa comissões)
- Página de afiliados com métricas reais e link de indicação
- **Lógica corrigida**: Referrals iniciam inativos e só ativam no primeiro depósito
- **Métricas precisas**: Total de Indicações (todos) vs Amigos Ativos (com depósito)

🔄 **Próximas Features**
- Sistema de Bônus completo (boas-vindas, rollover, conversão)
- Notificações WebSocket em tempo real
- Painel Administrativo
- Integração PIX real (substituir mock)

## Design Guidelines

Todas as implementações seguem rigorosamente o `design_guidelines.md`:
- Paleta de cores dark (#0B0B0B, #121212, #1B1B1D)
- Verde neon (#16FF4C) como primária
- Tipografia Inter/Outfit
- Bordas arredondadas (18px cards, fully rounded buttons)
- Hover states com glow suave
- Responsivo mobile-first
- Acessibilidade WCAG AA
