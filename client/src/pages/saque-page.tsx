import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowDownLeft, Wallet as WalletIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Wallet } from "@shared/schema";

const QUICK_AMOUNTS = [20, 50, 100, 200];
const MIN_WITHDRAWAL = 10;
const MAX_WITHDRAWAL = 10000;

export default function SaquePage() {
  const { toast } = useToast();
  const [amount, setAmount] = useState<number>(50);
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState<string>("CPF");
  const [recipientDocument, setRecipientDocument] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);

  const { data: wallet } = useQuery<Wallet>({
    queryKey: ["/api/wallet"],
  });

  const withdrawalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/withdrawals/create", {
        amount,
        pixKey,
        pixKeyType,
        recipientDocument,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setWithdrawalSuccess(true);
      toast({
        title: "Saque solicitado!",
        description: data.message || "O valor será transferido em até 24h.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao solicitar saque",
        description: error.message,
      });
    },
  });

  const handleAmountClick = (value: number) => {
    setAmount(value);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setAmount(numValue);
    }
  };

  const handleWithdraw = () => {
    if (!recipientDocument.trim()) {
      toast({
        variant: "destructive",
        title: "CPF obrigatório",
        description: "Informe seu CPF cadastrado na chave PIX",
      });
      return;
    }

    if (!pixKey.trim()) {
      toast({
        variant: "destructive",
        title: "Chave PIX obrigatória",
        description: "Informe sua chave PIX para receber o saque",
      });
      return;
    }

    if (amount < MIN_WITHDRAWAL) {
      toast({
        variant: "destructive",
        title: "Valor mínimo não atingido",
        description: `O valor mínimo para saque é R$ ${MIN_WITHDRAWAL.toFixed(2)}`,
      });
      return;
    }

    if (amount > MAX_WITHDRAWAL) {
      toast({
        variant: "destructive",
        title: "Valor máximo excedido",
        description: `O valor máximo para saque é R$ ${MAX_WITHDRAWAL.toFixed(2)}`,
      });
      return;
    }

    const availableBalance = parseFloat(wallet?.balanceTotal || "0");
    if (amount > availableBalance) {
      toast({
        variant: "destructive",
        title: "Saldo insuficiente",
        description: "Você não tem saldo suficiente para este saque",
      });
      return;
    }

    withdrawalMutation.mutate();
  };

  const availableBalance = parseFloat(wallet?.balanceTotal || "0");

  if (withdrawalSuccess) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4 max-w-2xl">
            <Card className="p-8 text-center">
              <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Saque solicitado com sucesso!</h2>
              <p className="text-muted-foreground mb-6">
                O valor de R$ {amount.toFixed(2)} será transferido para sua chave PIX em até 24 horas.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground mb-6">
                <p><strong>Chave PIX:</strong> {pixKey}</p>
                <p><strong>Tipo:</strong> {pixKeyType.toUpperCase()}</p>
              </div>
              <Button
                onClick={() => {
                  setWithdrawalSuccess(false);
                  setPixKey("");
                  setAmount(50);
                  setCustomAmount("");
                }}
                data-testid="button-new-withdrawal"
              >
                Fazer outro saque
              </Button>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-12">
        {/* Banner */}
        <div className="bg-gradient-to-r from-accent/20 to-background border-y border-border py-8 mb-12">
          <div className="container mx-auto px-4 text-center">
            <ArrowDownLeft className="h-12 w-12 text-accent mx-auto mb-3" />
            <h1 className="text-3xl font-bold mb-2">Saque seus ganhos</h1>
            <p className="text-muted-foreground">
              Receba direto na sua conta via PIX instantâneo
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-2xl">
          {/* Balance Display */}
          <Card className="p-6 mb-6 bg-gradient-to-br from-card to-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-3">
                  <WalletIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo disponível</p>
                  <p className="text-2xl font-bold text-primary" data-testid="text-balance">
                    R$ {availableBalance.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Withdrawal Form */}
          <Card className="p-6 mb-6">
            {/* Quick Amounts */}
            <div className="mb-6">
              <Label className="mb-3 block">Valores rápidos</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {QUICK_AMOUNTS.map((value) => (
                  <Button
                    key={value}
                    variant={amount === value && !customAmount ? "default" : "outline"}
                    onClick={() => handleAmountClick(value)}
                    className="font-semibold"
                    data-testid={`button-amount-${value}`}
                  >
                    R$ {value}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div className="mb-6">
              <Label htmlFor="custom-amount" className="mb-2 block">
                Valor personalizado
              </Label>
              <Input
                id="custom-amount"
                type="number"
                placeholder={`Mínimo R$ ${MIN_WITHDRAWAL}`}
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                min={MIN_WITHDRAWAL}
                max={MAX_WITHDRAWAL}
                data-testid="input-custom-amount"
              />
            </div>

            {/* CPF */}
            <div className="mb-6">
              <Label htmlFor="recipient-document" className="mb-2 block">
                CPF do titular
              </Label>
              <Input
                id="recipient-document"
                type="text"
                placeholder="000.000.000-00"
                value={recipientDocument}
                onChange={(e) => setRecipientDocument(e.target.value)}
                data-testid="input-recipient-document"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Informe o CPF cadastrado na chave PIX
              </p>
            </div>

            {/* PIX Key Type */}
            <div className="mb-6">
              <Label htmlFor="pix-type" className="mb-2 block">
                Tipo de chave PIX
              </Label>
              <Select value={pixKeyType} onValueChange={setPixKeyType}>
                <SelectTrigger id="pix-type" data-testid="select-pix-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CPF">CPF</SelectItem>
                  <SelectItem value="EMAIL">E-mail</SelectItem>
                  <SelectItem value="PHONE">Telefone</SelectItem>
                  <SelectItem value="RANDOM">Chave aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* PIX Key */}
            <div className="mb-6">
              <Label htmlFor="pix-key" className="mb-2 block">
                Chave PIX
              </Label>
              <Input
                id="pix-key"
                type="text"
                placeholder={
                  pixKeyType === "CPF"
                    ? "000.000.000-00"
                    : pixKeyType === "EMAIL"
                    ? "seu@email.com"
                    : pixKeyType === "PHONE"
                    ? "(00) 00000-0000"
                    : "Chave aleatória"
                }
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                data-testid="input-pix-key"
              />
            </div>

            {/* Info Alert */}
            {amount >= MIN_WITHDRAWAL && (
              <Alert className="mb-6 border-accent/50 bg-accent/10">
                <AlertCircle className="h-4 w-4 text-accent" />
                <AlertDescription>
                  Você vai sacar <strong className="text-accent">R$ {amount.toFixed(2)}</strong>.
                  O valor será transferido em até 24 horas para a chave PIX informada.
                </AlertDescription>
              </Alert>
            )}

            {/* Withdraw Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleWithdraw}
              disabled={
                withdrawalMutation.isPending || 
                !pixKey.trim() || 
                !recipientDocument.trim() || 
                amount < MIN_WITHDRAWAL
              }
              data-testid="button-withdraw"
            >
              {withdrawalMutation.isPending ? "Processando..." : "Solicitar saque"}
            </Button>
          </Card>

          {/* Info Card */}
          <Card className="p-6 bg-muted/30">
            <h3 className="font-semibold mb-3">Informações importantes</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Valor mínimo para saque: R$ {MIN_WITHDRAWAL.toFixed(2)}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Valor máximo por saque: R$ {MAX_WITHDRAWAL.toFixed(2)}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Prazo de transferência: até 24 horas úteis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Sem taxas para saques via PIX</span>
              </li>
            </ul>
          </Card>
        </div>
      </main>

      <Footer />
      <BottomNavigation />
    </div>
  );
}
