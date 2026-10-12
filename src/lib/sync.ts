import { supabase } from "@/integrations/supabase/client";
import type { ItemDespensa, Prioridade } from "@/lib/pantry";

export interface DadosDespensa {
  itens: ItemDespensa[];
  prioridades: Prioridade[];
  datas: { dataConferencia: string; dataUltimaCompra: string };
}

export function serializar(d: DadosDespensa): string {
  return JSON.stringify([d.itens, d.prioridades, d.datas]);
}

export function normalizar(linha: { itens: unknown; prioridades: unknown; datas: unknown }): DadosDespensa {
  const datas = (linha.datas ?? {}) as Record<string, unknown>;
  return {
    itens: Array.isArray(linha.itens) ? (linha.itens as ItemDespensa[]) : [],
    prioridades: Array.isArray(linha.prioridades) ? (linha.prioridades as Prioridade[]) : [],
    datas: {
      dataConferencia: typeof datas["dataConferencia"] === "string" ? datas["dataConferencia"] : "",
      dataUltimaCompra: typeof datas["dataUltimaCompra"] === "string" ? datas["dataUltimaCompra"] : "",
    },
  };
}

export async function buscarDespensa(userId: string): Promise<DadosDespensa | null> {
  const { data, error } = await supabase.from("despensa").select("itens, prioridades, datas").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data ? normalizar(data) : null;
}

export async function salvarDespensa(userId: string, d: DadosDespensa) {
  const { error } = await supabase.from("despensa").upsert({
    user_id: userId,
    itens: d.itens as never,
    prioridades: d.prioridades as never,
    datas: d.datas as never,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
