import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z.object({
  name: z.string().min(3, "Nome completo obrigatório"),
  phone: z.string().min(10, "Telefone obrigatório"),
  birthDate: z.string().min(1, "Data de nascimento obrigatória"),
  cpf: z.string().min(11, "CPF obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "login" | "register";
  onSuccess?: () => void;
}

export function AuthModal({ open, onOpenChange, defaultTab = "login", onSuccess }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { toast } = useToast();

  // Sync activeTab with defaultTab when modal opens or defaultTab changes
  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      phone: "",
      birthDate: "",
      cpf: "",
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: z.infer<typeof loginSchema>) => {
      return apiRequest("POST", "/api/login", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta",
      });
      onOpenChange(false);
      loginForm.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: error.message || "Credenciais inválidas",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof registerSchema>) => {
      // Get referral code from storage
      const referralCode = localStorage.getItem("referralCode");
      
      return apiRequest("POST", "/api/register", {
        ...data,
        referralCode: referralCode || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      toast({
        title: "Conta criada!",
        description: "Cadastro realizado com sucesso",
      });
      onOpenChange(false);
      registerForm.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: error.message || "Não foi possível criar a conta",
      });
    },
  });

  const handleLogin = loginForm.handleSubmit((data) => {
    loginMutation.mutate(data);
  });

  const handleRegister = registerForm.handleSubmit((data) => {
    registerMutation.mutate(data);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] p-0 bg-background border-border overflow-hidden">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          data-testid="button-close-auth-modal"
        >
          <X className="h-4 w-4 text-foreground" />
          <span className="sr-only">Fechar</span>
        </button>

        <div className="grid md:grid-cols-2">
          {/* Left Panel - Promotional */}
          <div className="hidden md:flex flex-col justify-center items-center p-8 bg-gradient-to-br from-[#0F2027] via-[#203A43] to-[#2C5364] relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-32 h-32 bg-accent rounded-full blur-3xl"></div>
              <div className="absolute bottom-10 right-10 w-40 h-40 bg-primary rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative z-10 text-center">
              <h2 className="text-3xl font-bold text-white mb-2">
                {activeTab === "register" ? "CADASTRE-SE AGORA E" : "ESSA OFERTA"}
              </h2>
              <h2 className="text-3xl font-bold text-primary mb-4">
                {activeTab === "register" ? "COMECE A CONCORRER" : "É LIMITADA!"}
              </h2>
              <p className="text-white/80 mb-6">
                {activeTab === "register" 
                  ? "AOS MELHORES PRÊMIOS DO BRASIL"
                  : "Sairá do Ar a qualquer momento"
                }
              </p>
              
              {activeTab === "login" && (
                <div className="bg-primary/20 border border-primary/50 rounded-lg p-4 mb-4">
                  <p className="text-white font-semibold mb-1">DEPOSITE AGORA E RECEBA</p>
                  <p className="text-primary text-xl font-bold">BÔNUS EXCLUSIVOS!</p>
                </div>
              )}

              {/* Decorative element */}
              <div className="mt-8 flex justify-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
                <div className="w-3 h-3 rounded-full bg-accent animate-pulse delay-100"></div>
                <div className="w-3 h-3 rounded-full bg-warning animate-pulse delay-200"></div>
              </div>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="p-8 bg-card max-h-[90vh] overflow-y-auto">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger 
                  value="login" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  data-testid="tab-login"
                >
                  Conecte-se
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  data-testid="tab-register"
                >
                  Inscrever-se
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <p className="text-muted-foreground">
                      Acesse sua conta com suas credenciais
                    </p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">E-mail</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="Digite seu e-mail"
                        className="bg-background border-border"
                        data-testid="input-login-email"
                        {...loginForm.register("email")}
                      />
                      {loginForm.formState.errors.email && (
                        <p className="text-sm text-destructive">
                          {loginForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Digite sua senha</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="bg-background border-border"
                        data-testid="input-login-password"
                        {...loginForm.register("password")}
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-destructive">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="remember"
                          data-testid="checkbox-remember-me"
                          checked={loginForm.watch("rememberMe")}
                          onCheckedChange={(checked) => 
                            loginForm.setValue("rememberMe", checked as boolean)
                          }
                        />
                        <label
                          htmlFor="remember"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Lembrar de mim
                        </label>
                      </div>
                      <button
                        type="button"
                        className="text-sm text-primary hover:underline"
                        data-testid="button-forgot-password"
                      >
                        Esqueceu sua senha?
                      </button>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      disabled={loginMutation.isPending}
                      data-testid="button-submit-login"
                    >
                      {loginMutation.isPending ? "Entrando..." : "Entrar"}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                      Ainda não tem uma conta?{" "}
                      <button
                        type="button"
                        onClick={() => setActiveTab("register")}
                        className="text-primary hover:underline font-semibold"
                        data-testid="button-switch-to-register"
                      >
                        Criar uma conta grátis
                      </button>
                    </p>
                  </form>
                </div>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <p className="text-muted-foreground">
                      Crie sua conta gratuita. Vamos começar?
                    </p>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Nome completo</Label>
                      <Input
                        id="register-name"
                        placeholder="Digite seu nome completo"
                        className="bg-background border-border"
                        data-testid="input-register-name"
                        {...registerForm.register("name")}
                      />
                      {registerForm.formState.errors.name && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-phone">Número de telefone</Label>
                      <Input
                        id="register-phone"
                        placeholder="(00) 00000-0000"
                        className="bg-background border-border"
                        data-testid="input-register-phone"
                        {...registerForm.register("phone")}
                      />
                      {registerForm.formState.errors.phone && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.phone.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-birthdate">Data de nascimento</Label>
                      <Input
                        id="register-birthdate"
                        type="date"
                        className="bg-background border-border"
                        data-testid="input-register-birthdate"
                        {...registerForm.register("birthDate")}
                      />
                      {registerForm.formState.errors.birthDate && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.birthDate.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Você deve ter 18 anos ou mais para se cadastrar
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-cpf">CPF ou CNPJ</Label>
                      <Input
                        id="register-cpf"
                        placeholder="000.000.000-00"
                        className="bg-background border-border"
                        data-testid="input-register-cpf"
                        {...registerForm.register("cpf")}
                      />
                      {registerForm.formState.errors.cpf && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.cpf.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email">Gmail</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="seuemail@gmail.com"
                        className="bg-background border-border"
                        data-testid="input-register-email"
                        {...registerForm.register("email")}
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password">Senha</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        className="bg-background border-border"
                        data-testid="input-register-password"
                        {...registerForm.register("password")}
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      disabled={registerMutation.isPending}
                      data-testid="button-submit-register"
                    >
                      {registerMutation.isPending ? "Cadastrando..." : "Cadastrar"}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                      Já tem uma conta?{" "}
                      <button
                        type="button"
                        onClick={() => setActiveTab("login")}
                        className="text-primary hover:underline font-semibold"
                        data-testid="button-switch-to-login"
                      >
                        Conecte-se
                      </button>
                    </p>
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
