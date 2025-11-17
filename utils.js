const axios = require('axios');
const xml2js = require('xml2js');

/**
 * Baixa e processa o sitemap.xml da loja
 * @param {string} sitemapUrl - URL do sitemap
 * @returns {Array<string>} - Lista de URLs de produtos
 */
async function getSitemapUrls(sitemapUrl) {
  try {
    console.log('📥 Baixando sitemap...');
    
    const response = await axios.get(sitemapUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    console.log('🔄 Processando sitemap XML...');

    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);

    // Extrai URLs do sitemap
    const urls = [];
    
    if (result.urlset && result.urlset.url) {
      for (const urlEntry of result.urlset.url) {
        if (urlEntry.loc && urlEntry.loc[0]) {
          const url = urlEntry.loc[0];
          
          // Filtra APENAS URLs que contêm /produtos/ seguido de um slug de produto
          // Exemplo: https://mkgames2.lojavirtualnuvem.com.br/produtos/fifa-23-fifa-2023-edicao-standard-para-ps4/
          if (url.includes('/produtos/') && !url.endsWith('/produtos/') && !url.includes('/br/produtos/')) {
            // Verifica se tem um slug de produto após /produtos/
            const parts = url.split('/produtos/');
            if (parts.length > 1 && parts[1].trim() !== '') {
              urls.push(url);
            }
          }
        }
      }
    }

    console.log(`✅ ${urls.length} produtos encontrados no sitemap`);
    return urls;

  } catch (error) {
    console.error('❌ Erro ao processar sitemap:', error.message);
    return [];
  }
}

/**
 * Envia notificação via webhook do Discord
 * @param {string} webhookUrl - URL do webhook
 * @param {Object} changeData - Dados da mudança detectada
 */
async function sendDiscordAlert(webhookUrl, changeData) {
  try {
    const { url, oldData, newData, changes } = changeData;

    // Formata a mensagem do alerta
    let message = '🔔 **ALTERAÇÃO DETECTADA!**\n\n';
    message += `🎮 **Produto:** ${extractProductName(url)}\n`;
    message += `🔗 **URL:** ${url}\n\n`;

    // Detalhes das mudanças na variação PRIMÁRIA
    message += '📌 **PRIMÁRIA:**\n';
    
    const primaryPriceChange = changes.find(c => c.field === 'primary_price');
    if (primaryPriceChange) {
      message += `Preço: ${primaryPriceChange.oldValue} → **${primaryPriceChange.newValue}**\n`;
    } else {
      message += `Preço: ${newData.primary.price} (sem mudança)\n`;
    }

    const primaryStockChange = changes.find(c => c.field === 'primary_stock');
    if (primaryStockChange) {
      const oldStock = primaryStockChange.oldValue === 'true' ? '✅ Disponível' : '❌ Indisponível';
      const newStock = primaryStockChange.newValue === 'true' ? '✅ Disponível' : '❌ Indisponível';
      message += `Estoque: ${oldStock} → **${newStock}**\n`;
    } else {
      message += `Estoque: ${newData.primary.stock ? '✅ Disponível' : '❌ Indisponível'} (sem mudança)\n`;
    }

    // Detalhes das mudanças na variação SECUNDÁRIA
    message += '\n📌 **SECUNDÁRIA:**\n';
    
    const secondaryPriceChange = changes.find(c => c.field === 'secondary_price');
    if (secondaryPriceChange) {
      message += `Preço: ${secondaryPriceChange.oldValue} → **${secondaryPriceChange.newValue}**\n`;
    } else {
      message += `Preço: ${newData.secondary.price} (sem mudança)\n`;
    }

    const secondaryStockChange = changes.find(c => c.field === 'secondary_stock');
    if (secondaryStockChange) {
      const oldStock = secondaryStockChange.oldValue === 'true' ? '✅ Disponível' : '❌ Indisponível';
      const newStock = secondaryStockChange.newValue === 'true' ? '✅ Disponível' : '❌ Indisponível';
      message += `Estoque: ${oldStock} → **${newStock}**\n`;
    } else {
      message += `Estoque: ${newData.secondary.stock ? '✅ Disponível' : '❌ Indisponível'} (sem mudança)\n`;
    }

    message += `\n⏰ **Data:** ${new Date().toLocaleString('pt-BR')}`;

    // Envia o webhook
    await axios.post(webhookUrl, {
      content: message
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Alerta enviado para o Discord');

  } catch (error) {
    console.error('❌ Erro ao enviar webhook do Discord:', error.message);
  }
}

/**
 * Extrai o nome do produto da URL
 * @param {string} url - URL do produto
 * @returns {string} - Nome do produto
 */
function extractProductName(url) {
  try {
    const parts = url.split('/');
    const productSlug = parts[parts.length - 1] || parts[parts.length - 2];
    return productSlug.replace(/-/g, ' ').toUpperCase();
  } catch {
    return 'Produto';
  }
}

/**
 * Adiciona delay entre requisições
 * @param {number} ms - Milissegundos para aguardar
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Formata data/hora no padrão brasileiro
 * @returns {string} - Data formatada
 */
function getFormattedDate() {
  return new Date().toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium'
  });
}

module.exports = {
  getSitemapUrls,
  sendDiscordAlert,
  extractProductName,
  sleep,
  getFormattedDate
};
