# BuscaLead 🚀

O **BuscaLead** é uma plataforma SaaS (Software as a Service) desenvolvida para automatizar a geração de leads qualificados utilizando a inteligência do Google Maps, OpenAI e n8n.

Este projeto transforma a busca manual de empresas em uma experiência automatizada e em tempo real, permitindo que usuários encontrem clientes em potencial com apenas alguns cliques.

## ✨ Funcionalidades

- 🔍 **Busca Inteligente**: Pesquisa de estabelecimentos por termo e cidade.
- 🤖 **Enriquecimento com IA**: Uso de GPT-4o-mini via n8n para identificar os bairros mais comerciais e otimizar a extração.
- 📊 **Dashboard de Performance**: Acompanhamento de estatísticas e histórico de buscas.
- ⚡ **Atualização em Tempo Real**: Os leads aparecem na tela instantaneamente à medida que são processados, utilizando Supabase Realtime.
- 💬 **Integração com WhatsApp**: Botão direto para iniciar conversas com os leads encontrados.
- 📧 **Extração de E-mails**: Scraper integrado para buscar contatos nos websites das empresas.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [Next.js 14](https://nextjs.org/) (App Router), [React](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/).
- **Backend / Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime).
- **Automação**: [n8n](https://n8n.io/) (Self-hosted via Docker).
- **APIs**: [OpenAI GPT-4o-mini](https://openai.com/), [Serper API](https://serper.dev/) (Google Maps Search).

## 🚀 Como Rodar o Projeto

### 1. Requisitos
- Node.js 18+
- Docker (para o n8n)
- Conta no Supabase

### 2. Configuração do Banco de Dados
- Crie um novo projeto no Supabase.
- Execute o script SQL localizado em `docs/supabase/schema.sql` no editor SQL do painel do Supabase.

### 3. Configuração do n8n
- Importe o workflow localizado em `docs/n8n/buscalead-workflow.json` para o seu n8n.
- Configure suas credenciais da OpenAI e Serper API nos nós correspondentes.

### 4. Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto com as seguintes chaves:
```env
NEXT_PUBLIC_SUPABASE_URL=seu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
N8N_WEBHOOK_URL=http://localhost:5678/webhook/buscalead
WEBHOOK_SECRET=sua_senha_segura
```

### 5. Instalação
```bash
npm install
npm run dev
```
Acesse `http://localhost:3000` e comece a capturar leads!

---

## 📈 Próximos Passos
- [ ] Implementação de CRM interno.
- [ ] Exportação de leads para CSV/Excel.
- [ ] Filtros avançados por avaliação e categoria.

---
Desenvolvido por **Alexandre Silva** como parte do portfólio de automação e desenvolvimento full-stack.
