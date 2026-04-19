import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, MoreVertical, Trash2, Plus } from "lucide-react";
import { type BudgetModel, deleteModel, getModels } from "@/lib/storage";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/modelos")({
  head: () => ({
    meta: [
      { title: "Meus modelos — Orça Fácil" },
      { name: "description", content: "Gerencie seus modelos de orçamento salvos." },
    ],
  }),
  component: Modelos,
});

function Modelos() {
  const [models, setModels] = useState<BudgetModel[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setModels(getModels());
  }, []);

  return (
    <AppShell back="/" title="Meus modelos">
      <p className="text-sm text-muted-foreground mb-3">
        {models.length} {models.length === 1 ? "modelo salvo" : "modelos salvos"}
      </p>

      <div className="space-y-3">
        {models.map((m) => (
          <Card key={m.id} className="p-4 flex items-center gap-3 hover:shadow-soft transition">
            <button
              onClick={() => navigate({ to: "/editor/$id", params: { id: m.id } })}
              className="flex-1 flex items-center gap-3 text-left"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary overflow-hidden">
                {m.logo_url ? <img src={m.logo_url} alt="" className="h-full w-full object-contain" /> : <FileText className="h-6 w-6" />}
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
                      setModels(getModels());
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
            <p className="text-sm text-muted-foreground mb-3">Nenhum modelo ainda.</p>
            <Button asChild size="sm">
              <Link to="/novo/ia">Criar com IA</Link>
            </Button>
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
