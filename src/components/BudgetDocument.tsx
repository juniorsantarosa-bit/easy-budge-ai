import { forwardRef } from "react";
import { HEADER_FONTS, resolveScheme, resolveHeaderBgHex, WATERMARK_COLORS, type BudgetModel, type ColorScheme, type LayoutTheme, type HeaderFont, type WatermarkColor, type HeaderBgColor } from "@/lib/storage";

// Determina se uma cor hex é "clara" (precisa de texto escuro)
function isLightHex(hex: string): boolean {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(v.slice(0, 2), 16) || 0;
  const g = parseInt(v.slice(2, 4), 16) || 0;
  const b = parseInt(v.slice(4, 6), 16) || 0;
  // luminância perceptual
  return (0.299 * r + 0.587 * g + 0.114 * b) > 170;
}

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

const VALOR_PX = 16;
// Total da proposta: 50% do tamanho anterior (antes era 2x dos demais valores)
const TOTAL_PX = VALOR_PX; // 16px — mesmo tamanho dos demais valores

// Renderiza o "fundo" do cabeçalho: imagem (com zoom/posição) + opacidade
// (marca d'água) + uma camada de cor opcional sobre a imagem.
function HeaderBackground({
  color,
  imageUrl,
  opacity,
  zoom,
  posX,
  posY,
  overlayColor,
}: {
  color: string;
  imageUrl?: string;
  opacity?: number;
  zoom?: number;
  posX?: number;
  posY?: number;
  overlayColor?: WatermarkColor;
}) {
  const z = zoom ?? 1;
  const px = posX ?? 50;
  const py = posY ?? 50;
  const overlay = overlayColor && overlayColor !== "nenhuma" ? WATERMARK_COLORS[overlayColor].hex : null;
  return (
    <>
      <div className="absolute inset-0" style={{ background: color }} />
      {imageUrl && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: `${z * 100}% auto`,
            backgroundPosition: `${px}% ${py}%`,
            backgroundRepeat: "no-repeat",
            opacity: opacity ?? 0.25,
          }}
        />
      )}
      {imageUrl && overlay && (
        <div
          className="absolute inset-0"
          style={{ background: overlay, opacity: 0.35, mixBlendMode: "multiply" }}
        />
      )}
    </>
  );
}

// Logo com enquadramento (zoom + posição) — usado em todos os layouts.
// object-cover + scale base ≥ 1 garantem que o logo ocupe 100% da caixa
// (sem bordas brancas em volta), permitindo ainda o ajuste fino do usuário.
function FramedLogo({ url, zoom, x, y, className, style }: { url: string; zoom?: number; x?: number; y?: number; className?: string; style?: React.CSSProperties }) {
  const z = zoom ?? 1;
  const tx = x ?? 0;
  const ty = y ?? 0;
  return (
    <div className={`overflow-hidden flex items-center justify-center ${className ?? ""}`} style={style}>
      <img
        src={url}
        alt="logo"
        crossOrigin="anonymous"
        className="h-full w-full object-cover"
        style={{ transform: `translate(${tx}%, ${ty}%) scale(${z})`, transformOrigin: "center" }}
      />
    </div>
  );
}

