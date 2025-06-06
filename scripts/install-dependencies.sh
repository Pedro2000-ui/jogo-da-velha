#!/bin/bash

echo "🔧 Resolvendo conflitos de dependências..."

# Limpar cache do npm
echo "🧹 Limpando cache do npm..."
npm cache clean --force

# Remover node_modules e package-lock.json se existirem
if [ -d "node_modules" ]; then
    echo "🗑️ Removendo node_modules..."
    rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
    echo "🗑️ Removendo package-lock.json..."
    rm package-lock.json
fi

# Instalar dependências com --legacy-peer-deps para resolver conflitos
echo "📦 Instalando dependências do frontend..."
npm install --legacy-peer-deps

# Instalar socket.io-client especificamente
echo "🔌 Instalando socket.io-client..."
npm install socket.io-client@^4.7.2 --legacy-peer-deps

echo "✅ Dependências do frontend instaladas!"

# Configurar servidor
echo "🖥️ Configurando servidor..."
cd server

# Instalar dependências do servidor
echo "📦 Instalando dependências do servidor..."
npm install

echo "✅ Setup completo!"
echo ""
echo "🚀 Para iniciar o projeto:"
echo "1. Terminal 1 - Servidor:"
echo "   cd server && npm run dev"
echo ""
echo "2. Terminal 2 - Frontend:"
echo "   npm run dev"
echo ""
echo "🌐 Acesse: http://localhost:3000"
