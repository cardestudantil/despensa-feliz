import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  Package,
  ClipboardList,
  Flag,
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
  component: PaginaDespensa,
});

type Aba = "despensa" | "compras" | "prioridades";

function PaginaDespensa() {
  const [itens, setItens] = useState<ItemDespensa[]>([]);
  const [aba, setAba] = useState<Aba>("despensa");
  const [carregado, setCarregado] = useState(false);
  const [prioridades, setPrioridades] = useState<Prioridade[]>([]);

  useEffect(() => {
    setItens(carregarItens());
    setPrioridades(carregarPrioridades());
    setCarregado(true);
  }, []);

  useEffect(() => {
    if (carregado) salvarItens(itens);
  }, [itens, carregado]);

  useEffect(() => {
    if (carregado && prioridades.length > 0) salvarPrioridades(prioridades);
  }, [prioridades, carregado]);

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

  const adicionarPrioridade = (nome: string) => {
    const valor = nome.trim().toLocaleLowerCase("pt-BR").replace(/[^a-z0-9áéíóúãõâêôç]+/g, "-").replace(/^-|-$/g, "");
    if (!valor || prioridades.includes(valor)) return false;
    setPrioridades((atual) => [...atual, valor]);
    return true;
  };

  const removerPrioridade = (prioridade: Prioridade) => {
    if (prioridades.length <= 1) return;
    const substituta = prioridades.find((p) => p !== prioridade) || "normal";
    setItens((atual) => atual.map((item) => item.prioridade === prioridade ? { ...item, prioridade: substituta } : item));
    setPrioridades((atual) => atual.filter((p) => p !== prioridade));
  };

  const removerItem = (id: string) => {
    setItens((atual) => atual.filter((item) => item.id !== id));
  };

  const editarItem = (
    id: string,
    nome: string,
    minimo: number,
    unidade: Unidade,
  ) => {
    setItens((atual) =>
      atual.map((item) =>
        item.id === id ? { ...item, nome, minimo, unidade } : item,
      ),
    );
  };

  const adicionarItem = (
    nome: string,
    categoria: Categoria,
    minimo: number,
    unidade: Unidade,
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
        prioridade: "normal",
      },
    ]);
  };

  const listaCompras = useMemo(() => itens.filter(precisaComprar), [itens]);

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-5">
          <Package className="h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <h1 className="text-undefined font-bold leading-tight text-foreground sm:text-undefined">
              Despensa Pacatito
            </h1>
            <p className="text-undefined text-muted-foreground">
              Controle o que tem em casa e o que precisa comprar
            </p>
          </div>
        </div>
      </header>

      <nav
        className="sticky top-0 z-10 border-b border-border bg-background"
        aria-label="Seções do aplicativo"
      >
        <div className="mx-auto grid max-w-3xl grid-cols-3 gap-2 px-4 py-3">
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
          <button
            type="button"
            onClick={() => setAba("prioridades")}
            aria-pressed={aba === "prioridades"}
            className={`relative flex min-h-12 items-center justify-center gap-2 rounded-lg text-undefined font-semibold transition-colors ${
              aba === "prioridades"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            <Flag className="h-4 w-4" aria-hidden="true" />
            Prioridades
            {listaCompras.length > 0 && (
              <span
                className="ml-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground"
                aria-label={`${listaCompras.length} itens prioritários`}
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
          />
        ) : aba === "compras" ? (
          <ListaCompras itens={listaCompras} />
        ) : (
          <AreaPrioridades itens={itens} prioridades={prioridades} onAlterar={alterarQuantidade} onRemoverItem={removerItem} onDefinirPrioridade={definirPrioridade} onAdicionarPrioridade={adicionarPrioridade} onRemoverPrioridade={removerPrioridade} />
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
}: {
  item: ItemDespensa;
  onAlterar: (id: string, delta: number) => void;
  onRemover: (id: string) => void;
  onEditar: (id: string, nome: string, minimo: number, unidade: Unidade) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(item.nome);
  const [minimo, setMinimo] = useState(String(item.minimo));
  const [unidade, setUnidade] = useState<Unidade>(item.unidade);
  const [erro, setErro] = useState("");
  const campoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editando) return;
    setNome(item.nome);
    setMinimo(String(item.minimo));
    setUnidade(item.unidade);
    setErro("");
    campoRef.current?.focus();
    campoRef.current?.select();
  }, [editando, item.nome, item.minimo, item.unidade]);

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
    onEditar(item.id, nomeLimpo, Math.max(0, minimoNum), unidade);
    setEditando(false);
  }

  return (
    <li
      className={`rounded-lg border p-4 shadow-sm ${
        precisaComprar(item)
          ? "border-destructive bg-card"
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
          <h3 className="text-undefined font-bold text-card-foreground">{item.nome}</h3>
          <SeloStatus item={item} />
        </div>
      )}

      {!editando && (
        <p className="mt-2 text-undefined text-muted-foreground">
          Quantidade mínima:{" "}
          <strong className="text-foreground">
            {item.minimo} {rotuloUnidade(item.unidade)}
          </strong>
        </p>
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
}: {
  itens: ItemDespensa[];
  onAlterar: (id: string, delta: number) => void;
  onRemover: (id: string) => void;
  onEditar: (id: string, nome: string, minimo: number, unidade: Unidade) => void;
  onAdicionar: (
    nome: string,
    categoria: Categoria,
    minimo: number,
    unidade: Unidade,
  ) => void;
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
                />
              ))}
            </ul>
          </section>
        );
      })}

      <FormularioNovoItem onAdicionar={onAdicionar} />
    </div>
  );
}

