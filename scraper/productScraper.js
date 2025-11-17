const puppeteer = require('puppeteer');

/**
 * Extrai preço e estoque de um produto com suas variações
 * @param {string} url - URL do produto
 * @returns {Object|null} - Objeto com dados das variações ou null em caso de erro
 */
async function scrapeProduct(url) {
  let browser;
  
  try {
    console.log(`🔍 Acessando produto: ${url}`);

    // Inicializa o navegador
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Configura user agent para evitar bloqueios
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navega até a página do produto
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Aguarda o seletor de preço carregar
    await page.waitForSelector('#price_display', { timeout: 10000 });

    // ========================================
    // 1️⃣ LER VARIAÇÃO PRIMÁRIA (já selecionada por padrão)
    // ========================================
    
    console.log('📊 Lendo variação PRIMÁRIA...');
    
    // Aguarda um pouco para garantir que os elementos estão carregados
    await page.waitForTimeout(500);

    // Lê o preço da variação primária
    const primaryPrice = await page.$eval('#price_display', el => el.textContent.trim())
      .catch(() => 'Indisponível');

    // Verifica se há estoque na variação primária (verifica o atributo value do input)
    const primaryStockValue = await page.$eval('[data-store="product-buy-button"]', el => el.value.toLowerCase())
      .catch(() => 'sem estoque');
    const primaryStock = !primaryStockValue.includes('sem estoque');

    console.log(`  ✅ Primária - Preço: ${primaryPrice} | Estoque: ${primaryStock ? 'Disponível' : 'Indisponível'}`);

    // ========================================
    // 2️⃣ TROCAR PARA VARIAÇÃO SECUNDÁRIA
    // ========================================
    
    console.log('📊 Lendo variação SECUNDÁRIA...');

    // Verifica se existe o seletor de variação
    const hasVariationSelector = await page.$('[data-variant-id="variation_1"]')
      .then(element => element !== null)
      .catch(() => false);

    let secondaryPrice = 'Indisponível';
    let secondaryStock = false;

    if (hasVariationSelector) {
      // Seleciona a variação secundária
      await page.select('[data-variant-id="variation_1"]', 'SECUNDÁRIA');

      // Aguarda a atualização do preço (importante!)
      await page.waitForTimeout(800);

      // Lê o preço da variação secundária
      secondaryPrice = await page.$eval('#price_display', el => el.textContent.trim())
        .catch(() => 'Indisponível');

      // Verifica se há estoque na variação secundária (verifica o atributo value do input)
      const secondaryStockValue = await page.$eval('[data-store="product-buy-button"]', el => el.value.toLowerCase())
        .catch(() => 'sem estoque');
      secondaryStock = !secondaryStockValue.includes('sem estoque');

      console.log(`  ✅ Secundária - Preço: ${secondaryPrice} | Estoque: ${secondaryStock ? 'Disponível' : 'Indisponível'}`);
    } else {
      console.log('  ⚠️ Produto não possui variação secundária');
    }

    // Retorna os dados coletados
    return {
      url,
      primary: {
        price: primaryPrice,
        stock: primaryStock
      },
      secondary: {
        price: secondaryPrice,
        stock: secondaryStock
      }
    };

  } catch (error) {
    console.error(`❌ Erro ao fazer scraping do produto: ${url}`);
    console.error(`   Motivo: ${error.message}`);
    return null;
  } finally {
    // Sempre fecha o navegador para evitar processos zumbis
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = {
  scrapeProduct
};
