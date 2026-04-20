import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Pencil } from "lucide-react";
import { addHistory, getModel, uid, type BudgetModel } from "@/lib/storage";
import { BudgetDocument } from "@/components/BudgetDocument";
import { toast } from "sonner";

export const Route = createFileRoute("/preview/$id")({
  component: Preview,
});

function Preview() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [model, setModel] = useState<BudgetModel | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [downloading, setDownloading] = useState(false);
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

  async function downloadPDF() {
    if (!docRef.current || !model) return;
    setDownloading(true);

    // Container off-screen com largura A4 (794px ≈ 210mm @ 96dpi).
    // Clonamos o documento para renderizar no tamanho A4 e exportamos tudo
    // em uma única folha, evitando cortes arbitrários entre blocos.
    const A4_WIDTH_PX = 794;
    const PDF_MARGIN_MM = 8;
    const sandbox = document.createElement("div");
    sandbox.style.position = "fixed";
    sandbox.style.top = "0";
    sandbox.style.left = "-10000px";
    sandbox.style.width = `${A4_WIDTH_PX}px`;
    sandbox.style.background = "#ffffff";
    sandbox.style.zIndex = "-1";
    const clone = docRef.current.cloneNode(true) as HTMLElement;
    clone.style.width = `${A4_WIDTH_PX}px`;
    clone.style.maxWidth = "none";
    sandbox.appendChild(clone);
    document.body.appendChild(sandbox);

    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      // Aguarda fontes/imagens carregarem antes de capturar
      if ((document as any).fonts?.ready) {
        try { await (document as any).fonts.ready; } catch {}
      }
      const cloneImages = Array.from(clone.querySelectorAll("img"));
      await Promise.all(
        cloneImages.map(
          (img) => new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          }),
        ),
      );
      await new Promise((r) => setTimeout(r, 100));

      const canvas = await html2canvas(clone, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        windowWidth: A4_WIDTH_PX,
        width: A4_WIDTH_PX,
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = 210; // A4 width mm
      const pageH = 297; // A4 height mm

      const maxW = pageW - PDF_MARGIN_MM * 2;
      const maxH = pageH - PDF_MARGIN_MM * 2;
      const widthFitH = (canvas.height * maxW) / canvas.width;
      const scale = widthFitH > maxH ? maxH / widthFitH : 1;
      const renderW = maxW * scale;
      const renderH = widthFitH * scale;
      const offsetX = (pageW - renderW) / 2;
      const offsetY = (pageH - renderH) / 2;
      const img = canvas.toDataURL("image/png");
      pdf.addImage(img, "PNG", offsetX, offsetY, renderW, renderH);

      pdf.save(`orcamento-${model.titulo.replace(/\s+/g, "-").toLowerCase()}.pdf`);

      // Salva no histórico de orçamentos emitidos
      const total = (model.itens_servico ?? []).reduce((s, it) => s + (it.quantidade ?? 1) * (it.valor_unitario ?? 0), 0);
      const clienteCampo = model.campos.find((c) => /cliente|nome/i.test(c.chave));
      addHistory({
        id: uid(),
        modelo_id: model.id,
        modelo_titulo: model.titulo,
        cliente: clienteCampo ? values[clienteCampo.chave] : undefined,
        total,
        emitido_em: Date.now(),
      });

      toast.success("PDF baixado!");
    } catch (e: any) {
      toast.error("Erro ao gerar PDF: " + e.message);
    } finally {
      if (sandbox.parentNode) sandbox.parentNode.removeChild(sandbox);
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

      <Button
        onClick={downloadPDF}
        disabled={downloading}
        size="lg"
        className="w-full mt-5 h-14 text-base"
        style={{ background: "var(--gradient-primary)" }}
      >
        {downloading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Download className="h-5 w-5 mr-2" />}
        {downloading ? "Gerando PDF..." : "Baixar PDF"}
      </Button>
    </AppShell>
  );
}
