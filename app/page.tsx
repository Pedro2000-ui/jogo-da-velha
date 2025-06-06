"use client"

import { useState, useEffect } from "react"
import { io, type Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Trophy, Users, Gamepad2, Wifi, WifiOff } from "lucide-react"

interface GameState {
  board: (string | null)[]
  currentPlayer: "X" | "O"
  winner: string | null
  isDraw: boolean
  players: { [key: string]: { name: string; symbol: "X" | "O"; score: number } }
  gameActive: boolean
}

export default function TicTacToeGame() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [playerName, setPlayerName] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(false)
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    currentPlayer: "X",
    winner: null,
    isDraw: false,
    players: {},
    gameActive: false,
  })
  const [playerId, setPlayerId] = useState("")
  const [waitingForPlayer, setWaitingForPlayer] = useState(false)

  useEffect(() => {
    // Tentar conectar ao servidor
    const connectToServer = () => {
      try {
        const newSocket = io("http://localhost:3001", {
          transports: ["websocket", "polling"],
          timeout: 5000,
        })

        setSocket(newSocket)

        newSocket.on("connect", () => {
          console.log("Conectado ao servidor!")
          setIsConnected(true)
          setConnectionError(false)
          setPlayerId(newSocket.id)
        })

        newSocket.on("connect_error", (error) => {
          console.error("Erro de conexão:", error)
          setConnectionError(true)
          setIsConnected(false)
        })

        newSocket.on("disconnect", () => {
          console.log("Desconectado do servidor")
          setIsConnected(false)
        })

        newSocket.on("gameState", (state: GameState) => {
          setGameState(state)
          setWaitingForPlayer(false)
        })

        newSocket.on("waitingForPlayer", () => {
          setWaitingForPlayer(true)
        })

        newSocket.on("gameReset", (state: GameState) => {
          setGameState(state)
        })

        return newSocket
      } catch (error) {
        console.error("Erro ao criar socket:", error)
        setConnectionError(true)
        return null
      }
    }

    const newSocket = connectToServer()

    return () => {
      if (newSocket) {
        newSocket.close()
      }
    }
  }, [])

  const joinGame = () => {
    if (socket && playerName.trim()) {
      socket.emit("joinGame", playerName.trim())
    }
  }

  const makeMove = (index: number) => {
    if (socket && gameState.gameActive && !gameState.board[index] && !gameState.winner) {
      socket.emit("makeMove", index)
    }
  }

  const resetGame = () => {
    if (socket) {
      socket.emit("resetGame")
    }
  }

  const renderSquare = (index: number) => {
    const value = gameState.board[index]
    const isWinningSquare = false // You could implement winning square highlighting here

    return (
      <button
        key={index}
        className={`
          w-20 h-20 border-2 border-gray-300 rounded-lg text-3xl font-bold
          transition-all duration-200 hover:bg-gray-50 active:scale-95
          ${value === "X" ? "text-blue-600" : "text-red-600"}
          ${!gameState.gameActive || gameState.board[index] || gameState.winner ? "cursor-not-allowed" : "cursor-pointer hover:border-gray-400"}
          ${isWinningSquare ? "bg-green-100 border-green-400" : ""}
        `}
        onClick={() => makeMove(index)}
        disabled={!gameState.gameActive || !!gameState.board[index] || !!gameState.winner}
      >
        {value}
      </button>
    )
  }

  const getGameStatus = () => {
    if (gameState.winner) {
      const winnerName = Object.values(gameState.players).find((p) => p.symbol === gameState.winner)?.name
      return `🎉 ${winnerName} venceu!`
    }
    if (gameState.isDraw) {
      return "🤝 Empate!"
    }
    if (waitingForPlayer) {
      return "⏳ Aguardando outro jogador..."
    }
    if (gameState.gameActive) {
      const currentPlayerName = Object.values(gameState.players).find((p) => p.symbol === gameState.currentPlayer)?.name
      return `🎮 Vez de ${currentPlayerName} (${gameState.currentPlayer})`
    }
    return "Aguardando início do jogo"
  }

  // Tela de erro de conexão
  if (connectionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600 flex items-center justify-center gap-2">
              <WifiOff className="w-8 h-8" />
              Erro de Conexão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-gray-600">Não foi possível conectar ao servidor. Verifique se:</p>
            <ul className="text-left text-sm text-gray-500 space-y-1">
              <li>• O servidor está rodando na porta 3001</li>
              <li>• Não há firewall bloqueando a conexão</li>
              <li>• O endereço do servidor está correto</li>
            </ul>
            <Button onClick={() => window.location.reload()} className="w-full">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Tela de carregamento
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Conectando ao servidor...</p>
            <p className="text-sm text-gray-500 mt-2">Certifique-se de que o servidor está rodando</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Tela de entrada
  if (!gameState.gameActive && Object.keys(gameState.players).length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
              <Gamepad2 className="w-8 h-8 text-blue-600" />
              Jogo da Velha Online
            </CardTitle>
            <p className="text-gray-600">Entre com seu nome para começar</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-green-600 text-sm">
              <Wifi className="w-4 h-4" />
              Conectado ao servidor
            </div>
            <Input
              type="text"
              placeholder="Digite seu nome"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && joinGame()}
              className="text-center"
            />
            <Button onClick={joinGame} disabled={!playerName.trim()} className="w-full">
              Entrar no Jogo
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <Gamepad2 className="w-10 h-10 text-blue-600" />
            Jogo da Velha Online
          </h1>
          <p className="text-gray-600">Jogue em tempo real com WebSocket</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Placar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                Placar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(gameState.players).map(([id, player]) => (
                <div key={id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={player.symbol === "X" ? "default" : "destructive"}>{player.symbol}</Badge>
                    <span className={`font-medium ${id === playerId ? "text-blue-600" : ""}`}>
                      {player.name} {id === playerId && "(Você)"}
                    </span>
                  </div>
                  <span className="font-bold text-lg">{player.score}</span>
                </div>
              ))}
              {Object.keys(gameState.players).length < 2 && (
                <div className="text-center text-gray-500 py-4">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Aguardando jogadores...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabuleiro */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">{getGameStatus()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 w-fit mx-auto mb-4">
                {gameState.board.map((_, index) => renderSquare(index))}
              </div>

              {(gameState.winner || gameState.isDraw) && (
                <div className="text-center">
                  <Button onClick={resetGame} className="w-full">
                    Jogar Novamente
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status do Jogo */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Conexão:</span>
                <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
                  {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {isConnected ? "Conectado" : "Desconectado"}
                </Badge>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span>Jogadores:</span>
                <Badge variant="outline">{Object.keys(gameState.players).length}/2</Badge>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span>Jogo Ativo:</span>
                <Badge variant={gameState.gameActive ? "default" : "secondary"}>
                  {gameState.gameActive ? "Sim" : "Não"}
                </Badge>
              </div>

              {waitingForPlayer && (
                <div className="text-center py-4">
                  <div className="animate-pulse text-blue-600">
                    <Users className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Procurando oponente...</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
