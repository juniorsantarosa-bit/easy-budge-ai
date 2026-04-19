import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Sparkles, Save, Trash2, Plus, Image as ImgIcon, X, Loader2 } from "lucide-react";
import {
  getModel, saveModel, type BudgetModel, type BudgetField, type ColorScheme,
  type LayoutTheme, type HeaderFont, type HeaderBgColor,
  COLOR_SCHEMES, HEADER_FONTS, HEADER_BG_LABELS, resolveHeaderBgHex, uid, resolveScheme,
} from "@/lib/storage";
import { aiImprovements } from "@/server/ai";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BudgetDocument } from "@/components/BudgetDocument";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/editor/$id")({
  component: Editor,
});

const HEADER_BG_OPTIONS: HeaderBgColor[] = [
  "branco", "primaria", "primaria_escura", "secundaria", "secundaria_escura", "suave", "suave_accent",
];

function Editor() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [model, setModel] = useState<BudgetModel | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiList, setAiList] = useState<any[]>([]);
  const [logoUploading, setLogoUploading] = useState(false);
  const [headerImgUploading, setHeaderImgUploading] = useState(false);

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

  const scheme = resolveScheme(model);

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

  async function uploadToBucket(file: File, prefix: string): Promise<string> {
    const path = `${prefix}/${model!.id}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("orcafacil").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("orcafacil").getPublicUrl(path);
    return data.publicUrl;
  }

  async function uploadLogo(file: File) {
    setLogoUploading(true);
    try {
      const url = await uploadToBucket(file, "logos");
      persist({ logo_url: url });
      toast.success("Logo carregado!");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao enviar logo");
    } finally {
      setLogoUploading(false);
    }
  }

  async function uploadHeaderImage(file: File) {
    setHeaderImgUploading(true);
    try {
      const url = await uploadToBucket(file, "headers");
      persist({ header_image_url: url, header_image_opacity: model!.header_image_opacity ?? 0.25 });
      toast.success("Imagem do cabeçalho carregada!");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao enviar imagem");
    } finally {
      setHeaderImgUploading(false);
    }
  }

  async function uploadImage(file: File) {
    try {
      const url = await uploadToBucket(file, "imgs");
      const imagens = [...(model!.imagens ?? []), { id: uid(), url }];
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
      {/* ============ ETAPA 1: LAYOUT ============ */}
      <Card className="p-4 mb-4">
        <h2 className="text-sm font-semibold mb-1">1. Escolha o layout</h2>
        <p className="text-[11px] text-muted-foreground mb-3">
          O layout define a estrutura do documento. Os ajustes seguintes se adaptam à escolha.
        </p>
        <div className="-mx-4 px-4 overflow-x-auto pb-2">
          <div className="flex gap-2" style={{ width: "max-content" }}>
            {(["moderno", "elegante", "minimal", "magazine", "corporativo"] as LayoutTheme[]).map((lay) => {
              const active = (model.layout ?? "moderno") === lay;
              return (
                <button
                  key={lay}
                  onClick={() => persist({ layout: lay })}
                  className={`rounded-xl overflow-hidden border-2 transition shrink-0 ${active ? "border-primary shadow-md" : "border-border"}`}
                  style={{ width: 110 }}
                >
                  <div className="aspect-[3/4] bg-white relative overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 scale-[0.22] origin-top-left" style={{ width: "455%", height: "455%" }}>
                      <BudgetDocument model={{ ...model, layout: lay }} values={values} />
                    </div>
                  </div>
                  <p className={`text-[11px] py-1.5 font-semibold capitalize text-center ${active ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {lay}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* ============ ETAPA 2: PALETA DE CORES ============ */}
      <Card className="p-4 mb-4">
        <h2 className="text-sm font-semibold mb-1">2. Paleta de cores</h2>
        <p className="text-[11px] text-muted-foreground mb-3">
          Define as cores principais. Tudo no orçamento (incluindo o fundo do cabeçalho) será derivado dela.
        </p>
        <div className="grid grid-cols-6 gap-2 mb-3">
          {(Object.keys(COLOR_SCHEMES) as ColorScheme[]).map((c) => {
            const s = COLOR_SCHEMES[c];
            const active = (model.cor_esquema ?? "azul") === c && !model.cor_primaria && !model.cor_secundaria;
            return (
              <button
                key={c}
                onClick={() => persist({ cor_esquema: c, cor_primaria: undefined, cor_secundaria: undefined })}
                className={`aspect-square rounded-xl flex items-center justify-center transition relative overflow-hidden ${active ? "ring-2 ring-offset-2 ring-primary scale-105" : ""}`}
                style={{ background: `linear-gradient(135deg, ${s.primary} 50%, ${s.accent} 50%)` }}
                title={s.label}
                aria-label={s.label}
              >
                {active && <span className="text-white text-lg drop-shadow">✓</span>}
              </button>
            );
          })}
        </div>

        {/* Cor 1 e Cor 2 personalizadas */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">1ª cor (principal)</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={model.cor_primaria || COLOR_SCHEMES[model.cor_esquema ?? "azul"].primary}
                onChange={(e) => persist({ cor_primaria: e.target.value })}
                className="h-10 w-12 rounded-md border border-border cursor-pointer p-0.5 bg-transparent"
              />
              <Input
                value={model.cor_primaria || ""}
                placeholder={COLOR_SCHEMES[model.cor_esquema ?? "azul"].primary}
                onChange={(e) => persist({ cor_primaria: e.target.value || undefined })}
                className="h-10 font-mono text-xs"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">2ª cor (destaque)</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={model.cor_secundaria || COLOR_SCHEMES[model.cor_esquema ?? "azul"].accent}
                onChange={(e) => persist({ cor_secundaria: e.target.value })}
                className="h-10 w-12 rounded-md border border-border cursor-pointer p-0.5 bg-transparent"
              />
              <Input
                value={model.cor_secundaria || ""}
                placeholder={COLOR_SCHEMES[model.cor_esquema ?? "azul"].accent}
                onChange={(e) => persist({ cor_secundaria: e.target.value || undefined })}
                className="h-10 font-mono text-xs"
              />
            </div>
          </div>
        </div>
        {(model.cor_primaria || model.cor_secundaria) && (
          <Button
            size="sm"
            variant="ghost"
            className="text-xs h-7 mt-2"
            onClick={() => persist({ cor_primaria: undefined, cor_secundaria: undefined })}
          >
            ↺ Voltar à paleta {COLOR_SCHEMES[model.cor_esquema ?? "azul"].label}
          </Button>
        )}
      </Card>

      {/* ============ ETAPA 3: CABEÇALHO ============ */}
      <Card className="p-4 mb-4">
        <h2 className="text-sm font-semibold mb-1">3. Cabeçalho</h2>
        <p className="text-[11px] text-muted-foreground mb-3">
          A caixa do logo segue o layout escolhido. Ajuste o enquadramento abaixo.
        </p>

        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-soft overflow-hidden">
            {model.logo_url ? (
              <img
                src={model.logo_url}
                alt="logo"
                className="h-full w-full object-contain"
                style={{
                  transform: `translate(${model.logo_x ?? 0}%, ${model.logo_y ?? 0}%) scale(${model.logo_zoom ?? 1})`,
                }}
              />
            ) : (
              <ImgIcon className="h-6 w-6 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Logo da empresa</p>
            <p className="text-xs text-muted-foreground">Formato {model.layout ?? "moderno"}</p>
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

        {/* Enquadramento do logo */}
        {model.logo_url && (
          <div className="mb-4 rounded-lg border border-border p-3 bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold">Enquadrar logo</p>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[11px]"
                onClick={() => persist({ logo_zoom: 1, logo_x: 0, logo_y: 0 })}
              >
                ↺ Reset
              </Button>
            </div>
            <Label className="text-[11px] text-muted-foreground flex items-center justify-between mb-1">
              <span>Zoom</span>
              <span className="font-mono text-[10px]">{(model.logo_zoom ?? 1).toFixed(2)}×</span>
            </Label>
            <Slider
              min={50} max={300} step={5}
              value={[Math.round((model.logo_zoom ?? 1) * 100)]}
              onValueChange={(v) => persist({ logo_zoom: v[0] / 100 })}
              className="mb-2"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] text-muted-foreground flex items-center justify-between mb-1">
                  <span>↔ Horizontal</span>
                  <span className="font-mono text-[10px]">{model.logo_x ?? 0}%</span>
                </Label>
                <Slider
                  min={-50} max={50} step={1}
                  value={[model.logo_x ?? 0]}
                  onValueChange={(v) => persist({ logo_x: v[0] })}
                />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground flex items-center justify-between mb-1">
                  <span>↕ Vertical</span>
                  <span className="font-mono text-[10px]">{model.logo_y ?? 0}%</span>
                </Label>
                <Slider
                  min={-50} max={50} step={1}
                  value={[model.logo_y ?? 0]}
                  onValueChange={(v) => persist({ logo_y: v[0] })}
                />
              </div>
            </div>
          </div>
        )}

        <Label className="text-xs text-muted-foreground">Nome que aparece ao lado do logo</Label>
        <Input
          value={model.empresa ?? ""}
          onChange={(e) => persist({ empresa: e.target.value })}
          placeholder="Sua empresa ou seu nome"
          className="mt-1 h-10 mb-3"
        />

        <Label className="text-xs text-muted-foreground">Subtítulo (acima do nome)</Label>
        <Input
          value={model.header_subtitulo ?? ""}
          onChange={(e) => persist({ header_subtitulo: e.target.value })}
          placeholder="Ex: Proposta Comercial"
          className="mt-1 h-10 mb-3"
        />

        <Label className="text-xs text-muted-foreground mb-1 block">Fonte do cabeçalho</Label>
        <p className="text-[10px] text-muted-foreground mb-2">
          Escolha a fonte que combina com a aparência do seu logo
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(HEADER_FONTS) as HeaderFont[]).map((f) => {
            const cur = (model.header_font ?? "sans") === f;
            return (
              <button
                key={f}
                onClick={() => persist({ header_font: f })}
                className={`rounded-lg border-2 p-2 text-left transition ${cur ? "border-primary bg-primary-soft" : "border-border"}`}
              >
                <p className="text-base font-bold leading-tight truncate" style={{ fontFamily: HEADER_FONTS[f].family }}>
                  {model.empresa || "Aa Bb"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {HEADER_FONTS[f].label} · {HEADER_FONTS[f].hint}
                </p>
              </button>
            );
          })}
        </div>

        {/* Cor de fundo do cabeçalho — alinhada à paleta + branco fixo */}
        <div className="mt-4">
          <Label className="text-xs text-muted-foreground mb-2 block">Cor de fundo do cabeçalho</Label>
          <p className="text-[10px] text-muted-foreground mb-2">
            Cores derivadas da paleta. O branco está sempre disponível.
          </p>
          <div className="grid grid-cols-7 gap-2">
            {HEADER_BG_OPTIONS.map((c) => {
              const hex = resolveHeaderBgHex(scheme, c);
              const active = (model.header_bg_color ?? "primaria") === c;
              return (
                <button
                  key={c}
                  onClick={() => persist({ header_bg_color: c })}
                  title={HEADER_BG_LABELS[c]}
                  aria-label={HEADER_BG_LABELS[c]}
                  className={`h-10 rounded-md border-2 transition ${active ? "border-primary scale-110 shadow" : "border-border"}`}
                  style={{ background: hex }}
                />
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Selecionado: <strong>{HEADER_BG_LABELS[model.header_bg_color ?? "primaria"]}</strong>
          </p>
        </div>

        {/* Imagem de cabeçalho com efeito marca d'água */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold">Imagem de fundo do cabeçalho</p>
              <p className="text-[11px] text-muted-foreground">
                Sobreposta à cor escolhida. Use a transparência para virar marca d'água.
              </p>
            </div>
            <div className="flex items-center gap-1">
              {model.header_image_url && (
                <Button size="sm" variant="ghost" onClick={() => persist({ header_image_url: undefined })}>
                  <X className="h-4 w-4" />
                </Button>
              )}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadHeaderImage(e.target.files[0])}
                />
                <Button asChild size="sm" variant="outline">
                  <span>{headerImgUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Carregar"}</span>
                </Button>
              </label>
            </div>
          </div>

          {model.header_image_url && (
            <>
              {/* Preview do cabeçalho com fundo + imagem */}
              <div
                className="h-20 w-full rounded-lg border overflow-hidden relative mb-3"
                style={{ background: resolveHeaderBgHex(scheme, model.header_bg_color ?? "primaria") }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${model.header_image_url})`,
                    backgroundSize: `${(model.header_image_zoom ?? 1) * 100}% auto`,
                    backgroundPosition: `${model.header_image_x ?? 50}% ${model.header_image_y ?? 50}%`,
                    backgroundRepeat: "no-repeat",
                    opacity: model.header_image_opacity ?? 0.25,
                  }}
                />
              </div>

              <Label className="text-xs text-muted-foreground flex items-center justify-between mb-1">
                <span>Transparência (marca d'água)</span>
                <span className="font-mono text-[10px]">{100 - Math.round((model.header_image_opacity ?? 0.25) * 100)}%</span>
              </Label>
              <Slider
                min={0} max={95} step={5}
                value={[100 - Math.round((model.header_image_opacity ?? 0.25) * 100)]}
                onValueChange={(v) => persist({ header_image_opacity: (100 - v[0]) / 100 })}
                className="mb-1"
              />
              <p className="text-[10px] text-muted-foreground mb-3">
                0% = imagem nítida · 95% = quase só o fundo aparece
              </p>

              {/* Enquadramento da imagem do cabeçalho */}
              <div className="rounded-lg border border-border p-3 bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold">Enquadrar imagem</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[11px]"
                    onClick={() => persist({ header_image_zoom: 1, header_image_x: 50, header_image_y: 50 })}
                  >
                    ↺ Reset
                  </Button>
                </div>
                <Label className="text-[11px] text-muted-foreground flex items-center justify-between mb-1">
                  <span>Zoom</span>
                  <span className="font-mono text-[10px]">{(model.header_image_zoom ?? 1).toFixed(2)}×</span>
                </Label>
                <Slider
                  min={100} max={300} step={5}
                  value={[Math.round((model.header_image_zoom ?? 1) * 100)]}
                  onValueChange={(v) => persist({ header_image_zoom: v[0] / 100 })}
                  className="mb-2"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[11px] text-muted-foreground flex items-center justify-between mb-1">
                      <span>↔ Posição X</span>
                      <span className="font-mono text-[10px]">{model.header_image_x ?? 50}%</span>
                    </Label>
                    <Slider
                      min={0} max={100} step={1}
                      value={[model.header_image_x ?? 50]}
                      onValueChange={(v) => persist({ header_image_x: v[0] })}
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground flex items-center justify-between mb-1">
                      <span>↕ Posição Y</span>
                      <span className="font-mono text-[10px]">{model.header_image_y ?? 50}%</span>
                    </Label>
                    <Slider
                      min={0} max={100} step={1}
                      value={[model.header_image_y ?? 50]}
                      onValueChange={(v) => persist({ header_image_y: v[0] })}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
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

      {/* Conditions + footer */}
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

      <h2 className="font-semibold text-sm mb-2 mt-6">Rodapé do orçamento</h2>
      <p className="text-xs text-muted-foreground mb-2">
        Texto que aparece no fim do documento. Ex.: contato, CNPJ, endereço, redes sociais.
      </p>
      <Textarea
        value={model.rodape ?? ""}
        onChange={(e) => persist({ rodape: e.target.value })}
        placeholder={`Ex: contato@suaempresa.com · (11) 99999-9999\nCNPJ 00.000.000/0001-00 · @suaempresa`}
        rows={3}
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
