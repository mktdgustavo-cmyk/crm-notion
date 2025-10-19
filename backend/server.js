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

      const status = getSelect(props['Status']);
      const title = getPeople(props['Quem está negociando']) || 'Sem nome';
      
      return {
        id: page.id,
        title: title,
        value: getNumber(props['Valor Proposta']),
        status: status,
        createdAt: getDate(props['Criado em']) || page.created_time,
        lastUpdate: getDate(props['Última atualização']) || page.last_edited_time,
        gk: getSelect(props['GK']),
        quality: getSelect(props['Qualidade']),
        lossReason: getRichText(props['Motivo de perda']),
        phone: getRichText(props['Telefone']),
        whatsapp: getRichText(props['WhatsApp']),
        email: getRichText(props['E-mail']),
        decisor: getRichText(props['Decisor']),
        cidade: getRichText(props['Cidade'])
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

app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
  console.log(`📊 Notion Database ID: ${DATABASE_ID}`);
});
