// --- SELECTORES DE ELEMENTOS ---
const palavraInput = document.getElementById("palavra_input");
const listaPalavras = document.getElementById("lista_palavras");
const revisoesContainer = document.getElementById("revisoesContainer");
const form = document.getElementById("documentForm");
const output = document.getElementById("jsonOutput");
const copyBtn = document.getElementById("copyJsonbtn");
const gerarPdfBtn = document.getElementById("gerarPdfBtn");

let palavras = [];

// --- FUNÇÕES DE MANIPULAÇÃO DO FORMULÁRIO ---
// Adiciona palavras-chave ao pressionar Enter
palavraInput.addEventListener("keypress", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    const palavra = palavraInput.value.trim();
    if (palavra && !palavras.includes(palavra)) {
      palavras.push(palavra); // insere no vetor
      atualizarPalavras();
      palavraInput.value = "";
    }
  }
});

// Atualiza a lista de palavras-chave na tela e permite a remoção
function atualizarPalavras() {
  listaPalavras.innerHTML = "";
  palavras.forEach(p => {
    const li = document.createElement("li");
    li.textContent = p;
    li.addEventListener("click", () => { // atribuiçao de funçao
      palavras = palavras.filter(item => item !== p);
      atualizarPalavras();
    });
    listaPalavras.appendChild(li); //puxa para dentro
  });
}

// Adiciona dinamicamente os campos para uma revisão
document.getElementById("addRevisão").addEventListener("click", () => {
  const div = document.createElement("div");
  div.classList.add("revisao");
   // crase é para vairaveis de ambiente e linguagens externas
  div.innerHTML = `
    <label>Data:</label>
    <input type="datetime-local" class="data_revisao" required>
    <label>Revisado por:</label>
    <input type="text" class="revisado_por" required>
    <label>Comentário:</label>
    <input type="text" class="comentario_revisao" required>
  `;
  revisoesContainer.appendChild(div);
});

// --- FUNÇÃO CENTRAL PARA COLETAR OS DADOS DO FORMULÁRIO ---
function construirDocumento() {
  // Coleta todas as revisões adicionadas
  const revisoesInput = Array.from(document.querySelectorAll(".revisao"));// . é uma classe
  const revisoes = revisoesInput.map(div => ({
    data: div.querySelector(".data_revisao").value,
    revisado_por: div.querySelector(".revisado_por").value,
    comentario: div.querySelector(".comentario_revisao").value
  }));

  const documento = {
    titulo: document.getElementById("titulo").value,
    tipo: document.getElementById("tipo").value,
    ano: parseInt(document.getElementById("ano").value),
    status: document.getElementById("status").value,
    data_envio: document.getElementById("data_envio").value,
    responsavel: {
      nome: document.getElementById("nome_responsavel").value,
      cargo: document.getElementById("cargo_responsavel").value,
      departamento: document.getElementById("departamento_responsavel").value
    },
    palavras_chave: palavras,
    revisoes: revisoes
  };

  return documento;
}

// --- LÓGICA DE GERAÇÃO (JSON E PDF) ---
// Evento para gerar o documento JSON no formato MongoDB
form.addEventListener("submit", e => {
  e.preventDefault();
  const documento = construirDocumento();

  const documentoMongo = JSON.parse(JSON.stringify(documento));
  documentoMongo.data_envio = { "$date": documento.data_envio };
  documentoMongo.revisoes.forEach(rev => {
    rev.data = { "$date": rev.data };
  });

  output.textContent = JSON.stringify(documentoMongo, null, 2);
});

