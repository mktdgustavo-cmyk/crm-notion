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
