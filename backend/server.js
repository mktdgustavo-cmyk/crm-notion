const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração do Notion
const NOTION_TOKEN = process.env.NOTION_TOKEN || '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';
const DATABASE_ID = process.env.DATABASE_ID || '259bf5178fd480be9d03e67b3f452c4a';

app.use(cors());
app.use(express.json());

// Servir frontend na raiz
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CRM Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white">
  <div id="app"></div>

  <script>
    const API_URL = window.location.origin;
    let deals = [];

    async function fetchDeals() {
      document.getElementById('app').innerHTML = '<div class="flex items-center justify-center h-screen"><div class="text-center"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div><p class="text-gray-400">Carregando...</p></div></div>';
      
      try {
        const response = await fetch(API_URL + '/api/deals');
        const result = await response.json();
        
        if (result.success) {
          deals = result.data.map(deal => ({
            ...deal,
            stage: getStageFromStatus(deal.status)
          }));
          renderDashboard();
        }
      } catch (error) {
        console.error('Erro:', error);
        document.getElementById('app').innerHTML = '<div class="flex items-center justify-center h-screen"><div class="text-center"><p class="text-red-500 text-xl">❌ Erro ao carregar dados</p></div></div>';
      }
    }

    function getStageFromStatus(status) {
      const todoStatuses = ['Novo Lead', 'Tentativa de contato', 'Lead Interessado', 'Contato Realizado'];
      const completeStatuses = ['Contrato enviado', 'Iniciar Implementação', 'PERDA', 'ARQUIVO'];
      
      if (todoStatuses.includes(status)) return 'to_do';
      if (completeStatuses.includes(status)) return 'complete';
      return 'in_progress';
    }

    function getStatusColor(status) {
      if (!status) return 'bg-gray-500';
      if (status.includes('PERDA')) return 'bg-red-500';
      if (status.includes('Contrato') || status.includes('Iniciar')) return 'bg-green-500';
      if (status.includes('Congelado')) return 'bg-blue-400';
      if (status.includes('Follow')) return 'bg-yellow-500';
      return 'bg-purple-500';
    }

    function renderDashboard() {
      const wonDeals = deals.filter(d => d.status === 'Iniciar Implementação' || d.status === 'Contrato enviado');
      const lostDeals = deals.filter(d => d.status === 'PERDA');
      
      const metrics = {
        total: deals.length,
        won: wonDeals.length,
        lost: lostDeals.length,
        wonValue: wonDeals.reduce((sum, d) => sum + d.value, 0)
      };

      const conversionRate = (metrics.won + metrics.lost) > 0 
        ? ((metrics.won / (metrics.won + metrics.lost)) * 100).toFixed(1) 
        : 0;

      const avgClosingTime = wonDeals.length > 0 
        ? Math.floor(wonDeals.reduce((sum, d) => {
            const days = Math.floor((new Date(d.lastUpdate) - new Date(d.createdAt)) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / wonDeals.length)
        : 0;

      const dealsByStage = {
        to_do: deals.filter(d => d.stage === 'to_do'),
        in_progress: deals.filter(d => d.stage === 'in_progress'),
        complete: deals.filter(d => d.stage === 'complete')
      };

      document.getElementById('app').innerHTML = \`
        <div class="bg-gray-800 shadow-lg">
          <div class="max-w-7xl mx-auto px-4 py-4">
            <div class="flex justify-between items-center">
              <div>
                <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
                  CRM Dashboard
                </h1>
                <p class="text-sm text-gray-400">
                  ✅ Conectado ao Notion • \${deals.length} oportunidades
                </p>
              </div>
              <button onclick="fetchDeals()" class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition">
                🔄 Atualizar
              </button>
            </div>
          </div>
        </div>

        <div class="max-w-7xl mx-auto px-4 py-8">
          <!-- Métricas -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-gray-800 p-6 rounded-xl shadow-lg">
              <p class="text-sm text-gray-400">Total de Oportunidades</p>
              <p class="text-3xl font-bold mt-2">\${metrics.total}</p>
            </div>
            <div class="bg-gray-800 p-6 rounded-xl shadow-lg">
              <p class="text-sm text-gray-400">Taxa de Conversão</p>
              <p class="text-3xl font-bold mt-2 text-green-500">\${conversionRate}%</p>
            </div>
            <div class="bg-gray-800 p-6 rounded-xl shadow-lg">
              <p class="text-sm text-gray-400">Tempo Médio</p>
              <p class="text-3xl font-bold mt-2">\${avgClosingTime} dias</p>
            </div>
            <div class="bg-gray-800 p-6 rounded-xl shadow-lg">
              <p class="text-sm text-gray-400">Valor Ganho</p>
              <p class="text-2xl font-bold mt-2 text-green-500">R$ \${metrics.wonValue.toLocaleString('pt-BR')}</p>
            </div>
          </div>

          <!-- Kanban -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- To-Do -->
            <div class="bg-gray-800 rounded-xl shadow-lg p-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold text-lg flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-gray-500"></div>
                  To-Do
                </h3>
                <span class="px-3 py-1 rounded-full text-sm font-semibold bg-gray-700">\${dealsByStage.to_do.length}</span>
              </div>
              <div class="space-y-3 max-h-96 overflow-y-auto">
                \${dealsByStage.to_do.map(deal => \`
                  <div class="bg-gray-700 p-4 rounded-lg cursor-pointer hover:bg-gray-600 transition border-l-4 border-gray-500">
                    <h4 class="font-semibold mb-2">\${deal.title}</h4>
                    <div class="inline-block px-2 py-1 rounded text-xs text-white mb-2 \${getStatusColor(deal.status)}">
                      \${deal.status || 'Sem status'}
                    </div>
                    \${deal.value > 0 ? \`<p class="text-sm text-green-500 font-semibold">R$ \${deal.value.toLocaleString('pt-BR')}</p>\` : ''}
                    \${deal.gk ? \`<p class="text-xs text-gray-400 mt-2">GK: \${deal.gk}</p>\` : ''}
                  </div>
                \`).join('')}
              </div>
            </div>

            <!-- Em Progresso -->
            <div class="bg-gray-800 rounded-xl shadow-lg p-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold text-lg flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                  Em Progresso
                </h3>
                <span class="px-3 py-1 rounded-full text-sm font-semibold bg-blue-900 text-blue-500">\${dealsByStage.in_progress.length}</span>
              </div>
              <div class="space-y-3 max-h-96 overflow-y-auto">
                \${dealsByStage.in_progress.map(deal => \`
                  <div class="bg-gray-700 p-4 rounded-lg cursor-pointer hover:bg-gray-600 transition border-l-4 border-blue-500">
                    <h4 class="font-semibold mb-2">\${deal.title}</h4>
                    <div class="inline-block px-2 py-1 rounded text-xs text-white mb-2 \${getStatusColor(deal.status)}">
                      \${deal.status || 'Sem status'}
                    </div>
                    \${deal.value > 0 ? \`<p class="text-sm text-green-500 font-semibold">R$ \${deal.value.toLocaleString('pt-BR')}</p>\` : ''}
                    \${deal.gk ? \`<p class="text-xs text-gray-400 mt-2">GK: \${deal.gk}</p>\` : ''}
                  </div>
                \`).join('')}
              </div>
            </div>

            <!-- Completo -->
            <div class="bg-gray-800 rounded-xl shadow-lg p-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold text-lg flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-green-500"></div>
                  Completo
                </h3>
                <span class="px-3 py-1 rounded-full text-sm font-semibold bg-green-900 text-green-500">\${dealsByStage.complete.length}</span>
              </div>
              <div class="space-y-3 max-h-96 overflow-y-auto">
                \${dealsByStage.complete.map(deal => \`
                  <div class="bg-gray-700 p-4 rounded-lg cursor-pointer hover:bg-gray-600 transition border-l-4 \${deal.status === 'PERDA' ? 'border-red-500' : 'border-green-500'}">
                    <h4 class="font-semibold mb-2">\${deal.title}</h4>
                    <div class="inline-block px-2 py-1 rounded text-xs text-white mb-2 \${getStatusColor(deal.status)}">
                      \${deal.status || 'Sem status'}
                    </div>
                    \${deal.value > 0 ? \`<p class="text-sm text-green-500 font-semibold">R$ \${deal.value.toLocaleString('pt-BR')}</p>\` : ''}
                    \${deal.gk ? \`<p class="text-xs text-gray-400 mt-2">GK: \${deal.gk}</p>\` : ''}
                    \${deal.lossReason ? \`<p class="text-xs text-red-400 mt-2">Motivo: \${deal.lossReason}</p>\` : ''}
                  </div>
                \`).join('')}
              </div>
            </div>
          </div>
        </div>
      \`;
    }

    // Carregar dados ao iniciar
    fetchDeals();
    
    // Auto-refresh a cada 5 minutos
    setInterval(fetchDeals, 5 * 60 * 1000);
  </script>
</body>
</html>
  `);
});

// Endpoint para buscar dados do Notion
app.get('/api/deals', async (req, res) => {
  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Processar os dados
    const processedDeals = data.results.map(page => {
      const props = page.properties;
      
      const getTitle = (prop) => {
        if (prop && prop.title && prop.title[0]) {
          return prop.title[0].plain_text;
        }
        return '';
      };

      const getRichText = (prop) => {
        if (prop && prop.rich_text && prop.rich_text[0]) {
          return prop.rich_text[0].plain_text;
        }
        return '';
      };

      const getNumber = (prop) => {
        if (prop && prop.number) {
          return prop.number;
        }
        return 0;
      };

      const getSelect = (prop) => {
        if (prop && prop.select && prop.select.name) {
          return prop.select.name;
        }
        return '';
      };

      const getStatus = (prop) => {
        if (prop && prop.status && prop.status.name) {
          return prop.status.name;
        }
        return '';
      };

      const getPeople = (prop) => {
        if (prop && prop.people && prop.people.length > 0) {
          return prop.people.map(p => p.name).join(', ');
        }
        return '';
      };

      const getDate = (prop) => {
        if (prop && prop.date && prop.date.start) {
          return prop.date.start;
        }
        return null;
      };

      const getPhone = (prop) => {
        if (prop && prop.phone_number) {
          return prop.phone_number;
        }
        return '';
      };

      const getEmail = (prop) => {
        if (prop && prop.email) {
          return prop.email;
        }
        return '';
      };

      const getUrl = (prop) => {
        if (prop && prop.url) {
          return prop.url;
        }
        return '';
      };

      // Campos corretos do Notion
      const status = getStatus(props['Status']);
      const title = getTitle(props['Nome']) || getPeople(props['Quem está negociando?']) || 'Sem nome';
      
      return {
        id: page.id,
        title: title,
        value: getNumber(props['Valor Proposta']),
        status: status,
        createdAt: getDate(props['Criado em']) || page.created_time,
        lastUpdate: getDate(props['Última atualização']) || page.last_edited_time,
        gk: getRichText(props['GK']),
        quality: getSelect(props['Qualidade']),
        lossReason: getSelect(props['Motivo de perda']),
        phone: getPhone(props['Telefone']),
        whatsapp: getPhone(props['WhatsApp']),
        email: getEmail(props['E-mail']),
        instagram: getUrl(props['Instagram']),
        site: getUrl(props['Site']),
        decisor: getRichText(props['Decisor']),
        cidade: getRichText(props['Cidade']),
        cnpj: getRichText(props['CNPJ']),
        negotiating: getPeople(props['Quem está negociando?'])
      };
    });

    res.json({ success: true, data: processedDeals });
  } catch (error) {
    console.error('Error fetching from Notion:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug endpoint - REMOVER DEPOIS!
app.get('/debug', (req, res) => {
  res.json({
    hasToken: !!NOTION_TOKEN,
    tokenPrefix: NOTION_TOKEN ? NOTION_TOKEN.substring(0, 10) + '...' : 'MISSING',
    databaseId: DATABASE_ID,
    env: process.env.NODE_ENV
  });
});

// Debug properties - Ver nomes das propriedades
app.get('/api/properties', async (req, res) => {
  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28'
      }
    });

    const data = await response.json();
    const properties = Object.keys(data.properties || {}).map(key => ({
      name: key,
      type: data.properties[key].type
    }));

    res.json({ success: true, properties });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
  console.log(`📊 Notion Database ID: ${DATABASE_ID}`);
});
