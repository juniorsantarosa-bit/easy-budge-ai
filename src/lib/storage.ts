// LocalStorage management for budget models (no auth in MVP)
export type FieldType = "texto" | "data" | "valor" | "numero" | "longo";

export type LayoutTheme = "moderno" | "elegante" | "minimal" | "magazine" | "corporativo";
export type ColorScheme =
  | "azul" | "verde" | "roxo" | "vermelho" | "preto" | "rosa"
  | "laranja" | "turquesa" | "dourado" | "grafite" | "indigo" | "vinho";
export type HeaderFont =
  | "sans" | "serif" | "display" | "mono"
  | "script" | "elegant" | "retro" | "geometric";

// Cor de fundo do cabeçalho.
// "branco" é fixo. "primaria/primaria_escura/secundaria/secundaria_escura/suave/suave_accent"
// são derivadas da paleta selecionada (resolveScheme), então sempre combinam.
export type HeaderBgColor =
  | "branco"
  | "primaria"
  | "primaria_escura"
  | "secundaria"
  | "secundaria_escura"
  | "suave"
  | "suave_accent";

export const HEADER_BG_LABELS: Record<HeaderBgColor, string> = {
  branco: "Branco",
  primaria: "1ª cor",
  primaria_escura: "1ª escura",
  secundaria: "2ª cor",
  secundaria_escura: "2ª escura",
  suave: "Suave clara",
  suave_accent: "Suave destaque",
};

export function resolveHeaderBgHex(
  scheme: { primary: string; primaryDark: string; accent: string; accentDark: string; soft: string; softAccent: string },
  c: HeaderBgColor | undefined,
): string {
  switch (c) {
    case "branco": return "#ffffff";
    case "primaria_escura": return scheme.primaryDark;
    case "secundaria": return scheme.accent;
    case "secundaria_escura": return scheme.accentDark;
    case "suave": return scheme.soft;
    case "suave_accent": return scheme.softAccent;
    case "primaria":
    default: return scheme.primary;
  }
}

// Mantido para compatibilidade do tipo (cor da "tinta" sobre a imagem de fundo).
// Os valores aqui são apenas placeholders — as cores reais agora vêm da paleta
// (ver resolveHeaderBgHex). "nenhuma" mantém a imagem sem tingimento.
export type WatermarkColor = "nenhuma" | "branco" | "preto" | "azul" | "verde" | "vermelho" | "amarelo";
export const WATERMARK_COLORS: Record<WatermarkColor, { label: string; hex: string | null }> = {
  nenhuma:  { label: "Sem cor",  hex: null },
  branco:   { label: "Branco",   hex: "#ffffff" },
  preto:    { label: "Preto",    hex: "#000000" },
  azul:     { label: "Azul",     hex: "#1e3a8a" },
  verde:    { label: "Verde",    hex: "#14532d" },
  vermelho: { label: "Vermelho", hex: "#7f1d1d" },
  amarelo:  { label: "Amarelo",  hex: "#facc15" },
};

export const HEADER_FONTS: Record<HeaderFont, { label: string; hint: string; family: string }> = {
  sans:      { label: "Moderno",   hint: "Limpa e geométrica",                family: "'Inter', system-ui, -apple-system, sans-serif" },
  serif:     { label: "Clássico",  hint: "Sofisticada, com serifas",          family: "'Playfair Display', 'Georgia', serif" },
  display:   { label: "Marcante",  hint: "Forte, impactante",                 family: "'Archivo Black', 'Impact', sans-serif" },
  mono:      { label: "Técnico",   hint: "Minimalista, tech",                 family: "'JetBrains Mono', 'Courier New', monospace" },
  script:    { label: "Manual",    hint: "Letra de mão, pessoal",             family: "'Caveat', 'Brush Script MT', cursive" },
  elegant:   { label: "Elegante",  hint: "Suave, refinada",                   family: "'Cormorant Garamond', 'Times New Roman', serif" },
  retro:     { label: "Retrô",     hint: "Vintage, nostálgica",               family: "'Abril Fatface', 'Cooper Black', serif" },
  geometric: { label: "Suave",     hint: "Arredondada, amigável",             family: "'Quicksand', 'Avenir Next', sans-serif" },
};

