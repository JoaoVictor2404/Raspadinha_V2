import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, Zap, Copy, CheckCircle2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const quickAmounts = [
  { value: 10, bonus: null },
  { value: 20, bonus: "+Quadro" },
  { value: 40, bonus: "Recomendado" },
  { value: 80, bonus: "+Chance" },
  { value: 100, bonus: "+Chance" },
  { value: 200, bonus: "+Chance" },
];

export default function DepositoPage() {
  const { toast } = useToast();
  const [amount, setAmount] = useState<number>(40);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixCode, setPixCode] = useState("");
  const [copied, setCopied] = useState(false);

  const [depositId, setDepositId] = useState<string>("");
  const [qrCodeBase64, setQrCodeBase64] = useState<string>("");

  const generatePixMutation = useMutation({
    mutationFn: async (depositAmount: number) => {
      const res = await apiRequest("POST", "/api/deposits/create", { amount: depositAmount });
      return res.json();
    },
    onSuccess: (data) => {
      setDepositId(data.depositId);
      setPixCode(data.qrCode || "");
      setQrCodeBase64(data.qrCodeBase64 || "");
      setPixModalOpen(true);
      
      // Poll for payment confirmation
      const pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`/api/deposits/${data.depositId}`, {
            credentials: "include",
          });
          const deposit = await res.json();
          
          if (deposit.status === "completed") {
            clearInterval(pollInterval);
            queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
            queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
            toast({
              title: "Pagamento confirmado!",
              description: "Seu saldo foi atualizado",
            });
            setPixModalOpen(false);
          }
        } catch (err) {
          console.error("Error polling deposit:", err);
        }
      }, 3000); // Poll every 3 seconds

      // Stop polling after 10 minutes
      setTimeout(() => clearInterval(pollInterval), 10 * 60 * 1000);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao gerar PIX",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast({
      title: "Código copiado!",
      description: "Cole no app do seu banco",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-12">
        {/* Banner */}
        <div className="bg-gradient-to-r from-primary/20 to-background border-y border-border py-8 mb-12">
          <div className="container mx-auto px-4 text-center">
            <Zap className="h-12 w-12 text-primary mx-auto mb-3" />
            <h1 className="text-3xl font-bold mb-2">Não perde tempo, deposite agora</h1>
            <p className="text-muted-foreground">
              Comece a jogar em segundos com PIX instantâneo
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-2xl">
          {/* Payment Method Card */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold">Método de pagamento seguro</span>
            </div>

            {/* Quick Amounts */}
            <div className="mb-6">
              <Label className="mb-3 block">Valores rápidos</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {quickAmounts.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setAmount(item.value)}
                    className={`relative rounded-lg border-2 p-4 text-center transition-all hover-elevate active-elevate-2 ${
                      amount === item.value
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card"
                    }`}
                    data-testid={`button-amount-${item.value}`}
                  >
                    {item.bonus && (
                      <Badge
                        variant="default"
                        className={`absolute -top-2 -right-2 text-xs ${
                          item.bonus === "Recomendado"
                            ? "bg-warning text-warning-foreground"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {item.bonus}
                      </Badge>
                    )}
                    <p className="text-2xl font-bold">R$ {item.value},00</p>
                    {item.bonus && item.bonus !== "Recomendado" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        +R$ {item.value},00
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div className="space-y-2 mb-6">
              <Label htmlFor="custom-amount">Valor customizado</Label>
              <Input
                id="custom-amount"
                type="number"
                min="10"
                max="5000"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="text-lg"
                data-testid="input-custom-amount"
              />
              <p className="text-xs text-muted-foreground">
                Mínimo: R$ 10,00 • Máximo: R$ 5.000,00
              </p>
            </div>

            {/* Total Display */}
            <div className="rounded-lg bg-muted p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total a pagar</span>
                <span className="text-2xl font-bold text-primary" data-testid="display-total">
                  R$ {amount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Generate PIX Button */}
            <Button
              size="lg"
              className="w-full rounded-full"
              onClick={() => generatePixMutation.mutate(amount)}
              disabled={amount < 10 || amount > 5000 || generatePixMutation.isPending}
              data-testid="button-gerar-pix"
            >
              {generatePixMutation.isPending ? "Gerando..." : "Gerar PIX"}
            </Button>
          </Card>
        </div>
      </main>

      {/* PIX Modal */}
      <Dialog open={pixModalOpen} onOpenChange={setPixModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>PIX Gerado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* QR Code */}
            <div className="aspect-square rounded-lg bg-white p-4 flex items-center justify-center">
              {qrCodeBase64 ? (
                <div className="text-center">
                  <img 
                    src={`data:image/png;base64,${qrCodeBase64}`} 
                    alt="QR Code PIX" 
                    className="w-64 h-64 mx-auto mb-2"
                  />
                  <p className="text-sm text-black/60">Escaneie com seu app de banco</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-48 h-48 bg-black/10 rounded-lg mb-2 flex items-center justify-center">
                    <span className="text-4xl">📱</span>
                  </div>
                  <p className="text-sm text-black/60">Gerando QR Code...</p>
                </div>
              )}
            </div>

            {/* Pix Copia e Cola */}
            <div>
              <Label className="mb-2 block">Pix Copia e Cola</Label>
              <div className="flex gap-2">
                <Input
                  value={pixCode}
                  readOnly
                  className="font-mono text-xs"
                  data-testid="input-pix-code"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={copyPixCode}
                  data-testid="button-copy-pix"
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-primary/10 p-3 text-sm text-center">
              <p className="text-muted-foreground">
                O valor será creditado automaticamente após o pagamento
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
      <BottomNavigation />
    </div>
  );
}
