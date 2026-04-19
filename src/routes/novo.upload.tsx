import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, FileText } from "lucide-react";
import { parseBudgetText } from "@/server/ai";
import { saveModel, uid, type BudgetModel } from "@/lib/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/novo/upload")({
  head: () => ({
    meta: [{ title: "Enviar orçamento PDF — Orça Fácil" }],
  }),
  component: NovoUpload,
});

async function extractPdfText(file: File): Promise<string> {
  // dynamic import — pdfjs-dist worker
  const pdfjs = await import("pdfjs-dist");
  // @ts-ignore
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it: any) => it.str).join(" ") + "\n\n";
  }
  return text;
}

function NovoUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("");
  const navigate = useNavigate();

  async function handleSelect(f: File | null) {
    if (!f) return;
    setFile(f);
  }

  async function process() {
    if (!file) return;
    setLoading(true);
    try {
      setStage("Lendo o PDF...");
      const text = await extractPdfText(file);
      if (!text.trim()) throw new Error("Não foi possível extrair texto do PDF");
      setStage("Analisando com IA...");
      const r = await parseBudgetText({ data: { text } });
      const now = Date.now();
      const m: BudgetModel = {
        id: uid(),
        titulo: r.titulo ?? file.name.replace(/\.pdf$/i, ""),
        empresa: r.empresa,
        campos: r.campos ?? [],
        itens_servico: r.itens_servico ?? [],
        condicoes: r.condicoes,
        observacoes: r.observacoes,
        criado_em: now,
        atualizado_em: now,
      };
      saveModel(m);
      toast.success("Modelo extraído!");
      navigate({ to: "/editor/$id", params: { id: m.id } });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao processar");
    } finally {
      setLoading(false);
      setStage("");
    }
  }

  return (
    <AppShell back="/" title="Enviar PDF">
      <div className="mb-6 rounded-2xl p-5 text-primary-foreground shadow-soft" style={{ background: "var(--gradient-primary)" }}>
        <Upload className="h-6 w-6 mb-2" />
        <h2 className="font-bold text-lg">Use seu padrão</h2>
        <p className="text-sm opacity-95 mt-1">
          Envie um orçamento PDF que você já usa. A IA identifica automaticamente os campos editáveis.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => handleSelect(e.target.files?.[0] ?? null)}
      />

      {!file ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-2xl border-2 border-dashed border-border bg-card p-8 hover:border-primary hover:bg-primary-soft/30 transition-all"
        >
          <Upload className="h-10 w-10 mx-auto text-primary mb-3" />
          <p className="font-semibold text-foreground">Toque para escolher um PDF</p>
          <p className="text-xs text-muted-foreground mt-1">ou arraste um arquivo aqui</p>
        </button>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="mt-2 w-full">
            Trocar arquivo
          </Button>
        </div>
      )}

      <Button
        onClick={process}
        disabled={!file || loading}
        size="lg"
        className="mt-6 w-full h-12"
        style={{ background: "var(--gradient-primary)" }}
      >
        {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
        {loading ? stage : "Analisar com IA"}
      </Button>

      <p className="mt-4 text-xs text-muted-foreground text-center">
        Formatos suportados: PDF. PowerPoint em breve.
      </p>
    </AppShell>
  );
}
