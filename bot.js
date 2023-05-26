require ('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env
const GoogleImages = require('google-images');
const {TwitterApi} = require('twitter-api-v2');
const schedule = require('node-schedule');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');
const { OpenAIApi, Configuration } = require("openai");



const configuration = new Configuration({
    organization: process.env.OPENAI_ORGANIZATION,
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);




// Configurações da API do Google Custom Search
const client = new GoogleImages(process.env.CX, process.env.GOOGLE_KEY);



const T = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});


async function buscarImagensAnimais() {
  try {
    // get random image from search from google pages to avoid duplicates 1-10
    const num = Math.floor(Math.random() * 10) + 1;
    // procure cute kitty, cute doggy, cute puppy, cute bunny, cute hamster and cute guinea pig
    const query = ['cute kitty', 'cute doggy', 'cute puppy', 'cute bunny', 'cute hamster', 'cute guinea pig'];
    const randomQuery = query[Math.floor(Math.random() * query.length)];
    const resultados = await client.search(randomQuery, { page: num, safe: 'off', num: 5 });
    return resultados.map((resultado) => resultado.url);
  } catch (error) {
    console.error('Ocorreu um erro ao buscar as imagens:', error.message);
    return [];
  }
}


async function gerarFraseDeTerror(mensagem) {
    try {
        const response = await openai.createCompletion({
          model: 'text-davinci-003',
         prompt: mensagem,
        });    
        let fraseDeTerror = response.data.choices[0].text;
        fraseDeTerror = fraseDeTerror.charAt(0).toUpperCase() + fraseDeTerror.slice(1);
        fraseDeTerror.trim();
        console.log('Frase de terror gerada:', fraseDeTerror);
        return fraseDeTerror;
      } catch (error) {
        console.error('Erro ao gerar a frase de terror:', error);
        throw error;
      }
  }

  async function adicionarFraseNaImagem(frase, imagem) {
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext('2d');
    const image = await loadImage(imagem);
    ctx.drawImage(image, 0, 0, 800, 600);
    ctx.font = '32px Arial';
    //cor da fonte amarela
    ctx.fillStyle = '#f5cf25';
    //cor da sombra preta
    ctx.shadowColor = '#000000';
    //tamanho da sombra
    ctx.shadowBlur = 1;
    // cor do contorno preto
    ctx.strokeStyle = '#000000';
    //centraliza a frase na imagem em x e um pouco abaixo do centro em y
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    //escreve a frase na imagem de maneira centralizada
    ctx.fillText(frase, 400, 500);

    const novaImagem = path.join(__dirname, 'imagem_com_frase.jpg');
    const stream = canvas.createJPEGStream();
    const outFile = fs.createWriteStream(novaImagem);
    stream.pipe(outFile);
    return novaImagem;
  }


async function publicarNoTwitter(Image) {
   const client = T.readWrite;
   const mediaIds = await client.v1.uploadMedia(Image)
   await client.v2.tweet('', { media:{media_ids: [mediaIds] }});
}

// Função para gerar e publicar uma imagem de terror a cada hora
async function publicarImagemTerror() {
    console.log('Gerando e publicando uma imagem de terror...')
    try {
      const imagensAnimais = await buscarImagensAnimais();
      const mensagem = 'Diga algo muito assustador em poucas até 9 palavras';
      const fraseAssustadora = await gerarFraseDeTerror(mensagem);
      const imagem = imagensAnimais[0];
      const imagemComFrase = await adicionarFraseNaImagem(fraseAssustadora, imagem);
      setTimeout(function(){ publicarNoTwitter(imagemComFrase); }, 10000);
    } catch (error) {
      console.error('Ocorreu um erro:', error.message);
    }
  }

// Agendando a publicação de imagens de terror a cada 4 horas
schedule.scheduleJob('0 */4 * * *', publicarImagemTerror);
