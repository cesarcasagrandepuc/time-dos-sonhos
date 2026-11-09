/* =====================================================
   Meu Time dos Sonhos — lógica da aplicação
   ===================================================== */

// ---------- Estado da aplicação ----------

const CHAVE_STORAGE = "timedossonhos:jogadores";

let jogadores = carregarJogadores();

// Estado temporário: id do jogador que está sendo editado
let idEmEdicao = null;

// Estado temporário: id do jogador aberto nos detalhes
let idEmDetalhe = null;

// Estado temporário da busca na API
let timesApi = [];
let elencoApi = [];
let timeSelecionado = null;
let idApiSelecionado = "";

// ---------- Elementos da página ----------

const formulario = document.querySelector("#form-jogador");
const tituloCadastro = document.querySelector("#titulo-cadastro");
const campoNome = document.querySelector("#nome");
const campoClube = document.querySelector("#clube");
const campoPosicao = document.querySelector("#posicao");
const campoSituacao = document.querySelector("#situacao");
const campoCamisa = document.querySelector("#camisa");
const campoIdade = document.querySelector("#idade");
const campoNacionalidade = document.querySelector("#nacionalidade");
const campoNota = document.querySelector("#nota");
const campoImagem = document.querySelector("#imagem");
const campoObservacao = document.querySelector("#observacao");
const botaoSalvar = document.querySelector("#btn-salvar");
const botaoCancelar = document.querySelector("#btn-cancelar");
const mensagem = document.querySelector("#mensagem");

const listaJogadores = document.querySelector("#lista-jogadores");
const listaVazia = document.querySelector("#lista-vazia");
const contador = document.querySelector("#contador");

const modalDetalhes = document.querySelector("#modal-detalhes");

const campoPesquisa = document.querySelector("#pesquisa");
const filtroPosicao = document.querySelector("#filtro-posicao");
const filtroSituacao = document.querySelector("#filtro-situacao");
const seletorOrdenacao = document.querySelector("#ordenacao");
const botaoLimparFiltros = document.querySelector("#btn-limpar-filtros");

const seletorLiga = document.querySelector("#liga");
const seletorTime = document.querySelector("#time-api");
const statusApi = document.querySelector("#status-api");
const listaResultadosApi = document.querySelector("#resultados-api");

const textoFormacao = document.querySelector("#formacao");
const escalacaoVazia = document.querySelector("#escalacao-vazia");
const campoFutebol = document.querySelector(".campo-futebol");

const MAXIMO_TITULARES = 11;

const POSICOES = ["Goleiro", "Defensor", "Meio-campista", "Atacante"];

// Linha do campo onde cada posição aparece
const LINHAS_CAMPO = {
    "Goleiro": "#linha-goleiro",
    "Defensor": "#linha-defensor",
    "Meio-campista": "#linha-meio-campista",
    "Atacante": "#linha-atacante"
};
const IMAGEM_PADRAO = "assets/img/sem-escudo.svg";

// Classe CSS usada na etiqueta de cada situação
const CLASSES_SITUACAO = {
    "Titular": "etiqueta--titular",
    "Reserva": "etiqueta--reserva",
    "Observando": "etiqueta--observando"
};

/* =====================================================
   Funções auxiliares
   ===================================================== */

function gerarProximoId() {

    if (jogadores.length === 0) {
        return 1;
    }

    const ids = jogadores.map(jogador => jogador.id);

    return Math.max(...ids) + 1;
}

// Campo numérico vazio vira null; caso contrário, vira número
function converterNumero(valor) {

    if (valor.trim() === "") {
        return null;
    }

    return Number(valor);
}

// Usado para preencher campos: null vira texto vazio
function valorOuVazio(valor) {

    if (valor === null) {
        return "";
    }

    return valor;
}

// Usado nos detalhes: valor vazio vira um traço
function valorOuTraco(valor) {

    if (valor === null || valor === "") {
        return "—";
    }

    return valor;
}

function formatarNota(nota) {

    if (nota === null) {
        return "Sem nota";
    }

    return `★ ${nota} / 10`;
}

// Ex.: "Atacante · Real Madrid"
function montarSubtitulo(jogador) {

    if (jogador.clube === "") {
        return jogador.posicao;
    }

    return `${jogador.posicao} · ${jogador.clube}`;
}

// Junta textos com " · " entre eles: ["A", "B"] → "A · B"
function juntarComPonto(partes) {

    let texto = "";

    partes.forEach((parte, indice) => {

        if (indice > 0) {
            texto = texto + " · ";
        }

        texto = texto + parte;
    });

    return texto;
}

