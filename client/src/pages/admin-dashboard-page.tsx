import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Trash2,
  Check,
  X,
  Eye
} from "lucide-react";

type RaspadinhaFormData = {
  title: string;
  slug: string;
  description: string;
  price: string;
  maxPrize: string;
  category: string;
  badge: string;
  stock: string;
  imageUrl: string;
};

export default function AdminDashboardPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editAffiliateModalOpen, setEditAffiliateModalOpen] = useState(false);
  const [userDetailsModalOpen, setUserDetailsModalOpen] = useState(false);
  
  // Selected items
  const [selectedRaspadinha, setSelectedRaspadinha] = useState<any>(null);
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Form states
  const [formData, setFormData] = useState<RaspadinhaFormData>({
    title: "",
    slug: "",
    description: "",
    price: "",
    maxPrize: "",
    category: "gold-rush",
    badge: "",
    stock: "1000",
    imageUrl: ""
  });
  const [affiliateBalance, setAffiliateBalance] = useState("");
  const [affiliatePercentage, setAffiliatePercentage] = useState("");

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

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/admin/raspadinhas", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/raspadinhas"] });
      setCreateModalOpen(false);
      resetForm();
      toast({ title: "Sucesso", description: "Raspadinha criada com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/admin/raspadinhas/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/raspadinhas"] });
      setEditModalOpen(false);
      setSelectedRaspadinha(null);
      resetForm();
      toast({ title: "Sucesso", description: "Raspadinha atualizada com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/raspadinhas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/raspadinhas"] });
      setDeleteConfirmOpen(false);
      setSelectedRaspadinha(null);
      toast({ title: "Sucesso", description: "Raspadinha deletada com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });

  const updateAffiliateMutation = useMutation({
    mutationFn: async ({ id, balance, percentage }: { id: string; balance: string; percentage: string }) => {
      return apiRequest("PATCH", `/api/admin/affiliates/${id}`, { 
        commissionBalance: balance,
        commissionPercentage: percentage 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliates"] });
      setEditAffiliateModalOpen(false);
      setSelectedAffiliate(null);
      setAffiliateBalance("");
      setAffiliatePercentage("");
      toast({ title: "Sucesso", description: "Afiliado atualizado!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });

  const approveWithdrawalMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/admin/withdrawals/${id}`, { status: "approved" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Sucesso", description: "Saque aprovado!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });

  const rejectWithdrawalMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/admin/withdrawals/${id}`, { status: "rejected" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Sucesso", description: "Saque rejeitado!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });

  async function handleLogout() {
    try {
      await apiRequest("POST", "/api/admin/logout");
      toast({ title: "Logout realizado", description: "Você foi desconectado do painel admin." });
      setLocation("/adminludixoffc");
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Erro ao fazer logout", variant: "destructive" });
    }
  }

  function resetForm() {
    setFormData({
      title: "",
      slug: "",
      description: "",
      price: "",
      maxPrize: "",
      category: "gold-rush",
      badge: "",
      stock: "1000",
      imageUrl: ""
    });
  }

  function handleCreate() {
    createMutation.mutate({
      ...formData,
      price: formData.price,
      maxPrize: formData.maxPrize,
      stock: parseInt(formData.stock)
    });
  }

  function handleEdit() {
    if (!selectedRaspadinha) return;
    updateMutation.mutate({
      id: selectedRaspadinha.id,
      data: {
        ...formData,
        price: formData.price,
        maxPrize: formData.maxPrize,
        stock: parseInt(formData.stock)
      }
    });
  }

  function handleDelete() {
    if (!selectedRaspadinha) return;
    deleteMutation.mutate(selectedRaspadinha.id);
  }

  function openEditModal(rasp: any) {
    setSelectedRaspadinha(rasp);
    setFormData({
      title: rasp.title,
      slug: rasp.slug,
      description: rasp.description || "",
      price: rasp.price,
      maxPrize: rasp.maxPrize,
      category: rasp.category,
      badge: rasp.badge || "",
      stock: rasp.stock.toString(),
      imageUrl: rasp.imageUrl || ""
    });
    setEditModalOpen(true);
  }

  function openDeleteConfirm(rasp: any) {
    setSelectedRaspadinha(rasp);
    setDeleteConfirmOpen(true);
  }

  function openEditAffiliate(affiliate: any) {
    setSelectedAffiliate(affiliate);
    setAffiliateBalance(affiliate.commissionBalance);
    setAffiliatePercentage(affiliate.commissionPercentage || "10.00");
    setEditAffiliateModalOpen(true);
  }

  function openUserDetails(user: any) {
    setSelectedUser(user);
    setUserDetailsModalOpen(true);
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
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Ticket className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold" data-testid="admin-title">Ludix Admin</h1>
                <p className="text-sm text-muted-foreground">Painel de Controle</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium" data-testid="admin-username">{adminStatus.username}</p>
                <p className="text-xs text-muted-foreground">Administrador</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-2">
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
                    <CardDescription>Administrar produtos e prêmios</CardDescription>
                  </div>
                  <Button onClick={() => { resetForm(); setCreateModalOpen(true); }} data-testid="button-create-raspadinha">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Raspadinha
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {raspadinhas.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhuma raspadinha encontrada</p>
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
                              <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-500">
                                {rasp.isActive ? "Ativo" : "Inativo"}
                              </span>
                            </td>
                            <td className="py-2 px-4">{rasp.stock}</td>
                            <td className="py-2 px-4">
                              <div className="flex gap-2">
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  onClick={() => openEditModal(rasp)}
                                  data-testid={`button-edit-${rasp.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  onClick={() => openDeleteConfirm(rasp)}
                                  data-testid={`button-delete-${rasp.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Usuários</CardTitle>
                <CardDescription>Lista de todos os usuários cadastrados</CardDescription>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum usuário encontrado</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">Nome</th>
                          <th className="text-left py-2 px-4">Email</th>
                          <th className="text-left py-2 px-4">Telefone</th>
                          <th className="text-left py-2 px-4">CPF</th>
                          <th className="text-left py-2 px-4">Data Cadastro</th>
                          <th className="text-left py-2 px-4">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user: any) => (
                          <tr key={user.id} className="border-b hover-elevate">
                            <td className="py-2 px-4">{user.name || "-"}</td>
                            <td className="py-2 px-4">{user.email || "-"}</td>
                            <td className="py-2 px-4">{user.phone || "-"}</td>
                            <td className="py-2 px-4">{user.cpf || "-"}</td>
                            <td className="py-2 px-4">{new Date(user.createdAt).toLocaleDateString('pt-BR')}</td>
                            <td className="py-2 px-4">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => openUserDetails(user)}
                                data-testid={`button-user-details-${user.id}`}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transações</CardTitle>
                <CardDescription>Histórico completo de transações</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhuma transação encontrada</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">Tipo</th>
                          <th className="text-left py-2 px-4">Valor</th>
                          <th className="text-left py-2 px-4">Status</th>
                          <th className="text-left py-2 px-4">Descrição</th>
                          <th className="text-left py-2 px-4">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx: any) => (
                          <tr key={tx.id} className="border-b hover-elevate">
                            <td className="py-2 px-4 capitalize">{tx.type}</td>
                            <td className="py-2 px-4">R$ {tx.amount}</td>
                            <td className="py-2 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                tx.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                                tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                                'bg-red-500/20 text-red-500'
                              }`}>
                                {tx.status}
                              </span>
                            </td>
                            <td className="py-2 px-4">{tx.description || "-"}</td>
                            <td className="py-2 px-4">{new Date(tx.createdAt).toLocaleDateString('pt-BR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deposits Tab */}
          <TabsContent value="deposits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Depósitos PIX</CardTitle>
                <CardDescription>Gerenciar depósitos dos usuários</CardDescription>
              </CardHeader>
              <CardContent>
                {deposits.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum depósito encontrado</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">Valor</th>
                          <th className="text-left py-2 px-4">Status</th>
                          <th className="text-left py-2 px-4">Chave PIX</th>
                          <th className="text-left py-2 px-4">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deposits.map((dep: any) => (
                          <tr key={dep.id} className="border-b hover-elevate">
                            <td className="py-2 px-4">R$ {dep.amount}</td>
                            <td className="py-2 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                dep.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                                dep.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                                'bg-red-500/20 text-red-500'
                              }`}>
                                {dep.status}
                              </span>
                            </td>
                            <td className="py-2 px-4">{dep.pixKey}</td>
                            <td className="py-2 px-4">{new Date(dep.createdAt).toLocaleDateString('pt-BR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Saques PIX</CardTitle>
                <CardDescription>Aprovar ou rejeitar saques pendentes</CardDescription>
              </CardHeader>
              <CardContent>
                {withdrawals.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum saque encontrado</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">Valor</th>
                          <th className="text-left py-2 px-4">Status</th>
                          <th className="text-left py-2 px-4">CPF</th>
                          <th className="text-left py-2 px-4">Chave PIX</th>
                          <th className="text-left py-2 px-4">Data</th>
                          <th className="text-left py-2 px-4">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawals.map((w: any) => (
                          <tr key={w.id} className="border-b hover-elevate">
                            <td className="py-2 px-4">R$ {w.amount}</td>
                            <td className="py-2 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                w.status === 'approved' || w.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                                w.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                                'bg-red-500/20 text-red-500'
                              }`}>
                                {w.status}
                              </span>
                            </td>
                            <td className="py-2 px-4">{w.cpf}</td>
                            <td className="py-2 px-4">{w.pixKey}</td>
                            <td className="py-2 px-4">{new Date(w.createdAt).toLocaleDateString('pt-BR')}</td>
                            <td className="py-2 px-4">
                              {w.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="default"
                                    onClick={() => approveWithdrawalMutation.mutate(w.id)}
                                    data-testid={`button-approve-${w.id}`}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Aprovar
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => rejectWithdrawalMutation.mutate(w.id)}
                                    data-testid={`button-reject-${w.id}`}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Rejeitar
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Affiliates Tab */}
          <TabsContent value="affiliates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Afiliados</CardTitle>
                <CardDescription>Gerenciar programa de afiliados</CardDescription>
              </CardHeader>
              <CardContent>
                {affiliates.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum afiliado encontrado</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">Código</th>
                          <th className="text-left py-2 px-4">Total Indicações</th>
                          <th className="text-left py-2 px-4">Indicações Ativas</th>
                          <th className="text-left py-2 px-4">Taxa (%)</th>
                          <th className="text-left py-2 px-4">Saldo Comissões</th>
                          <th className="text-left py-2 px-4">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {affiliates.map((aff: any) => (
                          <tr key={aff.id} className="border-b hover-elevate">
                            <td className="py-2 px-4 font-mono">{aff.referralCode}</td>
                            <td className="py-2 px-4">{aff.totalReferrals}</td>
                            <td className="py-2 px-4">{aff.activeReferrals}</td>
                            <td className="py-2 px-4">{aff.commissionPercentage || "10.00"}%</td>
                            <td className="py-2 px-4">R$ {aff.commissionBalance}</td>
                            <td className="py-2 px-4">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => openEditAffiliate(aff)}
                                data-testid={`button-edit-affiliate-${aff.id}`}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar Saldo
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Comissões</CardTitle>
                <CardDescription>Histórico de comissões geradas</CardDescription>
              </CardHeader>
              <CardContent>
                {commissions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhuma comissão encontrada</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">Valor</th>
                          <th className="text-left py-2 px-4">Porcentagem</th>
                          <th className="text-left py-2 px-4">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commissions.map((comm: any) => (
                          <tr key={comm.id} className="border-b hover-elevate">
                            <td className="py-2 px-4">R$ {comm.amount}</td>
                            <td className="py-2 px-4">{comm.percentage}%</td>
                            <td className="py-2 px-4">{new Date(comm.createdAt).toLocaleDateString('pt-BR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Raspadinha Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Raspadinha</DialogTitle>
            <DialogDescription>Crie uma nova raspadinha para a plataforma</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input 
                id="title" 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                data-testid="input-title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input 
                id="slug" 
                value={formData.slug} 
                onChange={(e) => setFormData({...formData, slug: e.target.value})}
                data-testid="input-slug"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea 
                id="description" 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                data-testid="input-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input 
                  id="price" 
                  type="number" 
                  step="0.01"
                  value={formData.price} 
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  data-testid="input-price"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxPrize">Prêmio Máximo (R$)</Label>
                <Input 
                  id="maxPrize" 
                  type="number" 
                  step="0.01"
                  value={formData.maxPrize} 
                  onChange={(e) => setFormData({...formData, maxPrize: e.target.value})}
                  data-testid="input-max-prize"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gold-rush">Gold Rush</SelectItem>
                    <SelectItem value="lucky-animals">Lucky Animals</SelectItem>
                    <SelectItem value="vegas-lights">Vegas Lights</SelectItem>
                    <SelectItem value="mythic-gods">Mythic Gods</SelectItem>
                    <SelectItem value="crypto-scratch">Crypto Scratch</SelectItem>
                    <SelectItem value="candy-mania">Candy Mania</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stock">Estoque</Label>
                <Input 
                  id="stock" 
                  type="number"
                  value={formData.stock} 
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  data-testid="input-stock"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="badge">Badge (opcional)</Label>
              <Input 
                id="badge" 
                value={formData.badge} 
                onChange={(e) => setFormData({...formData, badge: e.target.value})}
                placeholder="Ex: Popular, Novo"
                data-testid="input-badge"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="imageUrl">URL da Imagem</Label>
              <Input 
                id="imageUrl" 
                value={formData.imageUrl} 
                onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                placeholder="https://..."
                data-testid="input-image-url"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} data-testid="button-confirm-create">
              {createMutation.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Raspadinha Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Raspadinha</DialogTitle>
            <DialogDescription>Atualize as informações da raspadinha</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Título</Label>
              <Input 
                id="edit-title" 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                data-testid="input-edit-title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-slug">Slug (URL)</Label>
              <Input 
                id="edit-slug" 
                value={formData.slug} 
                onChange={(e) => setFormData({...formData, slug: e.target.value})}
                data-testid="input-edit-slug"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea 
                id="edit-description" 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                data-testid="input-edit-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Preço (R$)</Label>
                <Input 
                  id="edit-price" 
                  type="number" 
                  step="0.01"
                  value={formData.price} 
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  data-testid="input-edit-price"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-maxPrize">Prêmio Máximo (R$)</Label>
                <Input 
                  id="edit-maxPrize" 
                  type="number" 
                  step="0.01"
                  value={formData.maxPrize} 
                  onChange={(e) => setFormData({...formData, maxPrize: e.target.value})}
                  data-testid="input-edit-max-prize"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Categoria</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger data-testid="select-edit-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gold-rush">Gold Rush</SelectItem>
                    <SelectItem value="lucky-animals">Lucky Animals</SelectItem>
                    <SelectItem value="vegas-lights">Vegas Lights</SelectItem>
                    <SelectItem value="mythic-gods">Mythic Gods</SelectItem>
                    <SelectItem value="crypto-scratch">Crypto Scratch</SelectItem>
                    <SelectItem value="candy-mania">Candy Mania</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-stock">Estoque</Label>
                <Input 
                  id="edit-stock" 
                  type="number"
                  value={formData.stock} 
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  data-testid="input-edit-stock"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-badge">Badge (opcional)</Label>
              <Input 
                id="edit-badge" 
                value={formData.badge} 
                onChange={(e) => setFormData({...formData, badge: e.target.value})}
                placeholder="Ex: Popular, Novo"
                data-testid="input-edit-badge"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-imageUrl">URL da Imagem</Label>
              <Input 
                id="edit-imageUrl" 
                value={formData.imageUrl} 
                onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                placeholder="https://..."
                data-testid="input-edit-image-url"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending} data-testid="button-confirm-edit">
              {updateMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar a raspadinha "{selectedRaspadinha?.title}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending} data-testid="button-confirm-delete">
              {deleteMutation.isPending ? "Deletando..." : "Deletar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Affiliate Balance Modal */}
      <Dialog open={editAffiliateModalOpen} onOpenChange={setEditAffiliateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Saldo do Afiliado</DialogTitle>
            <DialogDescription>
              Atualize o saldo de comissões do afiliado {selectedAffiliate?.referralCode}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="affiliate-balance">Saldo de Comissões (R$)</Label>
              <Input 
                id="affiliate-balance" 
                type="number" 
                step="0.01"
                value={affiliateBalance} 
                onChange={(e) => setAffiliateBalance(e.target.value)}
                data-testid="input-affiliate-balance"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="affiliate-percentage">Taxa de Comissão (%)</Label>
              <Input 
                id="affiliate-percentage" 
                type="number" 
                step="0.01"
                value={affiliatePercentage} 
                onChange={(e) => setAffiliatePercentage(e.target.value)}
                data-testid="input-affiliate-percentage"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAffiliateModalOpen(false)}>Cancelar</Button>
            <Button 
              onClick={() => updateAffiliateMutation.mutate({ id: selectedAffiliate.id, balance: affiliateBalance, percentage: affiliatePercentage })} 
              disabled={updateAffiliateMutation.isPending}
              data-testid="button-confirm-edit-affiliate"
            >
              {updateAffiliateMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Modal */}
      <Dialog open={userDetailsModalOpen} onOpenChange={setUserDetailsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
                <p className="text-sm">{selectedUser?.name || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-sm">{selectedUser?.email || "-"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                <p className="text-sm">{selectedUser?.phone || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">CPF</p>
                <p className="text-sm">{selectedUser?.cpf || "-"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data de Nascimento</p>
                <p className="text-sm">{selectedUser?.birthDate ? new Date(selectedUser.birthDate).toLocaleDateString('pt-BR') : "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data Cadastro</p>
                <p className="text-sm">{selectedUser ? new Date(selectedUser.createdAt).toLocaleDateString('pt-BR') : "-"}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">ID</p>
              <p className="text-xs font-mono bg-muted p-2 rounded">{selectedUser?.id}</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setUserDetailsModalOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
