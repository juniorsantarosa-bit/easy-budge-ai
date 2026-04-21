import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Pencil, Link2, Share2 } from "lucide-react";
import { addHistory, getModel, uid, type BudgetModel } from "@/lib/storage";
import { BudgetDocument } from "@/components/BudgetDocument";
import { toast } from "sonner";
import { downloadElementAsPng } from "@/lib/capture";
import { buildPublicShareUrl, createShareSnapshot } from "@/lib/share-client";

export const Route = createFileRoute("/preview/$id")({
  component: Preview,
});

function Preview() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [model, setModel] = useState<BudgetModel | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const m = getModel(id);
    if (!m) {
      navigate({ to: "/" });
      return;
    }
    setModel(m);
    try {
      const v = sessionStorage.getItem("orcafacil:valores:" + id);
      if (v) setValues(JSON.parse(v));
      else {
        const init: Record<string, string> = {};
        m.campos.forEach((c) => (init[c.chave] = c.valor_atual ?? ""));
        setValues(init);
      }
    } catch {}
  }, [id, navigate]);

  async function buildShareUrl(): Promise<string> {
    if (!model) return "";
    const token = await createShareSnapshot(model, values);
    return buildPublicShareUrl(token);
  }

  function recordHistory() {
    if (!model) return;
    const total = (model.itens_servico ?? []).reduce(
      (s, it) => s + (it.quantidade ?? 1) * (it.valor_unitario ?? 0),
      0,
    );
    const clienteCampo = model.campos.find((c) => /cliente|nome/i.test(c.chave));
    addHistory({
      id: uid(),
      modelo_id: model.id,
      modelo_titulo: model.titulo,
      cliente: clienteCampo ? values[clienteCampo.chave] : undefined,
      total,
      emitido_em: Date.now(),
    });
  }

  async function shareLink() {
    if (!model) return;
    setSharing(true);
    try {
      const url = await buildShareUrl();
      if (navigator.share) {
        await navigator.share({
          title: `Orçamento — ${model.titulo}`,
          text: "Veja seu orçamento:",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado!");
      }
      recordHistory();
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        toast.error("Erro ao compartilhar: " + (e?.message ?? ""));
      }
    } finally {
      setSharing(false);
    }
  }

  async function copyLink() {
    if (!model) return;
    try {
      const url = await buildShareUrl();
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
      recordHistory();
    } catch (e: any) {
      toast.error("Erro ao copiar: " + e.message);
    }
  }

  async function downloadImage() {
    if (!docRef.current || !model) return;
    setDownloading(true);
    try {
      await downloadElementAsPng(
        docRef.current,
        `orcamento-${model.titulo.replace(/\s+/g, "-").toLowerCase()}.png`,
      );

      recordHistory();
      toast.success("Imagem baixada!");
    } catch (e: any) {
      toast.error("Erro ao gerar imagem: " + e.message);
    } finally {
      setDownloading(false);
    }
  }

  if (!model) return null;

  return (
    <AppShell
      back={`/editor/${id}` as any}
      title="Pré-visualização"
      action={
        <Button asChild size="sm" variant="ghost">
          <a onClick={() => navigate({ to: "/editor/$id", params: { id } })} className="cursor-pointer">
            <Pencil className="h-4 w-4" />
          </a>
        </Button>
      }
    >
      <div className="rounded-2xl shadow-elegant overflow-hidden bg-white">
        <BudgetDocument ref={docRef} model={model} values={values} />
      </div>

      <div className="mt-5 space-y-2.5">
        <Button
          onClick={shareLink}
          disabled={sharing}
          size="lg"
          className="w-full h-14 text-base"
          style={{ background: "var(--gradient-primary)" }}
        >
          {sharing ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Share2 className="h-5 w-5 mr-2" />}
          {sharing ? "Preparando..." : "Compartilhar por link"}
        </Button>

        <div className="grid grid-cols-2 gap-2.5">
          <Button onClick={copyLink} variant="outline" size="lg" className="h-12">
            <Link2 className="h-4 w-4 mr-2" />
            Copiar link
          </Button>
          <Button
            onClick={downloadImage}
            disabled={downloading}
            variant="outline"
            size="lg"
            className="h-12"
          >
            {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            {downloading ? "Gerando..." : "Salvar PNG"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center pt-1">
          O link abre o orçamento exatamente como você está vendo, em qualquer celular.
        </p>
      </div>
    </AppShell>
  );
}
