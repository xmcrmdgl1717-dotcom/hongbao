import { generatePackets } from './packet.js'
import { strategies } from './strategies.js'
import { updatePublicRoom } from './lobbyManager.js'

export class GameRoom {
  constructor(id, config, broadcast) {
    this.id = id
    this.config = config
    this.broadcast = broadcast
    this.phase = 'WAITING'
    this.round = 0
    this.issuerId = null
    this.packets = null
    this.grabs = []
    this.immuneIds = []
    this.multiplier = 1
    this.deadline = null
    this.timer = null
    this.seq = 0
    this.players = [] 
    this.hostId = null
  }

  addPlayer(userId, isBot = false) {
    let player = this.players.find(p => p.id === userId)
    if (!player) {
      this.players.push({ id: userId, balance: 10000, isBot, offline: false })
      if (!this.hostId) {
        this.hostId = userId
        this.issuerId = userId
        this.immuneIds.push(userId)
      }
    } else {
      player.offline = false
    }
    this.emit('PLAYER_JOINED', { players: this.players, hostId: this.hostId })
  }

  playerOffline(userId) {
    const player = this.players.find(p => p.id === userId)
    if (player) {
      player.offline = true
      if (this.hostId === userId) {
        const nextHost = this.players.find(p => !p.offline && !p.isBot)
        this.hostId = nextHost ? nextHost.id : null
      }
      this.emit('PLAYER_OFFLINE', { players: this.players, hostId: this.hostId })
    }
  }

  removeBot(botId) {
    this.players = this.players.filter(p => p.id !== botId)
    this.emit('PLAYER_LEFT', { players: this.players })
  }

  emit(type, payload = {}) {
    this.seq++
    this.broadcast({ type, seq: this.seq, phase: this.phase, ...payload })
  }

  // 房主点击开始游戏
  startGame(userId) {
    if (this.hostId === userId && this.phase === 'WAITING') {
      this.startRound(this.hostId)
    }
  }

  // 开启一轮
  startRound(issuerId) {
    this.issuerId = issuerId
    this.phase = 'ISSUING'
    this.grabs = []
    this.deadline = Date.now() + 15000 // 15秒发包窗口
    this.emit('PHASE', { deadline: this.deadline, issuerId: this.issuerId, round: this.round + 1 })
    
    // 如果接棒的是机器人，1.5秒后自动发
    const bot = this.players.find(p => p.id === issuerId && p.isBot)
    if (bot) {
      this.timer = setTimeout(() => { this.issue(bot.id) }, 1500)
    } else {
      this.timer = setTimeout(() => { this.onIssueTimeout() }, 15000)
    }
  }

  issue(userId) {
    if (this.phase !== 'ISSUING' || userId !== this.issuerId) return
    clearTimeout(this.timer)
    
    const player = this.players.find(p => p.id === userId)
    if (!player) return

    // 按房主配置的底金扣款
    let total = this.config.baseAmountCents * this.multiplier
    if (player.balance < total) total = Math.min(player.balance, 100) 
    if (total <= 0) total = 100
    
    player.balance -= total
    const count = this.config.packetCount || 5
    this.packets = generatePackets(total, count)
    this.grabs = []
    this.phase = 'GRABBING'
    this.deadline = Date.now() + 10000 // 10秒抢包窗口
    
    this.emit('PACKET_ISSUED', { 
      issuerId: this.issuerId, 
      totalCents: total, 
      packetCount: count, 
      multiplier: this.multiplier, 
      deadline: this.deadline, 
      players: this.players 
    })

    // 机器人抢包
    this.players.filter(p => p.isBot).forEach(bot => {
      setTimeout(() => { if (this.phase === 'GRABBING') this.grab(bot.id) }, 1000 + Math.random() * 2000)
    })
    // 超时没抢完，强制结算
    this.timer = setTimeout(() => { this.resolve() }, 10000)
  }

  grab(userId) {
    if (this.phase !== 'GRABBING') return
    const player = this.players.find(p => p.id === userId)
    if (!player || player.offline) return
    if (this.grabs.some(g => g.userId === userId)) return
    if (this.grabs.length >= this.packets.length) return
    
    const amount = this.packets[this.grabs.length]
    this.grabs.push({ userId, amount })
    player.balance += amount

    this.emit('GRABBED', { userId, amount, remaining: this.packets.length - this.grabs.length, players: this.players })
    
    // 如果包抢完了，或者所有在线的人都抢了，立刻结算
    const eligibleGrabbers = this.players.filter(p => !p.offline).length
    if (this.grabs.length >= this.packets.length || this.grabs.length >= eligibleGrabbers) {
      this.resolve()
    }
  }

  resolve() {
    if (this.phase !== 'GRABBING') return
    clearTimeout(this.timer)
    this.phase = 'RESOLVING'
    
    const strategy = strategies[this.config.mode] ?? strategies.worst
    const result = strategy({ grabs: this.grabs, immuneIds: this.immuneIds, rule: this.config, currentMultiplier: this.multiplier })
    
    this.phase = 'SETTLING'
    this.emit('SETTLED', { 
      grabs: this.grabs, nextIssuerId: result.nextIssuerId, mineHitters: result.mineHitters, multiplier: this.multiplier, players: this.players 
    })
    
    // 停留 3.5 秒展示开奖结果，然后进入下一局
    this.timer = setTimeout(() => {
      this.round++
      if (this.round >= this.config.maxRounds) {
        this.phase = 'FINISHED'
        const finalStats = this.players.map(p => ({ userId: p.id, balance: p.balance, net: p.balance - 10000 })).sort((a, b) => b.balance - a.balance)
        this.emit('FINISHED', { finalStats })
        return
      }
      
      let next = result.nextIssuerId
      const nextPlayer = this.players.find(p => p.id === next)
      if (!nextPlayer || nextPlayer.offline) {
        const onlinePlayers = this.players.filter(p => !p.offline)
        next = onlinePlayers.length > 0 ? onlinePlayers[0].id : this.issuerId
      }
      this.startRound(next)
    }, 3500)
  }

  onIssueTimeout() {
    if (this.phase === 'ISSUING') this.issue(this.issuerId) // 超时系统代发
  }

  snapshot() {
    return {
      roomId: this.id, phase: this.phase, round: this.round, issuerId: this.issuerId, grabs: this.grabs,
      multiplier: this.multiplier, deadline: this.deadline, seq: this.seq, config: this.config, players: this.players, hostId: this.hostId
    }
  }
}