export const COLOR_SCHEMES: Record<ColorScheme, { primary: string; primaryDark: string; accent: string; accentDark: string; soft: string; softAccent: string; label: string }> = {
  azul:     { label: "Azul",     primary: "#2563eb", primaryDark: "#1d4ed8", accent: "#fb923c", accentDark: "#ea580c", soft: "#eff6ff", softAccent: "#fff7ed" },
  verde:    { label: "Verde",    primary: "#059669", primaryDark: "#047857", accent: "#f59e0b", accentDark: "#d97706", soft: "#ecfdf5", softAccent: "#fffbeb" },
  roxo:     { label: "Roxo",     primary: "#7c3aed", primaryDark: "#6d28d9", accent: "#ec4899", accentDark: "#db2777", soft: "#f5f3ff", softAccent: "#fdf2f8" },
  vermelho: { label: "Vermelho", primary: "#dc2626", primaryDark: "#b91c1c", accent: "#f59e0b", accentDark: "#d97706", soft: "#fef2f2", softAccent: "#fffbeb" },
  preto:    { label: "Preto",    primary: "#1f2937", primaryDark: "#111827", accent: "#facc15", accentDark: "#ca8a04", soft: "#f3f4f6", softAccent: "#fefce8" },
  rosa:     { label: "Rosa",     primary: "#db2777", primaryDark: "#be185d", accent: "#8b5cf6", accentDark: "#7c3aed", soft: "#fdf2f8", softAccent: "#f5f3ff" },
  laranja:  { label: "Laranja",  primary: "#ea580c", primaryDark: "#c2410c", accent: "#0ea5e9", accentDark: "#0369a1", soft: "#fff7ed", softAccent: "#f0f9ff" },
  turquesa: { label: "Turquesa", primary: "#0d9488", primaryDark: "#0f766e", accent: "#f43f5e", accentDark: "#be123c", soft: "#f0fdfa", softAccent: "#fff1f2" },
  dourado:  { label: "Dourado",  primary: "#b45309", primaryDark: "#92400e", accent: "#1f2937", accentDark: "#111827", soft: "#fffbeb", softAccent: "#f3f4f6" },
  grafite:  { label: "Grafite",  primary: "#475569", primaryDark: "#334155", accent: "#06b6d4", accentDark: "#0891b2", soft: "#f1f5f9", softAccent: "#ecfeff" },
  indigo:   { label: "Indigo",   primary: "#4f46e5", primaryDark: "#4338ca", accent: "#fbbf24", accentDark: "#d97706", soft: "#eef2ff", softAccent: "#fffbeb" },
  vinho:    { label: "Vinho",    primary: "#9f1239", primaryDark: "#881337", accent: "#d4a373", accentDark: "#a8763e", soft: "#fff1f2", softAccent: "#fefae0" },
};

