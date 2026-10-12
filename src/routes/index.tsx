import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  Package,
  ClipboardList,
  GripVertical,
  Pencil,
  Check,
  X,
} from "lucide-react";
import {
  CATEGORIAS,
  carregarItens,
  carregarPrioridades,
  precisaComprar,
  rotuloUnidade,
  salvarItens,
  salvarPrioridades,
  UNIDADES,
  type Categoria,
  type ItemDespensa,
  type Prioridade,
  type Unidade,
} from "@/lib/pantry";
import { supabase } from "@/integrations/supabase/client";
import { buscarDespensa, normalizar, salvarDespensa, serializar, type DadosDespensa } from "@/lib/sync";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Despensa Pacatito — Controle de Despensa e Compras" },
      {
        name: "description",
        content:
          "Controle simples e acessível da despensa de casa: veja o que tem, o que está acabando e monte a lista de compras automaticamente.",
      },
      { property: "og:title", content: "Despensa Pacatito — Controle de Despensa e Compras" },
      {
        property: "og:description",
        content:
          "Controle simples e acessível da despensa de casa: veja o que tem, o que está acabando e monte a lista de compras automaticamente.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppComLogin,
});

type Aba = "despensa" | "compras";

const BANNER_PADRAO = "https://i.imgur.com/ihOcMO0.jpeg";

function AppComLogin() {
  const [sessao, setSessao] = useState<{ id: string; email: string } | null | undefined>(undefined);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) =>
      setSessao(data.user ? { id: data.user.id, email: data.user.email ?? "" } : null),
    );
    const { data } = supabase.auth.onAuthStateChange((evento, s) => {
      if (evento !== "SIGNED_IN" && evento !== "SIGNED_OUT" && evento !== "USER_UPDATED") return;
      setSessao(s?.user ? { id: s.user.id, email: s.user.email ?? "" } : null);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  if (sessao === undefined) {
    return <div className="flex min-h-dvh items-center justify-center bg-background text-lg text-muted-foreground">Carregando…</div>;
  }
  if (!sessao) return <TelaLogin />;
  return <PaginaDespensa usuarioId={sessao.id} email={sessao.email} />;
}

function TelaLogin() {
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(""); setMsg(""); setEnviando(true);
    if (modo === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) setErro("E-mail ou senha incorretos (ou e-mail ainda não confirmado).");
    } else {
      const { error } = await supabase.auth.signUp({ email, password: senha, options: { emailRedirectTo: window.location.origin } });
      if (error) setErro(error.message.includes("Password") ? "A senha precisa ter pelo menos 6 caracteres." : "Não foi possível criar a conta. Verifique o e-mail.");
      else setMsg("Conta criada! Abra o e-mail que enviamos e clique no link de confirmação. Depois volte e entre.");
    }
    setEnviando(false);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <form onSubmit={enviar} className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <Package className="h-7 w-7 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-foreground">Despensa Pacatito</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          {modo === "entrar" ? "Entre com a conta da família para ver a despensa em todos os aparelhos." : "Crie a conta da família (faça isso só uma vez)."}
        </p>
        <div>
          <label htmlFor="login-email" className="mb-1 block text-lg font-semibold text-foreground">E-mail</label>
          <input id="login-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="min-h-14 w-full rounded-lg border border-input bg-background px-4 text-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label htmlFor="login-senha" className="mb-1 block text-lg font-semibold text-foreground">Senha</label>
          <input id="login-senha" type="password" required minLength={6} autoComplete={modo === "entrar" ? "current-password" : "new-password"} value={senha} onChange={(e) => setSenha(e.target.value)} className="min-h-14 w-full rounded-lg border border-input bg-background px-4 text-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        {erro && <p role="alert" className="text-base font-semibold text-destructive">{erro}</p>}
        {msg && <p role="status" className="text-base font-semibold text-primary">{msg}</p>}
        <button type="submit" disabled={enviando} className="min-h-14 w-full rounded-lg bg-primary text-lg font-bold text-primary-foreground disabled:opacity-60">
          {enviando ? "Aguarde…" : modo === "entrar" ? "Entrar" : "Criar conta"}
        </button>
        <button type="button" onClick={() => { setModo(modo === "entrar" ? "criar" : "entrar"); setErro(""); setMsg(""); }} className="min-h-12 w-full rounded-lg bg-secondary text-base font-semibold text-secondary-foreground">
          {modo === "entrar" ? "Primeira vez? Criar conta da família" : "Já tenho conta: entrar"}
        </button>
      </form>
    </div>
  );
}

