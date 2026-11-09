/* =====================================================
   Meu Time dos Sonhos — lógica da aplicação
   ===================================================== */

// ---------- Estado da aplicação ----------

let jogadores = [];

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

const MAXIMO_TITULARES = 11;
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

// Sempre que os dados mudarem: salva e renderiza novamente
function atualizarAplicacao() {
    renderizarJogadores();
}

/* =====================================================
   Listagem
   ===================================================== */

function obterJogadoresVisiveis() {
    return jogadores;
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
}
