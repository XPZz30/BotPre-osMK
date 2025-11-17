# Bot de Monitoramento de Preços e Estoque

🤖 Bot automatizado para monitorar mudanças de preços e estoque em produtos de lojas NuvemShop.

## 📋 Descrição

Este bot realiza monitoramento contínuo de produtos, detectando alterações em:
- Preço da variação primária
- Estoque da variação primária
- Preço da variação secundária
- Estoque da variação secundária

Quando detecta mudanças, o bot:
- Registra no banco de dados Supabase
- Envia notificações via webhook do Discord
- Mantém histórico completo de alterações

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Puppeteer** - Automação de navegador
- **Supabase** - Banco de dados PostgreSQL
- **Discord Webhooks** - Notificações em tempo real
- **GitHub Actions** - Automação a cada 10 minutos

## 📁 Estrutura do Projeto

```
BotPreços/
├── scraper/
│   └── productScraper.js    # Lógica de scraping com Puppeteer
├── monitor.js               # Arquivo principal do bot
├── supabase.js             # Configuração e funções do Supabase
├── utils.js                # Funções utilitárias
├── package.json            # Dependências do projeto
├── .env.example            # Exemplo de variáveis de ambiente
├── .github/
│   └── workflows/
│       └── bot.yml         # Workflow do GitHub Actions
└── README.md              # Este arquivo
```

## 🗄️ Estrutura do Banco de Dados

### Tabela: `games`

```sql
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL UNIQUE,
  primary_price TEXT,
  primary_stock BOOLEAN,
  secondary_price TEXT,
  secondary_stock BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: `games_logs`

```sql
CREATE TABLE games_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  changed_field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMP DEFAULT NOW()
);
```

## ⚙️ Configuração

### 1️⃣ Clone o repositório

```bash
git clone <seu-repositorio>
cd BotPreços
```

### 2️⃣ Instale as dependências

```bash
npm install
```

### 3️⃣ Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-publica-aqui
SITEMAP_URL=https://sua-loja.nuvemshop.com.br/sitemap.xml
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/seu-webhook-aqui
```

### 4️⃣ Configure o Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Execute os scripts SQL acima para criar as tabelas
4. Copie a URL e a chave pública do projeto

### 5️⃣ Configure o Webhook do Discord

1. No Discord, vá em **Configurações do Canal** → **Integrações** → **Webhooks**
2. Clique em **Criar Webhook**
3. Copie a URL do webhook
4. Cole no arquivo `.env`

## 🖥️ Execução Local

Para testar o bot localmente:

```bash
npm start
```

## ☁️ Automação com GitHub Actions

### Configuração dos Secrets

No GitHub, vá em **Settings** → **Secrets and variables** → **Actions** e adicione:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SITEMAP_URL`
- `DISCORD_WEBHOOK_URL`

### Execução Automática

O bot será executado automaticamente:
- ⏰ **A cada 10 minutos** (configurado no cron)
- 🔄 **Manualmente** via GitHub Actions

Para executar manualmente:
1. Vá em **Actions** no GitHub
2. Selecione **Bot Monitoramento de Preços**
3. Clique em **Run workflow**

## 🎯 Como Funciona

1. **Leitura do Sitemap**: Bot baixa o sitemap.xml da loja
2. **Extração de URLs**: Filtra apenas URLs de produtos
3. **Scraping**: Para cada produto:
   - Acessa a página com Puppeteer
   - Lê preço/estoque da variação primária (padrão)
   - Seleciona a variação secundária
   - Lê preço/estoque da variação secundária
4. **Comparação**: Compara com dados anteriores do banco
5. **Detecção de Mudanças**: Se houver alteração:
   - Atualiza o banco de dados
   - Registra no histórico (`games_logs`)
   - Envia alerta no Discord

## 📊 Exemplo de Alerta

```
🔔 ALTERAÇÃO DETECTADA!

🎮 Produto: JOGO EXEMPLO
🔗 URL: https://loja.com.br/produtos/jogo-exemplo

📌 PRIMÁRIA:
Preço: R$ 29,90 → R$ 24,90
Estoque: ✅ Disponível (sem mudança)

📌 SECUNDÁRIA:
Preço: R$ 19,90 (sem mudança)
Estoque: ❌ Indisponível → ✅ Disponível

⏰ Data: 16/11/2025 14:30:00
```

## 🛡️ Tratamento de Erros

O bot possui tratamento robusto de erros:
- ✅ Try/catch em todas as operações críticas
- ✅ Logs detalhados de cada etapa
- ✅ Fechamento automático do navegador
- ✅ Prevenção de processos zumbis
- ✅ Timeout em requisições HTTP
- ✅ Validação de seletores antes de ler

## 📝 Logs

O bot exibe logs detalhados:
- 🔍 URL sendo processada
- 📊 Dados coletados (preços e estoque)
- 🔔 Mudanças detectadas
- ✅ Confirmação de operações
- ❌ Erros e avisos

## 🔧 Manutenção

### Ajustar frequência de execução

Edite `.github/workflows/bot.yml`:

```yaml
schedule:
  - cron: '*/10 * * * *'  # A cada 10 minutos
  # - cron: '0 * * * *'   # A cada hora
  # - cron: '0 */6 * * *' # A cada 6 horas
```

### Ajustar delay entre produtos

Edite `monitor.js`:

```javascript
const DELAY_BETWEEN_PRODUCTS = 3000; // 3 segundos
```

## 📄 Licença

ISC

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

---

Desenvolvido com ❤️ usando Node.js e Puppeteer
