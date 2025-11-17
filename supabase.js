require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuração do cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('❌ Variáveis SUPABASE_URL e SUPABASE_KEY são obrigatórias no .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Busca um produto existente pela URL
 * @param {string} url - URL do produto
 * @returns {Object|null} - Dados do produto ou null se não existir
 */
async function getGameByUrl(url) {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('url', url)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('❌ Erro ao buscar produto:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('❌ Erro ao buscar produto:', err.message);
    return null;
  }
}

/**
 * Cria um novo produto no banco de dados
 * @param {Object} productData - Dados do produto
 * @returns {Object|null} - Produto criado ou null em caso de erro
 */
async function createGame(productData) {
  try {
    const { data, error } = await supabase
      .from('games')
      .insert([{
        url: productData.url,
        primary_price: productData.primary.price,
        primary_stock: productData.primary.stock,
        secondary_price: productData.secondary.price,
        secondary_stock: productData.secondary.stock,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar produto:', error);
      return null;
    }

    console.log('✅ Produto criado com sucesso:', productData.url);
    return data;
  } catch (err) {
    console.error('❌ Erro ao criar produto:', err.message);
    return null;
  }
}

/**
 * Atualiza um produto existente
 * @param {string} gameId - ID do produto
 * @param {Object} productData - Novos dados do produto
 * @returns {boolean} - Sucesso da operação
 */
async function updateGame(gameId, productData) {
  try {
    const { error } = await supabase
      .from('games')
      .update({
        primary_price: productData.primary.price,
        primary_stock: productData.primary.stock,
        secondary_price: productData.secondary.price,
        secondary_stock: productData.secondary.stock,
        updated_at: new Date().toISOString()
      })
      .eq('id', gameId);

    if (error) {
      console.error('❌ Erro ao atualizar produto:', error);
      return false;
    }

    console.log('✅ Produto atualizado com sucesso');
    return true;
  } catch (err) {
    console.error('❌ Erro ao atualizar produto:', err.message);
    return false;
  }
}

/**
 * Registra uma mudança no log
 * @param {string} gameId - ID do produto
 * @param {string} field - Campo alterado
 * @param {string} oldValue - Valor antigo
 * @param {string} newValue - Valor novo
 */
async function logChange(gameId, field, oldValue, newValue) {
  try {
    const { error } = await supabase
      .from('games_logs')
      .insert([{
        game_id: gameId,
        changed_field: field,
        old_value: String(oldValue),
        new_value: String(newValue),
        changed_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('❌ Erro ao registrar log:', error);
    }
  } catch (err) {
    console.error('❌ Erro ao registrar log:', err.message);
  }
}

/**
 * Compara dados novos com os antigos e detecta mudanças
 * @param {Object} oldData - Dados antigos do banco
 * @param {Object} newData - Dados novos do scraper
 * @returns {Array} - Lista de mudanças detectadas
 */
function detectChanges(oldData, newData) {
  const changes = [];

  // Verifica preço primário
  if (oldData.primary_price !== newData.primary.price) {
    changes.push({
      field: 'primary_price',
      oldValue: oldData.primary_price,
      newValue: newData.primary.price
    });
  }

  // Verifica estoque primário
  if (oldData.primary_stock !== newData.primary.stock) {
    changes.push({
      field: 'primary_stock',
      oldValue: oldData.primary_stock,
      newValue: newData.primary.stock
    });
  }

  // Verifica preço secundário
  if (oldData.secondary_price !== newData.secondary.price) {
    changes.push({
      field: 'secondary_price',
      oldValue: oldData.secondary_price,
      newValue: newData.secondary.price
    });
  }

  // Verifica estoque secundário
  if (oldData.secondary_stock !== newData.secondary.stock) {
    changes.push({
      field: 'secondary_stock',
      oldValue: oldData.secondary_stock,
      newValue: newData.secondary.stock
    });
  }

  return changes;
}

module.exports = {
  supabase,
  getGameByUrl,
  createGame,
  updateGame,
  logChange,
  detectChanges
};
