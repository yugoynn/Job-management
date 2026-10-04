// ===========================================================
// ROTAS DE DISPONIBILIDADES
// Tabela (banco de dados): src/db/disponibilidades.json
// Endereço base: /disponibilidades
// ===========================================================
const express = require("express");
const fs = require("fs");      // módulo do Node para ler e gravar arquivos
const path = require("path");  // módulo do Node para montar caminhos de pastas

const router = express.Router(); // conjunto de rotas desta entidade

// caminho do arquivo JSON que funciona como banco de dados
const arquivo = path.join(__dirname, "..", "db", "disponibilidades.json");
// tabela de espaços (do colega), usada só na busca por nome
const arquivoEspacos = path.join(__dirname, "..", "db", "espacos.json");

// lê o arquivo e devolve a lista (array) de registros
function lerDisponibilidades() {
    return JSON.parse(fs.readFileSync(arquivo, "utf-8"));
}

// grava a lista de registros no arquivo
function salvarDisponibilidades(disponibilidades) {
    fs.writeFileSync(arquivo, JSON.stringify(disponibilidades, null, 2));
}


// ---------- DOCUMENTAÇÃO SWAGGER: campos enviados no cadastro (POST) e na atualização (PUT) ----------
/**
 * @swagger
 * tags:
 *   name: Disponibilidades
 *   description: Dias e horários em que cada espaço pode ser reservado
 *
 * components:
 *   schemas:
 *     Disponibilidade:
 *       type: object
 *       required: [espaco_id, dia_semana, hora_inicio, hora_fim]
 *       properties:
 *         espaco_id:
 *           type: integer
 *           description: id do espaço
 *           example: 5
 *         dia_semana:
 *           type: integer
 *           description: 0 = domingo, 1 = segunda ... 6 = sábado
 *           example: 2
 *         hora_inicio:
 *           type: string
 *           example: "08:00"
 *         hora_fim:
 *           type: string
 *           example: "12:00"
 *         permite_externo:
 *           type: boolean
 *           description: se pessoas de fora podem reservar nesse horário
 *           example: false
 */


// ---------- GET /disponibilidades : lista todos ----------
/**
 * @swagger
 * /disponibilidades:
 *   get:
 *     summary: Lista todas as disponibilidades
 *     tags: [Disponibilidades]
 *     responses:
 *       200:
 *         description: Lista de disponibilidades
 */
router.get("/", function (req, res) {
    const disponibilidades = lerDisponibilidades();
    disponibilidades.sort((a, b) => a.id - b.id); // ordena pelo id
    res.json(disponibilidades);
});


// ---------- GET /disponibilidades/nome/:nome : busca por nome ----------
/**
 * @swagger
 * /disponibilidades/nome/{nome}:
 *   get:
 *     summary: Busca disponibilidades pelo nome do espaço
 *     tags: [Disponibilidades]
 *     parameters:
 *       - in: path
 *         name: nome
 *         required: true
 *         schema:
 *           type: string
 *         example: "coworking"
 *     responses:
 *       200:
 *         description: Disponibilidades encontradas
 *       404:
 *         description: Nenhuma disponibilidade encontrada para esse espaço
 */
router.get("/nome/:nome", function (req, res) {
    const nome = req.params.nome.toLowerCase();

    // 1. acha os ids dos espaços que têm esse nome
    //    (na tabela de espaços o campo do nome se chama "name")
    const espacos = JSON.parse(fs.readFileSync(arquivoEspacos, "utf-8"));
    const ids = espacos.filter(x => x.name.toLowerCase().includes(nome)).map(x => x.id);

    // 2. pega os registros que pertencem a esses ids
    const encontrados = lerDisponibilidades().filter(d => ids.includes(d.espaco_id));

    if (encontrados.length === 0) {
        return res.status(404).json({ erro: "Nenhuma disponibilidade encontrada para esse espaço" });
    }

    res.json(encontrados);
});


// ---------- GET /disponibilidades/data/:data : busca por data ----------
/**
 * @swagger
 * /disponibilidades/data/{data}:
 *   get:
 *     summary: Busca disponibilidades pela data de cadastro (AAAA-MM-DD)
 *     tags: [Disponibilidades]
 *     parameters:
 *       - in: path
 *         name: data
 *         required: true
 *         schema:
 *           type: string
 *         example: "2026-01-12"
 *     responses:
 *       200:
 *         description: Disponibilidades encontradas
 *       404:
 *         description: Nenhuma disponibilidade cadastrada nessa data
 */
router.get("/data/:data", function (req, res) {
    const data = req.params.data; // exemplo: 2026-01-12

    // startsWith confere se o campo "criado_em" começa com a data informada
    const encontrados = lerDisponibilidades().filter(d => d.criado_em.startsWith(data));

    if (encontrados.length === 0) {
        return res.status(404).json({ erro: "Nenhuma disponibilidade cadastrada nessa data" });
    }

    res.json(encontrados);
});


