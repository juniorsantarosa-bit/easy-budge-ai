// LocalStorage management for budget models (no auth in MVP)
export type FieldType = "texto" | "data" | "valor" | "numero" | "longo";

export type LayoutTheme = "moderno" | "elegante" | "minimal";
export type ColorScheme = "azul" | "verde" | "roxo" | "vermelho" | "preto" | "rosa";
export type HeaderFont = "sans" | "serif" | "display" | "mono";

export const HEADER_FONTS: Record<HeaderFont, { label: string; hint: string; family: string }> = {
  sans:    { label: "Moderno",  hint: "Logos limpos e geométricos",       family: "'Inter', system-ui, -apple-system, sans-serif" },
  serif:   { label: "Clássico", hint: "Logos sofisticados, com serifas",  family: "'Playfair Display', 'Georgia', serif" },
  display: { label: "Marcante", hint: "Logos fortes, gordos, impactantes", family: "'Archivo Black', 'Impact', sans-serif" },
  mono:    { label: "Técnico",  hint: "Logos minimalistas e tech",        family: "'JetBrains Mono', 'Courier New', monospace" },
};

export const COLOR_SCHEMES: Record<ColorScheme, { primary: string; primaryDark: string; accent: string; accentDark: string; soft: string; softAccent: string; label: string }> = {
  azul:     { label: "Azul",     primary: "#2563eb", primaryDark: "#1d4ed8", accent: "#fb923c", accentDark: "#ea580c", soft: "#eff6ff", softAccent: "#fff7ed" },
  verde:    { label: "Verde",    primary: "#059669", primaryDark: "#047857", accent: "#f59e0b", accentDark: "#d97706", soft: "#ecfdf5", softAccent: "#fffbeb" },
  roxo:     { label: "Roxo",     primary: "#7c3aed", primaryDark: "#6d28d9", accent: "#ec4899", accentDark: "#db2777", soft: "#f5f3ff", softAccent: "#fdf2f8" },
  vermelho: { label: "Vermelho", primary: "#dc2626", primaryDark: "#b91c1c", accent: "#f59e0b", accentDark: "#d97706", soft: "#fef2f2", softAccent: "#fffbeb" },
  preto:    { label: "Preto",    primary: "#1f2937", primaryDark: "#111827", accent: "#facc15", accentDark: "#ca8a04", soft: "#f3f4f6", softAccent: "#fefce8" },
  rosa:     { label: "Rosa",     primary: "#db2777", primaryDark: "#be185d", accent: "#8b5cf6", accentDark: "#7c3aed", soft: "#fdf2f8", softAccent: "#f5f3ff" },
};

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
  imagens?: BudgetImage[];
  cor_destaque?: string;
  cor_esquema?: ColorScheme;
  layout?: LayoutTheme;
  header_font?: HeaderFont;
  header_subtitulo?: string;
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
