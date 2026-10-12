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

type Aba = "despensa" | "compras";

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

  const removerItem = (id: string) => {
    setItens((atual) => atual.filter((item) => item.id !== id));
  };

  const editarItem = (
    id: string,
    nome: string,
    minimo: number,
    unidade: Unidade,
    dataConferencia: string,
    dataUltimaCompra: string,
  ) => {
    setItens((atual) =>
      atual.map((item) =>
        item.id === id ? { ...item, nome, minimo, unidade, dataConferencia, dataUltimaCompra } : item,
      ),
    );
  };

  const adicionarItem = (
    nome: string,
    categoria: Categoria,
    minimo: number,
    unidade: Unidade,
    prioridade: Prioridade,
    dataConferencia: string,
    dataUltimaCompra: string,
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
        dataConferencia,
        dataUltimaCompra,
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
  prioridades,
  onDefinirPrioridade,
}: {
  item: ItemDespensa;
  onAlterar: (id: string, delta: number) => void;
  onRemover: (id: string) => void;
  onEditar: (id: string, nome: string, minimo: number, unidade: Unidade, dataConferencia: string, dataUltimaCompra: string) => void;
  prioridades: Prioridade[];
  onDefinirPrioridade: (id: string, prioridade: Prioridade) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(item.nome);
  const [minimo, setMinimo] = useState(String(item.minimo));
  const [unidade, setUnidade] = useState<Unidade>(item.unidade);
  const [dataConferencia, setDataConferencia] = useState(item.dataConferencia || "");
  const [dataUltimaCompra, setDataUltimaCompra] = useState(item.dataUltimaCompra || "");
  const [erro, setErro] = useState("");
  const campoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editando) return;
    setNome(item.nome);
    setMinimo(String(item.minimo));
    setUnidade(item.unidade);
    setDataConferencia(item.dataConferencia || "");
    setDataUltimaCompra(item.dataUltimaCompra || "");
    setErro("");
    campoRef.current?.focus();
    campoRef.current?.select();
  }, [editando, item.nome, item.minimo, item.unidade, item.dataConferencia, item.dataUltimaCompra]);

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
    onEditar(item.id, nomeLimpo, Math.max(0, minimoNum), unidade, dataConferencia, dataUltimaCompra);
    setEditando(false);
  }

  return (
    <li
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`editar-data-conferencia-${item.id}`} className="mb-1 block text-undefined font-semibold text-foreground">Data de conferência</label>
              <input id={`editar-data-conferencia-${item.id}`} type="date" value={dataConferencia} onChange={(e) => setDataConferencia(e.target.value)} className="min-h-12 w-full rounded-lg border border-input bg-background px-4 text-undefined text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label htmlFor={`editar-data-compra-${item.id}`} className="mb-1 block text-undefined font-semibold text-foreground">Data da última compra</label>
              <input id={`editar-data-compra-${item.id}`} type="date" value={dataUltimaCompra} onChange={(e) => setDataUltimaCompra(e.target.value)} className="min-h-12 w-full rounded-lg border border-input bg-background px-4 text-undefined text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
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
        <p className="mt-2 text-undefined text-muted-foreground">
          Quantidade mínima:{" "}
          <strong className="text-foreground">
            {item.minimo} {rotuloUnidade(item.unidade)}
          </strong>
        </p>
      )}
      {!editando && (item.dataConferencia || item.dataUltimaCompra) && (
        <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-muted-foreground sm:grid-cols-2">
          {item.dataConferencia && <p>Data de conferência: <strong className="text-foreground">{item.dataConferencia.split("-").reverse().join("/")}</strong></p>}
          {item.dataUltimaCompra && <p>Data da última compra: <strong className="text-foreground">{item.dataUltimaCompra.split("-").reverse().join("/")}</strong></p>}
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
  prioridades,
  onDefinirPrioridade,
}: {
  itens: ItemDespensa[];
  onAlterar: (id: string, delta: number) => void;
  onRemover: (id: string) => void;
  onEditar: (id: string, nome: string, minimo: number, unidade: Unidade, dataConferencia: string, dataUltimaCompra: string) => void;
  onAdicionar: (
    nome: string,
    categoria: Categoria,
    minimo: number,
    unidade: Unidade,
    prioridade: Prioridade,
    dataConferencia: string,
    dataUltimaCompra: string,
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
  ) => void;
  prioridades: Prioridade[];
}) {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("Alimentos");
  const [minimo, setMinimo] = useState("1");
  const [unidade, setUnidade] = useState<Unidade>("unidade");
  const [temPrioridade, setTemPrioridade] = useState(false);
  const [prioridadeNova, setPrioridadeNova] = useState<Prioridade>("normal");
  const [dataConferencia, setDataConferencia] = useState("");
  const [dataUltimaCompra, setDataUltimaCompra] = useState("");
  const [mensagem, setMensagem] = useState("");

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const nomeLimpo = nome.trim();
    const minimoNum = Math.max(0, parseInt(minimo, 10) || 0);
    if (!nomeLimpo) {
      setMensagem("Escreva o nome do produto.");
      return;
    }
    onAdicionar(nomeLimpo, categoria, minimoNum, unidade, temPrioridade ? prioridadeNova : "nenhuma", dataConferencia, dataUltimaCompra);
    setNome("");
    setMinimo("1");
    setDataConferencia("");
    setDataUltimaCompra("");
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="nova-data-conferencia" className="mb-1 block text-undefined font-semibold text-foreground">Data de conferência</label>
            <input id="nova-data-conferencia" type="date" value={dataConferencia} onChange={(e) => setDataConferencia(e.target.value)} className="min-h-12 w-full rounded-lg border border-input bg-background px-4 text-undefined text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label htmlFor="nova-data-compra" className="mb-1 block text-undefined font-semibold text-foreground">Data da última compra</label>
            <input id="nova-data-compra" type="date" value={dataUltimaCompra} onChange={(e) => setDataUltimaCompra(e.target.value)} className="min-h-12 w-full rounded-lg border border-input bg-background px-4 text-undefined text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
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