// Helpers para cor customizada (override do esquema pré-definido)
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return {
    r: parseInt(v.slice(0, 2), 16) || 0,
    g: parseInt(v.slice(2, 4), 16) || 0,
    b: parseInt(v.slice(4, 6), 16) || 0,
  };
}
export function shadeHex(hex: string, percent: number): string {
  // percent negativo = mais escuro; positivo = mais claro
  const { r, g, b } = hexToRgb(hex);
  const adj = (c: number) => {
    const v = percent < 0 ? c * (1 + percent) : c + (255 - c) * percent;
    return Math.max(0, Math.min(255, Math.round(v)));
  };
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(adj(r))}${toHex(adj(g))}${toHex(adj(b))}`;
}
export function softHex(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  // mistura com branco a 92%
  const mix = (c: number) => Math.round(c * 0.08 + 255 * 0.92);
  const toHex = (n: number) => mix(n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function resolveScheme(model: { cor_esquema?: ColorScheme; cor_primaria?: string; cor_secundaria?: string }) {
  const base = COLOR_SCHEMES[model.cor_esquema ?? "azul"];
  const primary = model.cor_primaria || base.primary;
  const accent = model.cor_secundaria || base.accent;
  return {
    label: base.label,
    primary,
    primaryDark: shadeHex(primary, -0.15),
    accent,
    accentDark: shadeHex(accent, -0.2),
    soft: softHex(primary),
    softAccent: softHex(accent),
  };
}

export interface BudgetField {
  chave: string;
  rotulo: string;
  tipo: FieldType;
  placeholder?: string;
  exemplo?: string;
  valor_atual?: string;
}

export interface BudgetItem {
  descricao: string;
  quantidade?: number;
  valor_unitario?: number;
}

export interface BudgetImage {
  id: string;
  url: string;
  legenda?: string;
}

export interface BudgetModel {
  id: string;
  titulo: string;
  empresa?: string;
  descricao?: string;
  campos: BudgetField[];
  itens_servico?: BudgetItem[];
  condicoes?: string;
  observacoes?: string;
  logo_url?: string;
  logo_zoom?: number;           // 1 = ajustado; >1 = aproximado
  logo_x?: number;              // -100..100 (% deslocamento horizontal)
  logo_y?: number;              // -100..100 (% deslocamento vertical)
  imagens?: BudgetImage[];
  cor_destaque?: string;
  cor_esquema?: ColorScheme;
  cor_primaria?: string;        // hex override (#rrggbb)
  cor_secundaria?: string;      // hex override (#rrggbb)
  layout?: LayoutTheme;
  header_font?: HeaderFont;
  header_subtitulo?: string;
  header_image_url?: string;    // imagem de fundo do cabeçalho
  header_image_opacity?: number; // 0..1 (efeito marca d'água)
  header_image_zoom?: number;   // 1..3
  header_image_x?: number;      // 0..100 (% backgroundPosition X)
  header_image_y?: number;      // 0..100 (% backgroundPosition Y)
  header_overlay_color?: WatermarkColor; // cor da "marca d'água" sobre a imagem
  rodape?: string;              // texto livre do rodapé
  criado_em: number;
  atualizado_em: number;
}

export interface BudgetHistory {
  id: string;
  modelo_id: string;
  modelo_titulo: string;
  cliente?: string;
  total: number;
  emitido_em: number;
}

const KEY = "orcafacil:modelos";
const KEY_HIST = "orcafacil:historico";

// ----- Histórico de orçamentos emitidos em PDF -----
export function getHistory(): BudgetHistory[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY_HIST) ?? "[]");
  } catch {
    return [];
  }
}

export function addHistory(h: BudgetHistory) {
  const all = getHistory();
  all.unshift(h);
  localStorage.setItem(KEY_HIST, JSON.stringify(all.slice(0, 100)));
}

export function deleteHistory(id: string) {
  localStorage.setItem(KEY_HIST, JSON.stringify(getHistory().filter((h) => h.id !== id)));
}

export function getModels(): BudgetModel[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seedModels();
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveModel(m: BudgetModel) {
  const all = getModels();
  const idx = all.findIndex((x) => x.id === m.id);
  if (idx >= 0) all[idx] = m;
  else all.push(m);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function deleteModel(id: string) {
  localStorage.setItem(KEY, JSON.stringify(getModels().filter((m) => m.id !== id)));
}

export function getModel(id: string): BudgetModel | undefined {
  return getModels().find((m) => m.id === id);
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function seedModels(): BudgetModel[] {
  const now = Date.now();
  const seeds: BudgetModel[] = [
    {
      id: "seed-design",
      titulo: "Design Gráfico",
      empresa: "Seu Estúdio",
      descricao: "Modelo para projetos de identidade visual e design",
      cor_destaque: "azul",
      campos: [
        { chave: "nome_cliente", rotulo: "Nome do Cliente", tipo: "texto", placeholder: "Ex: Maria Silva" },
        { chave: "data_orcamento", rotulo: "Data", tipo: "data" },
        { chave: "validade", rotulo: "Validade", tipo: "texto", placeholder: "15 dias" },
        { chave: "servico", rotulo: "Serviço", tipo: "longo", placeholder: "Identidade visual completa" },
        { chave: "valor_total", rotulo: "Valor Total", tipo: "valor" },
        { chave: "prazo", rotulo: "Prazo de Entrega", tipo: "texto", placeholder: "20 dias úteis" },
      ],
      itens_servico: [
        { descricao: "Logotipo + manual de marca", quantidade: 1, valor_unitario: 1200 },
        { descricao: "Cartão de visita (arte)", quantidade: 1, valor_unitario: 250 },
      ],
      condicoes: "50% na aprovação, 50% na entrega final.",
      observacoes: "Inclui 2 rodadas de revisão.",
      criado_em: now,
      atualizado_em: now,
    },
    {
      id: "seed-reforma",
      titulo: "Reforma & Construção",
      empresa: "Sua Construtora",
      cor_destaque: "azul",
      campos: [
        { chave: "nome_cliente", rotulo: "Cliente", tipo: "texto" },
        { chave: "endereco_obra", rotulo: "Endereço da Obra", tipo: "longo" },
        { chave: "data_orcamento", rotulo: "Data", tipo: "data" },
        { chave: "descricao_servico", rotulo: "Descrição do Serviço", tipo: "longo" },
        { chave: "valor_total", rotulo: "Valor Total", tipo: "valor" },
        { chave: "prazo", rotulo: "Prazo", tipo: "texto" },
      ],
      itens_servico: [
        { descricao: "Mão de obra", quantidade: 1, valor_unitario: 0 },
        { descricao: "Material", quantidade: 1, valor_unitario: 0 },
      ],
      condicoes: "Pagamento em 3x: 30% início, 40% durante, 30% entrega.",
      criado_em: now,
      atualizado_em: now,
    },
    {
      id: "seed-consultoria",
      titulo: "Consultoria",
      empresa: "Sua Consultoria",
      cor_destaque: "azul",
      campos: [
        { chave: "nome_cliente", rotulo: "Cliente", tipo: "texto" },
        { chave: "data_orcamento", rotulo: "Data", tipo: "data" },
        { chave: "objetivo", rotulo: "Objetivo da Consultoria", tipo: "longo" },
        { chave: "horas", rotulo: "Horas estimadas", tipo: "numero" },
        { chave: "valor_hora", rotulo: "Valor/Hora", tipo: "valor" },
        { chave: "valor_total", rotulo: "Valor Total", tipo: "valor" },
      ],
      condicoes: "Pagamento mensal mediante relatório de horas.",
      criado_em: now,
      atualizado_em: now,
    },
    {
      id: "seed-eventos",
      titulo: "Eventos & Buffet",
      empresa: "Seu Buffet",
      cor_destaque: "azul",
      campos: [
        { chave: "nome_cliente", rotulo: "Cliente", tipo: "texto" },
        { chave: "tipo_evento", rotulo: "Tipo do Evento", tipo: "texto", placeholder: "Casamento, Aniversário..." },
        { chave: "data_evento", rotulo: "Data do Evento", tipo: "data" },
        { chave: "convidados", rotulo: "Nº de Convidados", tipo: "numero" },
        { chave: "local", rotulo: "Local", tipo: "longo" },
        { chave: "valor_total", rotulo: "Valor Total", tipo: "valor" },
      ],
      itens_servico: [
        { descricao: "Buffet completo (por pessoa)", quantidade: 50, valor_unitario: 90 },
        { descricao: "Equipe de garçons", quantidade: 4, valor_unitario: 200 },
      ],
      condicoes: "Sinal de 30% para reserva da data. Saldo até 7 dias antes.",
      criado_em: now,
      atualizado_em: now,
    },
    {
      id: "seed-tecnologia",
      titulo: "Desenvolvimento de Software",
      empresa: "Seu Estúdio Digital",
      cor_destaque: "azul",
      campos: [
        { chave: "nome_cliente", rotulo: "Cliente", tipo: "texto" },
        { chave: "data_orcamento", rotulo: "Data", tipo: "data" },
        { chave: "escopo", rotulo: "Escopo do Projeto", tipo: "longo" },
        { chave: "tecnologias", rotulo: "Tecnologias", tipo: "texto" },
        { chave: "prazo", rotulo: "Prazo", tipo: "texto" },
        { chave: "valor_total", rotulo: "Valor Total", tipo: "valor" },
      ],
      condicoes: "Pagamento por marcos: 30% início, 40% homologação, 30% deploy.",
      observacoes: "Inclui 30 dias de suporte pós-entrega.",
      criado_em: now,
      atualizado_em: now,
    },
  ];
  localStorage.setItem(KEY, JSON.stringify(seeds));
  return seeds;
}
