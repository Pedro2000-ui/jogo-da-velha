# Jogo da Velha Online com WebSocket

Um jogo da velha multiplayer em tempo real usando React, Node.js e Socket.IO.

## 🚀 Funcionalidades

- ✅ Jogo da velha multiplayer em tempo real
- ✅ WebSocket para comunicação instantânea
- ✅ Sistema de placar com contagem de vitórias
- ✅ Interface moderna e responsiva
- ✅ Nomes personalizados para jogadores
- ✅ Detecção automática de vitória e empate
- ✅ Reconexão automática
- ✅ Status do jogo em tempo real

## 🛠️ Tecnologias

### Frontend
- React 18
- Next.js 14
- TypeScript
- Tailwind CSS
- Socket.IO Client
- Shadcn/ui Components

### Backend
- Node.js
- Express.js
- Socket.IO
- CORS

## 📁 Estrutura do Projeto

\`\`\`
jogo_da_velha/
├── app/                    # Frontend React/Next.js
│   ├── page.tsx           # Componente principal do jogo
│   ├── layout.tsx         # Layout da aplicação
│   └── globals.css        # Estilos globais
├── server/                # Backend Node.js
│   ├── server.js          # Servidor WebSocket
│   └── package.json       # Dependências do servidor
├── components/            # Componentes UI (shadcn/ui)
└── README.md
\`\`\`

## 🚀 Como Executar

### 1. Instalar Dependências do Servidor

\`\`\`bash
cd server
npm install
\`\`\`

### 2. Iniciar o Servidor

\`\`\`bash
npm run dev
# ou
npm start
\`\`\`

O servidor estará rodando em `http://localhost:3001`

### 3. Instalar Dependências do Frontend

No diretório raiz do projeto:

\`\`\`bash
npm install
\`\`\`

### 4. Iniciar o Frontend

\`\`\`bash
npm run dev
\`\`\`

O frontend estará disponível em `http://localhost:3000`

### 5. Scripts
Você pode rodar os comandos

\`\`\`bash
bash scripts/install-dependencies.sh
\`\`\`

\`\`\`bash
bash scripts/setup.sh
\`\`\`

\`\`\`bash
bash scripts/start-project.sh
\`\`\`

Para instalar as dependencias e iniciar o projeto, respectivamente.

## 🎮 Como Jogar

1. Acesse `http://localhost:3000`
2. Digite seu nome e clique em "Entrar no Jogo"
3. Aguarde outro jogador se conectar
4. Jogue alternadamente clicando nas células do tabuleiro
5. O placar é atualizado automaticamente após cada partida
6. Clique em "Jogar Novamente" para uma nova partida

## 🔧 Configuração

### Variáveis de Ambiente

Você pode configurar as seguintes variáveis:

- `PORT`: Porta do servidor (padrão: 3001)
- `FRONTEND_URL`: URL do frontend para CORS (padrão: http://localhost:3000)

### Personalização

- **Cores**: Modifique as classes Tailwind CSS no componente principal
- **Regras**: Ajuste a lógica do jogo no arquivo `server.js`
- **UI**: Customize os componentes shadcn/ui conforme necessário

## 📡 Eventos WebSocket

### Cliente → Servidor
- `joinGame(playerName)`: Entrar no jogo com nome
- `makeMove(index)`: Fazer jogada na posição especificada
- `resetGame()`: Resetar o jogo atual

### Servidor → Cliente
- `gameState(state)`: Estado completo do jogo
- `waitingForPlayer()`: Aguardando outro jogador
- `gameReset(state)`: Jogo foi resetado