// ---------- GET /disponibilidades/:id : busca por id ----------
/**
 * @swagger
 * /disponibilidades/{id}:
 *   get:
 *     summary: Busca uma disponibilidade pelo id
 *     tags: [Disponibilidades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Disponibilidade encontrada
 *       404:
 *         description: Disponibilidade não encontrada
 */
router.get("/:id", function (req, res) {
    const id = Number(req.params.id); // o id vem da URL como texto, então vira número

    // find devolve UM registro (o primeiro com esse id) ou undefined
    const disponibilidade = lerDisponibilidades().find(d => d.id === id);

    if (!disponibilidade) {
        return res.status(404).json({ erro: "Disponibilidade não encontrada" });
    }

    res.json(disponibilidade);
});


// ---------- POST /disponibilidades : cadastra ----------
/**
 * @swagger
 * /disponibilidades:
 *   post:
 *     summary: Cadastra uma nova disponibilidade
 *     tags: [Disponibilidades]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Disponibilidade'
 *     responses:
 *       201:
 *         description: Disponibilidade cadastrada
 *       400:
 *         description: Espaço, dia da semana, hora de início e hora de fim são obrigatórios
 */
router.post("/", function (req, res) {
    const dados = req.body; // dados enviados no corpo da requisição (JSON)

    // 1. confere os campos obrigatórios
    if (dados.espaco_id === undefined || dados.dia_semana === undefined || !dados.hora_inicio || !dados.hora_fim) {
        return res.status(400).json({ erro: "Espaço, dia da semana, hora de início e hora de fim são obrigatórios" });
    }

    const disponibilidades = lerDisponibilidades();

    // 2. gera o próximo id: maior id que existe + 1
    const novoId = disponibilidades.length > 0 ? Math.max(...disponibilidades.map(d => d.id)) + 1 : 1;

    // 3. monta o novo registro
    const novo = {
        id: novoId,
        espaco_id: dados.espaco_id,
        dia_semana: dados.dia_semana,
        hora_inicio: dados.hora_inicio,
        hora_fim: dados.hora_fim,
        permite_externo: dados.permite_externo !== undefined ? dados.permite_externo : false,
        criado_em: new Date().toISOString() // data e hora de agora
    };

    // 4. adiciona na lista, grava no arquivo e responde 201 (criado)
    disponibilidades.push(novo);
    salvarDisponibilidades(disponibilidades);
    res.status(201).json(novo);
});


// ---------- PUT /disponibilidades/:id : atualiza ----------
/**
 * @swagger
 * /disponibilidades/{id}:
 *   put:
 *     summary: Atualiza uma disponibilidade (só os campos enviados)
 *     tags: [Disponibilidades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Disponibilidade'
 *     responses:
 *       200:
 *         description: Disponibilidade atualizada
 *       404:
 *         description: Disponibilidade não encontrada
 */
router.put("/:id", function (req, res) {
    const disponibilidades = lerDisponibilidades();
    const disponibilidade = disponibilidades.find(d => d.id === Number(req.params.id));

    // 1. o registro existe?
    if (!disponibilidade) {
        return res.status(404).json({ erro: "Disponibilidade não encontrada" });
    }

    const dados = req.body;

    // 2. troca só os campos que foram enviados
    if (dados.espaco_id !== undefined) disponibilidade.espaco_id = dados.espaco_id;
    if (dados.dia_semana !== undefined) disponibilidade.dia_semana = dados.dia_semana;
    if (dados.hora_inicio !== undefined) disponibilidade.hora_inicio = dados.hora_inicio;
    if (dados.hora_fim !== undefined) disponibilidade.hora_fim = dados.hora_fim;
    if (dados.permite_externo !== undefined) disponibilidade.permite_externo = dados.permite_externo;

    // 3. grava no arquivo e responde com o registro atualizado
    salvarDisponibilidades(disponibilidades);
    res.json(disponibilidade);
});


// ---------- DELETE /disponibilidades/:id : apaga ----------
/**
 * @swagger
 * /disponibilidades/{id}:
 *   delete:
 *     summary: Apaga uma disponibilidade
 *     tags: [Disponibilidades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Disponibilidade apagada (devolve o registro removido)
 *       404:
 *         description: Disponibilidade não encontrada
 */
router.delete("/:id", function (req, res) {
    const disponibilidades = lerDisponibilidades();
    const disponibilidade = disponibilidades.find(d => d.id === Number(req.params.id));

    // 1. o registro existe?
    if (!disponibilidade) {
        return res.status(404).json({ erro: "Disponibilidade não encontrada" });
    }

    // 2. filter monta a lista com todos os registros MENOS o apagado, e grava
    const restantes = disponibilidades.filter(d => d.id !== disponibilidade.id);
    salvarDisponibilidades(restantes);

    // 3. responde com o registro que foi apagado
    res.json(disponibilidade);
});


module.exports = router; // deixa as rotas disponíveis para o src/routes/index.js
