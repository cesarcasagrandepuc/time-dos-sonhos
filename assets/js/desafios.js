/* =====================================================
   Meu Time dos Sonhos — Desafios para 2 pessoas
   Modos: Escolha às cegas e Leilão
   ===================================================== */

const URL_API = "https://site.api.espn.com/apis";

// Quantidade de times sorteados quando a pessoa não escolhe um time
const TIMES_SORTEADOS = 4;

const POSICOES_API = {
    "Goalkeeper": "Goleiro",
    "Defender": "Defensor",
    "Midfielder": "Meio-campista",
    "Forward": "Atacante"
};

// Posição de cada vaga do time em cada formato
const FORMATOS = {
    "5x5": ["Goleiro", "Defensor", "Defensor", "Meio-campista", "Atacante"],
    "11x11": [
        "Goleiro",
        "Defensor", "Defensor", "Defensor", "Defensor",
        "Meio-campista", "Meio-campista", "Meio-campista",
        "Atacante", "Atacante", "Atacante"
    ]
};

// Estado do desafio em andamento (null quando não há desafio)
let jogo = null;

// Controle do cronômetro da escolha às cegas
let cronometro = null;

// Times da liga escolhida (para o seletor e para o sorteio)
let timesDaLiga = [];

// ---------- Elementos da página ----------

const formDesafio = document.querySelector("#form-desafio");
const campoPessoa1 = document.querySelector("#pessoa-1");
const campoPessoa2 = document.querySelector("#pessoa-2");
const seletorLiga = document.querySelector("#liga-desafio");
const seletorTime = document.querySelector("#time-desafio");
const seletorFormato = document.querySelector("#formato");
const seletorTempo = document.querySelector("#tempo");
const campoTempo = document.querySelector("#campo-tempo");
const campoOrcamento = document.querySelector("#orcamento");
const blocoOrcamento = document.querySelector("#campo-orcamento");
const statusDesafio = document.querySelector("#status-desafio");
const botaoComecar = document.querySelector("#btn-comecar");

const secaoJogo = document.querySelector("#jogo");
const tituloJogo = document.querySelector("#titulo-jogo");
const areaJogo = document.querySelector("#area-jogo");
const secaoPlacar = document.querySelector("#placar");
const secaoHistorico = document.querySelector("#secao-historico");
const listaHistorico = document.querySelector("#historico");

/* =====================================================
   Funções auxiliares
   ===================================================== */

function criarElemento(tag, classe, texto) {

    const elemento = document.createElement(tag);

    if (classe) {
        elemento.className = classe;
    }

    if (texto !== undefined) {
        elemento.textContent = texto;
    }

    return elemento;
}

function criarBotao(texto, classe, acao) {

    const botao = criarElemento("button", `botao ${classe}`, texto);

    botao.type = "button";
    botao.dataset.acao = acao;

    return botao;
}

// Número inteiro aleatório de 0 até (quantidade - 1)
function sortearIndice(quantidade) {
    return Math.floor(Math.random() * quantidade);
}

function modoEscolhido() {
    return formDesafio.querySelector("input[name='modo']:checked").value;
}

function registrarHistorico(texto) {

    // O mais recente aparece primeiro
    listaHistorico.prepend(criarElemento("li", "", texto));

    secaoHistorico.hidden = false;
}

// Ex.: "Atacante · Flamengo · 25 anos"
function descreverAtleta(atleta) {

    let texto = `${atleta.posicao} · ${atleta.clube}`;

    if (atleta.idade !== null) {
        texto = `${texto} · ${atleta.idade} anos`;
    }

    return texto;
}

/* =====================================================
   API da ESPN
   ===================================================== */

async function buscarTimes(liga) {

    const resposta = await fetch(`${URL_API}/v2/sports/soccer/${liga}/standings`);

    const dados = await resposta.json();

    const times = dados.children[0].standings.entries.map(entrada => {
        return {
            id: entrada.team.id,
            nome: entrada.team.displayName
        };
    });

    return times.sort((a, b) => a.nome.localeCompare(b.nome));
}

