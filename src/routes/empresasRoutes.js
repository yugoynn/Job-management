// ===========================================================
// ROTAS DE EMPRESAS
// Tabela (banco de dados): src/db/empresas.json
// Endereço base: /empresas
// ===========================================================
const express = require("express");
const fs = require("fs");      // módulo do Node para ler e gravar arquivos
const path = require("path");  // módulo do Node para montar caminhos de pastas

const router = express.Router(); // conjunto de rotas desta entidade

// caminho do arquivo JSON que funciona como banco de dados
const arquivo = path.join(__dirname, "..", "db", "empresas.json");

// lê o arquivo e devolve a lista (array) de registros
function lerEmpresas() {
    return JSON.parse(fs.readFileSync(arquivo, "utf-8"));
}

// grava a lista de registros no arquivo
function salvarEmpresas(empresas) {
    fs.writeFileSync(arquivo, JSON.stringify(empresas, null, 2));
}


// ---------- DOCUMENTAÇÃO SWAGGER: campos enviados no cadastro (POST) e na atualização (PUT) ----------
/**
 * @swagger
 * tags:
 *   name: Empresas
 *   description: Cadastro de empresas
 *
 * components:
 *   schemas:
 *     Empresa:
 *       type: object
 *       required: [nome, cnpj]
 *       properties:
 *         nome:
 *           type: string
 *           example: "Acme Ltda"
 *         cnpj:
 *           type: string
 *           example: "11.222.333/0001-81"
 *         email:
 *           type: string
 *           example: "contato@acme.com"
 *         telefone:
 *           type: string
 *           example: "(48) 3333-4444"
 */


// ---------- GET /empresas : lista todos ----------
/**
 * @swagger
 * /empresas:
 *   get:
 *     summary: Lista todas as empresas
 *     tags: [Empresas]
 *     responses:
 *       200:
 *         description: Lista de empresas
 */
router.get("/", function (req, res) {
    const empresas = lerEmpresas();
    empresas.sort((a, b) => a.id - b.id); // ordena pelo id
    res.json(empresas);
});


// ---------- GET /empresas/nome/:nome : busca por nome ----------
/**
 * @swagger
 * /empresas/nome/{nome}:
 *   get:
 *     summary: Busca empresas pelo nome (pode ser parte do nome)
 *     tags: [Empresas]
 *     parameters:
 *       - in: path
 *         name: nome
 *         required: true
 *         schema:
 *           type: string
 *         example: "tech"
 *     responses:
 *       200:
 *         description: Empresas encontradas
 *       404:
 *         description: Nenhuma empresa encontrada com esse nome
 */
router.get("/nome/:nome", function (req, res) {
    const nome = req.params.nome.toLowerCase(); // o que foi digitado, em minúsculas

    // filter devolve TODOS os registros que têm esse texto no nome
    const encontrados = lerEmpresas().filter(e => e.nome.toLowerCase().includes(nome));

    if (encontrados.length === 0) {
        return res.status(404).json({ erro: "Nenhuma empresa encontrada com esse nome" });
    }

    res.json(encontrados);
});


// ---------- GET /empresas/data/:data : busca por data ----------
/**
 * @swagger
 * /empresas/data/{data}:
 *   get:
 *     summary: Busca empresas pela data de cadastro (AAAA-MM-DD)
 *     tags: [Empresas]
 *     parameters:
 *       - in: path
 *         name: data
 *         required: true
 *         schema:
 *           type: string
 *         example: "2026-01-10"
 *     responses:
 *       200:
 *         description: Empresas encontradas
 *       404:
 *         description: Nenhuma empresa cadastrada nessa data
 */
router.get("/data/:data", function (req, res) {
    const data = req.params.data; // exemplo: 2026-01-10

    // startsWith confere se o campo "criado_em" começa com a data informada
    const encontrados = lerEmpresas().filter(e => e.criado_em.startsWith(data));

    if (encontrados.length === 0) {
        return res.status(404).json({ erro: "Nenhuma empresa cadastrada nessa data" });
    }

    res.json(encontrados);
});


