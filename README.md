# Meu Time dos Sonhos

Sistema web para montar e organizar o time de futebol ideal do usuário: titulares, reservas e jogadores em observação, usando elencos reais das principais ligas.

Trabalho Prático Individual Evolutivo — Desenvolvimento de Interfaces Web (DIW) — PUC Minas.
Aluno: César Casagrande Lopes.

## Entidade principal

**Jogador**: nome, clube, posição (goleiro, defensor, meio-campista ou atacante), situação no time (titular, reserva ou observando), camisa, idade, nacionalidade, nota (0 a 10), escudo do clube e observação.

## Funcionalidades

- **Cadastrar** jogadores, com validação dos campos e mensagens de feedback
  - regra do futebol: o time aceita no máximo **11 titulares**
- **Listar** os jogadores dinamicamente, em cards criados com JavaScript
- **Ver detalhes** de um jogador
- **Editar** e **excluir** jogadores (a exclusão pede confirmação)
- **Pesquisar** por nome ou clube
- **Filtrar** por posição e por situação no time
- **Ordenar** por data de cadastro, nome, nota ou idade
- **Escalação no campo**: os titulares aparecem desenhados em um campo de futebol, separados por linha (goleiro, defesa, meio e ataque), com a formação tática calculada automaticamente (ex.: 4-3-3). Clicar em um jogador abre os detalhes
- **Formação tática**: o usuário escolhe a formação (4-3-3, 4-4-2, 3-5-2, 5-3-2 ou 4-5-1) e o sistema mostra quantos titulares faltam ou sobram em cada posição. A escolha fica salva no localStorage
- **Estatísticas do time**: total de jogadores, titulares, nota média, idade média, jogadores por posição e nacionalidades mais comuns
- **Comparar jogadores**: tabela lado a lado com dois jogadores do time, destacando a maior nota
- **Persistência com localStorage**: o time continua salvo depois de recarregar a página
- **Integração com a API pública da ESPN**:
  1. o usuário escolhe uma liga e o sistema busca os times dela (1ª requisição);
  2. escolhe um time e o sistema busca o elenco atual (2ª requisição);
  3. pode filtrar o elenco por nome e posição;
  4. clica em "Adicionar" e o formulário recebe nome, clube, posição, camisa, idade, nacionalidade e escudo;
  5. escolhe se o jogador será titular, reserva ou observado e cadastra. O jogador vai para o localStorage.

  Com a liga escolhida, a página também mostra a **tabela de classificação** (destacando os clubes que têm jogadores no time do usuário) e os **próximos jogos** do time escolhido.

## Desafios para 2 pessoas (`pages/desafios.html`)

Usam jogadores reais de uma liga (de um time escolhido ou de vários times sorteados), em times de 5 x 5 ou 11 x 11:

- **Escolha às cegas**: em cada rodada aparece um jogador e outro fica escondido. A pessoa tem um tempo (1 a 10 segundos) para ficar com o que está vendo ou arriscar no escondido. Se o tempo acaba, fica com o que estava aberto. Cada pessoa pode pular 2 vezes. As pessoas alternam até completar os times.
- **Leilão**: cada pessoa começa com um orçamento (padrão de R$ 100 milhões). Os jogadores vão a leilão aberto, com lance mínimo de R$ 1 milhão; quem der o maior lance leva. Também é possível pular um jogador.

No fim, as duas pessoas escolhem qual time ficou melhor.

```
Dados externos   → API da ESPN (ligas, times e elencos)
Dados do sistema → localStorage (o time do usuário)
```

## Tecnologias

- HTML semântico (`header`, `nav`, `main`, `section`, `article`, `footer`, formulários)
- CSS com variáveis, Flexbox, CSS Grid e Media Queries (breakpoints em 960px e 600px)
- JavaScript: arrays, objetos, funções, DOM, eventos, delegação de eventos, `fetch` com `async/await`

## Estrutura

```
index.html
pages/
└── desafios.html
assets/
├── css/style.css
├── js/
│   ├── script.js
│   └── desafios.js
└── img/
    ├── logo.svg
    └── sem-escudo.svg
```

## API utilizada

API pública da ESPN (sem chave):

- Times de uma liga: `GET https://site.api.espn.com/apis/v2/sports/soccer/{liga}/standings`
- Elenco de um time: `GET https://site.api.espn.com/apis/site/v2/sports/soccer/{liga}/teams/{idTime}/roster`
- Próximos jogos de um time: `GET https://site.api.espn.com/apis/site/v2/sports/soccer/{liga}/teams/{idTime}/schedule?fixture=true`

Ligas disponíveis: Brasileirão (`bra.1`), Premier League (`eng.1`), La Liga (`esp.1`), Serie A (`ita.1`), Bundesliga (`ger.1`) e Ligue 1 (`fra.1`).