function FormularioNovoItem({
  onAdicionar,
}: {
  onAdicionar: (
    nome: string,
    categoria: Categoria,
    minimo: number,
    unidade: Unidade,
  ) => void;
}) {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("Alimentos");
  const [minimo, setMinimo] = useState("1");
  const [unidade, setUnidade] = useState<Unidade>("unidade");
  const [mensagem, setMensagem] = useState("");

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const nomeLimpo = nome.trim();
    const minimoNum = Math.max(0, parseInt(minimo, 10) || 0);
    if (!nomeLimpo) {
      setMensagem("Escreva o nome do produto.");
      return;
    }
    onAdicionar(nomeLimpo, categoria, minimoNum, unidade);
    setNome("");
    setMinimo("1");
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

function AreaPrioridades({
  itens,
  prioridades,
  onAlterar,
  onRemoverItem,
  onDefinirPrioridade,
  onAdicionarPrioridade,
  onRemoverPrioridade,
}: {
  itens: ItemDespensa[];
  prioridades: Prioridade[];
  onAlterar: (id: string, delta: number) => void;
  onRemoverItem: (id: string) => void;
  onDefinirPrioridade: (id: string, prioridade: Prioridade) => void;
  onAdicionarPrioridade: (nome: string) => boolean;
  onRemoverPrioridade: (prioridade: Prioridade) => void;
}) {
  const [novaPrioridade, setNovaPrioridade] = useState("");
  const [mensagemPrioridade, setMensagemPrioridade] = useState("");
  const nomesPrioridades: Record<string, string> = { urgente: "Urgente", alta: "Alta", normal: "Normal", baixa: "Baixa" };
  const rotular = (prioridade: Prioridade) => nomesPrioridades[prioridade] || prioridade.replace(/-/g, " ").replace(/^./, (letra) => letra.toLocaleUpperCase("pt-BR"));
  const ordem = (prioridade: Prioridade) => prioridades.indexOf(prioridade);
  const ordenados = [...itens].sort((a, b) => ordem(a.prioridade) - ordem(b.prioridade) || a.nome.localeCompare(b.nome));
  const contagem = (prioridade: Prioridade) => itens.filter((item) => item.prioridade === prioridade).length;
  const criarPrioridade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaPrioridade.trim()) { setMensagemPrioridade("Digite o nome da prioridade."); return; }
    if (onAdicionarPrioridade(novaPrioridade)) { setMensagemPrioridade("Prioridade adicionada."); setNovaPrioridade(""); }
    else setMensagemPrioridade("Essa prioridade já existe ou o nome não é válido.");
  };

  return (
    <section aria-labelledby="prioridades-titulo" className="space-y-5">
      <div>
        <h2 id="prioridades-titulo" className="text-lg font-bold text-foreground">
          Editar prioridades
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha a prioridade de cada produto. Suas escolhas ficam salvas automaticamente.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {prioridades.map((prioridade) => (
          <div key={prioridade} className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">{rotular(prioridade)}</p>
            <p className={`mt-1 text-xl font-bold tabular-nums ${prioridade === "urgente" ? "text-destructive" : "text-foreground"}`}>
              {contagem(prioridade)}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-semibold text-card-foreground">Gerenciar prioridades</h3>
        <p className="mt-1 text-xs text-muted-foreground">Inclua nomes personalizados ou exclua os que não usa. Ao excluir, os produtos passam para a primeira prioridade restante.</p>
        <form onSubmit={criarPrioridade} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input value={novaPrioridade} onChange={(e) => setNovaPrioridade(e.target.value)} maxLength={30} placeholder="Ex.: Comprar esta semana" aria-label="Nome da nova prioridade" className="min-h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          <button type="submit" className="min-h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">Incluir prioridade</button>
        </form>
        {mensagemPrioridade && <p role="status" className="mt-2 text-xs text-muted-foreground">{mensagemPrioridade}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {prioridades.map((prioridade) => <div key={prioridade} className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm"><span>{rotular(prioridade)}</span><button type="button" onClick={() => onRemoverPrioridade(prioridade)} disabled={prioridades.length <= 1} aria-label={`Excluir prioridade ${rotular(prioridade)}`} title={`Excluir ${rotular(prioridade)}`} className="rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"><X className="h-3.5 w-3.5" aria-hidden="true" /></button></div>)}
        </div>
      </div>

      {ordenados.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <h3 className="mt-3 font-bold text-card-foreground">Sua despensa está vazia</h3>
          <p className="mt-1 text-sm text-muted-foreground">Adicione produtos na aba Despensa para definir suas prioridades.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {ordenados.map((item) => (
            <li key={item.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-card-foreground">{item.nome}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.categoria} · {item.quantidade} {rotuloUnidade(item.unidade)} em casa
                    {precisaComprar(item) ? " · precisa comprar" : ""}
                  </p>
                </div>
                <label className="min-w-32">
                  <span className="mb-1 block text-xs font-semibold text-muted-foreground">Prioridade</span>
                  <select
                    value={item.prioridade}
                    onChange={(e) => onDefinirPrioridade(item.id, e.target.value as Prioridade)}
                    aria-label={`Prioridade de ${item.nome}`}
                    className="min-h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {prioridades.map((prioridade) => <option key={prioridade} value={prioridade}>{rotular(prioridade)}</option>)}
                  </select>
                </label>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">
                  Mínimo: {item.minimo} {rotuloUnidade(item.unidade)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onAlterar(item.id, -1)}
                    disabled={item.quantidade === 0}
                    aria-label={`Diminuir quantidade de ${item.nome}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground disabled:opacity-40"
                  >
                    <Minus className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <span className="min-w-6 text-center text-sm font-semibold tabular-nums">{item.quantidade}</span>
                  <button
                    type="button"
                    onClick={() => onAlterar(item.id, 1)}
                    aria-label={`Aumentar quantidade de ${item.nome}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Excluir ${item.nome} da despensa?`)) onRemoverItem(item.id);
                    }}
                    aria-label={`Excluir ${item.nome} da despensa`}
                    title={`Excluir ${item.nome}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ListaCompras({ itens }: { itens: ItemDespensa[] }) {
  if (itens.length === 0) {
    return (
      <div className="rounded-lg border-border bg-card p-8 text-center">
        <ClipboardList
          className="mx-auto h-12 w-12 text-muted-foreground"
          aria-hidden="true"
        />
        <h2 className="mt-4 text-undefined font-bold text-card-foreground">
          Tudo certo por aqui! 🎉
        </h2>
        <p className="mt-2 text-undefined text-muted-foreground">
          Nenhum produto está acabando. Quando algo chegar na quantidade
          mínima, ele aparece aqui automaticamente.
        </p>
      </div>
    );
  }

  return (
    <section aria-labelledby="lista-compras-titulo">
      <h2
        id="lista-compras-titulo"
        className="mb-1 text-undefined font-bold text-foreground"
      >
        Lista de compras
      </h2>
      <p className="mb-4 text-undefined text-muted-foreground">
        {itens.length === 1
          ? "1 produto para comprar"
          : `${itens.length} produtos para comprar`}
      </p>
      <ul className="space-y-3">
        {itens.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-lg border-destructive bg-card p-4"
          >
            <div>
              <h3 className="text-undefined font-bold text-card-foreground">
                {item.nome}
              </h3>
              <p className="text-undefined text-muted-foreground">
                {item.categoria} · em casa: {item.quantidade}{" "}
                {rotuloUnidade(item.unidade)} · mínimo: {item.minimo}{" "}
                {rotuloUnidade(item.unidade)}
              </p>
            </div>
            <ShoppingCart
              className="h-5 w-5 shrink-0 text-destructive"
              aria-hidden="true"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
