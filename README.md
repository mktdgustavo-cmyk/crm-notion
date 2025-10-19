# 🚀 CRM Dashboard - Integrado com Notion

Dashboard completo para gerenciar seu CRM do Notion com interface moderna, gráficos e kanban board.

---

## 📋 Pré-requisitos

- Conta no EasyPanel
- Chave da API do Notion
- ID do Database do Notion

---

## 📁 Estrutura do Projeto

```
crm-notion/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   └── App.jsx
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env
└── README.md
```

---

## 🔧 Instalação no EasyPanel

### **Opção 1: Deploy Automático via Git**

1. **Crie um repositório no GitHub:**
   - Crie um novo repositório
   - Faça upload de todos os arquivos

2. **No EasyPanel:**
   - Clique em "New Project"
   - Selecione "From GitHub"
   - Escolha o repositório
   - Configure as variáveis de ambiente:
     ```
     NOTION_TOKEN=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
     DATABASE_ID=259bf5178fd480be9d03e67b3f452c4a
     ```

3. **Deploy:**
   - Clique em "Deploy"
   - Aguarde o build completar

---

### **Opção 2: Deploy Manual via Docker Compose**

1. **Acesse seu servidor via SSH**

2. **Clone ou crie os arquivos:**
   ```bash
   mkdir crm-notion
   cd crm-notion
   ```

3. **Crie a estrutura de pastas:**
   ```bash
   mkdir backend frontend
   ```

4. **Backend - Crie os arquivos:**
   
   **backend/server.js** (copie o código do artifact "server.js")
   
   **backend/package.json** (copie o código do artifact "package.json")
   
   **backend/Dockerfile** (copie o código do artifact "Dockerfile")

5. **Frontend - Configure:**
   
   Você pode usar o React build ou servir estático. Para simplificar, recomendo criar uma versão estática.

6. **Crie o arquivo .env na raiz:**
   ```bash
   cp .env.example .env
   nano .env
   ```
   Cole:
   ```
   NOTION_TOKEN=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
   DATABASE_ID=259bf5178fd480be9d03e67b3f452c4a
   ```

7. **Suba a aplicação:**
   ```bash
   docker-compose up -d
   ```

8. **Verifique os logs:**
   ```bash
   docker-compose logs -f
   ```

---

## 🎯 Deploy SIMPLES no EasyPanel (Recomendado)

### **Backend Standalone:**

1. No EasyPanel, crie uma nova aplicação "Node.js"
2. Cole o código do **server.js**
3. Adicione as variáveis de ambiente:
   - `NOTION_TOKEN`
   - `DATABASE_ID`
4. Configure a porta: **3001**
5. Deploy!

### **Frontend:**

O frontend já está funcionando no artifact atual. Para produção:

1. No EasyPanel, crie uma aplicação "Static Site"
2. Faça build do React localmente:
   ```bash
   npm run build
   ```
3. Faça upload da pasta `build/`
4. Configure a variável:
   - `REACT_APP_API_URL=https://seu-backend.easypanel.app`

---

## 🌐 Acessando a Aplicação

Após o deploy:

- **Frontend:** `http://seu-dominio:3000` ou URL do EasyPanel
- **Backend API:** `http://seu-dominio:3001/api/deals`
- **Health Check:** `http://seu-dominio:3001/health`

---

## 🔄 Atualização Automática

O dashboard sincroniza automaticamente com o Notion a cada 5 minutos.

Você também pode clicar no botão "Atualizar" para forçar uma sincronização manual.

---

## 🛠️ Troubleshooting

### **Backend não conecta ao Notion:**
- Verifique se a chave `NOTION_TOKEN` está correta
- Confirme o `DATABASE_ID`
- Veja os logs: `docker-compose logs backend`

### **Frontend não carrega dados:**
- Verifique se o backend está rodando
- Confirme a variável `REACT_APP_API_URL`
- Abra o console do navegador (F12) para ver erros

### **CORS Error:**
- Se ainda tiver erro de CORS, adicione seu domínio frontend no backend
- Edite `server.js` e configure:
  ```javascript
  app.use(cors({
    origin: 'https://seu-frontend.com'
  }));
  ```

---

## 📊 Funcionalidades

✅ Kanban Board (To-Do, Em Progresso, Completo)
✅ Métricas em tempo real
✅ Gráfico de funil de vendas
✅ Gráfico de valor por estágio
✅ Busca e filtros
✅ Alertas de oportunidades paradas
✅ Modal de detalhes
✅ Modo claro/escuro
✅ Auto-refresh a cada 5 minutos
✅ Responsivo (desktop e mobile)

---

## 🔐 Segurança

⚠️ **IMPORTANTE:** 
- Nunca exponha sua chave do Notion no frontend
- Use variáveis de ambiente
- Depois do teste, regenere a chave do Notion no painel de configurações

---

## 📝 Próximos Passos

Após o deploy funcionar:

1. Configure um domínio customizado
2. Adicione HTTPS (SSL)
3. Configure backups automáticos
4. Adicione autenticação (opcional)
5. Implemente edição de deals pelo dashboard

---

## 💬 Suporte

Se tiver problemas:

1. Verifique os logs
2. Confirme as variáveis de ambiente
3. Teste o endpoint `/health` do backend
4. Verifique a conexão com a API do Notion

---

## 📄 Licença

MIT License - Use livremente!

---

**Desenvolvido com ❤️ para facilitar seu CRM**