async function buscarElenco(liga, time) {

    const resposta = await fetch(`${URL_API}/site/v2/sports/soccer/${liga}/teams/${time.id}/roster`);

    const dados = await resposta.json();

    const atletas = dados.athletes.map(atleta => {

        let posicao = "";

        if (atleta.position && POSICOES_API[atleta.position.name]) {
            posicao = POSICOES_API[atleta.position.name];
        }

        let idade = null;

        if (atleta.age) {
            idade = atleta.age;
        }

        return {
            nome: atleta.displayName,
            posicao,
            idade,
            clube: time.nome
        };
    });

    // Só usa atletas com posição conhecida
    return atletas.filter(atleta => atleta.posicao !== "");
}

// Monta o "banco" de jogadores do desafio: um time escolhido ou vários sorteados
async function montarBanco(liga, idTime, times) {

    const banco = [];

    if (idTime !== "") {
        const time = times.find(item => item.id === idTime);
        const elenco = await buscarElenco(liga, time);
        banco.push(...elenco);
        return banco;
    }

    // Sorteia alguns times da liga sem repetir
    const disponiveis = times.map(time => time);

    for (let i = 0; i < TIMES_SORTEADOS && disponiveis.length > 0; i++) {

        const indice = sortearIndice(disponiveis.length);
        const time = disponiveis.splice(indice, 1)[0];

        statusDesafio.textContent = `Carregando elenco do ${time.nome}...`;

        const elenco = await buscarElenco(liga, time);
        banco.push(...elenco);
    }

    return banco;
}

// Tira um jogador aleatório do banco (da posição pedida, se houver)
function sortearDoBanco(posicao) {

    let candidatos = jogo.banco.filter(atleta => atleta.posicao === posicao);

    // Se acabaram os jogadores da posição, vale qualquer um
    if (candidatos.length === 0) {
        candidatos = jogo.banco;
    }

    if (candidatos.length === 0) {
        return null;
    }

    const escolhido = candidatos[sortearIndice(candidatos.length)];

    const indice = jogo.banco.findIndex(atleta => atleta === escolhido);
    jogo.banco.splice(indice, 1);

    return escolhido;
}

/* =====================================================
   Placar (times de cada pessoa)
   ===================================================== */

function renderizarPlacar() {

    [0, 1].forEach(pessoa => {

        const numero = pessoa + 1;
        const time = jogo.times[pessoa];

        document.querySelector(`#placar-nome-${numero}`).textContent = jogo.nomes[pessoa];

        let info = `${time.length} de ${jogo.vagas.length} jogadores`;

        if (jogo.modo === "leilao") {
            info = `${info} · saldo R$ ${jogo.saldos[pessoa]} mi`;
        }

        document.querySelector(`#placar-info-${numero}`).textContent = info;

        const lista = document.querySelector(`#placar-lista-${numero}`);
        lista.textContent = "";

        time.forEach(atleta => {

            let texto = `${atleta.nome} (${atleta.posicao})`;

            if (atleta.preco !== undefined) {
                texto = `${texto} · R$ ${atleta.preco} mi`;
            }

            lista.append(criarElemento("li", "", texto));
        });
    });

    secaoPlacar.hidden = false;
}

/* =====================================================
   Modo 1: Escolha às cegas
   ===================================================== */

function pessoaDaVezCegas() {
    // As pessoas alternam: rodada 0 = pessoa 1, rodada 1 = pessoa 2...
    return jogo.rodada % 2;
}