export const BudgetDocument = forwardRef<HTMLDivElement, Props>(function BudgetDocument(
  { model, values, layout, scheme },
  ref,
) {
  const L: LayoutTheme = layout ?? model.layout ?? "moderno";
  const S = resolveScheme({ ...model, cor_esquema: scheme ?? model.cor_esquema });
  const HF: HeaderFont = model.header_font ?? "sans";
  const headerFamily = HEADER_FONTS[HF].family;
  const today = new Date().toLocaleDateString("pt-BR");
  const total = (model.itens_servico ?? []).reduce(
    (s, it) => s + (it.quantidade ?? 1) * (it.valor_unitario ?? 0),
    0,
  );
  const camposSemValor = model.campos.filter((c) => c.tipo !== "valor");
  const camposValor = model.campos.filter((c) => c.tipo === "valor");
  const subtitulo = model.header_subtitulo ?? "Proposta Comercial";
  const rodape = model.rodape ?? "";
  const headerImg = model.header_image_url;
  const headerOp = model.header_image_opacity ?? 0.25;
  const headerZoom = model.header_image_zoom ?? 1;
  const headerPX = model.header_image_x ?? 50;
  const headerPY = model.header_image_y ?? 50;
  const headerOverlay = model.header_overlay_color ?? "nenhuma";
  const logoZoom = model.logo_zoom ?? 1;
  const logoX = model.logo_x ?? 0;
  const logoY = model.logo_y ?? 0;

  // Cor de fundo do cabeçalho (alinhada à paleta) — substitui o gradiente padrão.
  // Se o usuário não escolheu, fica undefined e cada layout usa seu próprio default.
  const headerBgHex = model.header_bg_color ? resolveHeaderBgHex(S, model.header_bg_color) : undefined;
  const headerIsLight = headerBgHex ? isLightHex(headerBgHex) : false;
  // Para legibilidade quando o fundo é claro (ex: branco)
  const headerTextColor = headerIsLight ? S.primaryDark : "#ffffff";
  const headerSubtleColor = headerIsLight ? S.primary : "rgba(255,255,255,0.85)";

  // ---------- LAYOUT MODERNO (gradient hero) ----------
  if (L === "moderno") {
    const headerColor = headerBgHex ?? `linear-gradient(135deg, ${S.primaryDark} 0%, ${S.primary} 100%)`;
    return (
      <div ref={ref} className="bg-white text-slate-900 text-[13px] leading-relaxed" style={{ minHeight: 500 }}>
        <div className="relative px-6 pt-6 pb-8 overflow-hidden" style={{ color: headerTextColor }}>
          <HeaderBackground color={headerColor} imageUrl={headerImg} opacity={headerOp} zoom={headerZoom} posX={headerPX} posY={headerPY} overlayColor={headerOverlay} />
          <div className="absolute top-0 right-0 h-full w-32 opacity-25" style={{ background: `radial-gradient(circle at top right, ${S.accent}, transparent 70%)` }} />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {model.logo_url ? (
                <div className="h-16 w-16 rounded-xl bg-white shadow-md overflow-hidden">
                  <FramedLogo url={model.logo_url} zoom={logoZoom} x={logoX} y={logoY} className="h-full w-full" />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-2xl font-black">
                  {(model.empresa ?? model.titulo).charAt(0)}
                </div>
              )}
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-semibold opacity-80">{subtitulo}</p>
                <h1 className="text-2xl font-extrabold leading-tight mt-0.5" style={{ fontFamily: headerFamily }}>{model.empresa ?? model.titulo}</h1>
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
          <div className="grid grid-cols-2 gap-2 mb-5">
            {camposSemValor.map((f) => (
              <div key={f.chave} className={`rounded-lg border-l-[3px] bg-slate-50 px-3 py-2 ${f.tipo === "longo" ? "col-span-2" : ""}`} style={{ borderColor: S.accent }}>
                <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">{f.rotulo}</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{fmtVal(f, values[f.chave])}</p>
              </div>
            ))}
          </div>

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

          {camposValor.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {camposValor.map((f) => (
                <div key={f.chave} className="rounded-lg border-l-[3px] bg-slate-50 px-3 py-2" style={{ borderColor: S.primary }}>
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">{f.rotulo}</p>
                  <p className="font-bold mt-0.5" style={{ color: S.primaryDark, fontSize: VALOR_PX }}>{fmtVal(f, values[f.chave])}</p>
                </div>
              ))}
            </div>
          )}

          {((model.itens_servico && model.itens_servico.length > 0) || total > 0) && (
            <div className="mt-8 rounded-2xl p-5 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${S.primaryDark}, ${S.primary})` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-80">Investimento total</p>
                  <p className="font-black mt-1 leading-none" style={{ fontSize: TOTAL_PX }}>{fmtBR(total)}</p>
                </div>
                <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ background: S.accent, color: S.accentDark }}>
                  À vista
                </span>
              </div>
            </div>
          )}

          <Footer rodape={rodape} fallback={`Obrigado pela preferência · ${model.empresa ?? model.titulo}`} primary={S.primaryDark} font={headerFamily} />
        </div>
      </div>
    );
  }

  // ---------- LAYOUT ELEGANTE (sidebar lateral colorida) ----------
  if (L === "elegante") {
    return (
      <div ref={ref} className="bg-white text-slate-900 text-[13px] leading-relaxed flex" style={{ minHeight: 500 }}>
        <aside className="relative w-[34%] p-5 flex flex-col overflow-hidden" style={{ color: headerTextColor }}>
          <HeaderBackground color={headerBgHex ?? S.primaryDark} imageUrl={headerImg} opacity={headerOp} zoom={headerZoom} posX={headerPX} posY={headerPY} overlayColor={headerOverlay} />
          <div className="relative flex-1 flex flex-col">
            {model.logo_url ? (
              <div className="h-16 w-16 rounded-lg bg-white p-1.5 flex items-center justify-center mb-4">
                <FramedLogo url={model.logo_url} zoom={logoZoom} x={logoX} y={logoY} className="h-full w-full" />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-lg bg-white/15 flex items-center justify-center text-2xl font-black mb-4">
                {(model.empresa ?? model.titulo).charAt(0)}
              </div>
            )}
            <p className="text-[9px] uppercase tracking-[0.25em] opacity-70 font-semibold">{subtitulo}</p>
            <h1 className="text-xl font-extrabold leading-tight mt-1" style={{ fontFamily: headerFamily }}>{model.empresa ?? model.titulo}</h1>
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
          </div>
        </aside>

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

          {((model.itens_servico && model.itens_servico.length > 0) || total > 0) && (
            <div className="mt-6 rounded-lg p-4 flex items-center justify-between" style={{ background: S.soft, border: `2px solid ${S.primaryDark}` }}>
              <p className="text-[11px] uppercase tracking-[0.2em] font-bold" style={{ color: S.primaryDark }}>Total da proposta</p>
              <p className="font-black leading-none" style={{ color: S.primaryDark, fontSize: TOTAL_PX }}>{fmtBR(total)}</p>
            </div>
          )}

          <Footer rodape={rodape} fallback="" primary={S.primaryDark} font={headerFamily} />
        </div>
      </div>
    );
  }

  // ---------- LAYOUT MAGAZINE (revista — capa de impacto) ----------
  if (L === "magazine") {
    return (
      <div ref={ref} className="bg-white text-slate-900 text-[13px] leading-relaxed" style={{ minHeight: 500 }}>
        {/* Capa estilo revista */}
        <div className="relative h-56 overflow-hidden">
          <HeaderBackground
            color={headerBgHex ?? `linear-gradient(160deg, ${S.primaryDark} 0%, ${S.primary} 60%, ${S.accent} 100%)`}
            imageUrl={headerImg}
            opacity={headerOp}
            zoom={headerZoom}
            posX={headerPX}
            posY={headerPY}
            overlayColor={headerOverlay}
          />
          {/* faixa diagonal */}
          <div
            className="absolute -bottom-10 left-0 right-0 h-24"
            style={{ background: "white", transform: "skewY(-3deg)" }}
          />
          <div className="relative h-full flex flex-col justify-between p-6" style={{ color: headerTextColor }}>
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-90">{subtitulo}</p>
              <p className="text-[11px] opacity-90">{today}</p>
            </div>
            <div>
              <h1 className="text-4xl font-black leading-[0.95] tracking-tight" style={{ fontFamily: headerFamily }}>
                {model.empresa ?? model.titulo}
              </h1>
              <p className="text-[12px] mt-1 opacity-90 font-semibold">{model.titulo}</p>
            </div>
          </div>
          {/* logo no canto, sobreposto à faixa branca */}
          {model.logo_url && (
            <div className="absolute bottom-2 right-6 h-16 w-16 rounded-full bg-white p-2 shadow-lg flex items-center justify-center z-10">
              <FramedLogo url={model.logo_url} zoom={logoZoom} x={logoX} y={logoY} className="h-full w-full" />
            </div>
          )}
        </div>

        <div className="px-6 pt-4 pb-6">
          {/* tag de seção */}
          <div className="flex items-center gap-2 mb-3">
            <span className="h-[2px] w-8" style={{ background: S.accent }} />
            <p className="text-[10px] uppercase tracking-[0.3em] font-black" style={{ color: S.accent }}>Edição especial</p>
          </div>

          {/* Resumo em duas colunas tipo revista */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              {camposSemValor.slice(0, Math.ceil(camposSemValor.length / 2)).map((f) => (
                <div key={f.chave} className="mb-2">
                  <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: S.primary }}>{f.rotulo}</p>
                  <p className="text-[13px] font-semibold text-slate-800">{fmtVal(f, values[f.chave])}</p>
                </div>
              ))}
            </div>
            <div>
              {camposSemValor.slice(Math.ceil(camposSemValor.length / 2)).map((f) => (
                <div key={f.chave} className="mb-2">
                  <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: S.primary }}>{f.rotulo}</p>
                  <p className="text-[13px] font-semibold text-slate-800">{fmtVal(f, values[f.chave])}</p>
                </div>
              ))}
            </div>
          </div>

          {model.imagens && model.imagens.length > 0 && (
            <div className="mb-5">
              <div className="grid grid-cols-3 gap-2">
                {model.imagens.map((img, i) => (
                  <img
                    key={img.id}
                    src={img.url}
                    alt=""
                    className={`rounded-lg w-full object-cover ${i === 0 ? "col-span-2 h-40" : "h-24"}`}
                    crossOrigin="anonymous"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Bloco "destaque" estilo magazine */}
          {model.condicoes && (
            <div className="mb-4 pl-4 border-l-4" style={{ borderColor: S.accent }}>
              <p className="text-[10px] uppercase tracking-wider font-black mb-1" style={{ color: S.primaryDark }}>Condições</p>
              <p className="text-[13px] text-slate-700 italic whitespace-pre-line">{model.condicoes}</p>
            </div>
          )}
          {model.observacoes && (
            <div className="mb-4 pl-4 border-l-4" style={{ borderColor: S.primary }}>
              <p className="text-[10px] uppercase tracking-wider font-black mb-1" style={{ color: S.primaryDark }}>Observações</p>
              <p className="text-[13px] text-slate-700 whitespace-pre-line">{model.observacoes}</p>
            </div>
          )}

          {model.itens_servico && model.itens_servico.length > 0 && (
            <div className="mb-4 rounded-xl overflow-hidden" style={{ border: `1px solid ${S.primary}33` }}>
              <div className="px-3 py-2 text-white text-[10px] uppercase tracking-[0.25em] font-black" style={{ background: S.primaryDark }}>
                O que está incluído
              </div>
              <table className="w-full text-[12px]">
                <tbody>
                  {model.itens_servico.map((it, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="py-2 px-3">
                        <span className="font-semibold">{it.descricao}</span>
                        <span className="text-slate-400 text-[11px]"> · ×{it.quantidade ?? 1}</span>
                      </td>
                      <td className="text-right py-2 px-3 font-semibold" style={{ color: S.primaryDark }}>
                        {fmtBR((it.quantidade ?? 1) * (it.valor_unitario ?? 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TOTAL — capa final */}
          {((model.itens_servico && model.itens_servico.length > 0) || total > 0) && (
            <div
              className="relative mt-6 rounded-2xl overflow-hidden p-5 text-white"
              style={{ background: `linear-gradient(120deg, ${S.primaryDark}, ${S.accent})` }}
            >
              <p className="text-[10px] uppercase tracking-[0.3em] font-black opacity-90">Investimento</p>
              <p className="font-black leading-none mt-1" style={{ fontSize: TOTAL_PX }}>{fmtBR(total)}</p>
            </div>
          )}

          <Footer rodape={rodape} fallback={model.empresa ?? model.titulo} primary={S.primaryDark} font={headerFamily} />
        </div>
      </div>
    );
  }

  // ---------- LAYOUT CORPORATIVO (executivo, sério, com 2 cores em barras) ----------
  if (L === "corporativo") {
    return (
      <div ref={ref} className="bg-white text-slate-900 text-[13px] leading-relaxed" style={{ minHeight: 500 }}>
        {/* Cabeçalho duplo: barra superior fina + bloco principal */}
        <div className="h-2" style={{ background: S.accent }} />
        <div className="relative px-6 py-5 overflow-hidden">
          <HeaderBackground color={headerBgHex ?? S.primaryDark} imageUrl={headerImg} opacity={headerOp} zoom={headerZoom} posX={headerPX} posY={headerPY} overlayColor={headerOverlay} />
          <div className="relative flex items-center justify-between" style={{ color: headerTextColor }}>
            <div className="flex items-center gap-4">
              {model.logo_url ? (
                <div className="h-14 w-14 bg-white p-1.5 rounded shadow flex items-center justify-center">
                  <FramedLogo url={model.logo_url} zoom={logoZoom} x={logoX} y={logoY} className="h-full w-full" />
                </div>
              ) : (
                <div className="h-14 w-14 bg-white/15 rounded flex items-center justify-center text-xl font-black">
                  {(model.empresa ?? model.titulo).charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-xl font-black leading-tight" style={{ fontFamily: headerFamily }}>
                  {model.empresa ?? model.titulo}
                </h1>
                <p className="text-[10px] uppercase tracking-[0.25em] opacity-80 mt-0.5">{subtitulo}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-wider opacity-70 font-bold">Emitido em</p>
              <p className="text-sm font-semibold">{today}</p>
            </div>
          </div>
        </div>
        <div className="h-1" style={{ background: S.primary }} />

        <div className="px-6 py-6">
          {/* Bloco "Para" estilo carta executiva */}
          <div className="grid grid-cols-12 gap-4 mb-5">
            <div className="col-span-4">
              <p className="text-[9px] uppercase tracking-[0.2em] font-bold" style={{ color: S.accent }}>Para</p>
            </div>
            <div className="col-span-8 space-y-2">
              {camposSemValor.map((f) => (
                <div key={f.chave} className="flex justify-between gap-3 border-b border-dotted border-slate-200 pb-1">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{f.rotulo}</p>
                  <p className="text-[12px] font-semibold text-slate-800 text-right">{fmtVal(f, values[f.chave])}</p>
                </div>
              ))}
            </div>
          </div>

          {model.imagens && model.imagens.length > 0 && (
            <div className="grid grid-cols-12 gap-4 mb-5">
              <div className="col-span-4">
                <p className="text-[9px] uppercase tracking-[0.2em] font-bold" style={{ color: S.accent }}>Anexos</p>
              </div>
              <div className="col-span-8 grid grid-cols-2 gap-2">
                {model.imagens.map((img) => (
                  <img key={img.id} src={img.url} alt="" className="rounded w-full h-24 object-cover border border-slate-200" crossOrigin="anonymous" />
                ))}
              </div>
            </div>
          )}

          {model.condicoes && (
            <div className="grid grid-cols-12 gap-4 mb-4">
              <div className="col-span-4">
                <p className="text-[9px] uppercase tracking-[0.2em] font-bold" style={{ color: S.accent }}>Condições</p>
              </div>
              <div className="col-span-8">
                <p className="text-[12px] text-slate-700 whitespace-pre-line">{model.condicoes}</p>
              </div>
            </div>
          )}
          {model.observacoes && (
            <div className="grid grid-cols-12 gap-4 mb-4">
              <div className="col-span-4">
                <p className="text-[9px] uppercase tracking-[0.2em] font-bold" style={{ color: S.accent }}>Observações</p>
              </div>
              <div className="col-span-8">
                <p className="text-[12px] text-slate-700 whitespace-pre-line">{model.observacoes}</p>
              </div>
            </div>
          )}

          {model.itens_servico && model.itens_servico.length > 0 && (
            <div className="mt-2">
              <div className="h-[2px] mb-2" style={{ background: S.primaryDark }} />
              <table className="w-full text-[12px]">
                <thead>
                  <tr>
                    <th className="text-left py-2 font-black text-[10px] uppercase tracking-wider" style={{ color: S.primaryDark }}>Item</th>
                    <th className="text-center py-2 font-black text-[10px] uppercase tracking-wider w-12" style={{ color: S.primaryDark }}>Qtd</th>
                    <th className="text-right py-2 font-black text-[10px] uppercase tracking-wider w-24" style={{ color: S.primaryDark }}>Unit.</th>
                    <th className="text-right py-2 font-black text-[10px] uppercase tracking-wider w-24" style={{ color: S.primaryDark }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {model.itens_servico.map((it, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2">{it.descricao}</td>
                      <td className="text-center py-2">{it.quantidade ?? 1}</td>
                      <td className="text-right py-2 text-slate-600">{fmtBR(it.valor_unitario ?? 0)}</td>
                      <td className="text-right py-2 font-semibold">{fmtBR((it.quantidade ?? 1) * (it.valor_unitario ?? 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TOTAL em barra dupla */}
          {((model.itens_servico && model.itens_servico.length > 0) || total > 0) && (
            <div className="mt-6 rounded overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 text-white" style={{ background: S.primaryDark }}>
                <p className="text-[11px] uppercase tracking-[0.25em] font-black">Valor total da proposta</p>
                <p className="font-black leading-none" style={{ fontSize: TOTAL_PX }}>{fmtBR(total)}</p>
              </div>
              <div className="h-1" style={{ background: S.accent }} />
            </div>
          )}

          <Footer rodape={rodape} fallback={`${model.empresa ?? model.titulo} · ${today}`} primary={S.primaryDark} font={headerFamily} />
        </div>
      </div>
    );
  }

  // ---------- LAYOUT MINIMAL (limpo, tipográfico) ----------
  return (
    <div ref={ref} className="bg-white text-slate-900 text-[13px] leading-relaxed" style={{ minHeight: 500 }}>
      <div className="relative px-7 py-7 overflow-hidden">
        {headerImg && <HeaderBackground color="white" imageUrl={headerImg} opacity={headerOp} zoom={headerZoom} posX={headerPX} posY={headerPY} overlayColor={headerOverlay} />}
        <div className="relative flex items-center justify-between pb-4 border-b-2" style={{ borderColor: S.primaryDark }}>
          <div className="flex items-center gap-3">
            {model.logo_url ? (
              <FramedLogo url={model.logo_url} zoom={logoZoom} x={logoX} y={logoY} className="h-12 w-12" />
            ) : (
              <div className="h-12 w-12 rounded flex items-center justify-center text-xl font-black text-white" style={{ background: S.primaryDark }}>
                {(model.empresa ?? model.titulo).charAt(0)}
              </div>
            )}
            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] text-slate-500 font-bold">{subtitulo}</p>
              <h1 className="text-xl font-black tracking-tight" style={{ fontFamily: headerFamily }}>{model.empresa ?? model.titulo}</h1>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Data</p>
            <p className="text-sm font-semibold">{today}</p>
          </div>
        </div>
      </div>

      <div className="px-7 pb-7">
        <h2 className="text-2xl font-black tracking-tight" style={{ color: S.primaryDark, fontFamily: headerFamily }}>{model.titulo}</h2>
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

        {((model.itens_servico && model.itens_servico.length > 0) || total > 0) && (
          <div className="mt-8 pt-4 border-t-2 flex items-end justify-between" style={{ borderColor: S.primaryDark }}>
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-bold">Total</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Investimento desta proposta</p>
            </div>
            <p className="font-black tracking-tight leading-none" style={{ color: S.primaryDark, fontSize: TOTAL_PX }}>{fmtBR(total)}</p>
          </div>
        )}

        <Footer rodape={rodape} fallback={`${model.empresa ?? model.titulo} · obrigado`} primary={S.primaryDark} font={headerFamily} />
      </div>
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

function Footer({ rodape, fallback, primary, font }: { rodape: string; fallback: string; primary: string; font: string }) {
  const text = rodape?.trim() ? rodape : fallback;
  if (!text) return null;
  return (
    <div className="mt-8 pt-4 border-t border-dashed border-slate-200 text-center">
      <p className="text-[11px] whitespace-pre-line font-medium" style={{ color: primary, fontFamily: font }}>
        {text}
      </p>
    </div>
  );
}
