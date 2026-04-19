import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Receipt, Trash2 } from "lucide-react";
import { getHistory, deleteHistory, type BudgetHistory } from "@/lib/storage";

export const Route = createFileRoute("/orcamentos")({
  head: () => ({
    meta: [
      { title: "Meus orçamentos — Orça Fácil" },
      { name: "description", content: "Histórico de orçamentos emitidos em PDF." },
    ],
  }),
  component: Orcamentos,
});

function fmtBR(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtDate(t: number) {
  return new Date(t).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Orcamentos() {
  const [items, setItems] = useState<BudgetHistory[]>([]);

  useEffect(() => {
    setItems(getHistory());
  }, []);

  return (
    <AppShell back="/" title="Meus orçamentos">
      <p className="text-sm text-muted-foreground mb-3">
        {items.length} {items.length === 1 ? "orçamento emitido" : "orçamentos emitidos"}
      </p>

      <div className="space-y-3">
        {items.map((h) => (
          <Card key={h.id} className="p-4 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Receipt className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm truncate">{h.modelo_titulo}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {h.cliente ? `${h.cliente} · ` : ""}{fmtDate(h.emitido_em)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-primary">{fmtBR(h.total)}</p>
              <button
                onClick={() => {
                  if (confirm("Remover do histórico?")) {
                    deleteHistory(h.id);
                    setItems(getHistory());
                  }
                }}
                className="text-[10px] text-muted-foreground hover:text-destructive inline-flex items-center gap-1 mt-0.5"
              >
                <Trash2 className="h-3 w-3" /> remover
              </button>
            </div>
          </Card>
        ))}

        {items.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">Nenhum orçamento emitido ainda.</p>
            <Button asChild size="sm">
              <Link to="/">Criar um agora</Link>
            </Button>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