function iniciarRodadaCegas() {

    const totalRodadas = jogo.vagas.length * 2;

    if (jogo.rodada >= totalRodadas) {
        finalizarDesafio();
        return;
    }

    const vaga = Math.floor(jogo.rodada / 2);
    const posicao = jogo.vagas[vaga];

    jogo.aberto = sortearDoBanco(posicao);
    jogo.escondido = sortearDoBanco(posicao);

    if (!jogo.aberto || !jogo.escondido) {
        registrarHistorico("Acabaram os jogadores disponíveis.");
        finalizarDesafio();
        return;
    }

    renderizarRodadaCegas(posicao);
    iniciarCronometro();
}

function criarCartaAtleta(atleta, escondido) {

    const carta = criarElemento("div", "carta");

    if (escondido) {
        carta.classList.add("carta--escondida");
        carta.append(
            criarElemento("span", "carta__interrogacao", "?"),
            criarElemento("span", "carta__sub", "Jogador escondido")
        );
        return carta;
    }

    carta.append(
        criarElemento("span", "carta__nome", atleta.nome),
        criarElemento("span", "carta__sub", descreverAtleta(atleta))
    );

    return carta;
}

function renderizarRodadaCegas(posicao) {

    const pessoa = pessoaDaVezCegas();
    const vaga = Math.floor(jogo.rodada / 2) + 1;

    tituloJogo.textContent = `Vez de ${jogo.nomes[pessoa]}`;

    areaJogo.textContent = "";

    const info = criarElemento(
        "p",
        "painel__descricao",
        `Vaga ${vaga} de ${jogo.vagas.length}: ${posicao}. Pulos restantes: ${jogo.pulos[pessoa]}.`
    );

    const barra = criarElemento("div", "cronometro");
    const preenchimento = criarElemento("div", "cronometro__barra");
    preenchimento.id = "cronometro-barra";
    barra.append(preenchimento);

    const tempo = criarElemento("p", "cronometro__texto", "");
    tempo.id = "cronometro-texto";

    const cartas = criarElemento("div", "cartas");
    cartas.append(
        criarCartaAtleta(jogo.aberto, false),
        criarElemento("span", "cartas__ou", "ou"),
        criarCartaAtleta(jogo.escondido, true)
    );

    const acoes = criarElemento("div", "formulario__acoes");
    acoes.append(
        criarBotao(`Ficar com ${jogo.aberto.nome}`, "botao--primario", "aberto"),
        criarBotao("Arriscar no escondido", "botao--secundario", "escondido")
    );

    if (jogo.pulos[pessoa] > 0) {
        acoes.append(criarBotao("Pular (sortear outros)", "botao--perigo", "pular-cegas"));
    }

    areaJogo.append(info, barra, tempo, cartas, acoes);
}

function atualizarCronometro() {

    const barra = document.querySelector("#cronometro-barra");
    const texto = document.querySelector("#cronometro-texto");

    if (!barra || !texto) {
        return;
    }

    const porcentagem = (jogo.restanteMs / jogo.tempoMs) * 100;

    barra.style.width = `${porcentagem}%`;
    texto.textContent = `${(jogo.restanteMs / 1000).toFixed(1)} s`;
}

function pararCronometro() {

    if (cronometro !== null) {
        clearInterval(cronometro);
        cronometro = null;
    }
}

function iniciarCronometro() {

    pararCronometro();

    jogo.restanteMs = jogo.tempoMs;
    atualizarCronometro();

    // A cada 100 ms diminui o tempo; quando zera, fica com o jogador aberto
    cronometro = setInterval(() => {

        jogo.restanteMs = jogo.restanteMs - 100;

        if (jogo.restanteMs <= 0) {
            jogo.restanteMs = 0;
            atualizarCronometro();
            escolherCegas("aberto", true);
            return;
        }

        atualizarCronometro();
    }, 100);
}