// Ex.: "Camisa 7 · 26 anos · Brasil"
function montarInformacoes(jogador) {

    const partes = [];

    if (jogador.camisa !== null) {
        partes.push(`Camisa ${jogador.camisa}`);
    }

    if (jogador.idade !== null) {
        partes.push(`${jogador.idade} anos`);
    }

    if (jogador.nacionalidade !== "") {
        partes.push(jogador.nacionalidade);
    }

    return juntarComPonto(partes);
}

function contarTitulares() {

    const titulares = jogadores.filter(jogador => jogador.situacao === "Titular");

    return titulares.length;
}

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

function criarBotao(texto, classe, acao, id) {

    const botao = criarElemento("button", `botao botao--pequeno ${classe}`, texto);

    botao.type = "button";
    botao.dataset.acao = acao;
    botao.dataset.id = id;

    return botao;
}

function criarImagem(endereco, classe, textoAlternativo) {

    const imagem = criarElemento("img", classe);

    if (endereco) {
        imagem.src = endereco;
    } else {
        imagem.src = IMAGEM_PADRAO;
    }

    imagem.alt = textoAlternativo;

    // Se o endereço não funcionar, mostra a imagem padrão
    imagem.addEventListener("error", () => {
        imagem.src = IMAGEM_PADRAO;
    });

    return imagem;
}

function mostrarMensagem(texto, tipo) {

    mensagem.textContent = texto;
    mensagem.className = `mensagem mensagem--${tipo}`;
    mensagem.hidden = false;
}

/* =====================================================
   Persistência com localStorage
   ===================================================== */

function salvarJogadores() {

    const dados = JSON.stringify(jogadores);

    localStorage.setItem(CHAVE_STORAGE, dados);
}

function carregarJogadores() {

    const dados = localStorage.getItem(CHAVE_STORAGE);

    // Primeiro acesso: começa com alguns exemplos
    if (!dados) {
        return criarJogadoresIniciais();
    }

    try {

        const jogadoresSalvos = JSON.parse(dados);

        if (!Array.isArray(jogadoresSalvos)) {
            return [];
        }

        return jogadoresSalvos;

    } catch (erro) {

        console.error("Não foi possível ler os dados salvos:", erro);

        return [];
    }
}

function criarJogadoresIniciais() {
    return [
        {
            id: 1,
            nome: "Alisson",
            clube: "Liverpool",
                        posicao: "Goleiro",
            situacao: "Titular",
            camisa: 1,
            idade: null,
            nacionalidade: "Brasil",
            nota: 9,
            imagem: "https://a.espncdn.com/i/teamlogos/soccer/500/364.png",
            observacao: "Seguro no gol e ótimo com os pés.",
            idApi: ""
        },
        {
            id: 2,
            nome: "Vinícius Júnior",
            clube: "Real Madrid",
                        posicao: "Atacante",
            situacao: "Titular",
            camisa: 7,
            idade: null,
            nacionalidade: "Brasil",
            nota: 9.5,
            imagem: "https://a.espncdn.com/i/teamlogos/soccer/500/86.png",
            observacao: "Velocidade e drible pela esquerda.",
            idApi: ""
        },
        {
            id: 3,
            nome: "Erling Haaland",
            clube: "Manchester City",
                        posicao: "Atacante",
            situacao: "Reserva",
            camisa: 9,
            idade: null,
            nacionalidade: "Noruega",
            nota: 9,
            imagem: "https://a.espncdn.com/i/teamlogos/soccer/500/382.png",
            observacao: "",
            idApi: ""
        }
    ];
}

// Sempre que os dados mudarem: salva e renderiza novamente
function atualizarAplicacao() {
    salvarJogadores();
    renderizarJogadores();
}

/* =====================================================
   Listagem
   ===================================================== */

// Jogadores sem nota ou sem idade ficam por último na ordenação
function numeroOuPadrao(valor, padrao) {

    if (valor === null) {
        return padrao;
    }

    return valor;
}

