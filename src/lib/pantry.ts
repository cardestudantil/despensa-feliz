export type Categoria = "Alimentos" | "Limpeza" | "Higiene";

export type Unidade = "unidade" | "kg";

export type Prioridade = string;

export const PRIORIDADES_INICIAIS: Prioridade[] = ["urgente", "alta", "normal", "baixa"];
const PRIORIDADES_STORAGE_KEY = "despensa-prioridades-v1";

export function carregarPrioridades(): Prioridade[] {
  try {
    const salvas = JSON.parse(window.localStorage.getItem(PRIORIDADES_STORAGE_KEY) || "null");
    if (Array.isArray(salvas) && salvas.length > 0 && salvas.every((p) => typeof p === "string")) return salvas;
  } catch { /* usa as prioridades padrão */ }
  return PRIORIDADES_INICIAIS;
}

export function salvarPrioridades(prioridades: Prioridade[]) {
  try { window.localStorage.setItem(PRIORIDADES_STORAGE_KEY, JSON.stringify(prioridades)); } catch { /* armazenamento indisponível */ }
}

export interface ItemDespensa {
  id: string;
  nome: string;
  categoria: Categoria;
  quantidade: number;
  minimo: number;
  unidade: Unidade;
  prioridade: Prioridade;
  dataCompra?: string;
  foto?: string;
  dataConferencia?: string;
  dataUltimaCompra?: string;
}

export const CATEGORIAS: Categoria[] = ["Alimentos", "Limpeza", "Higiene"];

export const UNIDADES: { valor: Unidade; rotulo: string }[] = [
  { valor: "unidade", rotulo: "Unidade" },
  { valor: "kg", rotulo: "Quilo (kg)" },
];

export function rotuloUnidade(unidade: Unidade): string {
  return unidade === "kg" ? "kg" : "un.";
}

const UNIDADES_VALIDAS: Unidade[] = ["unidade", "kg"];

export const ITENS_INICIAIS: ItemDespensa[] = [
  { id: "pao", nome: "Pão", categoria: "Alimentos", quantidade: 2, minimo: 1, unidade: "unidade", prioridade: "normal" },
  { id: "leite", nome: "Leite", categoria: "Alimentos", quantidade: 2, minimo: 2, unidade: "unidade", prioridade: "normal" },
  { id: "cafe", nome: "Pó de Café", categoria: "Alimentos", quantidade: 1, minimo: 1, unidade: "unidade", prioridade: "normal" },
  { id: "margarina", nome: "Margarina", categoria: "Alimentos", quantidade: 2, minimo: 1, unidade: "unidade", prioridade: "baixa" },
  { id: "acucar", nome: "Açúcar", categoria: "Alimentos", quantidade: 1, minimo: 1, unidade: "kg", prioridade: "normal" },
  { id: "oleo", nome: "Óleo", categoria: "Alimentos", quantidade: 1, minimo: 1, unidade: "unidade", prioridade: "normal" },
  { id: "laranja", nome: "Laranja", categoria: "Alimentos", quantidade: 12, minimo: 6, unidade: "kg", prioridade: "baixa" },
  { id: "limao", nome: "Limão", categoria: "Alimentos", quantidade: 6, minimo: 4, unidade: "kg", prioridade: "baixa" },
  { id: "alho", nome: "Alho", categoria: "Alimentos", quantidade: 1, minimo: 1, unidade: "unidade", prioridade: "normal" },
  { id: "carne-moida", nome: "Carne Moída", categoria: "Alimentos", quantidade: 2, minimo: 1, unidade: "kg", prioridade: "baixa" },
  { id: "molho-tomate", nome: "Molho de Tomate", categoria: "Alimentos", quantidade: 2, minimo: 2, unidade: "unidade", prioridade: "normal" },
  { id: "detergente", nome: "Detergente", categoria: "Limpeza", quantidade: 3, minimo: 2, unidade: "unidade", prioridade: "normal" },
  { id: "sabao-po", nome: "Sabão em Pó", categoria: "Limpeza", quantidade: 1, minimo: 1, unidade: "unidade", prioridade: "normal" },
  { id: "sabonete", nome: "Sabonete", categoria: "Higiene", quantidade: 2, minimo: 2, unidade: "unidade", prioridade: "normal" },
  { id: "pilhas", nome: "Pilhas", categoria: "Higiene", quantidade: 4, minimo: 2, unidade: "unidade", prioridade: "baixa" },
];

const STORAGE_KEY = "despensa-itens-v1";

export function carregarItens(): ItemDespensa[] {
  try {
    const bruto = window.localStorage.getItem(STORAGE_KEY);
    if (!bruto) return ITENS_INICIAIS;
    const itens = JSON.parse(bruto) as ItemDespensa[];
    if (!Array.isArray(itens)) return ITENS_INICIAIS;
    // Itens salvos antes de existir unidade: assume "unidade".
    let prioridadesPersonalizadas: string[] = [];
    try {
      const salvas = JSON.parse(window.localStorage.getItem(PRIORIDADES_STORAGE_KEY) || "null");
      if (Array.isArray(salvas)) prioridadesPersonalizadas = salvas.filter((p): p is string => typeof p === "string");
    } catch {
      prioridadesPersonalizadas = [];
    }
    return itens.map((item) => {
      const prioridadeSalva = typeof item.prioridade === "string" &&
        (item.prioridade === "nenhuma" ||
          ["urgente", "alta", "normal", "baixa"].includes(item.prioridade) ||
          prioridadesPersonalizadas.includes(item.prioridade));
      return {
        ...item,
        unidade: UNIDADES_VALIDAS.includes(item.unidade) ? item.unidade : "unidade",
        prioridade: prioridadeSalva
          ? item.prioridade
          : item.quantidade === 0
            ? "urgente"
            : item.quantidade < item.minimo
              ? "alta"
              : item.quantidade === item.minimo
                ? "normal"
                : "baixa",
      };
    });
  } catch {
    return ITENS_INICIAIS;
  }
}

export function salvarItens(itens: ItemDespensa[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
  } catch {
    // armazenamento indisponível — ignora
  }
}

export function calcularPrioridadeEstoque(
  item: Pick<ItemDespensa, "quantidade" | "minimo">,
): Prioridade {
  if (item.quantidade <= 0) return "urgente";
  if (item.quantidade < item.minimo) return "alta";
  if (item.quantidade === item.minimo) return "normal";
  return "baixa";
}

export function precisaComprar(item: ItemDespensa): boolean {
  return item.quantidade <= item.minimo;
}
