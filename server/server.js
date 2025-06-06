const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const cors = require("cors")

const app = express()
const server = http.createServer(app)

// Configuração do CORS para Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
})

app.use(cors())
app.use(express.json())

// Estado do jogo
const gameState = {
  board: Array(9).fill(null),
  currentPlayer: "X",
  winner: null,
  isDraw: false,
  players: {},
  gameActive: false,
}

// Função para verificar vitória
function checkWinner(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // linhas
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // colunas
    [0, 4, 8],
    [2, 4, 6], // diagonais
  ]

  for (const line of lines) {
    const [a, b, c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]
    }
  }
  return null
}

// Função para verificar empate
function checkDraw(board) {
  return board.every((cell) => cell !== null)
}

// Função para resetar o jogo
function resetGame() {
  gameState.board = Array(9).fill(null)
  gameState.currentPlayer = "X"
  gameState.winner = null
  gameState.isDraw = false
  gameState.gameActive = Object.keys(gameState.players).length === 2
}

io.on("connection", (socket) => {
  console.log(`Jogador conectado: ${socket.id}`)

  // Jogador entra no jogo
  socket.on("joinGame", (playerName) => {
    console.log(`${playerName} entrou no jogo`)

    // Determinar símbolo do jogador
    const playerCount = Object.keys(gameState.players).length
    const symbol = playerCount === 0 ? "X" : "O"

    // Adicionar jogador
    gameState.players[socket.id] = {
      name: playerName,
      symbol: symbol,
      score: 0,
    }

    // Se temos 2 jogadores, iniciar o jogo
    if (Object.keys(gameState.players).length === 2) {
      gameState.gameActive = true
      io.emit("gameState", gameState)
    } else {
      // Enviar estado atual e sinalizar que está aguardando
      socket.emit("gameState", gameState)
      socket.emit("waitingForPlayer")
    }
  })

  // Jogador faz uma jogada
  socket.on("makeMove", (index) => {
    const player = gameState.players[socket.id]

    // Verificar se é a vez do jogador e se a jogada é válida
    if (
      !player ||
      !gameState.gameActive ||
      player.symbol !== gameState.currentPlayer ||
      gameState.board[index] !== null ||
      gameState.winner
    ) {
      return
    }

    // Fazer a jogada
    gameState.board[index] = player.symbol

    // Verificar vitória
    const winner = checkWinner(gameState.board)
    if (winner) {
      gameState.winner = winner
      gameState.gameActive = false
      // Incrementar pontuação do vencedor
      gameState.players[socket.id].score++
    } else if (checkDraw(gameState.board)) {
      gameState.isDraw = true
      gameState.gameActive = false
    } else {
      // Alternar jogador
      gameState.currentPlayer = gameState.currentPlayer === "X" ? "O" : "X"
    }

    // Enviar estado atualizado para todos
    io.emit("gameState", gameState)
  })

  // Resetar jogo
  socket.on("resetGame", () => {
    resetGame()
    io.emit("gameReset", gameState)
  })

  // Jogador desconecta
  socket.on("disconnect", () => {
    console.log(`Jogador desconectado: ${socket.id}`)

    if (gameState.players[socket.id]) {
      delete gameState.players[socket.id]

      // Se não há jogadores suficientes, parar o jogo
      if (Object.keys(gameState.players).length < 2) {
        gameState.gameActive = false
        resetGame()
      }

      // Notificar jogadores restantes
      io.emit("gameState", gameState)

      // Se sobrou apenas 1 jogador, ele deve aguardar
      if (Object.keys(gameState.players).length === 1) {
        io.emit("waitingForPlayer")
      }
    }
  })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
  console.log(`WebSocket disponível em http://localhost:${PORT}`)
})