function compararJogadores(a, b, ordenacao) {

    switch (ordenacao) {
        case "nome-az":
            return a.nome.localeCompare(b.nome);
        case "nome-za":
            return b.nome.localeCompare(a.nome);
        case "nota":
            return numeroOuPadrao(b.nota, -1) - numeroOuPadrao(a.nota, -1);
        case "mais-novo":
            return numeroOuPadrao(a.idade, 999) - numeroOuPadrao(b.idade, 999);
        case "mais-velho":
            return numeroOuPadrao(b.idade, -1) - numeroOuPadrao(a.idade, -1);
        default:
            // "recentes": o maior id é o cadastrado por último
            return b.id - a.id;
    }
}

// Aplica pesquisa, filtros e ordenação sem alterar o array original
function obterJogadoresVisiveis() {

    const termo = campoPesquisa.value.trim().toLowerCase();
    const posicao = filtroPosicao.value;
    const situacao = filtroSituacao.value;
    const ordenacao = seletorOrdenacao.value;

    const filtrados = jogadores.filter(jogador => {

        const atendePesquisa =
            termo === "" ||
            jogador.nome.toLowerCase().includes(termo) ||
            jogador.clube.toLowerCase().includes(termo);

        const atendePosicao = posicao === "" || jogador.posicao === posicao;

        const atendeSituacao = situacao === "" || jogador.situacao === situacao;

        return atendePesquisa && atendePosicao && atendeSituacao;
    });

    return filtrados.sort((a, b) => compararJogadores(a, b, ordenacao));
}

function criarCard(jogador) {

    const card = criarElemento("li", "card");

    const imagem = criarImagem(jogador.imagem, "card__imagem", `Escudo do ${jogador.clube}`);

    const corpo = criarElemento("div", "card__corpo");

    const etiqueta = criarElemento(
        "span",
        `etiqueta ${CLASSES_SITUACAO[jogador.situacao]}`,
        jogador.situacao
    );

    const nome = criarElemento("h3", "card__nome", jogador.nome);
    const subtitulo = criarElemento("p", "card__sub", montarSubtitulo(jogador));
    const informacoes = criarElemento("p", "card__sub", montarInformacoes(jogador));
    const nota = criarElemento("p", "card__nota", formatarNota(jogador.nota));

    corpo.append(etiqueta, nome, subtitulo, informacoes, nota);

    const acoes = criarElemento("div", "card__acoes");
    acoes.append(criarBotao("Detalhes", "botao--primario", "detalhes", jogador.id));
    acoes.append(criarBotao("Editar", "botao--secundario", "editar", jogador.id));
    acoes.append(criarBotao("Excluir", "botao--perigo", "excluir", jogador.id));
    corpo.append(acoes);

    card.append(imagem, corpo);

    return card;
}

function atualizarContador(quantidadeVisivel) {

    const total = jogadores.length;

    let textoTotal = `${total} jogadores`;

    if (total === 1) {
        textoTotal = "1 jogador";
    }

    if (quantidadeVisivel !== total) {
        textoTotal = `${quantidadeVisivel} de ${textoTotal}`;
    }

    contador.textContent = `${textoTotal} · ${contarTitulares()}/${MAXIMO_TITULARES} titulares`;
}

function renderizarJogadores() {

    const visiveis = obterJogadoresVisiveis();

    listaJogadores.textContent = "";

    visiveis.forEach(jogador => {
        listaJogadores.append(criarCard(jogador));
    });

    if (jogadores.length === 0) {
        listaVazia.textContent = "Nenhum jogador no seu time ainda.";
    } else {
        listaVazia.textContent = "Nenhum jogador encontrado com esses critérios.";
    }

    listaVazia.hidden = visiveis.length > 0;

    atualizarContador(visiveis.length);

    renderizarEscalacao();

    renderizarEstatisticas();
}

/* =====================================================
   Escalação no campo
   ===================================================== */

function contarPorPosicao(lista, posicao) {

    const daPosicao = lista.filter(jogador => jogador.posicao === posicao);

    return daPosicao.length;
}

function criarJogadorNoCampo(jogador) {

    const botao = criarElemento("button", "jogador-campo");
    botao.type = "button";
    botao.dataset.id = jogador.id;
    botao.title = `${jogador.nome}: ver detalhes`;

    if (jogador.posicao === "Goleiro") {
        botao.classList.add("jogador-campo--goleiro");
    }

    let numero = "?";

    if (jogador.camisa !== null) {
        numero = jogador.camisa;
    }

    botao.append(
        criarElemento("span", "jogador-campo__numero", numero),
        criarElemento("span", "jogador-campo__nome", jogador.nome)
    );

    return botao;
}

