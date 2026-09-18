const btnListar = document.querySelectorAll('[data-action="listar"]') // pega TODOS osbotões de listar 
const btnDelete = document.querySelectorAll('[data-action="deletar"]')// pega todos os botõs de delete
const listaEmpresas = document.querySelector("#showlistEmpresas"); // tabela da aba empresas
const listaUsuarios = document.querySelector("#showlistUsuarios"); // tabela da aba usuarios
const abaEmpresa = document.querySelector("#tab-empresas"); // aba de empresas 
const abaUsuarios = document.querySelector("#tab-usuarios"); // aba de usuarios




//ABA DE LISTAGEM 


// listar os itens de users
btnListar.forEach(function (btn) { // o "[data-action="listar"]" ele retornar uma lista dos itens com "listar" e faz um for para percorrer todos os itens dentro da variavel btn
btn.addEventListener("click", function (evento){
    evento.preventDefault();
    if (abaUsuarios.checked){ // verifica se esta selecionado a aba usuarios, para usar ".checked" o elemento tem q ser type="radio"
        //faz a requisição para os clientes
        fetch(`http://localhost:3080/clients`, {
        method: "GET"
      })
        .then(res => res.json())
        .then(dados => {
            listaUsuarios.innerHTML = "";
//          console.log(dados);

            dados.forEach(function (cliente) { // um for para percorrer todos os clientes
                listaUsuarios.innerHTML += `
                    <tr>
                        <td>${cliente.name}</td>
                        <td>${cliente.email}</td>
                        <td>${cliente.role}</td>
                        <td></td>
                    </tr>
                `;
            });
        });
    }
}); 
}); 


// listar os itens de empresas
btnListar.forEach(function (btn){
btn.addEventListener("click", function (evento){
    evento.preventDefault();
    if(abaEmpresa.checked){ // verifica se esta selecionado a aba empresas, para usar ".checked" o elemento tem q ser type="radio"  
        fetch();  // continuar
    } 
}); 
});









//ABA DE EXCLUSÃO
btnDelete.forEach(function (btn){

    btn.addEventListener("click", function(evento){

        if (abaUsuarios.checked){ // verifica se ta dentro de users
            const id = document.querySelector('#panel-usuarios [name="nome"]').value; // Le oq esta dentro do campo "nome" no painel de usuarios
            if (id){ //retorna true se tiver algo escitro, se não retorna false
                const campos = document.querySelectorAll('.grid .field');// seleciona os .field dentro do .grid
                campos.forEach((campo, i) =>{ //for  passa por todos os campos
                    if (i !== 0) campo.remove(); //remove tods menos o "nome"
                });
            fetch(`http://localhost:3080/clients/${id}`, {
            method: "DELETE"
            })
            .then(res => res.json())
            .then(dados => {
                listaUsuarios.innerHTML = "";

                dados.forEach(function (cliente) {
                    listaUsuarios.innerHTML += `
                    <tr>
                        <td>${cliente.name}</td>
                        <td>${cliente.email}</td>
                        <td>${cliente.role}</td>
                        <td></td>
                    </tr>
                `;
                });

            });
            } 
            else{
                alert("insira o valor"); // caso n tenha iniserido o restorana o alerta
            } 

        } 
    }); 
}); 