function escolherCegas(opcao, tempoEsgotado) {

    pararCronometro();

    const pessoa = pessoaDaVezCegas();
    const nome = jogo.nomes[pessoa];

    let escolhido = jogo.aberto;
    let deixado = jogo.escondido;

    if (opcao === "escondido") {
        escolhido = jogo.escondido;
        deixado = jogo.aberto;
    }

    jogo.times[pessoa].push(escolhido);

    if (tempoEsgotado) {
        registrarHistorico(`O tempo de ${nome} acabou: ficou com ${escolhido.nome}. O escondido era ${deixado.nome}.`);
    } else if (opcao === "escondido") {
        registrarHistorico(`${nome} arriscou e pegou ${escolhido.nome}. Deixou ${deixado.nome}.`);
    } else {
        registrarHistorico(`${nome} ficou com ${escolhido.nome}. O escondido era ${deixado.nome}.`);
    }

    jogo.rodada++;

    renderizarPlacar();
    iniciarRodadaCegas();
}

function pularCegas() {

    const pessoa = pessoaDaVezCegas();

    if (jogo.pulos[pessoa] === 0) {
        return;
    }

    pararCronometro();

    jogo.pulos[pessoa]--;

    registrarHistorico(`${jogo.nomes[pessoa]} pulou ${jogo.aberto.nome} e o escondido.`);

    iniciarRodadaCegas();
}

/* =====================================================
   Modo 2: Leilão aberto
   ===================================================== */

const LANCE_MINIMO = 1;

function vagasRestantes(pessoa) {
    return jogo.vagas.length - jogo.times[pessoa].length;
}

// Guarda R$ 1 mi para cada vaga que ainda falta preencher depois desta
function lanceMaximo(pessoa) {
    return jogo.saldos[pessoa] - (vagasRestantes(pessoa) - 1) * LANCE_MINIMO;
}

function podeDarLance(pessoa, valor) {

    if (vagasRestantes(pessoa) === 0) {
        return false;
    }

    // Quem já está ganhando o lote não cobre o próprio lance
    if (jogo.lider === pessoa) {
        return false;
    }

    return valor <= lanceMaximo(pessoa);
}

function proximoLance(incremento) {

    // O primeiro lance de um jogador começa no lance mínimo
    if (jogo.lider === null) {
        return LANCE_MINIMO + incremento - 1;
    }

    return jogo.lance + incremento;
}

function leilaoTerminou() {

    const timesCompletos = vagasRestantes(0) === 0 && vagasRestantes(1) === 0;

    return timesCompletos || jogo.banco.length === 0;
}

function iniciarLote() {

    if (leilaoTerminou()) {
        finalizarDesafio();
        return;
    }

    jogo.lote = sortearDoBanco("");
    jogo.lance = 0;
    jogo.lider = null;

    renderizarLote();
}

function renderizarLote() {

    tituloJogo.textContent = "Leilão";

    areaJogo.textContent = "";

    const carta = criarCartaAtleta(jogo.lote, false);
    carta.classList.add("carta--leilao");

    let textoLance = `Lance mínimo: R$ ${LANCE_MINIMO} mi. Ninguém deu lance ainda.`;

    if (jogo.lider !== null) {
        textoLance = `Maior lance: R$ ${jogo.lance} mi, de ${jogo.nomes[jogo.lider]}.`;
    }

    const lance = criarElemento("p", "lance-atual", textoLance);

    const colunas = criarElemento("div", "lances");

    [0, 1].forEach(pessoa => {

        const coluna = criarElemento("div", "lances__pessoa");

        coluna.append(
            criarElemento("strong", "", jogo.nomes[pessoa]),
            criarElemento("span", "carta__sub", `Saldo: R$ ${jogo.saldos[pessoa]} mi · faltam ${vagasRestantes(pessoa)}`)
        );

        const botoes = criarElemento("div", "lances__botoes");

        [1, 5, 10].forEach(incremento => {

            const valor = proximoLance(incremento);

            const botao = criarBotao(`R$ ${valor} mi`, "botao--secundario botao--pequeno", "lance");
            botao.dataset.pessoa = pessoa;
            botao.dataset.incremento = incremento;
            botao.disabled = !podeDarLance(pessoa, valor);

            botoes.append(botao);
        });

        coluna.append(botoes);
        colunas.append(coluna);
    });

    const acoes = criarElemento("div", "formulario__acoes");

    const vendido = criarBotao("Vendido!", "botao--primario", "vendido");
    vendido.disabled = jogo.lider === null;

    acoes.append(vendido, criarBotao("Pular jogador", "botao--perigo", "pular-leilao"));

    areaJogo.append(carta, lance, colunas, acoes);
}