function renderizarEscalacao() {

    const titulares = jogadores.filter(jogador => jogador.situacao === "Titular");

    // Coloca cada titular na linha da sua posição
    POSICOES.forEach(posicao => {

        const linha = document.querySelector(LINHAS_CAMPO[posicao]);

        linha.textContent = "";

        titulares
            .filter(jogador => jogador.posicao === posicao)
            .forEach(jogador => {
                linha.append(criarJogadorNoCampo(jogador));
            });
    });

    // Formação tática: defensores-meio-campistas-atacantes (ex.: 4-3-3)
    if (titulares.length === 0) {
        textoFormacao.textContent = "";
    } else {
        const defensores = contarPorPosicao(titulares, "Defensor");
        const meias = contarPorPosicao(titulares, "Meio-campista");
        const atacantes = contarPorPosicao(titulares, "Atacante");

        textoFormacao.textContent = `Formação ${defensores}-${meias}-${atacantes}`;
    }

    escalacaoVazia.hidden = titulares.length > 0;
}

/* =====================================================
   Estatísticas do time
   ===================================================== */

// Média de um campo numérico (nota ou idade), ignorando valores vazios
function calcularMedia(campo) {

    let soma = 0;
    let quantidade = 0;

    jogadores.forEach(jogador => {

        if (jogador[campo] !== null) {
            soma = soma + jogador[campo];
            quantidade++;
        }
    });

    if (quantidade === 0) {
        return null;
    }

    // Arredonda para uma casa decimal
    return Math.round((soma / quantidade) * 10) / 10;
}

function contarNacionalidades() {

    const contagem = [];

    jogadores.forEach(jogador => {

        let pais = jogador.nacionalidade;

        if (pais === "") {
            pais = "Não informada";
        }

        const existente = contagem.find(item => item.pais === pais);

        if (existente) {
            existente.quantidade++;
        } else {
            contagem.push({ pais, quantidade: 1 });
        }
    });

    return contagem.sort((a, b) => b.quantidade - a.quantidade);
}

function criarBarra(rotulo, valor, maximo) {

    const item = criarElemento("li", "barra");

    const trilho = criarElemento("span", "barra__trilho");
    const preenchimento = criarElemento("span", "barra__preenchimento");

    let porcentagem = 0;

    if (maximo > 0) {
        porcentagem = (valor / maximo) * 100;
    }

    preenchimento.style.width = `${porcentagem}%`;

    trilho.append(preenchimento);

    item.append(
        criarElemento("span", "barra__rotulo", rotulo),
        trilho,
        criarElemento("span", "barra__valor", valor)
    );

    return item;
}

function renderizarEstatisticas() {

    const notaMedia = calcularMedia("nota");
    const idadeMedia = calcularMedia("idade");

    document.querySelector("#estat-total").textContent = jogadores.length;
    document.querySelector("#estat-titulares").textContent = `${contarTitulares()}/${MAXIMO_TITULARES}`;
    document.querySelector("#estat-nota").textContent = valorOuTraco(notaMedia);
    document.querySelector("#estat-idade").textContent = valorOuTraco(idadeMedia);

    const listaPosicoes = document.querySelector("#estat-posicoes");
    listaPosicoes.textContent = "";

    POSICOES.forEach(posicao => {
        const quantidade = contarPorPosicao(jogadores, posicao);
        listaPosicoes.append(criarBarra(posicao, quantidade, jogadores.length));
    });

    const listaPaises = document.querySelector("#estat-paises");
    listaPaises.textContent = "";

    // Mostra só as 5 nacionalidades com mais jogadores
    contarNacionalidades().forEach((item, indice) => {
        if (indice < 5) {
            listaPaises.append(criarBarra(item.pais, item.quantidade, jogadores.length));
        }
    });
}

/* =====================================================
   Cadastro e validação
   ===================================================== */

function lerFormulario() {
    return {
        nome: campoNome.value.trim(),
        clube: campoClube.value.trim(),
        posicao: campoPosicao.value,
        situacao: campoSituacao.value,
        camisa: converterNumero(campoCamisa.value),
        idade: converterNumero(campoIdade.value),
        nacionalidade: campoNacionalidade.value.trim(),
        nota: converterNumero(campoNota.value),
        imagem: campoImagem.value.trim(),
        observacao: campoObservacao.value.trim(),
        idApi: idApiSelecionado
    };
}

function mostrarErro(campo, texto) {

    const erro = document.querySelector(`#erro-${campo.id}`);

    erro.textContent = texto;

    campo.closest(".campo").classList.add("campo--invalido");
}