// Evento para o botão de gerar o relatório em PDF
gerarPdfBtn.addEventListener("click", () => {
  const doc = construirDocumento();

  //validadçao para garantir que o formulario foi preenchido
  if (!doc.titulo) {
    alert("Por favor, preencha o formulário antes de gerar o PDF.");
    return;
  }

  //acessa a biblioteca jsPDF que foi carregado no HTML
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  let y = 20;//posiçao vertical inicial do df

  // --- Cabeçalho ---
  pdf.setFontSize(18);
  pdf.text(doc.titulo, 105, y, { align: 'center' });
  y += 15;

  pdf.setFontSize(12);
  pdf.text(`Tipo: ${doc.tipo}`, 20, y);
  pdf.text(`Ano: ${doc.ano}`, 120, y);
  y += 7;

  pdf.text(`Status: ${doc.status}`, 20, y);
  pdf.text(`Data de Envio: ${new Date(doc.data_envio).toLocaleDateString('pt-BR')}`, 120, y);
  y += 15;

  // --- Responsável ---
  pdf.setFontSize(14);
  pdf.text("Responsável", 20, y);
  y += 7;

  pdf.setFontSize(12);
  pdf.text(`- Nome: ${doc.responsavel.nome}`, 25, y);
  y += 7;
  pdf.text(`- Cargo: ${doc.responsavel.cargo}`, 25, y);
  y += 7;
  pdf.text(`- Departamento: ${doc.responsavel.departamento}`, 25, y);
  y += 15;

  // --- Palavras-chave ---
  pdf.setFontSize(14);
  pdf.text("Palavras-chave", 20, y);
  y += 7;
  pdf.setFontSize(12);
  pdf.text(doc.palavras_chave.join(', '), 25, y);
  y += 15;

  // --- Revisões ---
  pdf.setFontSize(14);
  pdf.text("Revisões", 20, y);
  y += 7;
  pdf.setFontSize(12);

  if (doc.revisoes.length > 0) {
    doc.revisoes.forEach((rev, index) => {
      if (index > 0) y += 5;
      pdf.text(`Revisão ${index + 1}:`, 25, y);
      y += 7;
      pdf.text(`- Data: ${new Date(rev.data).toLocaleString('pt-BR')}`, 30, y);
      y += 7;
      pdf.text(`- Revisor: ${rev.revisado_por}`, 30, y);
      y += 7;

      const maxWidth = 165;
      const comentarioLines = pdf.splitTextToSize(`- Comentário: ${rev.comentario}`, maxWidth);
      pdf.text(comentarioLines, 30, y);
      y += (comentarioLines.length * 5) + 5;
    });
  } else {
    pdf.text("Nenhuma revisão adicionada", 25, y);
  }

  pdf.save(`${doc.titulo.replace(/ /g, '_')}.pdf`);
});

// --- FUNÇÃO DE COPIAR JSON ---
copyBtn.addEventListener("click", () => {
  const textoParaCopiar = output.textContent;

  if (textoParaCopiar.trim() === "") {
    alert("Gere um documento primeiro para poder copiar!");
    return;
  }

  navigator.clipboard.writeText(textoParaCopiar).then(() => {
    const textoOriginal = copyBtn.textContent;
    copyBtn.textContent = "Copiado!";
    setTimeout(() => {
      copyBtn.textContent = textoOriginal;
    }, 2000);
  }).catch(err => {
    console.error("Falha ao copiar o texto: ", err);
    alert("Ocorreu um erro ao tentar copiar.");
  });
});

// --- ENVIO PARA O BACK-END ---
form.addEventListener("submit", async e => {
  e.preventDefault();

  const documento = construirDocumento();

  const documentoMongo = JSON.parse(JSON.stringify(documento));
  documentoMongo.data_envio = { "$date": documento.data_envio };
  documentoMongo.revisoes.forEach(rev => {
    rev.data = { "$date": rev.data };
  });

  output.textContent = JSON.stringify(documentoMongo,null,2);

// 3. --- Enviar os dados para o back end ---
    try{
        const response = await fetch('http://localhost:3000/salvar-relatorio',{
            method: 'POST',
            headers:{
                'Content-type':'applixation/json',
            },
            // Enviamos o objeto 'documento' original,sem o formato "$date"
            body: JSON.stringify(documento),
        });
        const result = await response.json();

        if(response.ok){
            alert('Relatório salvo no banco de dados com sucesso!');

        }else{
            alert('Falha ao salvar no banco de dados: '+ result.message);
        }
    }catch(error){
        console.error('Erro de comunicação com o servidor: ', error);
        alert('Não foi possível conectar ao servidor. Verifique se o Back-end está rodando.');
    }

    });

    //npm init -y
    //npm install cors express mongoose