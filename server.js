//1. Import Bibliotecas
const express =  require('express');
const mongoose =  require('mongoose');
const cors = require('cors');

//2. consfigurar o servidor Express
const app = express();
app.use(cors()); //Permite que o front end acesse este back-end
app.use(express.json()); //Permite que o servidor entenda JSON

//3. conectar ao mongoDB
const MongoURI =''; //colocar a url do seu projeto no mongoDB
mongoose.connect(MongoURI,{ useNewParser: true, useUnifieldTopology: true})
    .then(()=> console.log('Conectado ao MongoDB com sucesso!'))
    .catch(err => console.error('Erro ao conectar ao MongoDB', err));

//4. Definir o "Schema" - A estrutura dos seus dados
// Isso deve corresponsder à estrura do seu formulário

const relatorioSchema = new mongoose.Schema({
    titulo:String,
    tipo:String,
    ano:Number,
    status:String,
    data_envio: Date,
    responsavel:{
        nome: String,
        cargo:String,
        departamento: String
    },
    palavras_chave: [String],
    revisoes:[{
        data: Date,
        revisado_por:String,
        comentario : String
    }]
});

//5. Criar o "Model" - O objeto que representa sua coleção no banco
const Relatório = mongoose.model('Relatorio', relarioSchema);

//6.Criar a "Rota" ou "Endpoint" - o URL que o front-end irá chamar
app.post('./salvar-relatorio', async(req, res) =>{
    try{
        //Pega os dados que o front-end enviou (estão em req.body)
        const dadosDoFormulario = req.body;

        //Cria um novo documento com base nos dados
        const novoRelatorio = new Relatório(dadosDoFormulario)

        // Salva o documento no banco de dados
        await novoRelatorio.save();

        // Envia uma resposta de sucesso de volta para o front-end
        res.status(201).json({message: 'Relatorio salvo com sucesso!'});
        console.log('Relatório salvo:', novoRelatoriio.titulo);
    }catch(error){
        //se der erro, envia uma mensagem de erro
        res.stutus(500).json({ message: 'Ocorreu um erro ao salvar o relatório.',
        error:error});
        console.error('Erro ao salvar: ',error);
    }
});

//7 Inciar o servidor.
const PORT = 3000;
app.listen(PORT, () =>{
    console.log( `Servidor back-end rodando na porta ${PORT}`);
});
