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

// Estado dos jogos - cada sala terá seu próprio estado
const gameRooms = new Map();

// Função para criar uma nova sala
function createGameRoom(roomId) {
  return {
    id: roomId,
    board: Array(9).fill(null),
    currentPlayer: "X",
    winner: null,
    isDraw: false,
    players: {},
    gameActive: false,
  };
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
  ];

  for (const line of lines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

// Função para verificar empate
function checkDraw(board) {
  return board.every((cell) => cell !== null);
}

// Função para resetar o jogo de uma sala específica
function resetGame(roomId) {
  const room = gameRooms.get(roomId);
  if (room) {
    room.board = Array(9).fill(null);
    room.currentPlayer = "X";
    room.winner = null;
    room.isDraw = false;
    room.gameActive = Object.keys(room.players).length === 2;
  }
}

io.on("connection", (socket) => {
  console.log(`Jogador conectado: ${socket.id}`);

  // Listar salas disponíveis
  socket.on("listRooms", () => {
    const rooms = Array.from(gameRooms.entries()).map(([id, room]) => ({
      id,
      playerCount: Object.keys(room.players).length,
      players: Object.values(room.players).map(p => p.name),
      gameActive: room.gameActive
    }));
    socket.emit("roomsList", rooms);
  });

  // Criar nova sala
  socket.on("createRoom", (roomId) => {
    if (!gameRooms.has(roomId)) {
      gameRooms.set(roomId, createGameRoom(roomId));
      socket.emit("roomCreated", roomId);
      // Atualizar lista de salas para todos
      io.emit("roomsUpdated");
    } else {
      socket.emit("error", "Sala já existe!");
    }
  });

  // Jogador entra em uma sala
  socket.on("joinRoom", ({ roomId, playerName }) => {
    const room = gameRooms.get(roomId);
    
    if (!room) {
      socket.emit("error", "Sala não encontrada!");
      return;
    }

    if (Object.keys(room.players).length >= 2) {
      socket.emit("error", "Sala cheia!");
      return;
    }

    // Remover jogador de outras salas primeiro
    for (const [id, gameRoom] of gameRooms.entries()) {
      if (gameRoom.players[socket.id]) {
        delete gameRoom.players[socket.id];
        socket.leave(id);
        io.to(id).emit("gameState", gameRoom);
        io.emit("roomsUpdated");
      }
    }

    // Entrar na nova sala
    socket.join(roomId);
    
    // Determinar símbolo do jogador
    const playerCount = Object.keys(room.players).length;
    const symbol = playerCount === 0 ? "X" : "O";

    // Adicionar jogador
    room.players[socket.id] = {
      name: playerName,
      symbol: symbol,
      score: 0,
    };

    // Se temos 2 jogadores, iniciar o jogo
    if (Object.keys(room.players).length === 2) {
      room.gameActive = true;
      io.to(roomId).emit("gameState", room);
    } else {
      socket.emit("gameState", room);
      socket.emit("waitingForPlayer");
    }

    // Atualizar lista de salas para todos
    io.emit("roomsUpdated");
  });

  // Jogador faz uma jogada
  socket.on("makeMove", ({ roomId, index }) => {
    const room = gameRooms.get(roomId);
    if (!room) return;

    const player = room.players[socket.id];

    // Verificar se é a vez do jogador e se a jogada é válida
    if (
      !player ||
      !room.gameActive ||
      player.symbol !== room.currentPlayer ||
      room.board[index] !== null ||
      room.winner
    ) {
      return;
    }

    // Fazer a jogada
    room.board[index] = player.symbol;

    // Verificar vitória
    const winner = checkWinner(room.board);
    if (winner) {
      room.winner = winner;
      room.gameActive = false;
      // Incrementar pontuação do vencedor
      room.players[socket.id].score++;
    } else if (checkDraw(room.board)) {
      room.isDraw = true;
      room.gameActive = false;
    } else {
      // Alternar jogador
      room.currentPlayer = room.currentPlayer === "X" ? "O" : "X";
    }

    // Enviar estado atualizado para todos na sala
    io.to(roomId).emit("gameState", room);
  });

  // Resetar jogo
  socket.on("resetGame", (roomId) => {
    if (gameRooms.has(roomId)) {
      resetGame(roomId);
      io.to(roomId).emit("gameReset", gameRooms.get(roomId));
    }
  });

  // Sair da sala
  socket.on("leaveRoom", (roomId) => {
    const room = gameRooms.get(roomId);
    if (room && room.players[socket.id]) {
      socket.leave(roomId);
      delete room.players[socket.id];
      
      // Se a sala ficou vazia, remover
      if (Object.keys(room.players).length === 0) {
        gameRooms.delete(roomId);
      } else {
        // Se ainda tem um jogador, resetar o jogo
        room.gameActive = false;
        resetGame(roomId);
        io.to(roomId).emit("gameState", room);
        io.to(roomId).emit("waitingForPlayer");
      }
      
      // Atualizar lista de salas para todos
      io.emit("roomsUpdated");
    }
  });

  // Jogador desconecta
  socket.on("disconnect", () => {
    console.log(`Jogador desconectado: ${socket.id}`);

    // Remover jogador de todas as salas que participava
    for (const [roomId, room] of gameRooms.entries()) {
      if (room.players[socket.id]) {
        delete room.players[socket.id];
        
        // Se a sala ficou vazia, remover
        if (Object.keys(room.players).length === 0) {
          gameRooms.delete(roomId);
        } else {
          // Se ainda tem um jogador, resetar o jogo
          room.gameActive = false;
          resetGame(roomId);
          io.to(roomId).emit("gameState", room);
          io.to(roomId).emit("waitingForPlayer");
        }
      }
    }

    // Atualizar lista de salas para todos
    io.emit("roomsUpdated");
  });
});

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
  console.log(`WebSocket disponível em http://localhost:${PORT}`)
})
