const express = require("express");
const fs = require("fs");      // módulo do Node para ler e escrever arquivos
const path = require("path");  // módulo do Node para montar caminhos de pastas

const router = express.Router(); // um "mini servidor" só para as rotas de empresas

// caminho até o arquivo empresas.json
const arquivo = path.join(__dirname, "..", "db", "empresas.json");

// lê o arquivo e transforma o texto JSON em um array de objetos
function lerEmpresas() {
    return JSON.parse(fs.readFileSync(arquivo, "utf-8"));
}
// transforma o array em texto JSON e grava no arquivo
function salvarEmpresas(empresas) {
    fs.writeFileSync(arquivo, JSON.stringify(empresas, null, 2));
}


// ===== DOCUMENTAÇÃO SWAGGER: o "molde" de uma empresa =====
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
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: TechNova Solucoes Digitais Ltda
 *         cnpj:
 *           type: string
 *           example: 12.345.678/0001-90
 *         email:
 *           type: string
 *           example: contato@technova.com
 *         phone:
 *           type: string
 *           example: (48) 3433-1001
 *         created_at:
 *           type: string
 *           example: 2026-01-10T10:00:00Z
 *     EmpresaInput:
 *       type: object
 *       required: [name, cnpj]
 *       properties:
 *         name:
 *           type: string
 *           example: Acme Ltda
 *         cnpj:
 *           type: string
 *           example: 11.222.333/0001-81
 *         email:
 *           type: string
 *           example: contato@acme.com
 *         phone:
 *           type: string
 *           example: (48) 3333-4444
 */


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
// GET /empresas -> lista todas as empresas
router.get("/", function (req, res) {
    const empresas = lerEmpresas();
    res.json(empresas);
});

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
 *         example: tech
 *     responses:
 *       200:
 *         description: Empresas encontradas
 *       404:
 *         description: Nenhuma empresa encontrada
 */
// GET /empresas/nome/:nome -> busca empresas pelo nome (pode ser só um pedaço do nome)
router.get("/nome/:nome", function (req, res) {
    const nome = req.params.nome.toLowerCase(); // o que foi digitado, em minúsculas

    const encontradas = lerEmpresas().filter(emp => emp.name.toLowerCase().includes(nome));

    if (encontradas.length === 0) {
        return res.status(404).json({ erro: "Nenhuma empresa encontrada com esse nome" });
    }

    res.json(encontradas);
});

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
 *         example: 2026-01-10
 *     responses:
 *       200:
 *         description: Empresas cadastradas nessa data
 *       404:
 *         description: Nenhuma empresa cadastrada nessa data
 */
// GET /empresas/data/:data -> busca empresas pela data de cadastro (formato AAAA-MM-DD)
router.get("/data/:data", function (req, res) {
    const data = req.params.data;

    const encontradas = lerEmpresas().filter(emp => emp.created_at.startsWith(data));

    if (encontradas.length === 0) {
        return res.status(404).json({ erro: "Nenhuma empresa cadastrada nessa data" });
    }

    res.json(encontradas);
});

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
// GET /empresas/:id -> busca uma empresa pelo id
router.get("/:id", function (req, res) {
    const id = Number(req.params.id);  // pega o id que veio na URL e transforma em número

    const empresa = lerEmpresas().find(emp => emp.id === id); // procura a empresa com esse id

    if (!empresa) {
        return res.status(404).json({ erro: "Empresa não encontrada" }); // não achou: erro 404
    }

    res.json(empresa); // achou: devolve a empresa
});

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
 *             $ref: '#/components/schemas/EmpresaInput'
 *     responses:
 *       201:
 *         description: Empresa cadastrada
 *       400:
 *         description: Nome ou CNPJ não informados
 *       409:
 *         description: Já existe uma empresa com esse CNPJ
 */
// POST /empresas -> cadastra uma nova empresa
router.post("/", function (req, res) {
    const { name, cnpj, email, phone } = req.body; // pega os dados enviados no corpo

    // 1. validação: nome e CNPJ são obrigatórios
    if (!name || !cnpj) {
        return res.status(400).json({ erro: "Nome e CNPJ são obrigatórios" });
    }

    const empresas = lerEmpresas();

    // 2. não pode repetir CNPJ
    if (empresas.some(emp => emp.cnpj === cnpj)) {
        return res.status(409).json({ erro: "Já existe uma empresa com esse CNPJ" });
    }

    // 3. gera o próximo id: maior id que existe + 1
    const novoId = empresas.length > 0 ? Math.max(...empresas.map(emp => emp.id)) + 1 : 1;

    // 4. monta a nova empresa
    const novaEmpresa = {
        id: novoId,
        name,
        cnpj,
        email: email || "",
        phone: phone || "",
        created_at: new Date().toISOString() // data e hora de agora
    };

    // 5. adiciona na lista e grava no arquivo
    empresas.push(novaEmpresa);
    salvarEmpresas(empresas);

    // 6. responde 201 (criado) com a empresa nova
    res.status(201).json(novaEmpresa);
}); 

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
 *             $ref: '#/components/schemas/EmpresaInput'
 *     responses:
 *       200:
 *         description: Empresa atualizada
 *       404:
 *         description: Empresa não encontrada
 *       409:
 *         description: CNPJ já usado por outra empresa
 */
// PUT /empresas/:id -> atualiza os dados de uma empresa
router.put("/:id", function (req, res) {
    const empresas = lerEmpresas();
    const empresa = empresas.find(emp => emp.id === Number(req.params.id));

    // 1. a empresa existe?
    if (!empresa) {
        return res.status(404).json({ erro: "Empresa não encontrada" });
    }

    const { name, cnpj, email, phone } = req.body;

    // 2. se mudou o CNPJ, ele não pode ser de OUTRA empresa
    if (cnpj && empresas.some(emp => emp.cnpj === cnpj && emp.id !== empresa.id)) {
        return res.status(409).json({ erro: "CNPJ já usado por outra empresa" });
    }

    // 3. troca só o que foi enviado
    if (name) empresa.name = name;
    if (cnpj) empresa.cnpj = cnpj;
    if (email !== undefined) empresa.email = email;
    if (phone !== undefined) empresa.phone = phone;

    // 4. grava e responde com a empresa atualizada
    salvarEmpresas(empresas);
    res.json(empresa);
});

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
 *         example: 6
 *     responses:
 *       200:
 *         description: Empresa apagada (devolve a empresa removida)
 *       404:
 *         description: Empresa não encontrada
 */
// DELETE /empresas/:id -> apaga uma empresa
router.delete("/:id", function (req, res) {
    const empresas = lerEmpresas();
    const empresa = empresas.find(emp => emp.id === Number(req.params.id));

    // 1. a empresa existe?
    if (!empresa) {
        return res.status(404).json({ erro: "Empresa não encontrada" });
    }

    // 2. grava a lista com todas as empresas MENOS a que vai ser apagada
    const restantes = empresas.filter(emp => emp.id !== empresa.id);
    salvarEmpresas(restantes);

    // 3. responde com a empresa que foi apagada
    res.json(empresa);
});

module.exports = router; // deixa o router disponível para o index.js usar


