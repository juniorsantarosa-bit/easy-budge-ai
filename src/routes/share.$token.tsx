import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { BudgetDocument } from "@/components/BudgetDocument";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { downloadElementAsPng } from "@/lib/capture";
import { buildPublicShareUrl, resolveSharedBudget } from "@/lib/share-client";

export const Route = createFileRoute("/share/$token")({
  component: SharePage,
  head: () => ({
    meta: [
      { title: "Orçamento" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
    ],
  }),
});

function SharePage() {
  const { token } = Route.useParams();
  const docRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [data, setData] = useState<Awaited<ReturnType<typeof resolveSharedBudget>>>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);
      const result = await resolveSharedBudget(token);
      if (!active) return;
      setData(result);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (data?.model?.titulo) {
      document.title = `Orçamento — ${data.model.titulo}`;
    }
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6 bg-muted/30">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando orçamento...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6 bg-muted/30">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-semibold mb-2">Link inválido</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Este link de orçamento não pôde ser aberto. Peça um novo link a quem te enviou.
          </p>
          <Button asChild variant="outline">
            <Link to="/">Voltar ao início</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { model, values } = data;

  async function downloadImage() {
    if (!docRef.current) return;
    setDownloading(true);
    try {
      await downloadElementAsPng(
        docRef.current,
        `orcamento-${model.titulo.replace(/\s+/g, "-").toLowerCase()}.png`,
      );
      toast.success("Imagem salva!");
    } catch (e: any) {
      toast.error("Erro ao gerar imagem: " + e.message);
    } finally {
      setDownloading(false);
    }
  }

  async function shareLink() {
    const url = buildPublicShareUrl(token);
    try {
      if (navigator.share) {
        await navigator.share({ title: `Orçamento — ${model.titulo}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado!");
      }
    } catch {
      // user cancelled
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-muted/40 to-muted/10">
      {/* Top bar premium */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-background/70 border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="text-sm font-medium truncate">{model.titulo}</div>
          <Button onClick={shareLink} size="sm" variant="ghost">
            <Share2 className="h-4 w-4 mr-1.5" />
            Compartilhar
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-3 py-5 pb-32">
        <div className="rounded-2xl shadow-elegant overflow-hidden bg-white">
          <BudgetDocument ref={docRef} model={model} values={values} />
        </div>
      </main>

      {/* Floating action */}
      <div className="fixed bottom-0 inset-x-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={downloadImage}
            disabled={downloading}
            size="lg"
            className="w-full h-14 text-base shadow-lg"
            style={{ background: "var(--gradient-primary)" }}
          >
            {downloading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Download className="h-5 w-5 mr-2" />}
            {downloading ? "Gerando imagem..." : "Baixar imagem (PNG)"}
          </Button>
        </div>
      </div>
    </div>
  );
}
