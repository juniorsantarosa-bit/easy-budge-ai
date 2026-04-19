import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Sparkles, Save, Trash2, Plus, Image as ImgIcon, X, Loader2, Upload } from "lucide-react";
import { getModel, saveModel, type BudgetModel, type BudgetField, uid } from "@/lib/storage";
import { aiImprovements } from "@/server/ai";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/editor/$id")({
  component: Editor,
});

function Editor() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [model, setModel] = useState<BudgetModel | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiList, setAiList] = useState<any[]>([]);
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    const m = getModel(id);
    if (!m) {
      toast.error("Modelo não encontrado");
      navigate({ to: "/" });
      return;
    }
    setModel(m);
    const v: Record<string, string> = {};
    m.campos.forEach((c) => (v[c.chave] = c.valor_atual ?? ""));
    setValues(v);
  }, [id, navigate]);

  const total = useMemo(() => {
    if (!model?.itens_servico) return 0;
    return model.itens_servico.reduce((s, it) => s + (it.quantidade ?? 1) * (it.valor_unitario ?? 0), 0);
  }, [model]);

  if (!model) return null;

  function update(field: BudgetField, val: string) {
    setValues((v) => ({ ...v, [field.chave]: val }));
  }

  function persist(extra?: Partial<BudgetModel>) {
    if (!model) return;
    const next = { ...model, ...extra, atualizado_em: Date.now() };
    next.campos = next.campos.map((c) => ({ ...c, valor_atual: values[c.chave] ?? c.valor_atual }));
    saveModel(next);
    setModel(next);
    return next;
  }

  function saveAsTemplate() {
    persist();
    toast.success("Modelo salvo como padrão!");
  }

  function gotoPreview() {
    persist();
    sessionStorage.setItem("orcafacil:valores:" + model!.id, JSON.stringify(values));
    navigate({ to: "/preview/$id", params: { id: model!.id } });
  }

  async function loadImprovements() {
    setAiLoading(true);
    setAiList([]);
    try {
      const r = await aiImprovements({ data: { modelo: { ...model, valores_atuais: values } } });
      setAiList(r.melhorias ?? []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAiLoading(false);
    }
  }

  async function uploadLogo(file: File) {
    setLogoUploading(true);
    try {
      const path = `logos/${model!.id}-${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("orcafacil").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("orcafacil").getPublicUrl(path);
      const next = persist({ logo_url: data.publicUrl });
      if (next) toast.success("Logo carregado!");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao enviar logo");
    } finally {
      setLogoUploading(false);
    }
  }

  async function uploadImage(file: File) {
    try {
      const path = `imgs/${model!.id}-${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("orcafacil").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("orcafacil").getPublicUrl(path);
      const imagens = [...(model!.imagens ?? []), { id: uid(), url: data.publicUrl }];
      persist({ imagens });
      toast.success("Imagem adicionada");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  function removeImage(id: string) {
    persist({ imagens: (model!.imagens ?? []).filter((i) => i.id !== id) });
  }

  return (
    <AppShell
      back="/"
      title={model.titulo}
      action={
        <Button onClick={gotoPreview} size="sm" className="gap-1" style={{ background: "var(--gradient-primary)" }}>
          <Eye className="h-4 w-4" /> Preview
        </Button>
      }
    >
      {/* Logo card */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-soft overflow-hidden">
            {model.logo_url ? (
              <img src={model.logo_url} alt="logo" className="h-full w-full object-contain" />
            ) : (
              <ImgIcon className="h-6 w-6 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Logo da empresa</p>
            <p className="text-xs text-muted-foreground">Aparece no cabeçalho do orçamento</p>
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])}
            />
            <Button asChild size="sm" variant="outline">
              <span>{logoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Carregar"}</span>
            </Button>
          </label>
        </div>
      </Card>

      {/* Editable fields */}
      <h2 className="font-semibold text-sm mb-2 mt-2">Dados do orçamento</h2>
      <div className="space-y-3">
        {model.campos.map((f) => (
          <div key={f.chave}>
            <Label htmlFor={f.chave} className="text-xs text-muted-foreground">
              {f.rotulo}
            </Label>
            {f.tipo === "longo" ? (
              <Textarea
                id={f.chave}
                value={values[f.chave] ?? ""}
                onChange={(e) => update(f, e.target.value)}
                placeholder={f.placeholder ?? f.exemplo}
                className="mt-1"
                rows={3}
              />
            ) : (
              <Input
                id={f.chave}
                type={f.tipo === "data" ? "date" : f.tipo === "numero" || f.tipo === "valor" ? "number" : "text"}
                value={values[f.chave] ?? ""}
                onChange={(e) => update(f, e.target.value)}
                placeholder={f.placeholder ?? f.exemplo}
                className="mt-1 h-11"
              />
            )}
          </div>
        ))}
      </div>

      {/* Items */}
      {model.itens_servico && model.itens_servico.length > 0 && (
        <>
          <h2 className="font-semibold text-sm mb-2 mt-6">Itens do serviço</h2>
          <div className="space-y-2">
            {model.itens_servico.map((it, i) => (
              <Card key={i} className="p-3">
                <Input
                  value={it.descricao}
                  onChange={(e) => {
                    const items = [...model.itens_servico!];
                    items[i] = { ...it, descricao: e.target.value };
                    persist({ itens_servico: items });
                  }}
                  className="border-0 p-0 h-auto text-sm font-medium focus-visible:ring-0"
                />
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="number"
                    value={it.quantidade ?? 1}
                    onChange={(e) => {
                      const items = [...model.itens_servico!];
                      items[i] = { ...it, quantidade: Number(e.target.value) };
                      persist({ itens_servico: items });
                    }}
                    className="h-9 w-20 text-center"
                  />
                  <span className="text-xs text-muted-foreground">×</span>
                  <Input
                    type="number"
                    value={it.valor_unitario ?? 0}
                    onChange={(e) => {
                      const items = [...model.itens_servico!];
                      items[i] = { ...it, valor_unitario: Number(e.target.value) };
                      persist({ itens_servico: items });
                    }}
                    className="h-9 flex-1"
                    placeholder="R$"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => persist({ itens_servico: model.itens_servico!.filter((_, idx) => idx !== i) })}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() =>
                persist({
                  itens_servico: [...(model.itens_servico ?? []), { descricao: "Novo item", quantidade: 1, valor_unitario: 0 }],
                })
              }
            >
              <Plus className="h-4 w-4 mr-1" /> Adicionar item
            </Button>
            <div className="text-right text-sm font-semibold pt-1">
              Total: R$ {total.toFixed(2)}
            </div>
          </div>
        </>
      )}

      {/* Images */}
      <h2 className="font-semibold text-sm mb-2 mt-6">Imagens do orçamento</h2>
      <div className="grid grid-cols-3 gap-2">
        {(model.imagens ?? []).map((img) => (
          <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border border-border">
            <img src={img.url} alt="" className="h-full w-full object-cover" />
            <button
              onClick={() => removeImage(img.id)}
              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <label className="aspect-square rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary-soft/30 transition">
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
          <Plus className="h-5 w-5 text-muted-foreground" />
        </label>
      </div>

      {/* Conditions */}
      <h2 className="font-semibold text-sm mb-2 mt-6">Condições e observações</h2>
      <Textarea
        value={model.condicoes ?? ""}
        onChange={(e) => persist({ condicoes: e.target.value })}
        placeholder="Forma de pagamento, prazos..."
        rows={3}
      />
      <Textarea
        value={model.observacoes ?? ""}
        onChange={(e) => persist({ observacoes: e.target.value })}
        placeholder="Observações"
        rows={2}
        className="mt-2"
      />

      {/* AI improvements + Save template */}
      <div className="grid grid-cols-2 gap-2 mt-6">
        <Sheet open={aiOpen} onOpenChange={(o) => { setAiOpen(o); if (o) loadImprovements(); }}>
          <SheetTrigger asChild>
            <Button variant="outline" className="h-12">
              <Sparkles className="h-4 w-4 mr-1 text-accent" /> Melhorias IA
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" /> Sugestões da IA
              </SheetTitle>
            </SheetHeader>
            {aiLoading && (
              <div className="py-12 flex flex-col items-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                Analisando seu modelo...
              </div>
            )}
            <div className="space-y-3 mt-4">
              {aiList.map((s, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start gap-2">
                    <span className="rounded-full bg-accent-soft text-accent px-2 py-0.5 text-[10px] uppercase font-semibold">
                      {s.categoria?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <h4 className="font-semibold mt-2 text-sm">{s.titulo}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{s.descricao}</p>
                  {s.sugestao_aplicar && (
                    <p className="text-xs mt-2 rounded-lg bg-muted p-2 italic">{s.sugestao_aplicar}</p>
                  )}
                </Card>
              ))}
            </div>
          </SheetContent>
        </Sheet>
        <Button onClick={saveAsTemplate} className="h-12" style={{ background: "var(--gradient-primary)" }}>
          <Save className="h-4 w-4 mr-1" /> Salvar modelo
        </Button>
      </div>

      <Button onClick={gotoPreview} size="lg" className="w-full mt-3 h-12 bg-accent text-accent-foreground hover:bg-accent/90">
        Gerar orçamento →
      </Button>
    </AppShell>
  );
}
