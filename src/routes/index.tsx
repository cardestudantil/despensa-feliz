import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  Package,
  ClipboardList,
  Pencil,
  Check,
  X,
} from "lucide-react";
import {
  CATEGORIAS,
  carregarItens,
  precisaComprar,
  salvarItens,
  type Categoria,
  type ItemDespensa,
} from "@/lib/pantry";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Despensa da Família — Controle de Despensa e Compras" },
      {
        name: "description",
        content:
          "Controle simples e acessível da despensa de casa: veja o que tem, o que está acabando e monte a lista de compras automaticamente.",
      },
      { property: "og:title", content: "Despensa da Família — Controle de Despensa e Compras" },
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

type Aba = "despensa" | "compras";

function PaginaDespensa() {
  const [itens, setItens] = useState<ItemDespensa[]>([]);
  const [aba, setAba] = useState<Aba>("despensa");
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    setItens(carregarItens());
    setCarregado(true);
  }, []);

  useEffect(() => {
    if (carregado) salvarItens(itens);
  }, [itens, carregado]);

  const alterarQuantidade = (id: string, delta: number) => {
    setItens((atual) =>
      atual.map((item) =>
        item.id === id
          ? { ...item, quantidade: Math.max(0, item.quantidade + delta) }
          : item,
      ),
    );
  };

  const removerItem = (id: string) => {
    setItens((atual) => atual.filter((item) => item.id !== id));
  };

  const editarItem = (id: string, nome: string, minimo: number) => {
    setItens((atual) =>
      atual.map((item) =>
        item.id === id ? { ...item, nome, minimo } : item,
      ),
    );
  };

  const adicionarItem = (nome: string, categoria: Categoria, minimo: number) => {
    setItens((atual) => [
      ...atual,
      {
        id: `item-${Date.now()}`,
        nome,
        categoria,
        quantidade: 0,
        minimo,
      },
    ]);
  };

  const listaCompras = useMemo(() => itens.filter(precisaComprar), [itens]);

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-5">
          <Package className="h-10 w-10 text-primary" aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
              Despensa da Família
            </h1>
            <p className="text-base text-muted-foreground">
              Controle o que tem em casa e o que precisa comprar
            </p>
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
            className={`flex min-h-14 items-center justify-center gap-2 rounded-xl text-lg font-semibold transition-colors ${
              aba === "despensa"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            <Package className="h-6 w-6" aria-hidden="true" />
            Despensa
          </button>
          <button
            type="button"
            onClick={() => setAba("compras")}
            aria-pressed={aba === "compras"}
            className={`relative flex min-h-14 items-center justify-center gap-2 rounded-xl text-lg font-semibold transition-colors ${
              aba === "compras"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            <ShoppingCart className="h-6 w-6" aria-hidden="true" />
            Compras
            {listaCompras.length > 0 && (
              <span
                className="ml-1 inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-destructive px-2 text-base font-bold text-destructive-foreground"
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
      <span className="inline-flex items-center rounded-lg bg-destructive px-3 py-1.5 text-base font-bold text-destructive-foreground">
        🚨 COMPRAR
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-lg bg-[oklch(0.55_0.15_150)] px-3 py-1.5 text-base font-bold text-white">
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
  onEditar: (id: string, nome: string, minimo: number) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(item.nome);
  const [minimo, setMinimo] = useState(String(item.minimo));
  const [erro, setErro] = useState("");
  const campoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editando) return;
    setNome(item.nome);
    setMinimo(String(item.minimo));
    setErro("");
    campoRef.current?.focus();
    campoRef.current?.select();
  }, [editando, item.nome, item.minimo]);

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
    onEditar(item.id, nomeLimpo, Math.max(0, minimoNum));
    setEditando(false);
  }

  return (
    <li
      className={`rounded-2xl border-2 p-4 shadow-sm ${
        precisaComprar(item)
          ? "border-destructive bg-card"
          : "border-border bg-card"
      }`}
    >
      {editando ? (
        <div>
          <label
            htmlFor={`editar-nome-${item.id}`}
            className="mb-1 block text-lg font-semibold text-foreground"
          >
            Nome do produto
          </label>
          <input
            id={`editar-nome-${item.id}`}
            ref={campoRef}
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                salvarNome();
              } else if (e.key === "Escape") {
                setEditando(false);
              }
            }}
            className="min-h-14 w-full rounded-xl border-2 border-input bg-background px-4 text-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {erro && (
            <p
              className="mt-1 text-base font-semibold text-destructive"
              role="alert"
            >
              {erro}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xl font-bold text-card-foreground">{item.nome}</h3>
          <SeloStatus item={item} />
        </div>
      )}

      <p className="mt-2 text-base text-muted-foreground">
        Quantidade mínima: <strong className="text-foreground">{item.minimo}</strong>
      </p>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => onAlterar(item.id, -1)}
          disabled={item.quantidade === 0}
          aria-label={`Diminuir quantidade de ${item.nome}`}
          className="flex h-16 w-16 items-center justify-center rounded-xl bg-secondary text-secondary-foreground transition-colors hover:bg-accent disabled:opacity-40"
        >
          <Minus className="h-8 w-8" aria-hidden="true" />
        </button>

        <div className="min-w-20 text-center" aria-live="polite">
          <span className="text-4xl font-bold tabular-nums text-foreground">
            {item.quantidade}
          </span>
          <span className="block text-sm text-muted-foreground">em casa</span>
        </div>

        <button
          type="button"
          onClick={() => onAlterar(item.id, 1)}
          aria-label={`Aumentar quantidade de ${item.nome}`}
          className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-8 w-8" aria-hidden="true" />
        </button>

        {!editando && (
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditando(true)}
              aria-label={`Editar nome de ${item.nome}`}
              className="flex h-12 w-12 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <Pencil className="h-6 w-6" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onRemover(item.id)}
              aria-label={`Remover ${item.nome} da despensa`}
              className="flex h-12 w-12 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {editando && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={salvarNome}
            className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-primary text-lg font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Check className="h-6 w-6" aria-hidden="true" />
            Salvar nome
          </button>
          <button
            type="button"
            onClick={() => setEditando(false)}
            className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-secondary text-lg font-bold text-secondary-foreground transition-colors hover:bg-accent"
          >
            <X className="h-6 w-6" aria-hidden="true" />
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
  onRenomear,
  onAdicionar,
}: {
  itens: ItemDespensa[];
  onAlterar: (id: string, delta: number) => void;
  onRemover: (id: string) => void;
  onRenomear: (id: string, nome: string) => void;
  onAdicionar: (nome: string, categoria: Categoria, minimo: number) => void;
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
              className="mb-3 border-b-2 border-border pb-2 text-2xl font-bold text-foreground"
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
                  onRenomear={onRenomear}
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
  onAdicionar: (nome: string, categoria: Categoria, minimo: number) => void;
}) {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("Alimentos");
  const [minimo, setMinimo] = useState("1");
  const [mensagem, setMensagem] = useState("");

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const nomeLimpo = nome.trim();
    const minimoNum = Math.max(0, parseInt(minimo, 10) || 0);
    if (!nomeLimpo) {
      setMensagem("Escreva o nome do produto.");
      return;
    }
    onAdicionar(nomeLimpo, categoria, minimoNum);
    setNome("");
    setMinimo("1");
    setMensagem(`"${nomeLimpo}" foi adicionado à despensa!`);
  };

  return (
    <section
      aria-labelledby="novo-item-titulo"
      className="rounded-2xl border-2 border-dashed border-border bg-card p-5"
    >
      <h2
        id="novo-item-titulo"
        className="flex items-center gap-2 text-2xl font-bold text-card-foreground"
      >
        <Plus className="h-7 w-7 text-primary" aria-hidden="true" />
        Adicionar novo produto
      </h2>

      <form onSubmit={enviar} className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="novo-nome"
            className="mb-1 block text-lg font-semibold text-foreground"
          >
            Nome do produto
          </label>
          <input
            id="novo-nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Arroz"
            className="min-h-14 w-full rounded-xl border-2 border-input bg-background px-4 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label
            htmlFor="nova-categoria"
            className="mb-1 block text-lg font-semibold text-foreground"
          >
            Categoria
          </label>
          <select
            id="nova-categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as Categoria)}
            className="min-h-14 w-full rounded-xl border-2 border-input bg-background px-4 text-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
            className="mb-1 block text-lg font-semibold text-foreground"
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
            className="min-h-14 w-full rounded-xl border-2 border-input bg-background px-4 text-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="mt-1 text-sm text-muted-foreground">
            Quando a quantidade em casa chegar nesse valor, o produto entra na
            lista de compras.
          </p>
        </div>

        <button
          type="submit"
          className="flex min-h-16 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xl font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-7 w-7" aria-hidden="true" />
          Adicionar produto
        </button>

        {mensagem && (
          <p className="text-center text-lg font-semibold text-foreground" role="status">
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
      <div className="rounded-2xl border-2 border-border bg-card p-8 text-center">
        <ClipboardList
          className="mx-auto h-16 w-16 text-muted-foreground"
          aria-hidden="true"
        />
        <h2 className="mt-4 text-2xl font-bold text-card-foreground">
          Tudo certo por aqui! 🎉
        </h2>
        <p className="mt-2 text-lg text-muted-foreground">
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
        className="mb-1 text-2xl font-bold text-foreground"
      >
        Lista de compras
      </h2>
      <p className="mb-4 text-lg text-muted-foreground">
        {itens.length === 1
          ? "1 produto para comprar"
          : `${itens.length} produtos para comprar`}
      </p>
      <ul className="space-y-3">
        {itens.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-2xl border-2 border-destructive bg-card p-4"
          >
            <div>
              <h3 className="text-xl font-bold text-card-foreground">
                {item.nome}
              </h3>
              <p className="text-base text-muted-foreground">
                {item.categoria} · em casa: {item.quantidade} · mínimo:{" "}
                {item.minimo}
              </p>
            </div>
            <ShoppingCart
              className="h-8 w-8 shrink-0 text-destructive"
              aria-hidden="true"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
