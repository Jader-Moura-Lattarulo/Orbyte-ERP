# Orbyte ERP

## 📝 Descrição do Projeto
O **Orbyte ERP** é um sistema de Planejamento de Recursos Empresariais (ERP) robusto e moderno, projetado para gerenciar operações empresariais. A aplicação fornece um conjunto de ferramentas para controle financeiro, gestão de clientes, integrações de pagamento e outras rotinas administrativas fundamentais.

## 🎯 Objetivo do Sistema
Centralizar e automatizar processos de gestão, oferecendo uma interface amigável e relatórios gerenciais para facilitar a tomada de decisão em tempo real, integrando frontend, backend e serviços de terceiros.

## ✨ Principais Funcionalidades
<!-- TODO: Detalhar funcionalidades específicas do negócio -->
- Gestão de Cadastros (Usuários, Clientes, etc.)
- Controle Financeiro e Faturamento (Integração com Stripe)
- Autenticação e Autorização Segura (Supabase)
- Relatórios e Dashboards Interativos (Recharts)
- Gerenciamento de Arquivos/Documentos (PDF via jspdf)

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React (v18)** com **TypeScript**
- **Vite** como bundler
- **Tailwind CSS** para estilização
- **Radix UI** para componentes acessíveis e base (Design System)
- **React Router DOM** para roteamento
- **React Hook Form** + **Zod** para validação de formulários
- **TanStack React Query** para data fetching e state management
- **Lucide React** para ícones

### Backend / Infraestrutura
- **Node.js** (API Backend local na pasta `/server`)
- **Supabase** (Autenticação / Banco de Dados / Storage)
- **Stripe** (Processamento de Pagamentos)

## 🏗️ Arquitetura do Projeto
O sistema segue uma arquitetura baseada em microsserviços/módulos, separados entre o **Frontend** (SPA em React) e um **Backend** Node.js dedicado. O Frontend interage com o Backend através de chamadas de API RESTful, além de utilizar o SDK do Supabase diretamente para recursos específicos como Autenticação em tempo real.

## 📂 Estrutura de Pastas

```text
Orbyte-ERP/
├── public/                 # Arquivos estáticos públicos (favicon, etc.)
├── src/                    # Código-fonte principal do Frontend (React)
│   ├── api/                # Serviços e chamadas HTTP (Axios/Fetch)
│   ├── assets/             # Imagens, SVGs e arquivos de mídia
│   ├── components/         # Componentes React reutilizáveis (UI)
│   ├── hooks/              # Custom hooks (ex: useAuth, queries)
│   ├── lib/                # Configurações de bibliotecas (Supabase, Utils globais)
│   ├── pages/              # Telas principais da aplicação (Views)
│   └── utils/              # Funções utilitárias e helpers (formatação, validação)
├── server/                 # Código-fonte do Backend (Node.js)
│   ├── middleware/         # Interceptadores de rotas (Auth, Error handler)
│   ├── routes/             # Definição dos endpoints da API
│   ├── validators/         # Validação de payload/dados no backend
│   ├── db.js               # Conexão com o Banco de Dados
│   └── index.js            # Entry point do servidor Node.js
├── entities/               # Modelos de domínio compartilhados / Tipagens
├── dist/                   # Build de produção gerado pelo Vite
└── [Arquivos de Configuração] # .env, package.json, tailwind.config.js, etc.
```

## ⚙️ Pré-requisitos
- Node.js (v18 ou superior recomendado)
- Gerenciador de pacotes (npm, pnpm ou yarn)
- Contas/Chaves de API para: Supabase e Stripe

## 🚀 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/Jader-Moura-Lattarulo/Orbyte-ERP.git
cd Orbyte-ERP
```

2. Instale as dependências do Frontend:
```bash
npm install
```

3. Instale as dependências do Backend:
```bash
cd server
npm install
cd ..
```

## 🔧 Configuração

Crie os arquivos de ambiente baseando-se nos exemplos.
- Na raiz do projeto, crie um arquivo `.env.local`:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
VITE_STRIPE_PUBLIC_KEY=sua_chave_publica_do_stripe
# Adicione outras variáveis necessárias...
```

- Na pasta `/server`, crie o arquivo `.env`:
```env
PORT=3000
DATABASE_URL=sua_string_de_conexao_do_banco
# Adicione chaves secretas (Stripe Secret Key, Supabase Service Role, etc)
```

## 💻 Como executar localmente

Para rodar o ambiente de desenvolvimento, você precisará iniciar o Frontend e o Backend simultaneamente.

1. **Iniciando o Backend:**
```bash
cd server
npm run dev # ou node index.js
```

2. **Iniciando o Frontend:**
Em um novo terminal, na raiz do projeto:
```bash
npm run dev
```
Acesse a aplicação em `http://localhost:5173` (ou a porta indicada pelo Vite).

## 📦 Como gerar build/deploy

Para gerar a versão otimizada de produção do Frontend:
```bash
npm run build
```
O build será gerado na pasta `/dist`, pronto para ser hospedado em serviços como Vercel, Netlify, ou AWS S3/CloudFront.
Para o backend, garanta que as variáveis de ambiente de produção (`.env.production`) estejam configuradas no seu serviço de nuvem (Render, Heroku, AWS, etc) e inicie o serviço com `node index.js`.

## 🔄 Fluxo geral da aplicação
1. O usuário acessa a plataforma e realiza o login (Autenticação via Supabase).
2. O React Query gerencia o estado da aplicação e busca os dados necessários.
3. Requisições seguras são enviadas para a API local (`/server`) para operações de negócio complexas.
4. O servidor processa a requisição, valida regras (via middlewares/validators), interage com o banco de dados (`db.js`) e retorna a resposta ao client.

## 🔌 Principais Endpoints ou Módulos
<!-- TODO: Mapear as rotas da API em /server/routes -->
- **Frontend Pages:** A pasta `/src/pages` contém a divisão visual dos módulos do ERP.
- **Backend API:** Os recursos são agrupados em `/server/routes` com prefixos padrão (ex: `/api/users`, `/api/payments`).

## 📏 Convenções adotadas
- **Padronização de Código:** ESLint e Prettier (configurado em `eslint.config.js`).
- **Tipagem Forte:** Uso estrito do TypeScript.
- **Commits/Branches:** Padrão Git Flow (recomendado).
- **Estilos:** Utilização de classes utilitárias do Tailwind, evitando CSS puro sempre que possível.

## 📌 Observações importantes
- Mantenha sempre as chaves secretas do Stripe e Supabase apenas no `.env` do backend. O Frontend deve ter acesso apenas às chaves públicas/anônimas (`VITE_`).
- Certifique-se de manter os esquemas do Banco de Dados sincronizados com o código TypeScript.

---

## 👨‍💻 Autor
**Jader Moura Lattarulo**

## ©️ Direitos Autorais e Uso do Software

**Projeto Proprietário (Private)**

Este é um projeto proprietário (projeto próprio). Todos os direitos reservados.
Nenhuma parte deste código, arquivos, designs ou documentação pode ser reproduzida, distribuída, modificada ou transmitida de qualquer forma ou por qualquer meio, sem a permissão prévia por escrito do proprietário/autor. O uso não autorizado é estritamente proibido.