function limparErros() {

    formulario.querySelectorAll(".campo__erro").forEach(erro => {
        erro.textContent = "";
    });

    formulario.querySelectorAll(".campo--invalido").forEach(campo => {
        campo.classList.remove("campo--invalido");
    });
}

function validarJogador(dados) {

    limparErros();

    let valido = true;

    // Procura outro jogador com o mesmo nome
    const repetido = jogadores.find(jogador =>
        jogador.nome.toLowerCase() === dados.nome.toLowerCase()
        && jogador.id !== idEmEdicao
    );

    if (dados.nome.length < 2) {
        mostrarErro(campoNome, "Informe o nome (mínimo de 2 caracteres).");
        valido = false;
    } else if (repetido) {
        mostrarErro(campoNome, "Esse jogador já está no seu time.");
        valido = false;
    }

    if (dados.posicao === "") {
        mostrarErro(campoPosicao, "Selecione a posição.");
        valido = false;
    }

    if (dados.situacao === "") {
        mostrarErro(campoSituacao, "Selecione a situação no seu time.");
        valido = false;
    }

    // Regra do futebol: no máximo 11 titulares
    if (dados.situacao === "Titular") {

        const outrosTitulares = jogadores.filter(jogador =>
            jogador.situacao === "Titular"
            && jogador.id !== idEmEdicao
        );

        if (outrosTitulares.length >= MAXIMO_TITULARES) {
            mostrarErro(campoSituacao, `Seu time já tem ${MAXIMO_TITULARES} titulares.`);
            valido = false;
        }
    }

    if (dados.camisa !== null && (dados.camisa < 1 || dados.camisa > 99)) {
        mostrarErro(campoCamisa, "A camisa deve ser de 1 a 99.");
        valido = false;
    }

    if (dados.idade !== null && (dados.idade < 15 || dados.idade > 50)) {
        mostrarErro(campoIdade, "A idade deve estar entre 15 e 50 anos.");
        valido = false;
    }

    if (dados.nota !== null && (dados.nota < 0 || dados.nota > 10)) {
        mostrarErro(campoNota, "A nota deve estar entre 0 e 10.");
        valido = false;
    }

    return valido;
}

function limparFormulario() {

    formulario.reset();
    limparErros();
    idApiSelecionado = "";
}

function cadastrarJogador(dados) {

    dados.id = gerarProximoId();

    jogadores.push(dados);

    atualizarAplicacao();

    mostrarMensagem(`${dados.nome} entrou no seu time!`, "sucesso");
}

/* =====================================================
   Edição e exclusão
   ===================================================== */

function buscarJogador(id) {
    return jogadores.find(jogador => jogador.id === id);
}

function preencherFormulario(jogador) {

    campoNome.value = jogador.nome;
    campoClube.value = jogador.clube;
    campoPosicao.value = jogador.posicao;
    campoSituacao.value = jogador.situacao;
    campoCamisa.value = valorOuVazio(jogador.camisa);
    campoIdade.value = valorOuVazio(jogador.idade);
    campoNacionalidade.value = jogador.nacionalidade;
    campoNota.value = valorOuVazio(jogador.nota);
    campoImagem.value = jogador.imagem;
    campoObservacao.value = jogador.observacao;
    idApiSelecionado = jogador.idApi;
}

function iniciarEdicao(id) {

    const jogador = buscarJogador(id);

    if (!jogador) {
        return;
    }

    idEmEdicao = id;

    limparErros();
    preencherFormulario(jogador);

    tituloCadastro.textContent = "Editar jogador";
    botaoSalvar.textContent = "Salvar alterações";
    botaoCancelar.hidden = false;

    // Leva o usuário até o formulário
    campoNome.focus();
}

function cancelarEdicao() {

    idEmEdicao = null;

    limparFormulario();

    tituloCadastro.textContent = "Cadastrar jogador";
    botaoSalvar.textContent = "Cadastrar jogador";
    botaoCancelar.hidden = true;
}

function atualizarJogador(dados) {

    const indice = jogadores.findIndex(jogador => jogador.id === idEmEdicao);

    if (indice === -1) {
        mostrarMensagem("Jogador não encontrado.", "erro");
        return;
    }

    // Mantém o mesmo id e substitui os dados
    dados.id = idEmEdicao;

    jogadores[indice] = dados;

    atualizarAplicacao();

    mostrarMensagem(`${dados.nome} foi atualizado!`, "sucesso");
}

