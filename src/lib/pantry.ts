export type Categoria = "Alimentos" | "Limpeza" | "Higiene";

export type Unidade = "unidade" | "kg";

export interface ItemDespensa {
  id: string;
  nome: string;
  categoria: Categoria;
  quantidade: number;
  minimo: number;
  unidade: Unidade;
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
  { id: "pao", nome: "Pão", categoria: "Alimentos", quantidade: 2, minimo: 1, unidade: "unidade" },
  { id: "leite", nome: "Leite", categoria: "Alimentos", quantidade: 2, minimo: 2, unidade: "unidade" },
  { id: "cafe", nome: "Pó de Café", categoria: "Alimentos", quantidade: 1, minimo: 1, unidade: "unidade" },
  { id: "margarina", nome: "Margarina", categoria: "Alimentos", quantidade: 2, minimo: 1, unidade: "unidade" },
  { id: "acucar", nome: "Açúcar", categoria: "Alimentos", quantidade: 1, minimo: 1, unidade: "kg" },
  { id: "oleo", nome: "Óleo", categoria: "Alimentos", quantidade: 1, minimo: 1, unidade: "unidade" },
  { id: "laranja", nome: "Laranja", categoria: "Alimentos", quantidade: 12, minimo: 6, unidade: "kg" },
  { id: "limao", nome: "Limão", categoria: "Alimentos", quantidade: 6, minimo: 4, unidade: "kg" },
  { id: "alho", nome: "Alho", categoria: "Alimentos", quantidade: 1, minimo: 1, unidade: "unidade" },
  { id: "carne-moida", nome: "Carne Moída", categoria: "Alimentos", quantidade: 2, minimo: 1, unidade: "kg" },
  { id: "molho-tomate", nome: "Molho de Tomate", categoria: "Alimentos", quantidade: 2, minimo: 2, unidade: "unidade" },
  { id: "detergente", nome: "Detergente", categoria: "Limpeza", quantidade: 3, minimo: 2, unidade: "unidade" },
  { id: "sabao-po", nome: "Sabão em Pó", categoria: "Limpeza", quantidade: 1, minimo: 1, unidade: "unidade" },
  { id: "sabonete", nome: "Sabonete", categoria: "Higiene", quantidade: 2, minimo: 2, unidade: "unidade" },
  { id: "pilhas", nome: "Pilhas", categoria: "Higiene", quantidade: 4, minimo: 2, unidade: "unidade" },
];

const STORAGE_KEY = "despensa-itens-v1";

export function carregarItens(): ItemDespensa[] {
  try {
    const bruto = window.localStorage.getItem(STORAGE_KEY);
    if (!bruto) return ITENS_INICIAIS;
    const itens = JSON.parse(bruto) as ItemDespensa[];
    if (!Array.isArray(itens)) return ITENS_INICIAIS;
    // Itens salvos antes de existir unidade: assume "unidade".
    return itens.map((item) => ({
      ...item,
      unidade: UNIDADES_VALIDAS.includes(item.unidade) ? item.unidade : "unidade",
    }));
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

export function precisaComprar(item: ItemDespensa): boolean {
  return item.quantidade <= item.minimo;
}
