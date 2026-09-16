const express = require("express");
const app = express();
const path = require("path");
const users = require("../db/users.json"); // define o caminho da rota do "banco de dados". Em caso de um banco real, seria uma conexão com banco de dados na web

app.use(express.json()); // o express precisa usar a notação json nesse caso (não temos banco de dado, só jsons)
app.use(express.static("public"));


//definido a rota pincipal
app.use(express.static(path.join(__dirname, "public")));
app.get("/", function(req, res){
    res.sendFile(path.join(__dirname, "public", "index.html"));
});



// verbos http
//GET, receber dados de um Resource. (clients)
//POST, enviar dados ou informações para serem processados por um resource. (clients)
//PUT, atualizar os dados de um resource. (clients)
//DELETE, deleter um resource. (clients)


//app.get("/clients");
//app.post("/clients");
//app.put("/clients");
//app.delete("/clients");


//http://localhost:3000/clients
//client é o end point, clients é o nome do meu resource


// app.get("/clients"); pega os clientes, para pegar um unico cliente use:
//app.get("/clients/:id"); isso vale para todos os verbos.









//REQUISIÇÕES DE TABELA USUARIOS


//reotorna toda a tabela de clientes
app.get("/clients", function(req, res){ //req (request,requisição) pega o res (response, resposta), tudo da biblioteca express
    res.json(users); // resposta (res) em json sobre a tabela users
}); 



//procura um cadastro de cliente pelo id
app.get("/clients/:id", function(req, res) {
    const { id } = req.params; //params são os paramnetros da requisção, nesse caso, é o 111id
    const client = users.find(cli => cli.id === Number(id)); // procure o client na tabela users q for igual a id e coloque na variael client e transfora em numero em vez de sting

    if(!client) return res.status(404).sendFile(path.join(__dirname, "public", "404.html")); // Caso n tenha o cliente, retornar 404

    res.json(client); //retorna client em json
});




//adiciona um cliente
app.post("/clients", function(req, res) {//mesmo ele usando o mesmo diretorio de retorno da tabela, ele entregaum resultado diferente por contado do "post" um verbo diferente
    const { name, email, role} = req.body; //quais as "colunas" podem ser adicionadas e salva


    res.json({name, email, role}); // retorna oq foi salvo em json
});


//atualiza um cliente
app.put("/clients/:id", function(req, res) {
    const { id } = req.params; 
    const client = users.find(cli => cli.id === Number(id)); 

    if(!client) return res.status(404).sendFile(path.join(__dirname, "public", "404.html"));

    const { name } = req.body; //pegua o nome que o usuario manda

    client.name = name; //e define ele como client.name



    res.json(client); // responde o cliente atualizado
});



//deeleta um cliente
app.delete("/clients/:id", function(req, res) {
    const { id } = req.params; 
    const clientsFiltered = users.filter(client => client.id != Number(id)); // ele filtra os clients, e todos que forem diferentes do id que eu passei serão retornados na lista
                                                                               // seria um "delete" q n deleta, só oculta
    if(!clientsFiltered) return res.status(404).sendFile(path.join(__dirname, "public", "404.html"));

    res.json(clientsFiltered); 
});







//REQUISIÇÕES DA TABELA EMPRESAS




// erro 404
app.use(function (req, res) {  
    res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});

app.listen(3080, function(){
console.log("rodando na porta 3080");
});
