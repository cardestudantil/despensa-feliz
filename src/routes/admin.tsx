import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck, RefreshCw, Users, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  component: PaginaAdmin,
});

const EMAIL_ADMIN = "beraldosjc@yahoo.com.br";

type RegistroDespensa = {
  user_id: string;
  itens: unknown;
  prioridades: unknown;
  datas: unknown;
  updated_at: string;
};

function PaginaAdmin() {
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  const [registros, setRegistros] = useState<RegistroDespensa[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const carregarRegistros = async () => {
    setCarregando(true);
    setErro("");
    const { data, error } = await supabase
      .from("despensa")
      .select("user_id, itens, prioridades, datas, updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      setErro("Não foi possível carregar os dados. Confirme se a configuração administrativa foi aplicada no Supabase.");
      setRegistros([]);
    } else {
      setRegistros((data ?? []) as RegistroDespensa[]);
    }
    setCarregando(false);
  };

  useEffect(() => {
    let ativo = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!ativo) return;
      const emailAtual = data.user?.email?.toLowerCase() ?? null;
      setEmail(emailAtual);
      if (emailAtual === EMAIL_ADMIN) void carregarRegistros();
    });
    return () => { ativo = false; };
  }, []);

  if (email === undefined) {
    return <div className="flex min-h-dvh items-center justify-center bg-background text-lg text-muted-foreground">Verificando acesso administrativo…</div>;
  }

  if (!email) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-4 text-foreground">
        <section className="w-full max-w-lg space-y-4 rounded-2xl border border-border bg-card p-6">
          <ShieldCheck className="h-10 w-10 text-primary" />
          <h1 className="text-2xl font-bold">Área administrativa</h1>
          <p>Entre primeiro na sua conta do Despensa Pacatito e depois abra esta página novamente.</p>
          <Link to="/" className="inline-flex min-h-12 items-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground">Ir para entrar</Link>
        </section>
      </main>
    );
  }

  if (email !== EMAIL_ADMIN) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-4 text-foreground">
        <section className="w-full max-w-lg space-y-4 rounded-2xl border border-border bg-card p-6">
          <ShieldCheck className="h-10 w-10 text-destructive" />
          <h1 className="text-2xl font-bold">Acesso não autorizado</h1>
          <p>Esta área é exclusiva do administrador do Despensa Pacatito.</p>
          <Link to="/" className="inline-flex min-h-12 items-center rounded-lg bg-secondary px-4 font-semibold text-secondary-foreground">Voltar ao aplicativo</Link>
        </section>
      </main>
    );
  }

  const totalItens = registros.reduce((total, registro) => {
    return total + (Array.isArray(registro.itens) ? registro.itens.length : 0);
  }, 0);

  return (
    <main className="min-h-dvh bg-background px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-9 w-9 text-primary" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Acesso exclusivo</p>
              <h1 className="text-2xl font-bold sm:text-3xl">Administração</h1>
              <p className="text-sm text-muted-foreground">Despensa Pacatito</p>
            </div>
          </div>
          <Link to="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-secondary px-4 font-semibold text-secondary-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar ao aplicativo
          </Link>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 text-muted-foreground"><Users className="h-5 w-5" /> Contas com despensa</div>
            <p className="mt-2 text-3xl font-bold">{registros.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 text-muted-foreground"><Package className="h-5 w-5" /> Itens registrados</div>
            <p className="mt-2 text-3xl font-bold">{totalItens}</p>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Dados das despensas</h2>
              <p className="text-sm text-muted-foreground">A lista mostra o identificador da conta e os itens salvos na despensa.</p>
            </div>
            <button type="button" onClick={() => void carregarRegistros()} disabled={carregando} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${carregando ? "animate-spin" : ""}`} /> Atualizar
            </button>
          </div>

          {erro && <p role="alert" className="rounded-lg border border-destructive/40 p-3 text-sm text-destructive">{erro}</p>}
          {carregando && <p className="text-muted-foreground">Carregando dados…</p>}
          {!carregando && !erro && registros.length === 0 && <p className="rounded-lg bg-secondary p-4">Ainda não há despensas cadastradas ou o Supabase não liberou a consulta administrativa.</p>}

          <div className="space-y-3">
            {registros.map((registro) => {
              const itens = Array.isArray(registro.itens) ? registro.itens as Array<Record<string, unknown>> : [];
              return (
                <details key={registro.user_id} className="rounded-lg border border-border p-4">
                  <summary className="cursor-pointer font-semibold">
                    Conta: {registro.user_id.slice(0, 8)}… — {itens.length} item(ns)
                  </summary>
                  <p className="mt-2 break-all text-xs text-muted-foreground">ID completo: {registro.user_id}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Última atualização: {new Date(registro.updated_at).toLocaleString("pt-BR")}</p>
                  {itens.length === 0 ? <p className="mt-3 text-sm">Nenhum item registrado.</p> : (
                    <ul className="mt-3 space-y-2">
                      {itens.map((item, index) => (
                        <li key={String(item.id ?? index)} className="flex flex-wrap justify-between gap-2 border-t border-border pt-2 text-sm">
                          <span>{String(item.nome ?? "Item sem nome")} <span className="text-muted-foreground">({String(item.categoria ?? "Sem categoria")})</span></span>
                          <span className="font-semibold">{String(item.quantidade ?? 0)} {String(item.unidade ?? "unidade")} · mínimo {String(item.minimo ?? 0)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </details>
              );
            })}
          </div>
        </section>
        <p className="text-xs text-muted-foreground">Administrador conectado: {email}. O acesso aos dados depende também das permissões configuradas no Supabase.</p>
      </div>
    </main>
  );
}
