#!/bin/bash

echo "🚀 Iniciando Jogo da Velha WebSocket..."

# Função para verificar se uma porta está em uso
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️ Porta $1 já está em uso!"
        return 1
    else
        return 0
    fi
}

# Verificar portas
echo "🔍 Verificando portas..."
check_port 3000
check_port 3001

# Iniciar servidor em background
echo "🖥️ Iniciando servidor..."
cd server
npm run dev &
SERVER_PID=$!

# Aguardar um pouco para o servidor iniciar
sleep 3

# Voltar para o diretório raiz
cd ..

# Iniciar frontend
echo "🌐 Iniciando frontend..."
npm run dev &
FRONTEND_PID=$!

echo "✅ Projeto iniciado!"
echo "📊 Servidor: http://localhost:3001"
echo "🎮 Frontend: http://localhost:3000"
echo ""
echo "Para parar os serviços:"
echo "kill $SERVER_PID $FRONTEND_PID"

# Aguardar entrada do usuário para parar
read -p "Pressione Enter para parar os serviços..."

# Parar os processos
kill $SERVER_PID $FRONTEND_PID 2>/dev/null
echo "🛑 Serviços parados!"
