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

    // Estratégia: renderizar o documento em um sandbox com largura A4 e
    // ALTURA A4 proporcional (mesma proporção 210x297). Forçamos o conteúdo
    // a caber na folha aplicando um zoom CSS dinâmico antes do html2canvas.
    // Isso garante UMA ÚNICA página com layout idêntico ao preview.
    const A4_WIDTH_PX = 794;   // 210mm @ 96dpi
    const A4_HEIGHT_PX = 1123; // 297mm @ 96dpi
    const PDF_MARGIN_MM = 6;

    const sandbox = document.createElement("div");
    sandbox.style.position = "fixed";
    sandbox.style.top = "0";
    sandbox.style.left = "-10000px";
    sandbox.style.width = `${A4_WIDTH_PX}px`;
    sandbox.style.background = "#ffffff";
    sandbox.style.zIndex = "-1";

    // Wrapper interno que receberá o zoom para encolher o conteúdo se necessário
    const wrapper = document.createElement("div");
    wrapper.style.width = `${A4_WIDTH_PX}px`;
    wrapper.style.background = "#ffffff";
    wrapper.style.transformOrigin = "top left";

    const clone = docRef.current.cloneNode(true) as HTMLElement;
    clone.style.width = `${A4_WIDTH_PX}px`;
    clone.style.maxWidth = "none";
    clone.style.minHeight = "0";
    wrapper.appendChild(clone);
    sandbox.appendChild(wrapper);
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
      await new Promise((r) => setTimeout(r, 150));

      // Mede a altura natural do conteúdo e calcula o zoom necessário
      // para caber em uma página A4 (na largura inteira).
      const naturalH = clone.scrollHeight;
      const fitScale = naturalH > A4_HEIGHT_PX ? A4_HEIGHT_PX / naturalH : 1;
      if (fitScale < 1) {
        wrapper.style.transform = `scale(${fitScale})`;
        wrapper.style.width = `${A4_WIDTH_PX}px`;
        // Após o scale, a largura visual encolhe: compensamos definindo
        // a largura do sandbox para o tamanho final, evitando faixa branca.
        sandbox.style.width = `${A4_WIDTH_PX * fitScale}px`;
      }
      await new Promise((r) => setTimeout(r, 50));

      const finalW = A4_WIDTH_PX * fitScale;
      const finalH = naturalH * fitScale;

      const canvas = await html2canvas(wrapper, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        windowWidth: A4_WIDTH_PX,
        width: finalW,
        height: finalH,
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = 210;
      const pageH = 297;
      const maxW = pageW - PDF_MARGIN_MM * 2;
      const maxH = pageH - PDF_MARGIN_MM * 2;

      // Ajusta proporcionalmente para caber dentro das margens
      const ratio = canvas.width / canvas.height;
      let renderW = maxW;
      let renderH = renderW / ratio;
      if (renderH > maxH) {
        renderH = maxH;
        renderW = renderH * ratio;
      }
      const offsetX = (pageW - renderW) / 2;
      const offsetY = PDF_MARGIN_MM;
      const img = canvas.toDataURL("image/jpeg", 0.95);
      pdf.addImage(img, "JPEG", offsetX, offsetY, renderW, renderH);

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
