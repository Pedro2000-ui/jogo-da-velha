#!/bin/bash

echo "🎮 Configurando Jogo da Velha WebSocket..."

# Criar diretório do servidor se não existir
if [ ! -d "server" ]; then
    mkdir server
fi

# Navegar para o diretório do servidor
cd server

# Instalar dependências do servidor
echo "📦 Instalando dependências do servidor..."
npm install express socket.io cors nodemon

# Voltar para o diretório raiz
cd ..

# Instalar dependências do frontend (se necessário)
echo "📦 Instalando dependências do frontend..."
npm install socket.io-client

echo "✅ Setup concluído!"
echo ""
echo "🚀 Para iniciar o projeto:"
echo "1. Terminal 1 - Servidor:"
echo "   cd server && npm run dev"
echo ""
echo "2. Terminal 2 - Frontend:"
echo "   npm run dev"
echo ""
echo "🌐 Acesse: http://localhost:3000"
