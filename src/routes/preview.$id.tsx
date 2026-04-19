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
        <div ref={docRef} className="bg-white text-slate-900 text-[13px] leading-relaxed" style={{ minHeight: "500px" }}>
          {/* Hero header with gradient */}
          <div
            className="relative px-6 pt-6 pb-8 text-white"
            style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 55%, #2563eb 100%)" }}
          >
            <div className="absolute top-0 right-0 h-full w-32 opacity-20" style={{ background: "radial-gradient(circle at top right, #fb923c, transparent 70%)" }} />
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {model.logo_url ? (
                  <div className="h-16 w-16 rounded-xl bg-white p-1.5 shadow-md flex items-center justify-center">
                    <img src={model.logo_url} alt="logo" className="h-full w-full object-contain" crossOrigin="anonymous" />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-2xl font-black">
                    {(model.empresa ?? model.titulo).charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-blue-200 font-semibold">Proposta Comercial</p>
                  <h1 className="text-2xl font-extrabold leading-tight mt-0.5">{model.empresa ?? model.titulo}</h1>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ background: "#fb923c", color: "#7c2d12" }}>
                  Orçamento
                </span>
                <p className="text-[11px] text-blue-100 mt-2">{today}</p>
              </div>
            </div>

            {/* Total card overlapping */}
            {model.itens_servico && model.itens_servico.length > 0 && (
              <div className="relative mt-5 -mb-12 rounded-xl bg-white text-slate-900 shadow-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Valor total</p>
                  <p className="text-2xl font-extrabold" style={{ color: "#1d4ed8" }}>{fmtBR(total)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Itens</p>
                  <p className="text-lg font-bold text-slate-700">{model.itens_servico.length}</p>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 pt-16 pb-6">
            {/* Fields grid as cards */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {model.campos.map((f) => (
                <div
                  key={f.chave}
                  className={`rounded-lg border-l-[3px] bg-slate-50 px-3 py-2 ${f.tipo === "longo" ? "col-span-2" : ""}`}
                  style={{ borderColor: "#fb923c" }}
                >
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">{f.rotulo}</p>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">{fmtVal(f, values[f.chave])}</p>
                </div>
              ))}
            </div>

            {/* Items */}
            {model.itens_servico && model.itens_servico.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-5 w-1 rounded-full" style={{ background: "#fb923c" }} />
                  <h3 className="text-xs uppercase tracking-wider font-extrabold" style={{ color: "#1d4ed8" }}>Itens & Serviços</h3>
                </div>
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="text-white text-[10px] uppercase tracking-wider" style={{ background: "#1d4ed8" }}>
                        <th className="text-left py-2 px-3 font-bold">Descrição</th>
                        <th className="text-right py-2 px-2 font-bold">Qtd</th>
                        <th className="text-right py-2 px-2 font-bold">Unit.</th>
                        <th className="text-right py-2 px-3 font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {model.itens_servico.map((it, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="py-2 px-3">{it.descricao}</td>
                          <td className="text-right py-2 px-2">{it.quantidade ?? 1}</td>
                          <td className="text-right py-2 px-2 text-slate-600">{fmtBR(it.valor_unitario ?? 0)}</td>
                          <td className="text-right py-2 px-3 font-semibold">{fmtBR((it.quantidade ?? 1) * (it.valor_unitario ?? 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: "#fff7ed" }}>
                        <td colSpan={3} className="text-right py-2 px-3 font-bold text-slate-700 uppercase text-[10px] tracking-wider">Total geral</td>
                        <td className="text-right py-2 px-3 font-extrabold text-base" style={{ color: "#ea580c" }}>{fmtBR(total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Images */}
            {model.imagens && model.imagens.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-5 w-1 rounded-full" style={{ background: "#fb923c" }} />
                  <h3 className="text-xs uppercase tracking-wider font-extrabold" style={{ color: "#1d4ed8" }}>Galeria</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {model.imagens.map((img) => (
                    <img key={img.id} src={img.url} alt="" className="rounded-lg w-full h-32 object-cover border border-slate-200 shadow-sm" crossOrigin="anonymous" />
                  ))}
                </div>
              </div>
            )}

            {/* Conditions */}
            {model.condicoes && (
              <div className="mt-6 rounded-xl p-4" style={{ background: "#eff6ff", border: "1px solid #dbeafe" }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-4 w-1 rounded-full" style={{ background: "#1d4ed8" }} />
                  <p className="text-[10px] uppercase tracking-wider font-extrabold" style={{ color: "#1d4ed8" }}>Condições</p>
                </div>
                <p className="text-[12px] text-slate-700 whitespace-pre-line">{model.condicoes}</p>
              </div>
            )}
            {model.observacoes && (
              <div className="mt-3 rounded-xl p-4" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-4 w-1 rounded-full" style={{ background: "#ea580c" }} />
                  <p className="text-[10px] uppercase tracking-wider font-extrabold" style={{ color: "#ea580c" }}>Observações</p>
                </div>
                <p className="text-[12px] text-slate-700 whitespace-pre-line">{model.observacoes}</p>
              </div>
            )}

            {/* Footer signature */}
            <div className="mt-8 pt-4 border-t border-dashed border-slate-200 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em]">Obrigado pela preferência</p>
              <p className="text-[11px] font-semibold mt-1" style={{ color: "#1d4ed8" }}>{model.empresa ?? model.titulo}</p>
            </div>
          </div>
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
