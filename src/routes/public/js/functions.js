const btnListar = document.querySelectorAll('[data-action="listar"]') // pega TODOS osbotões de listar 
const listaEmpresas = document.querySelector("#showlistEmpresas"); // tabela da aba empresas
const listaUsuarios = document.querySelector("#showlistUsuarios"); // tabela da aba usuarios
const abaEmpresa = document.querySelector("#tab-empresas"); // aba de empresas 
const abaUsuarios = document.querySelector("#tab-usuarios"); // aba de usuarios


// listar os itens
btnListar.forEach(function (btn) { // o "[data-action="listar"]" ele retornar uma lista dos itens com "listar" e faz um for para percorrer todos
btn.addEventListener("click", function (evento){
    evento.preventDefault();
    if (abaUsuarios.checked){ // verifica se esta selecionado a aba usuarios, para usar ".checked" o elemento tem q ser type="radio"
        //faz a requisição para os clientes
        fetch("http://localhost:3080/clients")
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

if (abaEmpresas.checked){ // verifica se esta selecionado a aba empresas, para usar ".checked" o elemento tem q ser type="radio"  

}
});
});