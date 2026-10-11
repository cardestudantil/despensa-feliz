export type Categoria = "Alimentos" | "Limpeza" | "Higiene";

export interface ItemDespensa {
  id: string;
  nome: string;
  categoria: Categoria;
  quantidade: number;
  minimo: number;
}

export const CATEGORIAS: Categoria[] = ["Alimentos", "Limpeza", "Higiene"];

export const ITENS_INICIAIS: ItemDespensa[] = [
  { id: "pao", nome: "Pão", categoria: "Alimentos", quantidade: 2, minimo: 1 },
  { id: "leite", nome: "Leite", categoria: "Alimentos", quantidade: 2, minimo: 2 },
  { id: "cafe", nome: "Pó de Café", categoria: "Alimentos", quantidade: 1, minimo: 1 },
  { id: "margarina", nome: "Margarina", categoria: "Alimentos", quantidade: 2, minimo: 1 },
  { id: "acucar", nome: "Açúcar", categoria: "Alimentos", quantidade: 1, minimo: 1 },
  { id: "oleo", nome: "Óleo", categoria: "Alimentos", quantidade: 1, minimo: 1 },
  { id: "laranja", nome: "Laranja", categoria: "Alimentos", quantidade: 12, minimo: 6 },
  { id: "limao", nome: "Limão", categoria: "Alimentos", quantidade: 6, minimo: 4 },
  { id: "alho", nome: "Alho", categoria: "Alimentos", quantidade: 1, minimo: 1 },
  { id: "carne-moida", nome: "Carne Moída", categoria: "Alimentos", quantidade: 2, minimo: 1 },
  { id: "molho-tomate", nome: "Molho de Tomate", categoria: "Alimentos", quantidade: 2, minimo: 2 },
  { id: "detergente", nome: "Detergente", categoria: "Limpeza", quantidade: 3, minimo: 2 },
  { id: "sabao-po", nome: "Sabão em Pó", categoria: "Limpeza", quantidade: 1, minimo: 1 },
  { id: "sabonete", nome: "Sabonete", categoria: "Higiene", quantidade: 2, minimo: 2 },
  { id: "pilhas", nome: "Pilhas", categoria: "Higiene", quantidade: 4, minimo: 2 },
];

const STORAGE_KEY = "despensa-itens-v1";

export function carregarItens(): ItemDespensa[] {
  try {
    const bruto = window.localStorage.getItem(STORAGE_KEY);
    if (!bruto) return ITENS_INICIAIS;
    const itens = JSON.parse(bruto) as ItemDespensa[];
    if (!Array.isArray(itens)) return ITENS_INICIAIS;
    return itens;
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