export function PaginaDespensa({ usuarioId, email }: { usuarioId?: string; email?: string } = {}) {
  const [itens, setItens] = useState<ItemDespensa[]>([]);
  const [aba, setAba] = useState<Aba>("despensa");
  const [carregado, setCarregado] = useState(false);
  const [prioridades, setPrioridades] = useState<Prioridade[]>([]);
  const [dataConferencia, setDataConferencia] = useState("");
  const [dataUltimaCompra, setDataUltimaCompra] = useState("");
  const datasRef = useRef({ dataConferencia: "", dataUltimaCompra: "" });
  const [banner, setBanner] = useState("");
  const [erroBanner, setErroBanner] = useState("");
  const campoBannerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setItens(carregarItens());
    setPrioridades(carregarPrioridades());
    try {
      setBanner(window.localStorage.getItem("despensa-banner-v2") || BANNER_PADRAO);
    } catch { /* inicia sem banner se o armazenamento estiver indisponível */ }
    try {
      const datasSalvas = JSON.parse(window.localStorage.getItem("despensa-datas-gerais-v1") || "{}");
      datasRef.current = {
        dataConferencia: typeof datasSalvas?.dataConferencia === "string" ? datasSalvas.dataConferencia : "",
        dataUltimaCompra: typeof datasSalvas?.dataUltimaCompra === "string" ? datasSalvas.dataUltimaCompra : "",
      };
      setDataConferencia(datasRef.current.dataConferencia);
      setDataUltimaCompra(datasRef.current.dataUltimaCompra);
    } catch { /* inicia sem datas se o armazenamento estiver indisponível */ }
    setCarregado(true);
  }, []);

  const atualizarDataGeral = (campo: "dataConferencia" | "dataUltimaCompra", valor: string) => {
    const novasDatas = {
      ...datasRef.current,
      [campo]: valor,
    };
    datasRef.current = novasDatas;
    if (campo === "dataConferencia") setDataConferencia(valor);
    else setDataUltimaCompra(valor);
    try {
      window.localStorage.setItem("despensa-datas-gerais-v1", JSON.stringify(novasDatas));
    } catch { /* mantém a alteração na tela se o armazenamento estiver indisponível */ }
  };

  useEffect(() => {
    if (carregado) salvarItens(itens);
  }, [itens, carregado]);

  useEffect(() => {
    if (carregado && prioridades.length > 0) salvarPrioridades(prioridades);
  }, [prioridades, carregado]);

  // ---- Sincronização online entre aparelhos ----
  const [sincronizado, setSincronizado] = useState(false);
  const [statusSync, setStatusSync] = useState("");
  const ultimoConhecido = useRef("");

  const aplicarRemoto = (d: DadosDespensa) => {
    ultimoConhecido.current = serializar(d);
    setItens(d.itens);
    if (d.prioridades.length > 0) setPrioridades(d.prioridades);
    datasRef.current = { ...d.datas };
    setDataConferencia(d.datas.dataConferencia);
    setDataUltimaCompra(d.datas.dataUltimaCompra);
    try { window.localStorage.setItem("despensa-datas-gerais-v1", JSON.stringify(d.datas)); } catch { /* ignora */ }
  };

  useEffect(() => {
    if (!carregado || !usuarioId) return;
    let ativo = true;
    (async () => {
      try {
        const remoto = await buscarDespensa(usuarioId);
        if (!ativo) return;
        if (remoto && remoto.itens.length > 0) {
          aplicarRemoto(remoto);
        } else {
          // Primeira vez: envia os dados que já estão neste aparelho, sem apagar nada.
          const locais: DadosDespensa = { itens, prioridades, datas: { ...datasRef.current } };
          await salvarDespensa(usuarioId, locais);
          ultimoConhecido.current = serializar(locais);
        }
        setSincronizado(true);
        setStatusSync("");
      } catch {
        setStatusSync("Sem conexão: as mudanças ficam salvas neste aparelho.");
      }
    })();
    const canal = supabase
      .channel(`despensa-${usuarioId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "despensa", filter: `user_id=eq.${usuarioId}` },
        (payload) => {
          const linha = payload.new as { itens: unknown; prioridades: unknown; datas: unknown } | undefined;
          if (!linha || !("itens" in linha)) return;
          const d = normalizar(linha);
          if (serializar(d) === ultimoConhecido.current) return;
          aplicarRemoto(d);
        },
      )
      .subscribe();
    return () => {
      ativo = false;
      supabase.removeChannel(canal);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregado, usuarioId]);

  useEffect(() => {
    if (!sincronizado || !usuarioId) return;
    const atual: DadosDespensa = { itens, prioridades, datas: { dataConferencia, dataUltimaCompra } };
    const texto = serializar(atual);
    if (texto === ultimoConhecido.current) return;
    const t = setTimeout(() => {
      ultimoConhecido.current = texto;
      salvarDespensa(usuarioId, atual)
        .then(() => setStatusSync(""))
        .catch(() => {
          ultimoConhecido.current = "";
          setStatusSync("Não foi possível sincronizar agora. Tentaremos de novo na próxima mudança.");
        });
    }, 500);
    return () => clearTimeout(t);
  }, [itens, prioridades, dataConferencia, dataUltimaCompra, sincronizado, usuarioId]);

  const alterarQuantidade = (id: string, delta: number) => {
    setItens((atual) =>
      atual.map((item) =>
        item.id === id
          ? { ...item, quantidade: Math.max(0, item.quantidade + delta) }
          : item,
      ),
    );
  };

  const definirPrioridade = (id: string, prioridade: Prioridade) => {
    setItens((atual) => atual.map((item) => item.id === id ? { ...item, prioridade } : item));
  };

  const removerItem = (id: string) => {
    setItens((atual) => atual.filter((item) => item.id !== id));
  };

  const reordenarItem = (idOrigem: string, idDestino: string) => {
    if (idOrigem === idDestino) return;
    setItens((atual) => {
      const origem = atual.find((item) => item.id === idOrigem);
      const destino = atual.find((item) => item.id === idDestino);
      if (!origem || !destino || origem.categoria !== destino.categoria) return atual;

      const daCategoria = atual.filter((item) => item.categoria === origem.categoria);
      const indiceOrigem = daCategoria.findIndex((item) => item.id === idOrigem);
      const indiceDestino = daCategoria.findIndex((item) => item.id === idDestino);
      if (indiceOrigem < 0 || indiceDestino < 0) return atual;

      const reorganizados = [...daCategoria];
      const [movido] = reorganizados.splice(indiceOrigem, 1);
      if (!movido) return atual;
      reorganizados.splice(indiceDestino, 0, movido);
      let indice = 0;
      return atual.map((item) =>
        item.categoria === origem.categoria ? (reorganizados[indice++] ?? item) : item,
      );
    });
  };

  const editarItem = (id: string, nome: string, minimo: number, unidade: Unidade, dataCompra: string) => {
    setItens((atual) =>
      atual.map((item) =>
        item.id === id ? { ...item, nome, minimo, unidade, dataCompra } : item,
      ),
    );
  };

  const adicionarItem = (
    nome: string,
    categoria: Categoria,
    minimo: number,
    unidade: Unidade,
    prioridade: Prioridade,
    dataCompra: string,
  ) => {
    setItens((atual) => [
      ...atual,
      {
        id: `item-${Date.now()}`,
        nome,
        categoria,
        quantidade: 0,
        minimo,
        unidade,
        prioridade,
        dataCompra,
      },
    ]);
  };

  const escolherBanner = (arquivo?: File) => {
    setErroBanner("");
    if (!arquivo) return;
    if (!arquivo.type.startsWith("image/")) {
      setErroBanner("Escolha um arquivo de imagem.");
      return;
    }
    if (arquivo.size > 1.5 * 1024 * 1024) {
      setErroBanner("A imagem deve ter no máximo 1,5 MB.");
      return;
    }
    const leitor = new FileReader();
    leitor.onload = () => {
      const imagem = typeof leitor.result === "string" ? leitor.result : "";
      try {
        window.localStorage.setItem("despensa-banner-v2", imagem);
        setBanner(imagem);
      } catch {
        setErroBanner("Não foi possível salvar essa imagem. Escolha uma imagem menor.");
      }
    };
    leitor.onerror = () => setErroBanner("Não foi possível abrir essa imagem. Tente outro arquivo.");
    leitor.readAsDataURL(arquivo);
  };

  const removerBanner = () => {
    try { window.localStorage.removeItem("despensa-banner-v2"); } catch { /* armazenamento indisponível */ }
    setBanner(BANNER_PADRAO);
    setErroBanner("");
    if (campoBannerRef.current) campoBannerRef.current.value = "";
  };

  const listaCompras = useMemo(() => itens.filter(precisaComprar), [itens]);

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-5">
          <Package className="h-5 w-5 text-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h1 className="text-undefined font-bold leading-tight text-foreground sm:text-undefined">
              Despensa Pacatito
            </h1>
            <p className="text-undefined text-muted-foreground">
              Controle o que tem em casa e o que precisa comprar.
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-4">
          <div className="overflow-hidden rounded-xl border border-dashed border-border bg-background">
            {banner ? (
              <img src={banner} alt="Banner do Despensa Pacatito" className="block max-h-56 w-full object-cover" />
            ) : (
              <div className="flex min-h-24 flex-col items-center justify-center gap-1 px-4 py-5 text-center text-muted-foreground">
                <Package className="h-6 w-6" aria-hidden="true" />
                <p className="text-sm font-semibold">Banner do Despensa Pacatito</p>
                <p className="text-xs">Sua imagem padrão está sendo carregada</p>
              </div>
            )}

          </div>
        </div>
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-3 px-4 pb-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-background p-3">
            <label htmlFor="data-conferencia-geral" className="mb-1 block text-sm font-semibold text-foreground">Data de conferência do estoque</label>
            <input id="data-conferencia-geral" type="date" value={dataConferencia} onChange={(e) => atualizarDataGeral("dataConferencia", e.target.value)} className="min-h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <label htmlFor="data-ultima-compra-geral" className="mb-1 block text-sm font-semibold text-foreground">Data da última compra</label>
            <input id="data-ultima-compra-geral" type="date" value={dataUltimaCompra} onChange={(e) => atualizarDataGeral("dataUltimaCompra", e.target.value)} className="min-h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>
      </header>

      <nav
        className="sticky top-0 z-10 border-b border-border bg-background"
        aria-label="Seções do aplicativo"
      >
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-2 px-4 py-3">
          <button
            type="button"
            onClick={() => setAba("despensa")}
            aria-pressed={aba === "despensa"}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-lg text-undefined font-semibold transition-colors ${
              aba === "despensa"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            <Package className="h-5 w-5" aria-hidden="true" />
            Despensa
          </button>
          <button
            type="button"
            onClick={() => setAba("compras")}
            aria-pressed={aba === "compras"}
            className={`relative flex min-h-12 items-center justify-center gap-2 rounded-lg text-undefined font-semibold transition-colors ${
              aba === "compras"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            Compras
            {listaCompras.length > 0 && (
              <span
                className="ml-1 inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-destructive px-2 text-undefined font-bold text-destructive-foreground"
                aria-label={`${listaCompras.length} itens para comprar`}
              >
                {listaCompras.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        {aba === "despensa" ? (
          <Despensa
            itens={itens}
            onAlterar={alterarQuantidade}
            onRemover={removerItem}
            onEditar={editarItem}
            onAdicionar={adicionarItem}
            onReordenar={reordenarItem}
            prioridades={prioridades}
            onDefinirPrioridade={definirPrioridade}
          />
        ) : (
          <ListaCompras itens={listaCompras} />
        )}
      </main>
    </div>
  );
}

function SeloStatus({ item }: { item: ItemDespensa }) {
  if (precisaComprar(item)) {
    return (
      <span className="inline-flex items-center rounded-lg bg-destructive px-3 py-1.5 text-undefined font-bold text-destructive-foreground">
        🚨 COMPRAR
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-lg bg-[oklch(0.55_0.15_150)] px-3 py-1.5 text-undefined font-bold text-white">
      ✅ OK
    </span>
  );
}

function CartaoItem({
  item,
  onAlterar,
  onRemover,
  onEditar,
  onReordenar,
  prioridades,
  onDefinirPrioridade,
}: {
  item: ItemDespensa;
  onAlterar: (id: string, delta: number) => void;
  onRemover: (id: string) => void;
  onEditar: (id: string, nome: string, minimo: number, unidade: Unidade, dataCompra: string) => void;
  onReordenar: (idOrigem: string, idDestino: string) => void;
  prioridades: Prioridade[];
  onDefinirPrioridade: (id: string, prioridade: Prioridade) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(item.nome);
  const [minimo, setMinimo] = useState(String(item.minimo));
  const [unidade, setUnidade] = useState<Unidade>(item.unidade);
  const [dataCompra, setDataCompra] = useState(item.dataCompra || "");
  const [erro, setErro] = useState("");
  const campoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editando) return;
    setNome(item.nome);
    setMinimo(String(item.minimo));
    setUnidade(item.unidade);
    setDataCompra(item.dataCompra || "");
    setErro("");
    campoRef.current?.focus();
    campoRef.current?.select();
  }, [editando, item.nome, item.minimo, item.unidade, item.dataCompra]);

  const ajustarMinimo = (delta: number) => {
    setMinimo((atual) =>
      String(Math.max(0, (parseInt(atual, 10) || 0) + delta)),
    );
  };

  const aoTeclar = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      salvarEdicao();
    } else if (e.key === "Escape") {
      setEditando(false);
    }
  };

  function salvarEdicao() {
    const nomeLimpo = nome.trim();
    const minimoNum = parseInt(minimo, 10);
    if (!nomeLimpo) {
      setErro("Escreva o novo nome do produto.");
      return;
    }
    if (minimo.trim() === "" || Number.isNaN(minimoNum)) {
      setErro("Informe a quantidade mínima ideal.");
      return;
    }
    onEditar(item.id, nomeLimpo, Math.max(0, minimoNum), unidade, dataCompra);
    setEditando(false);
  }

  return (
    <li
      draggable={!editando}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", item.id);
      }}
      onDragOver={(e) => {
        if (!editando) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        const idOrigem = e.dataTransfer.getData("text/plain");
        if (idOrigem) onReordenar(idOrigem, item.id);
      }}
      className={`rounded-xl border-2 p-4 shadow-sm transition-colors ${
        item.prioridade === "alta"
          ? "border-red-500 bg-red-50 dark:bg-red-950/40"
          : item.prioridade === "urgente"
            ? "border-orange-500 bg-orange-50 dark:bg-orange-950/40"
            : item.prioridade === "normal"
              ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30"
              : item.prioridade === "baixa"
                ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
                : "border-border bg-card"
      }`}
    >
      {editando ? (
        <div className="space-y-4">
          <div>
            <label
              htmlFor={`editar-nome-${item.id}`}
              className="mb-1 block text-undefined font-semibold text-foreground"
            >
              Nome do produto
            </label>
            <input
              id={`editar-nome-${item.id}`}
              ref={campoRef}
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={aoTeclar}
              className="min-h-12 w-full rounded-lg border border-input bg-background px-4 text-undefined text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label
              htmlFor={`editar-data-compra-${item.id}`}
              className="mb-1 block text-undefined font-semibold text-foreground"
            >
              Data da compra
            </label>
            <input
              id={`editar-data-compra-${item.id}`}
              type="date"
              value={dataCompra}
              onChange={(e) => setDataCompra(e.target.value)}
              onKeyDown={aoTeclar}
              className="min-h-12 w-full rounded-lg border border-input bg-background px-4 text-undefined text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label
              htmlFor={`editar-prioridade-${item.id}`}
              className="mb-1 block text-undefined font-semibold text-foreground"
            >
              Prioridade do produto
            </label>
            <select
              id={`editar-prioridade-${item.id}`}
              value={item.prioridade}
              onChange={(e) => onDefinirPrioridade(item.id, e.target.value as Prioridade)}
              className="min-h-12 w-full rounded-lg border border-input bg-background px-4 text-undefined text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="nenhuma">Sem prioridade</option>
              {prioridades.map((prioridade) => (
                <option key={prioridade} value={prioridade}>
                  {prioridade.charAt(0).toLocaleUpperCase("pt-BR") + prioridade.slice(1).replace(/-/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={`editar-minimo-${item.id}`}
              className="mb-1 block text-undefined font-semibold text-foreground"
            >
              Quantidade mínima ideal
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => ajustarMinimo(-1)}
                disabled={(parseInt(minimo, 10) || 0) <= 0}
                aria-label={`Diminuir quantidade mínima de ${item.nome}`}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground transition-colors hover:bg-accent disabled:opacity-40"
              >
                <Minus className="h-5 w-5" aria-hidden="true" />
              </button>
              <input
                id={`editar-minimo-${item.id}`}
                type="number"
                min={0}
                inputMode="numeric"
                value={minimo}
                onChange={(e) => setMinimo(e.target.value)}
                onKeyDown={aoTeclar}
                className="min-h-12 w-24 rounded-lg border border-input bg-background px-3 text-center text-undefined font-bold tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => ajustarMinimo(1)}
                aria-label={`Aumentar quantidade mínima de ${item.nome}`}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-1 text-undefined text-muted-foreground">
              Quando a quantidade em casa chegar nesse valor, o produto entra na
              lista de compras.
            </p>
          </div>

          <div>
            <span
              id={`editar-unidade-${item.id}`}
              className="mb-1 block text-undefined font-semibold text-foreground"
            >
              Unidade
            </span>
            <div
              role="group"
              aria-labelledby={`editar-unidade-${item.id}`}
              className="grid grid-cols-2 gap-3"
            >
              {UNIDADES.map((u) => (
                <button
                  key={u.valor}
                  type="button"
                  onClick={() => setUnidade(u.valor)}
                  aria-pressed={unidade === u.valor}
                  className={`flex min-h-12 items-center justify-center rounded-lg text-undefined font-semibold transition-colors ${
                    unidade === u.valor
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {u.rotulo}
                </button>
              ))}
            </div>
            <p className="mt-1 text-undefined text-muted-foreground">
              Escolha se o produto é contado por unidade ou pesado em
              quilogramas (kg).
            </p>
          </div>

          {erro && (
            <p className="text-undefined font-semibold text-destructive" role="alert">
              {erro}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <GripVertical className="h-4 w-4" aria-hidden="true" />
              <span>Arraste para reorganizar</span>
            </div>
            <h3 className="text-undefined font-bold text-card-foreground">{item.nome}</h3>
            <span className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${item.prioridade === "nenhuma" ? "bg-secondary text-secondary-foreground" : item.prioridade === "alta" ? "bg-red-600 text-white" : item.prioridade === "urgente" ? "bg-orange-600 text-white" : item.prioridade === "normal" ? "bg-blue-600 text-white" : item.prioridade === "baixa" ? "bg-emerald-600 text-white" : "bg-violet-600 text-white"}`}>
              {item.prioridade === "nenhuma" ? "Sem prioridade" : `Prioridade: ${{ urgente: "Urgente", alta: "Alta", normal: "Normal", baixa: "Baixa" }[item.prioridade] || item.prioridade.replace(/-/g, " ").replace(/^./, (letra) => letra.toLocaleUpperCase("pt-BR"))}`}
            </span>
            <label className="mt-2 block max-w-56">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">Alterar prioridade</span>
              <select
                value={item.prioridade}
                onChange={(e) => onDefinirPrioridade(item.id, e.target.value as Prioridade)}
                aria-label={`Alterar prioridade de ${item.nome}`}
                className="min-h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="nenhuma">Sem prioridade</option>
                {prioridades.map((prioridade) => (
                  <option key={prioridade} value={prioridade}>
                    {prioridade.charAt(0).toLocaleUpperCase("pt-BR") + prioridade.slice(1).replace(/-/g, " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <SeloStatus item={item} />
        </div>
      )}

      {!editando && (
        <div className="mt-2 space-y-1 text-undefined text-muted-foreground">
          <p>
            Quantidade mínima:{" "}
            <strong className="text-foreground">
              {item.minimo} {rotuloUnidade(item.unidade)}
            </strong>
          </p>
          <p>
            Data da compra:{" "}
            <strong className="text-foreground">
              {item.dataCompra ? new Date(`${item.dataCompra}T12:00:00`).toLocaleDateString("pt-BR") : "Não informada"}
            </strong>
          </p>
        </div>
      )}
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => onAlterar(item.id, -1)}
          disabled={item.quantidade === 0}
          aria-label={`Diminuir quantidade de ${item.nome}`}
          className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-secondary-foreground transition-colors hover:bg-accent disabled:opacity-40"
        >
          <Minus className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="min-w-20 text-center" aria-live="polite">
          <span className="text-undefined font-bold tabular-nums text-foreground">
            {item.quantidade}
          </span>
          <span className="text-undefined font-semibold text-muted-foreground">
            {" "}
            {rotuloUnidade(item.unidade)}
          </span>
          <span className="block text-undefined text-muted-foreground">em casa</span>
        </div>

        <button
          type="button"
          onClick={() => onAlterar(item.id, 1)}
          aria-label={`Aumentar quantidade de ${item.nome}`}
          className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
        </button>

        {!editando && (
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditando(true)}
              aria-label={`Editar ${item.nome}: nome e quantidade mínima`}
              className="flex h-12 w-12 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <Pencil className="h-5 w-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onRemover(item.id)}
              aria-label={`Remover ${item.nome} da despensa`}
              className="flex h-12 w-12 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {editando && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={salvarEdicao}
            className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary text-undefined font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Check className="h-5 w-5" aria-hidden="true" />
            Salvar
          </button>
          <button
            type="button"
            onClick={() => setEditando(false)}
            className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-secondary text-undefined font-bold text-secondary-foreground transition-colors hover:bg-accent"
          >
            <X className="h-5 w-5" aria-hidden="true" />
            Cancelar
          </button>
        </div>
      )}
    </li>
  );
}

function Despensa({
  itens,
  onAlterar,
  onRemover,
  onEditar,
  onAdicionar,
  onReordenar,
  prioridades,
  onDefinirPrioridade,
}: {
  itens: ItemDespensa[];
  onAlterar: (id: string, delta: number) => void;
  onRemover: (id: string) => void;
  onEditar: (id: string, nome: string, minimo: number, unidade: Unidade, dataCompra: string) => void;
  onReordenar: (idOrigem: string, idDestino: string) => void;
  onAdicionar: (
    nome: string,
    categoria: Categoria,
    minimo: number,
    unidade: Unidade,
    prioridade: Prioridade,
    dataCompra: string,
  ) => void;
  prioridades: Prioridade[];
  onDefinirPrioridade: (id: string, prioridade: Prioridade) => void;
}) {
  return (
    <div className="space-y-8">
      {CATEGORIAS.map((categoria) => {
        const daCategoria = itens.filter((i) => i.categoria === categoria);
        if (daCategoria.length === 0) return null;
        return (
          <section key={categoria} aria-labelledby={`cat-${categoria}`}>
            <h2
              id={`cat-${categoria}`}
              className="mb-3 border-b-2 border-border pb-2 text-undefined font-bold text-foreground"
            >
              {categoria}
            </h2>
            <ul className="space-y-4">
              {daCategoria.map((item) => (
                <CartaoItem
                  key={item.id}
                  item={item}
                  onAlterar={onAlterar}
                  onRemover={onRemover}
                  onEditar={onEditar}
                  onReordenar={onReordenar}
                  prioridades={prioridades}
                  onDefinirPrioridade={onDefinirPrioridade}
                />
              ))}
            </ul>
          </section>
        );
      })}

      <FormularioNovoItem onAdicionar={onAdicionar} prioridades={prioridades} />
    </div>
  );
}

function FormularioNovoItem({
  onAdicionar,
  prioridades,
}: {
  onAdicionar: (
    nome: string,
    categoria: Categoria,
    minimo: number,
    unidade: Unidade,
    prioridade: Prioridade,
    dataCompra: string,
  ) => void;
  prioridades: Prioridade[];
}) {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("Alimentos");
  const [minimo, setMinimo] = useState("1");
  const [unidade, setUnidade] = useState<Unidade>("unidade");
  const [temPrioridade, setTemPrioridade] = useState(false);
  const [prioridadeNova, setPrioridadeNova] = useState<Prioridade>("normal");
  const [dataCompra, setDataCompra] = useState("");
  const [mensagem, setMensagem] = useState("");

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const nomeLimpo = nome.trim();
    const minimoNum = Math.max(0, parseInt(minimo, 10) || 0);
    if (!nomeLimpo) {
      setMensagem("Escreva o nome do produto.");
      return;
    }
    onAdicionar(nomeLimpo, categoria, minimoNum, unidade, temPrioridade ? prioridadeNova : "nenhuma", dataCompra);
    setNome("");
    setMinimo("1");
    setDataCompra("");
    setMensagem(`"${nomeLimpo}" foi adicionado à despensa!`);
  };

  return (
    <section
      aria-labelledby="novo-item-titulo"
      className="rounded-lg border-dashed border-border bg-card p-5"
    >
      <h2
        id="novo-item-titulo"
        className="flex items-center gap-2 text-undefined font-bold text-card-foreground"
      >
        <Plus className="h-5 w-5 text-primary" aria-hidden="true" />
        Adicionar novo produto
      </h2>

      <form onSubmit={enviar} className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="novo-nome"
            className="mb-1 block text-undefined font-semibold text-foreground"
          >
            Nome do produto
          </label>
          <input
            id="novo-nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Arroz"
            className="min-h-12 w-full rounded-lg border border-input bg-background px-4 text-undefined text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label
            htmlFor="nova-categoria"
            className="mb-1 block text-undefined font-semibold text-foreground"
          >
            Categoria
          </label>
          <select
            id="nova-categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as Categoria)}
            className="min-h-12 w-full rounded-lg border border-input bg-background px-4 text-undefined text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="nova-data-compra"
            className="mb-1 block text-undefined font-semibold text-foreground"
          >
            Data da compra
          </label>
          <input
            id="nova-data-compra"
            type="date"
            value={dataCompra}
            onChange={(e) => setDataCompra(e.target.value)}
            className="min-h-12 w-full rounded-lg border border-input bg-background px-4 text-undefined text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label
            htmlFor="novo-minimo"
            className="mb-1 block text-undefined font-semibold text-foreground"
          >
            Quantidade mínima ideal
          </label>
          <input
            id="novo-minimo"
            type="number"
            min={0}
            inputMode="numeric"
            value={minimo}
            onChange={(e) => setMinimo(e.target.value)}
            className="min-h-12 w-full rounded-lg border border-input bg-background px-4 text-undefined text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="mt-1 text-undefined text-muted-foreground">
            Quando a quantidade em casa chegar nesse valor, o produto entra na
            lista de compras.
          </p>
        </div>

        <div>
          <span
            id="nova-unidade"
            className="mb-1 block text-undefined font-semibold text-foreground"
          >
            Unidade
          </span>
          <div
            role="group"
            aria-labelledby="nova-unidade"
            className="grid grid-cols-2 gap-3"
          >
            {UNIDADES.map((u) => (
              <button
                key={u.valor}
                type="button"
                onClick={() => setUnidade(u.valor)}
                aria-pressed={unidade === u.valor}
                className={`flex min-h-12 items-center justify-center rounded-lg text-undefined font-semibold transition-colors ${
                  unidade === u.valor
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {u.rotulo}
              </button>
            ))}
          </div>
          <p className="mt-1 text-undefined text-muted-foreground">
            Escolha se o produto é contado por unidade ou pesado em quilogramas
            (kg).
          </p>
        </div>

        <div className="rounded-lg border border-border p-4">
          <label className="flex min-h-10 cursor-pointer items-center gap-3 font-semibold text-foreground">
            <input type="checkbox" checked={temPrioridade} onChange={(e) => setTemPrioridade(e.target.checked)} className="h-5 w-5 accent-primary" />
            Este produto é prioridade
          </label>
          {temPrioridade && (
            <div className="mt-3">
              <label htmlFor="nova-prioridade-produto" className="mb-1 block text-undefined font-semibold text-foreground">Qual é a prioridade?</label>
              <select id="nova-prioridade-produto" value={prioridadeNova} onChange={(e) => setPrioridadeNova(e.target.value)} className="min-h-12 w-full rounded-lg border border-input bg-background px-4 text-undefined text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                {prioridades.map((p) => <option key={p} value={p}>{({ urgente: "Urgente", alta: "Alta", normal: "Normal", baixa: "Baixa" } as Record<string, string>)[p] || p.replace(/-/g, " ")}</option>)}
              </select>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-undefined font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          Adicionar produto
        </button>

        {mensagem && (
          <p className="text-center text-undefined font-semibold text-foreground" role="status">
            {mensagem}
          </p>
        )}
      </form>
    </section>
  );
}

function ListaCompras({ itens }: { itens: ItemDespensa[] }) {
  if (itens.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <ClipboardList
          className="mx-auto h-12 w-12 text-muted-foreground"
          aria-hidden="true"
        />
        <h2 className="mt-4 text-undefined font-bold text-card-foreground">
          Sua despensa está vazia
        </h2>
        <p className="mt-2 text-undefined text-muted-foreground">
          Cadastre produtos na aba Despensa para ver aqui o estoque e a quantidade necessária para as compras.
        </p>
      </div>
    );
  }

  const itensOrdenados = [...itens].sort((a, b) => {
    const precisaA = precisaComprar(a);
    const precisaB = precisaComprar(b);
    if (precisaA !== precisaB) return precisaA ? -1 : 1;
    return a.nome.localeCompare(b.nome, "pt-BR");
  });

  const quantidadePrecisando = itens.filter(precisaComprar).length;

  return (
    <section aria-labelledby="lista-compras-titulo">
      <h2
        id="lista-compras-titulo"
        className="mb-1 text-undefined font-bold text-foreground"
      >
        Estoque e necessidades de compra
      </h2>
      <p className="mb-4 text-undefined text-muted-foreground">
        Todos os produtos cadastrados, com a quantidade em casa, o mínimo ideal e quanto falta para atingir esse mínimo.
      </p>
      <div className="mb-4 rounded-lg border border-border bg-card p-3 text-sm text-foreground">
        <strong>{quantidadePrecisando}</strong> de {itens.length} produtos estão no mínimo ou abaixo dele.
      </div>
      <ul className="space-y-3">
        {itensOrdenados.map((item) => {
          const falta = Math.max(0, item.minimo - item.quantidade);
          const noLimite = item.quantidade === item.minimo;
          const abaixoDoMinimo = item.quantidade < item.minimo;
          const precisaAtencao = precisaComprar(item);

          return (
            <li
              key={item.id}
              className={`rounded-xl border-2 bg-card p-4 ${abaixoDoMinimo ? "border-destructive" : noLimite ? "border-orange-400" : "border-border"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-undefined font-bold text-card-foreground">
                    {item.nome}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.categoria}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${abaixoDoMinimo ? "bg-destructive text-destructive-foreground" : noLimite ? "bg-orange-500 text-white" : "bg-emerald-600 text-white"}`}>
                  {abaixoDoMinimo ? "ABAIXO DO MÍNIMO" : noLimite ? "NO LIMITE MÍNIMO" : "ESTOQUE SUFICIENTE"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-background p-3">
                  <span className="block text-xs text-muted-foreground">Em casa</span>
                  <strong className="text-lg text-foreground">{item.quantidade} {rotuloUnidade(item.unidade)}</strong>
                </div>
                <div className="rounded-lg bg-background p-3">
                  <span className="block text-xs text-muted-foreground">Mínimo ideal</span>
                  <strong className="text-lg text-foreground">{item.minimo} {rotuloUnidade(item.unidade)}</strong>
                </div>
              </div>
              <div className={`mt-3 rounded-lg p-3 ${precisaAtencao ? "bg-destructive/10" : "bg-emerald-600/10"}`}>
                <p className="text-sm font-semibold text-foreground">
                  {falta > 0
                    ? `Comprar ${falta} ${rotuloUnidade(item.unidade)} para atingir o mínimo`
                    : noLimite
                      ? "Está no mínimo ideal: confira se deseja repor na próxima compra."
                      : "Não precisa comprar para atingir o mínimo atual."}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