function excluirJogador(id) {

    const indice = jogadores.findIndex(jogador => jogador.id === id);

    if (indice === -1) {
        return;
    }

    const nome = jogadores[indice].nome;

    const confirmou = window.confirm(`Deseja realmente tirar ${nome} do seu time?`);

    if (!confirmou) {
        return;
    }

    jogadores.splice(indice, 1);

    // Se o jogador excluído estava em edição, restaura o formulário
    if (idEmEdicao === id) {
        cancelarEdicao();
    }

    atualizarAplicacao();

    mostrarMensagem(`${nome} saiu do seu time.`, "sucesso");
}

/* =====================================================
   Detalhes
   ===================================================== */

function abrirDetalhes(id) {

    const jogador = buscarJogador(id);

    if (!jogador) {
        return;
    }

    idEmDetalhe = id;

    const imagem = document.querySelector("#detalhe-imagem");

    if (jogador.imagem) {
        imagem.src = jogador.imagem;
    } else {
        imagem.src = IMAGEM_PADRAO;
    }

    imagem.alt = `Escudo do ${jogador.clube}`;

    let observacao = jogador.observacao;

    if (observacao === "") {
        observacao = "Nenhuma observação.";
    }

    document.querySelector("#detalhe-nome").textContent = jogador.nome;
    document.querySelector("#detalhe-sub").textContent = montarSubtitulo(jogador);
    document.querySelector("#detalhe-situacao").textContent = jogador.situacao;
    document.querySelector("#detalhe-clube").textContent = valorOuTraco(jogador.clube);
    document.querySelector("#detalhe-posicao").textContent = jogador.posicao;
    document.querySelector("#detalhe-camisa").textContent = valorOuTraco(jogador.camisa);
    document.querySelector("#detalhe-idade").textContent = valorOuTraco(jogador.idade);
    document.querySelector("#detalhe-nacionalidade").textContent = valorOuTraco(jogador.nacionalidade);
    document.querySelector("#detalhe-nota").textContent = formatarNota(jogador.nota);
    document.querySelector("#detalhe-observacao").textContent = observacao;

    modalDetalhes.hidden = false;
}

function fecharDetalhes() {

    modalDetalhes.hidden = true;

    idEmDetalhe = null;
}

/* =====================================================
   Integração com a API pública da ESPN
   1ª requisição: times da liga (tabela de classificação)
   2ª requisição: elenco do time escolhido
   ===================================================== */

const URL_API = "https://site.api.espn.com/apis";

// Posições da API (em inglês) → posições do sistema
const POSICOES_API = {
    "Goalkeeper": "Goleiro",
    "Defender": "Defensor",
    "Midfielder": "Meio-campista",
    "Forward": "Atacante"
};

// Países mais comuns (em inglês) → português
const PAISES_API = {
    "Argentina": "Argentina",
    "Belgium": "Bélgica",
    "Brazil": "Brasil",
    "Chile": "Chile",
    "Colombia": "Colômbia",
    "Croatia": "Croácia",
    "Ecuador": "Equador",
    "England": "Inglaterra",
    "France": "França",
    "Germany": "Alemanha",
    "Italy": "Itália",
    "Japan": "Japão",
    "Mexico": "México",
    "Morocco": "Marrocos",
    "Netherlands": "Holanda",
    "Norway": "Noruega",
    "Paraguay": "Paraguai",
    "Peru": "Peru",
    "Portugal": "Portugal",
    "Scotland": "Escócia",
    "Senegal": "Senegal",
    "Spain": "Espanha",
    "United States": "Estados Unidos",
    "Uruguay": "Uruguai",
    "Venezuela": "Venezuela"
};

// Se o país não estiver na lista, mantém o nome em inglês
function traduzirPais(pais) {

    if (PAISES_API[pais] === undefined) {
        return pais;
    }

    return PAISES_API[pais];
}

function traduzirPosicao(posicao) {

    if (!posicao) {
        return "";
    }

    const traduzida = POSICOES_API[posicao.name];

    if (traduzida === undefined) {
        return "";
    }

    return traduzida;
}

// Converte um time da API para o formato usado no sistema
function converterTime(entrada) {

    let escudo = "";

    if (entrada.team.logos) {
        escudo = entrada.team.logos[0].href;
    }

    return {
        id: entrada.team.id,
        nome: entrada.team.displayName,
        escudo
    };
}

