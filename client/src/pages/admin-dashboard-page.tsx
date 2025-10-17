import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard, 
  Ticket, 
  Users, 
  Receipt, 
  TrendingUp, 
  LogOut,
  DollarSign,
  CreditCard,
  Wallet,
  Plus,
  Pencil,
  Trash2
} from "lucide-react";

export default function AdminDashboardPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch admin status
  const { data: adminStatus, isLoading: isCheckingAdmin } = useQuery<any>({
    queryKey: ["/api/admin/status"],
  });

  // Fetch stats
  const { data: stats } = useQuery<any>({
    queryKey: ["/api/admin/stats"],
    enabled: !!adminStatus,
  });

  // Fetch users
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    enabled: activeTab === "users",
  });

  // Fetch transactions
  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/transactions"],
    enabled: activeTab === "transactions",
  });

  // Fetch deposits
  const { data: deposits = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/deposits"],
    enabled: activeTab === "deposits",
  });

  // Fetch withdrawals
  const { data: withdrawals = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/withdrawals"],
    enabled: activeTab === "withdrawals",
  });

  // Fetch affiliates
  const { data: affiliates = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/affiliates"],
    enabled: activeTab === "affiliates",
  });

  // Fetch commissions
  const { data: commissions = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/commissions"],
    enabled: activeTab === "commissions",
  });

  // Fetch raspadinhas
  const { data: raspadinhas = [] } = useQuery<any[]>({
    queryKey: ["/api/raspadinhas"],
    enabled: activeTab === "raspadinhas",
  });

  useEffect(() => {
    if (!isCheckingAdmin && !adminStatus) {
      setLocation("/adminludixoffc");
    }
  }, [adminStatus, isCheckingAdmin, setLocation]);

  async function handleLogout() {
    try {
      await apiRequest("POST", "/api/admin/logout");
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado do painel admin.",
      });
      
      setLocation("/adminludixoffc");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer logout",
        variant: "destructive",
      });
    }
  }

  if (isCheckingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Verificando permissões...</p>
      </div>
    );
  }

  if (!adminStatus) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md flex items-center justify-center" style={{
                background: "linear-gradient(135deg, #00C6FF, #0072FF)"
              }}>
                <LayoutDashboard className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Ludix Admin</h1>
                <p className="text-sm text-muted-foreground">Painel de Controle</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {adminStatus.adminUsername}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                data-testid="button-admin-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 h-auto p-2">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="raspadinhas" data-testid="tab-raspadinhas">
              <Ticket className="h-4 w-4 mr-2" />
              Raspadinhas
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="transactions" data-testid="tab-transactions">
              <Receipt className="h-4 w-4 mr-2" />
              Transações
            </TabsTrigger>
            <TabsTrigger value="deposits" data-testid="tab-deposits">
              <CreditCard className="h-4 w-4 mr-2" />
              Depósitos
            </TabsTrigger>
            <TabsTrigger value="withdrawals" data-testid="tab-withdrawals">
              <Wallet className="h-4 w-4 mr-2" />
              Saques
            </TabsTrigger>
            <TabsTrigger value="affiliates" data-testid="tab-affiliates">
              <TrendingUp className="h-4 w-4 mr-2" />
              Afiliados
            </TabsTrigger>
            <TabsTrigger value="commissions" data-testid="tab-commissions">
              <DollarSign className="h-4 w-4 mr-2" />
              Comissões
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Usuários</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-total-users">
                    {stats?.totalUsers || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Depósitos</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-total-deposits">
                    R$ {stats?.totalDeposits || "0.00"}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Saques</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-total-withdrawals">
                    R$ {stats?.totalWithdrawals || "0.00"}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Afiliados</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-total-affiliates">
                    {stats?.totalAffiliates || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.activeAffiliates || 0} ativos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Comissões</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-total-commissions">
                    R$ {stats?.totalCommissions || "0.00"}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Saques Pendentes</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-pending-withdrawals">
                    R$ {stats?.pendingWithdrawals || "0.00"}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Transações</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-total-transactions">
                    {stats?.totalTransactions || 0}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Raspadinhas Tab */}
          <TabsContent value="raspadinhas" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gerenciar Raspadinhas</CardTitle>
                    <CardDescription>
                      Administrar produtos e prêmios
                    </CardDescription>
                  </div>
                  <Button data-testid="button-create-raspadinha">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Raspadinha
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {raspadinhas.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhuma raspadinha encontrada
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-4">Título</th>
                            <th className="text-left py-2 px-4">Preço</th>
                            <th className="text-left py-2 px-4">Prêmio Máx</th>
                            <th className="text-left py-2 px-4">Categoria</th>
                            <th className="text-left py-2 px-4">Status</th>
                            <th className="text-left py-2 px-4">Estoque</th>
                            <th className="text-left py-2 px-4">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {raspadinhas.map((rasp: any) => (
                            <tr key={rasp.id} className="border-b hover-elevate" data-testid={`raspadinha-row-${rasp.id}`}>
                              <td className="py-2 px-4">{rasp.title}</td>
                              <td className="py-2 px-4">R$ {rasp.price}</td>
                              <td className="py-2 px-4">R$ {rasp.maxPrize}</td>
                              <td className="py-2 px-4">{rasp.category}</td>
                              <td className="py-2 px-4">
                                <span className={`inline-flex px-2 py-1 rounded-md text-xs ${
                                  rasp.isActive ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                                }`}>
                                  {rasp.isActive ? "Ativo" : "Inativo"}
                                </span>
                              </td>
                              <td className="py-2 px-4">{rasp.stock}</td>
                              <td className="py-2 px-4">
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    data-testid={`button-edit-raspadinha-${rasp.id}`}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    data-testid={`button-delete-raspadinha-${rasp.id}`}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Usuários Cadastrados</CardTitle>
                <CardDescription>
                  Lista de todos os usuários da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {users.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum usuário encontrado
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-4">Username</th>
                            <th className="text-left py-2 px-4">Email</th>
                            <th className="text-left py-2 px-4">Criado em</th>
                            <th className="text-left py-2 px-4">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user: any) => (
                            <tr key={user.id} className="border-b hover-elevate" data-testid={`user-row-${user.id}`}>
                              <td className="py-2 px-4">{user.username}</td>
                              <td className="py-2 px-4">{user.email || "-"}</td>
                              <td className="py-2 px-4">
                                {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                              </td>
                              <td className="py-2 px-4">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  data-testid={`button-view-user-${user.id}`}
                                >
                                  Ver Detalhes
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Transações</CardTitle>
                <CardDescription>
                  Todas as transações do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {transactions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhuma transação encontrada
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-4">Tipo</th>
                            <th className="text-left py-2 px-4">Valor</th>
                            <th className="text-left py-2 px-4">Descrição</th>
                            <th className="text-left py-2 px-4">Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((tx: any) => (
                            <tr key={tx.id} className="border-b hover-elevate" data-testid={`transaction-row-${tx.id}`}>
                              <td className="py-2 px-4">
                                <span className={`inline-flex px-2 py-1 rounded-md text-xs ${
                                  tx.type === "deposit" ? "bg-green-500/20 text-green-500" :
                                  tx.type === "withdrawal" ? "bg-red-500/20 text-red-500" :
                                  "bg-blue-500/20 text-blue-500"
                                }`}>
                                  {tx.type}
                                </span>
                              </td>
                              <td className="py-2 px-4">R$ {tx.amount}</td>
                              <td className="py-2 px-4">{tx.description}</td>
                              <td className="py-2 px-4">
                                {new Date(tx.createdAt).toLocaleDateString("pt-BR")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deposits Tab */}
          <TabsContent value="deposits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Depósitos</CardTitle>
                <CardDescription>
                  Histórico de depósitos PIX
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {deposits.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum depósito encontrado
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-4">Valor</th>
                            <th className="text-left py-2 px-4">Status</th>
                            <th className="text-left py-2 px-4">PIX Key Type</th>
                            <th className="text-left py-2 px-4">Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deposits.map((deposit: any) => (
                            <tr key={deposit.id} className="border-b hover-elevate" data-testid={`deposit-row-${deposit.id}`}>
                              <td className="py-2 px-4">R$ {deposit.amount}</td>
                              <td className="py-2 px-4">
                                <span className={`inline-flex px-2 py-1 rounded-md text-xs ${
                                  deposit.status === "completed" ? "bg-green-500/20 text-green-500" :
                                  deposit.status === "pending" ? "bg-yellow-500/20 text-yellow-500" :
                                  "bg-red-500/20 text-red-500"
                                }`}>
                                  {deposit.status}
                                </span>
                              </td>
                              <td className="py-2 px-4">{deposit.pixKeyType}</td>
                              <td className="py-2 px-4">
                                {new Date(deposit.createdAt).toLocaleDateString("pt-BR")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Saques</CardTitle>
                <CardDescription>
                  Solicitações de saque PIX
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {withdrawals.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum saque encontrado
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-4">Valor</th>
                            <th className="text-left py-2 px-4">Status</th>
                            <th className="text-left py-2 px-4">Chave PIX</th>
                            <th className="text-left py-2 px-4">Data</th>
                            <th className="text-left py-2 px-4">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {withdrawals.map((withdrawal: any) => (
                            <tr key={withdrawal.id} className="border-b hover-elevate" data-testid={`withdrawal-row-${withdrawal.id}`}>
                              <td className="py-2 px-4">R$ {withdrawal.amount}</td>
                              <td className="py-2 px-4">
                                <span className={`inline-flex px-2 py-1 rounded-md text-xs ${
                                  withdrawal.status === "completed" ? "bg-green-500/20 text-green-500" :
                                  withdrawal.status === "pending" ? "bg-yellow-500/20 text-yellow-500" :
                                  "bg-red-500/20 text-red-500"
                                }`}>
                                  {withdrawal.status}
                                </span>
                              </td>
                              <td className="py-2 px-4">{withdrawal.pixKey}</td>
                              <td className="py-2 px-4">
                                {new Date(withdrawal.createdAt).toLocaleDateString("pt-BR")}
                              </td>
                              <td className="py-2 px-4">
                                {withdrawal.status === "pending" && (
                                  <div className="flex gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="bg-green-500/10 hover:bg-green-500/20"
                                      data-testid={`button-approve-withdrawal-${withdrawal.id}`}
                                    >
                                      Aprovar
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="bg-red-500/10 hover:bg-red-500/20"
                                      data-testid={`button-reject-withdrawal-${withdrawal.id}`}
                                    >
                                      Rejeitar
                                    </Button>
                                  </div>
                                )}
                                {withdrawal.status !== "pending" && (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Affiliates Tab */}
          <TabsContent value="affiliates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Programa de Afiliados</CardTitle>
                <CardDescription>
                  Gerenciar afiliados e seus ganhos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {affiliates.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum afiliado encontrado
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-4">Código</th>
                            <th className="text-left py-2 px-4">Indicações</th>
                            <th className="text-left py-2 px-4">Ativos</th>
                            <th className="text-left py-2 px-4">Saldo</th>
                            <th className="text-left py-2 px-4">Data</th>
                            <th className="text-left py-2 px-4">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {affiliates.map((affiliate: any) => (
                            <tr key={affiliate.id} className="border-b hover-elevate" data-testid={`affiliate-row-${affiliate.id}`}>
                              <td className="py-2 px-4 font-mono">{affiliate.referralCode}</td>
                              <td className="py-2 px-4">{affiliate.totalReferrals}</td>
                              <td className="py-2 px-4">{affiliate.activeReferrals}</td>
                              <td className="py-2 px-4">R$ {affiliate.commissionBalance}</td>
                              <td className="py-2 px-4">
                                {new Date(affiliate.createdAt).toLocaleDateString("pt-BR")}
                              </td>
                              <td className="py-2 px-4">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  data-testid={`button-edit-affiliate-${affiliate.id}`}
                                >
                                  <Pencil className="h-3 w-3 mr-1" />
                                  Editar Saldo
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Comissões Pagas</CardTitle>
                <CardDescription>
                  Histórico de comissões de afiliados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {commissions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhuma comissão encontrada
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-4">Valor</th>
                            <th className="text-left py-2 px-4">Percentual</th>
                            <th className="text-left py-2 px-4">Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {commissions.map((commission: any) => (
                            <tr key={commission.id} className="border-b hover-elevate" data-testid={`commission-row-${commission.id}`}>
                              <td className="py-2 px-4">R$ {commission.amount}</td>
                              <td className="py-2 px-4">{commission.percentage}%</td>
                              <td className="py-2 px-4">
                                {new Date(commission.createdAt).toLocaleDateString("pt-BR")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
