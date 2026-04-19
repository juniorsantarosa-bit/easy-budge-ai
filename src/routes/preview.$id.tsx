import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Pencil } from "lucide-react";
import { getModel, type BudgetModel } from "@/lib/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/preview/$id")({
  component: Preview,
});

function fmtBR(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtVal(field: { tipo: string }, raw: string | undefined) {
  if (!raw) return "—";
  if (field.tipo === "valor") return fmtBR(Number(raw));
  if (field.tipo === "data") {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d.toLocaleDateString("pt-BR");
  }
  return raw;
}

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

  const total = useMemo(() => {
    if (!model?.itens_servico) return 0;
    return model.itens_servico.reduce((s, it) => s + (it.quantidade ?? 1) * (it.valor_unitario ?? 0), 0);
  }, [model]);

  async function downloadPDF() {
    if (!docRef.current || !model) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(docRef.current, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = 210;
      const pageH = 297;
      const imgH = (canvas.height * pageW) / canvas.width;
      let y = 0;
      let remaining = imgH;
      while (remaining > 0) {
        pdf.addImage(img, "PNG", 0, y, pageW, imgH);
        remaining -= pageH;
        if (remaining > 0) {
          pdf.addPage();
          y -= pageH;
        }
      }
      pdf.save(`orcamento-${model.titulo.replace(/\s+/g, "-").toLowerCase()}.pdf`);
      toast.success("PDF baixado!");
    } catch (e: any) {
      toast.error("Erro ao gerar PDF: " + e.message);
    } finally {
      setDownloading(false);
    }
  }

  if (!model) return null;
  const today = new Date().toLocaleDateString("pt-BR");

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
        <div ref={docRef} className="bg-white text-slate-900 p-6 text-[13px] leading-relaxed" style={{ minHeight: "500px" }}>
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 pb-4 mb-4" style={{ borderColor: "#1d4ed8" }}>
            <div className="flex items-center gap-3">
              {model.logo_url && <img src={model.logo_url} alt="logo" className="h-14 w-14 object-contain" crossOrigin="anonymous" />}
              <div>
                <h1 className="text-xl font-bold" style={{ color: "#1d4ed8" }}>{model.empresa ?? model.titulo}</h1>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider">Orçamento</p>
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-500">
              <p>{today}</p>
            </div>
          </div>

          {/* Fields grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-5">
            {model.campos.map((f) => (
              <div key={f.chave} className={f.tipo === "longo" ? "col-span-2" : ""}>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{f.rotulo}</p>
                <p className="text-sm font-medium text-slate-900">{fmtVal(f, values[f.chave])}</p>
              </div>
            ))}
          </div>

          {/* Items */}
          {model.itens_servico && model.itens_servico.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs uppercase tracking-wider font-bold mb-2" style={{ color: "#1d4ed8" }}>Itens</h3>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="text-left py-1 font-semibold">Descrição</th>
                    <th className="text-right font-semibold">Qtd</th>
                    <th className="text-right font-semibold">Unit.</th>
                    <th className="text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {model.itens_servico.map((it, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-1.5">{it.descricao}</td>
                      <td className="text-right">{it.quantidade ?? 1}</td>
                      <td className="text-right">{fmtBR(it.valor_unitario ?? 0)}</td>
                      <td className="text-right font-medium">{fmtBR((it.quantidade ?? 1) * (it.valor_unitario ?? 0))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="text-right pt-2 font-semibold">Total geral</td>
                    <td className="text-right pt-2 font-bold text-base" style={{ color: "#ea580c" }}>{fmtBR(total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Images */}
          {model.imagens && model.imagens.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {model.imagens.map((img) => (
                <img key={img.id} src={img.url} alt="" className="rounded-md w-full h-32 object-cover" crossOrigin="anonymous" />
              ))}
            </div>
          )}

          {/* Footer */}
          {model.condicoes && (
            <div className="mt-5 pt-3 border-t border-slate-200">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Condições</p>
              <p className="text-[12px] text-slate-700 mt-1 whitespace-pre-line">{model.condicoes}</p>
            </div>
          )}
          {model.observacoes && (
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Observações</p>
              <p className="text-[12px] text-slate-700 mt-1 whitespace-pre-line">{model.observacoes}</p>
            </div>
          )}
        </div>
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
