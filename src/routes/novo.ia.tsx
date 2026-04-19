import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Check, X } from "lucide-react";
import { generateTemplate } from "@/server/ai";
import { saveModel, uid, type BudgetModel } from "@/lib/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/novo/ia")({
  head: () => ({
    meta: [{ title: "Gerar modelo com IA — Orça Fácil" }],
  }),
  component: NovoIA,
});

function NovoIA() {
  const [serviceType, setServiceType] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const navigate = useNavigate();

  async function generate() {
    if (!serviceType.trim()) return;
    setLoading(true);
    try {
      const r = await generateTemplate({ data: { serviceType } });
      setPreview(r);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao gerar modelo");
    } finally {
      setLoading(false);
    }
  }

  function confirm() {
    const now = Date.now();
    const m: BudgetModel = {
      id: uid(),
      titulo: preview.titulo,
      empresa: preview.empresa,
      descricao: preview.descricao,
      campos: preview.campos ?? [],
      itens_servico: preview.itens_servico ?? [],
      condicoes: preview.condicoes,
      observacoes: preview.observacoes,
      criado_em: now,
      atualizado_em: now,
    };
    saveModel(m);
    toast.success("Modelo criado!");
    navigate({ to: "/editor/$id", params: { id: m.id } });
  }

  return (
    <AppShell back="/" title="Gerar com IA">
      {!preview && (
        <>
          <div className="mb-6 rounded-2xl p-5 text-accent-foreground shadow-soft" style={{ background: "var(--gradient-accent)" }}>
            <Sparkles className="h-6 w-6 mb-2" />
            <h2 className="font-bold text-lg">Conte o que você faz</h2>
            <p className="text-sm opacity-95 mt-1">
              A IA cria um modelo de orçamento organizado para o seu serviço.
            </p>
          </div>

          <Label htmlFor="service" className="text-sm font-medium">
            Tipo de serviço
          </Label>
          <Input
            id="service"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            placeholder="Ex: Fotografia de casamento"
            className="mt-2 h-12"
          />

          <p className="mt-3 text-xs text-muted-foreground">Sugestões:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {["Pintura residencial", "Aulas particulares", "Manicure domiciliar", "Marketing digital"].map((s) => (
              <button
                key={s}
                onClick={() => setServiceType(s)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:bg-muted transition"
              >
                {s}
              </button>
            ))}
          </div>

          <Button
            onClick={generate}
            disabled={loading || !serviceType.trim()}
            size="lg"
            className="mt-6 w-full h-12"
            style={{ background: "var(--gradient-primary)" }}
          >
            {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Sparkles className="h-5 w-5 mr-2" />}
            {loading ? "Gerando modelo..." : "Gerar modelo"}
          </Button>
        </>
      )}

      {preview && (
        <>
          <Card className="p-4 mb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Modelo sugerido</p>
            <h2 className="font-bold text-xl mt-1">{preview.titulo}</h2>
            {preview.descricao && <p className="text-sm text-muted-foreground mt-1">{preview.descricao}</p>}
          </Card>

          <h3 className="font-semibold text-sm mb-2">Campos editáveis ({preview.campos?.length ?? 0})</h3>
          <div className="space-y-2 mb-4">
            {preview.campos?.map((c: any) => (
              <Card key={c.chave} className="p-3 text-sm flex justify-between items-center">
                <span className="font-medium">{c.rotulo}</span>
                <span className="text-xs text-muted-foreground capitalize">{c.tipo}</span>
              </Card>
            ))}
          </div>

          {preview.itens_servico?.length > 0 && (
            <>
              <h3 className="font-semibold text-sm mb-2">Itens sugeridos</h3>
              <div className="space-y-2 mb-4">
                {preview.itens_servico.map((it: any, i: number) => (
                  <Card key={i} className="p-3 text-sm flex justify-between items-center">
                    <span>{it.descricao}</span>
                    <span className="text-xs text-muted-foreground">
                      {it.quantidade ?? 1}x R$ {(it.valor_unitario ?? 0).toFixed(2)}
                    </span>
                  </Card>
                ))}
              </div>
            </>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPreview(null)} className="flex-1 h-12">
              <X className="h-4 w-4 mr-1" /> Refazer
            </Button>
            <Button
              onClick={confirm}
              className="flex-1 h-12"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Check className="h-4 w-4 mr-1" /> Usar este modelo
            </Button>
          </div>
        </>
      )}
    </AppShell>
  );
}