// ---------- GET /empresas/:id : busca por id ----------
/**
 * @swagger
 * /empresas/{id}:
 *   get:
 *     summary: Busca uma empresa pelo id
 *     tags: [Empresas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Empresa encontrada
 *       404:
 *         description: Empresa não encontrada
 */
router.get("/:id", function (req, res) {
    const id = Number(req.params.id); // o id vem da URL como texto, então vira número

    // find devolve UM registro (o primeiro com esse id) ou undefined
    const empresa = lerEmpresas().find(e => e.id === id);

    if (!empresa) {
        return res.status(404).json({ erro: "Empresa não encontrada" });
    }

    res.json(empresa);
});


// ---------- POST /empresas : cadastra ----------
/**
 * @swagger
 * /empresas:
 *   post:
 *     summary: Cadastra uma nova empresa
 *     tags: [Empresas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Empresa'
 *     responses:
 *       201:
 *         description: Empresa cadastrada
 *       400:
 *         description: Nome e CNPJ são obrigatórios
 */
router.post("/", function (req, res) {
    const dados = req.body; // dados enviados no corpo da requisição (JSON)

    // 1. confere os campos obrigatórios
    if (!dados.nome || !dados.cnpj) {
        return res.status(400).json({ erro: "Nome e CNPJ são obrigatórios" });
    }

    const empresas = lerEmpresas();

    // 2. gera o próximo id: maior id que existe + 1
    const novoId = empresas.length > 0 ? Math.max(...empresas.map(e => e.id)) + 1 : 1;

    // 3. monta o novo registro
    const novo = {
        id: novoId,
        nome: dados.nome,
        cnpj: dados.cnpj,
        email: dados.email || "",
        telefone: dados.telefone || "",
        criado_em: new Date().toISOString() // data e hora de agora
    };

    // 4. adiciona na lista, grava no arquivo e responde 201 (criado)
    empresas.push(novo);
    salvarEmpresas(empresas);
    res.status(201).json(novo);
});


// ---------- PUT /empresas/:id : atualiza ----------
/**
 * @swagger
 * /empresas/{id}:
 *   put:
 *     summary: Atualiza uma empresa (só os campos enviados)
 *     tags: [Empresas]
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
 *             $ref: '#/components/schemas/Empresa'
 *     responses:
 *       200:
 *         description: Empresa atualizada
 *       404:
 *         description: Empresa não encontrada
 */
router.put("/:id", function (req, res) {
    const empresas = lerEmpresas();
    const empresa = empresas.find(e => e.id === Number(req.params.id));

    // 1. o registro existe?
    if (!empresa) {
        return res.status(404).json({ erro: "Empresa não encontrada" });
    }

    const dados = req.body;

    // 2. troca só os campos que foram enviados
    if (dados.nome !== undefined) empresa.nome = dados.nome;
    if (dados.cnpj !== undefined) empresa.cnpj = dados.cnpj;
    if (dados.email !== undefined) empresa.email = dados.email;
    if (dados.telefone !== undefined) empresa.telefone = dados.telefone;

    // 3. grava no arquivo e responde com o registro atualizado
    salvarEmpresas(empresas);
    res.json(empresa);
});


// ---------- DELETE /empresas/:id : apaga ----------
/**
 * @swagger
 * /empresas/{id}:
 *   delete:
 *     summary: Apaga uma empresa
 *     tags: [Empresas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Empresa apagada (devolve a empresa removida)
 *       404:
 *         description: Empresa não encontrada
 */
router.delete("/:id", function (req, res) {
    const empresas = lerEmpresas();
    const empresa = empresas.find(e => e.id === Number(req.params.id));

    // 1. o registro existe?
    if (!empresa) {
        return res.status(404).json({ erro: "Empresa não encontrada" });
    }

    // 2. filter monta a lista com todos os registros MENOS o apagado, e grava
    const restantes = empresas.filter(e => e.id !== empresa.id);
    salvarEmpresas(restantes);

    // 3. responde com o registro que foi apagado
    res.json(empresa);
});


module.exports = router; // deixa as rotas disponíveis para o src/routes/index.js
