import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || user?.username || "");
  const [email, setEmail] = useState(user?.email || "");

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Perfil atualizado",
      description: "Suas informações foram salvas com sucesso",
    });
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Senha atualizada",
      description: "Sua senha foi alterada com sucesso",
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Configurações</h1>
          <p className="text-muted-foreground mb-6">
            Gerencie suas configurações de perfil e conta
          </p>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="profile" data-testid="tab-perfil">
                Perfil
              </TabsTrigger>
              <TabsTrigger value="password" data-testid="tab-senha">
                Senha
              </TabsTrigger>
              <TabsTrigger value="appearance" data-testid="tab-aparencia">
                Aparência
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Informações do perfil</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Atualize seu nome e endereço de email
                </p>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="João Victor da Silva Souza"
                      data-testid="input-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Endereço de email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="joaovictordasilva2008@gmail.com"
                      data-testid="input-email"
                    />
                  </div>
                  <Button type="submit" className="rounded-full" data-testid="button-salvar-perfil">
                    Salvar
                  </Button>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="password">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Alterar senha</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Crie uma nova senha forte
                </p>
                <form onSubmit={handleSavePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Senha atual</Label>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="Digite sua senha atual"
                      data-testid="input-current-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova senha</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Digite a nova senha"
                      data-testid="input-new-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirme a nova senha"
                      data-testid="input-confirm-password"
                    />
                  </div>
                  <Button type="submit" className="rounded-full" data-testid="button-salvar-senha">
                    Salvar
                  </Button>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="appearance">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Aparência</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Personalize a aparência da plataforma
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div>
                      <p className="font-medium">Tema escuro</p>
                      <p className="text-sm text-muted-foreground">
                        Modo escuro ativado permanentemente
                      </p>
                    </div>
                    <div className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      Ativo
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
      <BottomNavigation />
    </div>
  );
}