// Converte um atleta da API para o formato usado no sistema
function converterAtleta(atleta) {

    let camisa = null;

    if (atleta.jersey) {
        camisa = Number(atleta.jersey);
    }

    let idade = null;

    if (atleta.age) {
        idade = atleta.age;
    }

    let nacionalidade = "";

    if (atleta.citizenship) {
        nacionalidade = traduzirPais(atleta.citizenship);
    }

    let bandeira = "";

    if (atleta.flag) {
        bandeira = atleta.flag.href;
    }

    return {
        idApi: atleta.id,
        nome: atleta.displayName,
        posicao: traduzirPosicao(atleta.position),
        camisa,
        idade,
        nacionalidade,
        bandeira
    };
}

async function buscarTimes(liga) {

    const resposta = await fetch(`${URL_API}/v2/sports/soccer/${liga}/standings`);

    const dados = await resposta.json();

    const entradas = dados.children[0].standings.entries;

    const times = entradas.map(entrada => converterTime(entrada));

    return times.sort((a, b) => a.nome.localeCompare(b.nome));
}

async function buscarElenco(liga, idTime) {

    const resposta = await fetch(`${URL_API}/site/v2/sports/soccer/${liga}/teams/${idTime}/roster`);

    const dados = await resposta.json();

    return dados.athletes.map(atleta => converterAtleta(atleta));
}

function preencherSeletorTimes() {

    seletorTime.textContent = "";

    const opcaoInicial = criarElemento("option", "", "Selecione o time");
    opcaoInicial.value = "";
    seletorTime.append(opcaoInicial);

    timesApi.forEach(time => {

        const opcao = criarElemento("option", "", time.nome);
        opcao.value = time.id;

        seletorTime.append(opcao);
    });
}

function jaEstaNoTime(atleta) {

    const encontrado = jogadores.find(jogador =>
        jogador.idApi === atleta.idApi ||
        jogador.nome.toLowerCase() === atleta.nome.toLowerCase()
    );

    return encontrado !== undefined;
}

function renderizarElencoApi() {

    listaResultadosApi.textContent = "";

    elencoApi.forEach(atleta => {

        const item = criarElemento("li", "resultado");

        const bandeira = criarImagem(atleta.bandeira, "resultado__bandeira", "");

        const info = criarElemento("div", "resultado__info");

        const partes = [];

        if (atleta.posicao !== "") {
            partes.push(atleta.posicao);
        }

        if (atleta.camisa !== null) {
            partes.push(`Camisa ${atleta.camisa}`);
        }

        if (atleta.idade !== null) {
            partes.push(`${atleta.idade} anos`);
        }

        info.append(
            criarElemento("p", "resultado__titulo", atleta.nome),
            criarElemento("p", "resultado__sub", juntarComPonto(partes))
        );

        item.append(bandeira, info);

        if (jaEstaNoTime(atleta)) {

            item.append(criarElemento("span", "resultado__aviso", "No time"));

        } else {

            const botao = criarElemento("button", "botao botao--primario botao--pequeno", "Adicionar");
            botao.type = "button";
            botao.dataset.id = atleta.idApi;

            item.append(botao);
        }

        listaResultadosApi.append(item);
    });
}

function usarAtletaNoCadastro(idApi) {

    const atleta = elencoApi.find(item => item.idApi === idApi);

    if (!atleta) {
        return;
    }

    // Se estava editando outro jogador, sai da edição antes
    cancelarEdicao();

    campoNome.value = atleta.nome;
    campoClube.value = timeSelecionado.nome;
    campoPosicao.value = atleta.posicao;
    campoCamisa.value = valorOuVazio(atleta.camisa);
    campoIdade.value = valorOuVazio(atleta.idade);
    campoNacionalidade.value = atleta.nacionalidade;
    campoImagem.value = timeSelecionado.escudo;
    idApiSelecionado = atleta.idApi;

    // Leva o usuário até o campo que falta preencher
    campoSituacao.focus();

    mostrarMensagem(
        `Dados de ${atleta.nome} preenchidos. Escolha se ele será titular, reserva ou observado e clique em Cadastrar.`,
        "sucesso"
    );
}

/* =====================================================
   Eventos
   ===================================================== */

formulario.addEventListener("submit", event => {

    event.preventDefault();

    const dados = lerFormulario();

    if (!validarJogador(dados)) {
        mostrarMensagem("Corrija os campos destacados antes de salvar.", "erro");
        return;
    }

    if (idEmEdicao === null) {
        cadastrarJogador(dados);
    } else {
        atualizarJogador(dados);
    }

    cancelarEdicao();

    // Atualiza o botão "Adicionar" / "No time" da lista da API
    renderizarElencoApi();
});

