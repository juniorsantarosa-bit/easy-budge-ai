import { createServerFn } from "@tanstack/react-start";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAI(body: Record<string, unknown>) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY ausente");
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-3-flash-preview", ...body }),
  });
  if (!res.ok) {
    const t = await res.text();
    if (res.status === 429) throw new Error("Limite de requisições da IA atingido. Aguarde alguns segundos.");
    if (res.status === 402) throw new Error("Créditos da IA esgotados. Adicione créditos no workspace Lovable.");
    throw new Error(`Erro IA ${res.status}: ${t}`);
  }
  return res.json();
}

// Generate a budget template from a service description
export const generateTemplate = createServerFn({ method: "POST" })
  .inputValidator((input: { serviceType: string }) => {
    if (!input?.serviceType || input.serviceType.length > 300) throw new Error("Tipo de serviço inválido");
    return input;
  })
  .handler(async ({ data }) => {
    const tools = [
      {
        type: "function",
        function: {
          name: "criar_modelo",
          description: "Cria um modelo organizado de orçamento com seções e campos editáveis",
          parameters: {
            type: "object",
            properties: {
              titulo: { type: "string" },
              empresa: { type: "string" },
              descricao: { type: "string" },
              campos: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    chave: { type: "string", description: "snake_case ex: nome_cliente" },
                    rotulo: { type: "string" },
                    tipo: { type: "string", enum: ["texto", "data", "valor", "numero", "longo"] },
                    placeholder: { type: "string" },
                    exemplo: { type: "string" },
                  },
                  required: ["chave", "rotulo", "tipo"],
                },
              },
              itens_servico: {
                type: "array",
                description: "Itens/serviços padrão sugeridos",
                items: {
                  type: "object",
                  properties: {
                    descricao: { type: "string" },
                    quantidade: { type: "number" },
                    valor_unitario: { type: "number" },
                  },
                  required: ["descricao"],
                },
              },
              condicoes: { type: "string", description: "Texto de condições/forma de pagamento padrão" },
              observacoes: { type: "string" },
            },
            required: ["titulo", "campos"],
          },
        },
      },
    ];
    const r = await callAI({
      messages: [
        {
          role: "system",
          content:
            "Você é um especialista em orçamentos comerciais brasileiros. Crie modelos práticos, claros e completos para celular. Sempre em português do Brasil.",
        },
        {
          role: "user",
          content: `Gere um modelo de orçamento para o serviço: "${data.serviceType}". Inclua campos editáveis essenciais (cliente, data, validade, etc.), 2-4 itens de serviço sugeridos com valores realistas, condições de pagamento padrão e observações.`,
        },
      ],
      tools,
      tool_choice: { type: "function", function: { name: "criar_modelo" } },
    });
    const args = r.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("Resposta da IA inválida");
    return JSON.parse(args);
  });

// Extract editable fields from PDF text
export const parseBudgetText = createServerFn({ method: "POST" })
  .inputValidator((input: { text: string }) => {
    if (!input?.text) throw new Error("Texto vazio");
    return { text: input.text.slice(0, 30000) };
  })
  .handler(async ({ data }) => {
    const tools = [
      {
        type: "function",
        function: {
          name: "extrair_campos",
          description: "Extrai dados editáveis do orçamento (cliente, data, valores, etc.)",
          parameters: {
            type: "object",
            properties: {
              titulo: { type: "string" },
              empresa: { type: "string" },
              campos: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    chave: { type: "string" },
                    rotulo: { type: "string" },
                    tipo: { type: "string", enum: ["texto", "data", "valor", "numero", "longo"] },
                    valor_atual: { type: "string" },
                  },
                  required: ["chave", "rotulo", "tipo"],
                },
              },
              itens_servico: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    descricao: { type: "string" },
                    quantidade: { type: "number" },
                    valor_unitario: { type: "number" },
                  },
                },
              },
              condicoes: { type: "string" },
              observacoes: { type: "string" },
            },
            required: ["campos"],
          },
        },
      },
    ];
    const r = await callAI({
      messages: [
        {
          role: "system",
          content:
            "Você analisa orçamentos em PDF e identifica os campos que normalmente são editados a cada novo orçamento (nome do cliente, data, valor, prazo, descrição do serviço, etc.). Retorna estruturado em PT-BR.",
        },
        { role: "user", content: `Analise este orçamento e extraia os campos editáveis:\n\n${data.text}` },
      ],
      tools,
      tool_choice: { type: "function", function: { name: "extrair_campos" } },
    });
    const args = r.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("Não foi possível analisar o arquivo");
    return JSON.parse(args);
  });

// AI improvement suggestions
export const aiImprovements = createServerFn({ method: "POST" })
  .inputValidator((input: { modelo: unknown }) => input)
  .handler(async ({ data }) => {
    const tools = [
      {
        type: "function",
        function: {
          name: "sugerir_melhorias",
          parameters: {
            type: "object",
            properties: {
              melhorias: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    categoria: { type: "string", enum: ["informacao_faltante", "layout", "formato", "clareza", "profissionalismo"] },
                    titulo: { type: "string" },
                    descricao: { type: "string" },
                    sugestao_aplicar: { type: "string" },
                  },
                  required: ["categoria", "titulo", "descricao"],
                },
              },
            },
            required: ["melhorias"],
          },
        },
      },
    ];
    const r = await callAI({
      messages: [
        {
          role: "system",
          content:
            "Você é consultor de orçamentos comerciais. Sugira de 3 a 6 melhorias práticas e específicas para tornar o orçamento mais profissional, completo e claro. Em PT-BR.",
        },
        { role: "user", content: `Modelo atual:\n${JSON.stringify(data.modelo, null, 2)}` },
      ],
      tools,
      tool_choice: { type: "function", function: { name: "sugerir_melhorias" } },
    });
    const args = r.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("Sem sugestões");
    return JSON.parse(args);
  });
