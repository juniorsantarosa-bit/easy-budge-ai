import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Sparkles, Upload, FileText, MoreVertical, Trash2 } from "lucide-react";
import { type BudgetModel, deleteModel, getModels } from "@/lib/storage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Orça Fácil — Orçamentos profissionais em segundos" },
      {
        name: "description",
        content:
          "Crie orçamentos profissionais a partir do seu modelo. Faça upload do PDF, gere com IA ou use a biblioteca de modelos prontos.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [models, setModels] = useState<BudgetModel[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setModels(getModels());
  }, []);

  function refresh() {
    setModels(getModels());
  }

  return (
    <AppShell>
      <section className="mb-6 rounded-3xl p-6 text-primary-foreground shadow-elegant" style={{ background: "var(--gradient-hero)" }}>
        <p className="text-xs uppercase tracking-widest opacity-80">Bem-vindo</p>
        <h1 className="mt-1 text-2xl font-bold leading-tight">Faça orçamentos em segundos</h1>
        <p className="mt-2 text-sm opacity-90">
          Use seu modelo, deixe a IA criar um para você ou escolha da biblioteca abaixo.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link to="/novo/ia" className="block">
          <Card className="h-full p-4 hover:shadow-elegant transition-all border-2 border-transparent hover:border-accent/30">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground mb-3">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-sm">Gerar modelo</h3>
            <p className="text-xs text-muted-foreground mt-1">A IA cria pra você</p>
          </Card>
        </Link>
        <Link to="/novo/upload" className="block">
          <Card className="h-full p-4 hover:shadow-elegant transition-all border-2 border-transparent hover:border-primary/30">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-3">
              <Upload className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-sm">Enviar PDF</h3>
            <p className="text-xs text-muted-foreground mt-1">Use seu padrão</p>
          </Card>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-foreground">Meus modelos</h2>
        <span className="text-xs text-muted-foreground">{models.length} salvos</span>
      </div>

      <div className="space-y-3">
        {models.map((m) => (
          <Card key={m.id} className="p-4 flex items-center gap-3 hover:shadow-soft transition-all">
            <button
              onClick={() => navigate({ to: "/editor/$id", params: { id: m.id } })}
              className="flex-1 flex items-center gap-3 text-left"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm truncate">{m.titulo}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {m.campos.length} campos · {m.empresa ?? "Modelo"}
                </p>
              </div>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => {
                    if (confirm("Excluir modelo?")) {
                      deleteModel(m.id);
                      refresh();
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Card>
        ))}

        {models.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhum modelo ainda. Crie o primeiro!</p>
          </Card>
        )}
      </div>

      <Button
        asChild
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-elegant"
        style={{ background: "var(--gradient-accent)" }}
      >
        <Link to="/novo/ia">
          <Plus className="h-6 w-6" />
        </Link>
      </Button>
    </AppShell>
  );
}
