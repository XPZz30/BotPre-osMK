require('dotenv').config();
const { scrapeProduct } = require('./scraper/productScraper');
const { 
  getGameByUrl, 
  createGame, 
  updateGame, 
  logChange, 
  detectChanges 
} = require('./supabase');
const { 
  getSitemapUrls, 
  sendDiscordAlert, 
  sleep, 
  getFormattedDate 
} = require('./utils');

// Configurações
const SITEMAP_URL = process.env.SITEMAP_URL;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const DELAY_BETWEEN_PRODUCTS = 0; // Sem delay - máxima velocidade

/**
 * Processa um único produto
 * @param {string} url - URL do produto
 */
async function processProduct(url) {
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🎯 Processando: ${url}`);
    console.log(`${'='.repeat(80)}`);

    // 1️⃣ Faz scraping do produto
    const scrapedData = await scrapeProduct(url);
    
    if (!scrapedData) {
      console.error('⚠️ Não foi possível fazer scraping deste produto. Pulando...');
      return;
    }

    // 2️⃣ Busca produto no banco de dados
    const existingGame = await getGameByUrl(url);

    // 3️⃣ Se o produto não existe, cria um novo registro
    if (!existingGame) {
      console.log('🆕 Produto novo detectado! Criando no banco de dados...');
      await createGame(scrapedData);
      console.log('✅ Produto registrado com sucesso');
      return;
    }

    // 4️⃣ Se existe, compara os dados
    console.log('🔍 Comparando com dados anteriores...');
    const changes = detectChanges(existingGame, scrapedData);

    // 5️⃣ Se não houve mudanças, apenas loga
    if (changes.length === 0) {
      console.log('✅ Nenhuma mudança detectada');
      return;
    }

    // 6️⃣ Se houve mudanças, atualiza o banco e envia alerta
    console.log(`🔔 ${changes.length} mudança(s) detectada(s)!`);
    
    // Registra cada mudança no log
    for (const change of changes) {
      console.log(`   📝 ${change.field}: ${change.oldValue} → ${change.newValue}`);
      await logChange(existingGame.id, change.field, change.oldValue, change.newValue);
    }

    // Atualiza o registro principal
    await updateGame(existingGame.id, scrapedData);

    // Envia alerta no Discord
    if (DISCORD_WEBHOOK_URL) {
      console.log('📢 Enviando alerta para o Discord...');
      await sendDiscordAlert(DISCORD_WEBHOOK_URL, {
        url,
        oldData: existingGame,
        newData: scrapedData,
        changes
      });
    }

    console.log('✅ Processamento concluído com sucesso');

  } catch (error) {
    console.error(`❌ Erro ao processar produto ${url}:`, error.message);
  }
}

/**
 * Função principal do bot
 */
async function runBot() {
  try {
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║      🤖 BOT DE MONITORAMENTO DE PREÇOS E ESTOQUE             ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log(`\n⏰ Iniciado em: ${getFormattedDate()}\n`);

    // Validação das variáveis de ambiente
    if (!SITEMAP_URL) {
      throw new Error('❌ Variável SITEMAP_URL não configurada no .env');
    }

    // 1️⃣ Baixa URLs do sitemap
    const productUrls = await getSitemapUrls(SITEMAP_URL);

    if (productUrls.length === 0) {
      console.log('⚠️ Nenhum produto encontrado no sitemap');
      return;
    }

    console.log(`\n📦 Total de produtos para processar: ${productUrls.length}\n`);

    // 2️⃣ Processa cada produto
    for (let i = 0; i < productUrls.length; i++) {
      const url = productUrls[i];
      
      console.log(`\n[${i + 1}/${productUrls.length}]`);
      await processProduct(url);

      // Sem delay - processamento máximo de velocidade
    }

    // 3️⃣ Finalização
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                  ✅ BOT FINALIZADO COM SUCESSO               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log(`⏰ Finalizado em: ${getFormattedDate()}\n`);

  } catch (error) {
    console.error('\n❌ ERRO FATAL NO BOT:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Executa o bot
if (require.main === module) {
  runBot();
}

module.exports = { runBot, processProduct };