// Clicar na mensagem esconde a mensagem
mensagem.addEventListener("click", () => {
    mensagem.hidden = true;
});

botaoCancelar.addEventListener("click", cancelarEdicao);

// Delegação de eventos: um único listener para os botões de todos os cards
listaJogadores.addEventListener("click", event => {

    const botao = event.target.closest("[data-acao]");

    if (!botao) {
        return;
    }

    const id = Number(botao.dataset.id);
    const acao = botao.dataset.acao;

    if (acao === "detalhes") {
        abrirDetalhes(id);
    }

    if (acao === "editar") {
        iniciarEdicao(id);
    }

    if (acao === "excluir") {
        excluirJogador(id);
        renderizarElencoApi();
    }
});

document.querySelector("#btn-fechar-modal").addEventListener("click", fecharDetalhes);

// Clicar em um jogador no campo abre os detalhes dele
campoFutebol.addEventListener("click", event => {

    const botao = event.target.closest(".jogador-campo");

    if (botao) {
        abrirDetalhes(Number(botao.dataset.id));
    }
});

// Se o escudo dos detalhes não carregar, mostra a imagem padrão
document.querySelector("#detalhe-imagem").addEventListener("error", event => {
    event.target.src = IMAGEM_PADRAO;
});

// Fecha os detalhes ao clicar no fundo escuro
modalDetalhes.addEventListener("click", event => {
    if (event.target === modalDetalhes) {
        fecharDetalhes();
    }
});

document.querySelector("#detalhe-editar").addEventListener("click", () => {
    const id = idEmDetalhe;
    fecharDetalhes();
    iniciarEdicao(id);
});

document.querySelector("#detalhe-excluir").addEventListener("click", () => {
    const id = idEmDetalhe;
    fecharDetalhes();
    excluirJogador(id);
    renderizarElencoApi();
});

// Pesquisa, filtros e ordenação atualizam a lista na hora
campoPesquisa.addEventListener("input", renderizarJogadores);
filtroPosicao.addEventListener("change", renderizarJogadores);
filtroSituacao.addEventListener("change", renderizarJogadores);
seletorOrdenacao.addEventListener("change", renderizarJogadores);

botaoLimparFiltros.addEventListener("click", () => {

    campoPesquisa.value = "";
    filtroPosicao.value = "";
    filtroSituacao.value = "";
    seletorOrdenacao.value = "recentes";

    renderizarJogadores();
});

// 1ª requisição: ao escolher a liga, carrega os times
seletorLiga.addEventListener("change", async () => {

    const liga = seletorLiga.value;

    elencoApi = [];
    timesApi = [];
    timeSelecionado = null;
    renderizarElencoApi();
    preencherSeletorTimes();

    if (liga === "") {
        statusApi.textContent = "";
        return;
    }

    // Estado de carregamento
    statusApi.textContent = "Carregando times...";

    try {

        timesApi = await buscarTimes(liga);

        preencherSeletorTimes();

        statusApi.textContent = `${timesApi.length} times carregados. Escolha um time.`;

    } catch (erro) {

        console.error(erro);

        statusApi.textContent = "Não foi possível carregar os times. Tente novamente.";
    }
});

// 2ª requisição: ao escolher o time, carrega o elenco
seletorTime.addEventListener("change", async () => {

    const idTime = seletorTime.value;

    elencoApi = [];
    renderizarElencoApi();

    timeSelecionado = timesApi.find(time => time.id === idTime);

    if (!timeSelecionado) {
        statusApi.textContent = "";
        return;
    }

    statusApi.textContent = `Carregando elenco do ${timeSelecionado.nome}...`;

    try {

        elencoApi = await buscarElenco(seletorLiga.value, idTime);

        statusApi.textContent = `${elencoApi.length} jogadores no elenco do ${timeSelecionado.nome}.`;

    } catch (erro) {

        console.error(erro);

        statusApi.textContent = "Não foi possível carregar o elenco. Tente novamente.";
    }

    renderizarElencoApi();
});

listaResultadosApi.addEventListener("click", event => {

    const botao = event.target.closest("[data-id]");

    if (botao) {
        usarAtletaNoCadastro(botao.dataset.id);
    }
});

/* =====================================================
   Inicialização
   ===================================================== */

renderizarJogadores();