function darLance(pessoa, incremento) {

    const valor = proximoLance(incremento);

    if (!podeDarLance(pessoa, valor)) {
        return;
    }

    jogo.lance = valor;
    jogo.lider = pessoa;

    renderizarLote();
}

function venderLote() {

    if (jogo.lider === null) {
        return;
    }

    const pessoa = jogo.lider;

    jogo.lote.preco = jogo.lance;
    jogo.times[pessoa].push(jogo.lote);
    jogo.saldos[pessoa] = jogo.saldos[pessoa] - jogo.lance;

    registrarHistorico(`${jogo.nomes[pessoa]} comprou ${jogo.lote.nome} por R$ ${jogo.lance} mi.`);

    renderizarPlacar();
    iniciarLote();
}

function pularLote() {

    registrarHistorico(`${jogo.lote.nome} ficou sem comprador.`);

    iniciarLote();
}

/* =====================================================
   Início e fim do desafio
   ===================================================== */

function finalizarDesafio() {

    pararCronometro();

    tituloJogo.textContent = "Fim do desafio!";

    areaJogo.textContent = "";

    let resumo = "Os dois times estão abaixo. Qual ficou melhor?";

    if (jogo.modo === "leilao") {
        const gasto1 = jogo.orcamento - jogo.saldos[0];
        const gasto2 = jogo.orcamento - jogo.saldos[1];
        resumo = `${jogo.nomes[0]} gastou R$ ${gasto1} mi e ${jogo.nomes[1]} gastou R$ ${gasto2} mi. Qual time ficou melhor?`;
    }

    const acoes = criarElemento("div", "formulario__acoes");

    [0, 1].forEach(pessoa => {
        const botao = criarBotao(`Time de ${jogo.nomes[pessoa]}`, "botao--primario", "votar");
        botao.dataset.pessoa = pessoa;
        acoes.append(botao);
    });

    acoes.append(criarBotao("Jogar de novo", "botao--secundario", "reiniciar"));

    areaJogo.append(criarElemento("p", "painel__descricao", resumo), acoes);

    renderizarPlacar();
}

function validarConfiguracao() {

    let valido = true;

    document.querySelectorAll(".campo__erro").forEach(erro => {
        erro.textContent = "";
    });

    if (campoPessoa1.value.trim() === "") {
        document.querySelector("#erro-pessoa-1").textContent = "Informe o nome.";
        valido = false;
    }

    if (campoPessoa2.value.trim() === "") {
        document.querySelector("#erro-pessoa-2").textContent = "Informe o nome.";
        valido = false;
    }

    if (seletorLiga.value === "") {
        document.querySelector("#erro-liga-desafio").textContent = "Escolha a liga.";
        valido = false;
    }

    const orcamento = Number(campoOrcamento.value);

    if (modoEscolhido() === "leilao" && (orcamento < 10 || orcamento > 1000)) {
        document.querySelector("#erro-orcamento").textContent = "Use um valor entre 10 e 1000.";
        valido = false;
    }

    return valido;
}

