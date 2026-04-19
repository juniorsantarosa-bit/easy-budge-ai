import { forwardRef } from "react";
import { COLOR_SCHEMES, type BudgetModel, type ColorScheme, type LayoutTheme } from "@/lib/storage";

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

interface Props {
  model: BudgetModel;
  values: Record<string, string>;
  layout?: LayoutTheme;
  scheme?: ColorScheme;
}

export const BudgetDocument = forwardRef<HTMLDivElement, Props>(function BudgetDocument(
  { model, values, layout, scheme },
  ref,
) {
  const L: LayoutTheme = layout ?? model.layout ?? "moderno";
  const S = COLOR_SCHEMES[scheme ?? model.cor_esquema ?? "azul"];
  const today = new Date().toLocaleDateString("pt-BR");
  const total = (model.itens_servico ?? []).reduce((s, it) => s + (it.quantidade ?? 1) * (it.valor_unitario ?? 0), 0);
  const camposSemValor = model.campos.filter((c) => c.tipo !== "valor");
  const camposValor = model.campos.filter((c) => c.tipo === "valor");

  // ---------- LAYOUT MODERNO (gradient hero) ----------
  if (L === "moderno") {
    return (
      <div ref={ref} className="bg-white text-slate-900 text-[13px] leading-relaxed" style={{ minHeight: 500 }}>
        <div className="relative px-6 pt-6 pb-8 text-white" style={{ background: `linear-gradient(135deg, ${S.primaryDark} 0%, ${S.primary} 100%)` }}>
          <div className="absolute top-0 right-0 h-full w-32 opacity-25" style={{ background: `radial-gradient(circle at top right, ${S.accent}, transparent 70%)` }} />
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
                <p className="text-[10px] uppercase tracking-[0.2em] font-semibold opacity-80">Proposta Comercial</p>
                <h1 className="text-2xl font-extrabold leading-tight mt-0.5">{model.empresa ?? model.titulo}</h1>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ background: S.accent, color: S.accentDark }}>
                Orçamento
              </span>
              <p className="text-[11px] mt-2 opacity-80">{today}</p>
            </div>
          </div>
        </div>

        <div className="px-6 pt-6 pb-6">
          {/* Dados do cliente */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {camposSemValor.map((f) => (
              <div key={f.chave} className={`rounded-lg border-l-[3px] bg-slate-50 px-3 py-2 ${f.tipo === "longo" ? "col-span-2" : ""}`} style={{ borderColor: S.accent }}>
                <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">{f.rotulo}</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{fmtVal(f, values[f.chave])}</p>
              </div>
            ))}
          </div>

          {/* Imagens primeiro (visual antes do valor) */}
          {model.imagens && model.imagens.length > 0 && (
            <div className="mt-6">
              <SectionTitle accent={S.accent} primary={S.primaryDark}>Galeria do projeto</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                {model.imagens.map((img) => (
                  <img key={img.id} src={img.url} alt="" className="rounded-lg w-full h-32 object-cover border border-slate-200 shadow-sm" crossOrigin="anonymous" />
                ))}
              </div>
            </div>
          )}

          {/* Condições / observações antes do valor */}
          {model.condicoes && (
            <div className="mt-6 rounded-xl p-4" style={{ background: S.soft, border: `1px solid ${S.primary}22` }}>
              <SectionTitle accent={S.accent} primary={S.primaryDark} small>Condições</SectionTitle>
              <p className="text-[12px] text-slate-700 whitespace-pre-line">{model.condicoes}</p>
            </div>
          )}
          {model.observacoes && (
            <div className="mt-3 rounded-xl p-4" style={{ background: S.softAccent, border: `1px solid ${S.accent}55` }}>
              <SectionTitle accent={S.accent} primary={S.accentDark} small>Observações</SectionTitle>
              <p className="text-[12px] text-slate-700 whitespace-pre-line">{model.observacoes}</p>
            </div>
          )}

          {/* Itens — tabela */}
          {model.itens_servico && model.itens_servico.length > 0 && (
            <div className="mt-6">
              <SectionTitle accent={S.accent} primary={S.primaryDark}>Itens & serviços</SectionTitle>
              <div className="rounded-xl overflow-hidden border border-slate-200">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="text-white text-[10px] uppercase tracking-wider" style={{ background: S.primaryDark }}>
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
                </table>
              </div>
            </div>
          )}

          {/* Valor extra (campos de valor além do total) */}
          {camposValor.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {camposValor.map((f) => (
                <div key={f.chave} className="rounded-lg border-l-[3px] bg-slate-50 px-3 py-2" style={{ borderColor: S.primary }}>
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">{f.rotulo}</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: S.primaryDark }}>{fmtVal(f, values[f.chave])}</p>
                </div>
              ))}
            </div>
          )}

          {/* VALOR TOTAL — sempre por último */}
          {((model.itens_servico && model.itens_servico.length > 0) || total > 0) && (
            <div className="mt-8 rounded-2xl p-5 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${S.primaryDark}, ${S.primary})` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-80">Investimento total</p>
                  <p className="text-3xl font-black mt-1">{fmtBR(total)}</p>
                </div>
                <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ background: S.accent, color: S.accentDark }}>
                  À vista
                </span>
              </div>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-dashed border-slate-200 text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em]">Obrigado pela preferência</p>
            <p className="text-[11px] font-semibold mt-1" style={{ color: S.primaryDark }}>{model.empresa ?? model.titulo}</p>
          </div>
        </div>
      </div>
    );
  }

  // ---------- LAYOUT ELEGANTE (sidebar lateral colorida) ----------
  if (L === "elegante") {
    return (
      <div ref={ref} className="bg-white text-slate-900 text-[13px] leading-relaxed flex" style={{ minHeight: 500 }}>
        {/* sidebar */}
        <aside className="w-[34%] p-5 text-white flex flex-col" style={{ background: S.primaryDark }}>
          {model.logo_url ? (
            <div className="h-16 w-16 rounded-lg bg-white p-1.5 flex items-center justify-center mb-4">
              <img src={model.logo_url} alt="logo" className="h-full w-full object-contain" crossOrigin="anonymous" />
            </div>
          ) : (
            <div className="h-16 w-16 rounded-lg bg-white/15 flex items-center justify-center text-2xl font-black mb-4">
              {(model.empresa ?? model.titulo).charAt(0)}
            </div>
          )}
          <p className="text-[9px] uppercase tracking-[0.25em] opacity-70 font-semibold">Proposta</p>
          <h1 className="text-xl font-extrabold leading-tight mt-1">{model.empresa ?? model.titulo}</h1>
          <div className="h-px my-4" style={{ background: S.accent, opacity: 0.6 }} />
          <p className="text-[10px] uppercase tracking-wider opacity-70 font-bold mb-1">Emitido em</p>
          <p className="text-sm font-semibold mb-5">{today}</p>

          {camposSemValor.slice(0, 4).map((f) => (
            <div key={f.chave} className="mb-3">
              <p className="text-[9px] uppercase tracking-wider opacity-70 font-bold">{f.rotulo}</p>
              <p className="text-[12px] font-semibold mt-0.5 break-words">{fmtVal(f, values[f.chave])}</p>
            </div>
          ))}

          <div className="mt-auto pt-4">
            <div className="h-px mb-3" style={{ background: S.accent, opacity: 0.6 }} />
            <p className="text-[9px] uppercase tracking-wider opacity-70">Obrigado</p>
            <p className="text-[11px] font-semibold">{model.empresa}</p>
          </div>
        </aside>

        {/* main */}
        <div className="flex-1 px-6 py-6">
          <div className="border-l-4 pl-3 mb-5" style={{ borderColor: S.accent }}>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: S.primaryDark }}>Detalhes</p>
            <h2 className="text-lg font-extrabold text-slate-900">{model.titulo}</h2>
          </div>

          {camposSemValor.slice(4).length > 0 && (
            <div className="space-y-2 mb-5">
              {camposSemValor.slice(4).map((f) => (
                <div key={f.chave}>
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">{f.rotulo}</p>
                  <p className="text-[13px] font-medium text-slate-800">{fmtVal(f, values[f.chave])}</p>
                </div>
              ))}
            </div>
          )}

          {model.imagens && model.imagens.length > 0 && (
            <div className="mb-5 grid grid-cols-2 gap-2">
              {model.imagens.map((img) => (
                <img key={img.id} src={img.url} alt="" className="rounded-md w-full h-28 object-cover border border-slate-200" crossOrigin="anonymous" />
              ))}
            </div>
          )}

          {model.condicoes && (
            <div className="mb-3">
              <SectionTitle accent={S.accent} primary={S.primaryDark} small>Condições</SectionTitle>
              <p className="text-[12px] text-slate-700 whitespace-pre-line">{model.condicoes}</p>
            </div>
          )}
          {model.observacoes && (
            <div className="mb-4">
              <SectionTitle accent={S.accent} primary={S.primaryDark} small>Observações</SectionTitle>
              <p className="text-[12px] text-slate-700 whitespace-pre-line">{model.observacoes}</p>
            </div>
          )}

          {model.itens_servico && model.itens_servico.length > 0 && (
            <div className="mb-4">
              <SectionTitle accent={S.accent} primary={S.primaryDark}>Itens</SectionTitle>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b-2" style={{ borderColor: S.primaryDark }}>
                    <th className="text-left py-1.5 font-bold text-[10px] uppercase tracking-wider" style={{ color: S.primaryDark }}>Descrição</th>
                    <th className="text-right py-1.5 font-bold text-[10px] uppercase tracking-wider w-12" style={{ color: S.primaryDark }}>Qtd</th>
                    <th className="text-right py-1.5 font-bold text-[10px] uppercase tracking-wider w-20" style={{ color: S.primaryDark }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {model.itens_servico.map((it, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2">{it.descricao}</td>
                      <td className="text-right py-2">{it.quantidade ?? 1}</td>
                      <td className="text-right py-2 font-semibold">{fmtBR((it.quantidade ?? 1) * (it.valor_unitario ?? 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* VALOR TOTAL — por último */}
          {((model.itens_servico && model.itens_servico.length > 0) || total > 0) && (
            <div className="mt-6 rounded-lg p-4 flex items-center justify-between" style={{ background: S.soft, border: `2px solid ${S.primaryDark}` }}>
              <p className="text-[11px] uppercase tracking-[0.2em] font-bold" style={{ color: S.primaryDark }}>Total da proposta</p>
              <p className="text-2xl font-black" style={{ color: S.primaryDark }}>{fmtBR(total)}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------- LAYOUT MINIMAL (limpo, tipográfico) ----------
  return (
    <div ref={ref} className="bg-white text-slate-900 text-[13px] leading-relaxed px-7 py-7" style={{ minHeight: 500 }}>
      <div className="flex items-center justify-between pb-4 border-b-2" style={{ borderColor: S.primaryDark }}>
        <div className="flex items-center gap-3">
          {model.logo_url ? (
            <img src={model.logo_url} alt="logo" className="h-12 w-12 object-contain" crossOrigin="anonymous" />
          ) : (
            <div className="h-12 w-12 rounded flex items-center justify-center text-xl font-black text-white" style={{ background: S.primaryDark }}>
              {(model.empresa ?? model.titulo).charAt(0)}
            </div>
          )}
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-slate-500 font-bold">Proposta</p>
            <h1 className="text-xl font-black tracking-tight">{model.empresa ?? model.titulo}</h1>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Data</p>
          <p className="text-sm font-semibold">{today}</p>
        </div>
      </div>

      <h2 className="mt-6 text-2xl font-black tracking-tight" style={{ color: S.primaryDark }}>{model.titulo}</h2>
      {model.descricao && <p className="text-[13px] text-slate-600 mt-1">{model.descricao}</p>}

      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3">
        {camposSemValor.map((f) => (
          <div key={f.chave} className={f.tipo === "longo" ? "col-span-2" : ""}>
            <p className="text-[9px] uppercase tracking-[0.18em] text-slate-400 font-bold">{f.rotulo}</p>
            <p className="text-[13px] font-semibold text-slate-800 mt-0.5 border-b border-slate-100 pb-1">{fmtVal(f, values[f.chave])}</p>
          </div>
        ))}
      </div>

      {model.imagens && model.imagens.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-2">
          {model.imagens.map((img) => (
            <img key={img.id} src={img.url} alt="" className="rounded w-full h-24 object-cover" crossOrigin="anonymous" />
          ))}
        </div>
      )}

      {model.condicoes && (
        <div className="mt-6">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-1" style={{ color: S.primaryDark }}>Condições</p>
          <p className="text-[12px] text-slate-700 whitespace-pre-line">{model.condicoes}</p>
        </div>
      )}
      {model.observacoes && (
        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-1" style={{ color: S.primaryDark }}>Observações</p>
          <p className="text-[12px] text-slate-700 whitespace-pre-line">{model.observacoes}</p>
        </div>
      )}

      {model.itens_servico && model.itens_servico.length > 0 && (
        <div className="mt-6">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-2" style={{ color: S.primaryDark }}>Itens</p>
          <table className="w-full text-[12px]">
            <tbody>
              {model.itens_servico.map((it, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-2">{it.descricao} <span className="text-slate-400 text-[11px]">×{it.quantidade ?? 1}</span></td>
                  <td className="text-right py-2 font-semibold">{fmtBR((it.quantidade ?? 1) * (it.valor_unitario ?? 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VALOR TOTAL — por último */}
      {((model.itens_servico && model.itens_servico.length > 0) || total > 0) && (
        <div className="mt-8 pt-4 border-t-2 flex items-end justify-between" style={{ borderColor: S.primaryDark }}>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-bold">Total</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Investimento desta proposta</p>
          </div>
          <p className="text-3xl font-black tracking-tight" style={{ color: S.primaryDark }}>{fmtBR(total)}</p>
        </div>
      )}

      <p className="mt-8 text-center text-[10px] uppercase tracking-[0.3em] text-slate-400">
        {model.empresa ?? model.titulo} · obrigado
      </p>
    </div>
  );
});

function SectionTitle({ children, accent, primary, small }: { children: React.ReactNode; accent: string; primary: string; small?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className={`w-1 rounded-full ${small ? "h-4" : "h-5"}`} style={{ background: accent }} />
      <h3 className={`uppercase tracking-wider font-extrabold ${small ? "text-[10px]" : "text-xs"}`} style={{ color: primary }}>
        {children}
      </h3>
    </div>
  );
}
