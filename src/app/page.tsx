import type { Metadata } from "next";
import Link from "next/link";
import {
  Receipt,
  TrendingUp,
  ClipboardList,
  Handshake,
  LayoutDashboard,
  Wallet,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Priority List — Gestão de finanças pessoais",
  description:
    "Organize despesas, acompanhe receitas em múltiplas moedas, controle orçamentos e nunca mais perca o controle do seu dinheiro.",
};

const features = [
  {
    icon: Receipt,
    title: "Despesas Detalhadas",
    description:
      "Categorize por casa, saúde, educação e mais. Defina prioridade, urgência e tipo. Importe via CSV.",
  },
  {
    icon: TrendingUp,
    title: "Receitas e Moedas",
    description:
      "Registre receitas fixas e variáveis em BRL, USD ou PYG. Conversão automática com cotações atualizadas.",
  },
  {
    icon: ClipboardList,
    title: "Pendências",
    description:
      "Acompanhe tarefas financeiras pendentes com status, prioridade e centro de custo. Nada fica esquecido.",
  },
  {
    icon: Handshake,
    title: "Empréstimos",
    description:
      "Controle empréstimos feitos e recebidos, com cálculo de juros, consolidação mensal e exibição em duas moedas.",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard Completo",
    description:
      "Gráficos por categoria, prioridade, centro de custo, fluxo diário, maiores gastos e visão anual.",
  },
  {
    icon: Wallet,
    title: "Orçamento Mensal",
    description:
      "Defina limites mensais e acompanhe o progresso com barras visuais. Saiba exatamente onde está gastando.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2 font-semibold">
            <Wallet className="h-5 w-5 text-primary" />
            <span>Priority List</span>
          </div>
          <Button render={<Link href="/login" />} variant="outline" size="sm">
            Entrar
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-[80vh] flex flex-col items-center justify-center text-center max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <Badge variant="secondary" className="mb-6">
          Gestão financeira inteligente
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
          Tome o controle das suas finanças pessoais
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
          Organize despesas, acompanhe receitas em múltiplas moedas, controle
          orçamentos e nunca mais perca o controle do seu dinheiro.
        </p>
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Button render={<Link href="/login" />} size="lg">
            Começar agora
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button render={<Link href="#funcionalidades" />} variant="outline" size="lg">
            Ver funcionalidades
          </Button>
        </div>

        {/* Mini stat cards */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          <Card>
            <CardContent className="pt-6 text-center">
              <Receipt className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-2xl font-bold">R$ 4.250,00</p>
              <p className="text-sm text-muted-foreground">Despesas do mês</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-2xl font-bold">R$ 8.500,00</p>
              <p className="text-sm text-muted-foreground">Receitas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Wallet className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-2xl font-bold">73%</p>
              <p className="text-sm text-muted-foreground">
                Orçamento utilizado
              </p>
              <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-[73%] rounded-full bg-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Grid */}
      <section
        id="funcionalidades"
        className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Tudo que você precisa em um só lugar
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <feature.icon className="h-8 w-8 text-primary mb-2" />
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Feature Detail: Multi-moeda */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Suas finanças em qualquer moeda
            </h3>
            <p className="text-muted-foreground text-lg">
              Trabalha com dólares, reais e guaranis? Registre valores na moeda
              original e veja a conversão automática para BRL, USD e PYG com
              cotações atualizadas diariamente.
            </p>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Aluguel escritório</p>
                    <p className="text-sm text-muted-foreground">USD 1.200,00</p>
                  </div>
                </div>
                <Badge variant="outline">USD</Badge>
              </div>
              <div className="border-t pt-3 space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>BRL</span>
                  <span>R$ 6.840,00</span>
                </div>
                <div className="flex justify-between">
                  <span>PYG</span>
                  <span>₲ 8.760.000</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Feature Detail: Prioridades */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Plano de saúde</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">Alta</Badge>
                    <span className="text-sm font-medium">R$ 890,00</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Curso de inglês</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Média</Badge>
                    <span className="text-sm font-medium">R$ 350,00</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Streaming</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Baixa</Badge>
                    <span className="text-sm font-medium">R$ 45,90</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="order-1 lg:order-2">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Priorize o que importa
            </h3>
            <p className="text-muted-foreground text-lg">
              Classifique cada despesa por prioridade, urgência e centro de
              custo. Saiba exatamente o que cortar primeiro se o orçamento
              apertar.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Detail: Dashboard */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Visão completa, decisões melhores
            </h3>
            <p className="text-muted-foreground text-lg">
              Gráficos interativos mostram para onde vai seu dinheiro.
              Acompanhe fluxo diário, maiores gastos por categoria e evolução
              mensal em um dashboard completo.
            </p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-end gap-2 h-32">
                <div className="flex-1 bg-chart-1 rounded-t" style={{ height: "60%" }} />
                <div className="flex-1 bg-chart-2 rounded-t" style={{ height: "85%" }} />
                <div className="flex-1 bg-chart-3 rounded-t" style={{ height: "45%" }} />
                <div className="flex-1 bg-chart-4 rounded-t" style={{ height: "70%" }} />
                <div className="flex-1 bg-chart-5 rounded-t" style={{ height: "55%" }} />
                <div className="flex-1 bg-chart-1 rounded-t" style={{ height: "90%" }} />
                <div className="flex-1 bg-chart-2 rounded-t" style={{ height: "40%" }} />
              </div>
              <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                <span>Seg</span>
                <span>Ter</span>
                <span>Qua</span>
                <span>Qui</span>
                <span>Sex</span>
                <span>Sáb</span>
                <span>Dom</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Final */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="bg-card/50 rounded-2xl p-8 md:p-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Pronto para organizar suas finanças?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Crie sua conta gratuitamente e comece a ter controle total sobre
            suas receitas, despesas e orçamentos.
          </p>
          <Button render={<Link href="/login" />} size="lg">
            Criar conta gratuita
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 text-center text-sm text-muted-foreground">
          <p className="font-medium">
            Priority List — Gestão de finanças pessoais
          </p>
          <p className="mt-1">
            Feito com cuidado para quem leva dinheiro a sério.
          </p>
        </div>
      </footer>
    </div>
  );
}