async function comecarDesafio() {

    if (!validarConfiguracao()) {
        statusDesafio.textContent = "Corrija os campos destacados.";
        return;
    }

    if (timesDaLiga.length === 0) {
        statusDesafio.textContent = "Aguarde os times da liga carregarem e tente de novo.";
        return;
    }

    pararCronometro();

    statusDesafio.textContent = "Carregando jogadores...";

    let banco = [];

    try {
        banco = await montarBanco(seletorLiga.value, seletorTime.value, timesDaLiga);
    } catch (erro) {
        console.error(erro);
        statusDesafio.textContent = "Não foi possível carregar os jogadores. Tente novamente.";
        return;
    }

    const vagas = FORMATOS[seletorFormato.value];

    jogo = {
        modo: modoEscolhido(),
        nomes: [campoPessoa1.value.trim(), campoPessoa2.value.trim()],
        vagas,
        banco,
        times: [[], []],
        rodada: 0,
        pulos: [2, 2],
        tempoMs: Number(seletorTempo.value) * 1000,
        restanteMs: 0
    };

    statusDesafio.textContent = `${banco.length} jogadores carregados. Boa sorte!`;

    listaHistorico.textContent = "";
    secaoJogo.hidden = false;

    if (jogo.modo === "leilao") {
        jogo.orcamento = Number(campoOrcamento.value);
        jogo.saldos = [jogo.orcamento, jogo.orcamento];
        renderizarPlacar();
        iniciarLote();
        secaoJogo.scrollIntoView({ behavior: "smooth" });
        return;
    }

    renderizarPlacar();
    iniciarRodadaCegas();
    secaoJogo.scrollIntoView({ behavior: "smooth" });
}

/* =====================================================
   Eventos
   ===================================================== */

seletorLiga.addEventListener("change", async () => {

    timesDaLiga = [];

    seletorTime.textContent = "";

    const opcaoTodos = criarElemento("option", "", "Vários times da liga (sorteados)");
    opcaoTodos.value = "";
    seletorTime.append(opcaoTodos);

    if (seletorLiga.value === "") {
        return;
    }

    statusDesafio.textContent = "Carregando times...";

    try {

        timesDaLiga = await buscarTimes(seletorLiga.value);

        timesDaLiga.forEach(time => {
            const opcao = criarElemento("option", "", time.nome);
            opcao.value = time.id;
            seletorTime.append(opcao);
        });

        statusDesafio.textContent = "";

    } catch (erro) {
        console.error(erro);
        statusDesafio.textContent = "Não foi possível carregar os times da liga.";
    }
});

// Mostra o campo certo para cada modo (tempo ou orçamento)
formDesafio.addEventListener("change", () => {
    const modo = modoEscolhido();
    campoTempo.hidden = modo !== "cegas";
    blocoOrcamento.hidden = modo !== "leilao";
});

formDesafio.addEventListener("submit", event => {
    event.preventDefault();
    comecarDesafio();
});

// Delegação de eventos: todos os botões da área do jogo
areaJogo.addEventListener("click", event => {

    const botao = event.target.closest("[data-acao]");

    if (!botao || botao.disabled) {
        return;
    }

    const acao = botao.dataset.acao;

    if (acao === "aberto" || acao === "escondido") {
        escolherCegas(acao, false);
    }

    if (acao === "pular-cegas") {
        pularCegas();
    }

    if (acao === "lance") {
        darLance(Number(botao.dataset.pessoa), Number(botao.dataset.incremento));
    }

    if (acao === "vendido") {
        venderLote();
    }

    if (acao === "pular-leilao") {
        pularLote();
    }

    if (acao === "votar") {
        const vencedor = jogo.nomes[Number(botao.dataset.pessoa)];
        tituloJogo.textContent = `${vencedor} venceu o desafio!`;
        registrarHistorico(`Resultado: o time de ${vencedor} foi escolhido como o melhor.`);
    }

    if (acao === "reiniciar") {
        pararCronometro();
        secaoJogo.hidden = true;
        secaoPlacar.hidden = true;
        secaoHistorico.hidden = true;
        document.querySelector("#configuracao").scrollIntoView({ behavior: "smooth" });
    }
});
