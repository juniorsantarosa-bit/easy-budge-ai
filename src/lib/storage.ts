// LocalStorage management for budget models (no auth in MVP)
export type FieldType = "texto" | "data" | "valor" | "numero" | "longo";

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
  criado_em: number;
  atualizado_em: number;
}

const KEY = "orcafacil:modelos";

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
