# Despensa Feliz

Crie um aplicativo em português de "Controle de Despensa e Compras" focado em idosos e seus familiares. O design deve ser limpo, com fontes grandes, botões fáceis de clicar e alta acessibilidade.

O aplicativo deve ter as seguintes funcionalidades:

1. Tela de Despensa (Estoque): Uma lista de produtos dividida por categorias (Alimentos, Limpeza, Higiene). Cada produto deve mostrar o nome, a "Quantidade Atual" e a "Quantidade Mínima".

2. Botões de Ajuste Rápido: Cada item na lista deve ter botões grandes de "+" e "-" para que meu pai possa atualizar facilmente a quantidade de itens que tem em casa.

3. Status Automático: Se a "Quantidade Atual" for menor ou igual à "Quantidade Mínima", o item deve exibir um alerta visual vermelho escrito "🚨 COMPRAR". Se estiver acima, exibe um selo verde "✅ OK".

4. Tela de Lista de Compras: Uma aba separada que junta automaticamente TODOS os produtos que estão com o status "COMPRAR", funcionando como uma lista de mercado automática.

5. Cadastro de Itens: Um formulário simples para adicionar novos produtos, definindo o nome, categoria e a quantidade mínima ideal.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4c75351b-ade4-4f17-a6ec-eb14d915fe6f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
