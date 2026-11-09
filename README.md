# Meu Time dos Sonhos

Sistema web para montar e organizar o time de futebol ideal do usuário: titulares, reservas e jogadores em observação.

Trabalho Prático Individual Evolutivo — Desenvolvimento de Interfaces Web (DIW) — PUC Minas.
Aluno: César Casagrande Lopes.

## Entidade principal

**Jogador**: nome, clube, posição, situação no time (titular, reserva ou observando), camisa, idade, nacionalidade, nota (0 a 10), escudo do clube e observação.

## API prevista

API pública da ESPN, para buscar os elencos reais das principais ligas e adicionar jogadores ao time.

## Etapa 1 — HTML e estrutura da interface

- estrutura HTML semântica (`header`, `nav`, `main`, `section`, `article`, `footer`)
- formulário de cadastro do jogador, com `input`, `select`, `textarea` e `button`
- listagem com dados de exemplo escritos no HTML
- pesquisa, filtros e ordenação previstos
- botões de detalhes, edição e exclusão previstos
- área de detalhes do jogador
- área prevista para a busca de elencos reais (API)

## Etapa 2 — CSS, layout e responsividade

- identidade visual com variáveis CSS (cores, raios, sombras e tipografia)
- layout principal com CSS Grid e componentes com Flexbox
- listagem em cards organizada com Grid (`auto-fill` + `minmax`)
- formulário, botões, etiquetas de situação e mensagens estilizados
- detalhes do jogador em uma janela sobreposta (abre com `:target`, só com CSS)
- estados de interação: `hover`, `focus-visible` e `active`
- responsividade com Media Queries (breakpoints em 960px e 600px)

## Estrutura

```
index.html
assets/
├── css/style.css
├── js/script.js
└── img/
```
