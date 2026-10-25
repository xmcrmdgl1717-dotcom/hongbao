import { generatePackets } from './packet.js'
import { strategies } from './strategies.js'
import { updatePublicRoom, removePublicRoom } from './lobbyManager.js'

export class GameRoom {
  constructor(id, config, broadcast) {
    this.id = id
    this.config = config // 包含 isPublic, password, mode, maxRounds
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
    
    // 如果是公开房，推送到大厅
    if (this.config.isPublic) {
      updatePublicRoom(this.id, this.getLobbyInfo())
    }
  }

  getLobbyInfo() {
    return {
      id: this.id,
      mode: this.config.mode,
      isPublic: this.config.isPublic,
      maxRounds: this.config.maxRounds,
      playerCount: this.players.length,
      status: this.phase === 'WAITING' ? '等待中' : '游戏中'
    }
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
    
    if (this.config.isPublic) updatePublicRoom(this.id, this.getLobbyInfo())
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
      if (this.config.isPublic) updatePublicRoom(this.id, this.getLobbyInfo())
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

  start(issuerId) {
    this.issuerId = issuerId
    this.phase = 'ISSUING'
    this.grabs = []
    if (this.config.isPublic) updatePublicRoom(this.id, this.getLobbyInfo())
    
    const bot = this.players.find(p => p.id === issuerId && p.isBot)
    if (bot) {
      this.deadline = Date.now() + this.config.issueWindowSec * 1000
      this.timer = setTimeout(() => { this.issue(bot.id, 2000, 5) }, 1500)
    } else {
      this.armTimer(this.config.issueWindowSec, () => this.onIssueTimeout())
    }
    this.emit('PHASE', { deadline: this.deadline, issuerId: this.issuerId })
  }

  issue(userId, customAmountCents, customCount) {
    if (this.phase !== 'ISSUING' || userId !== this.issuerId) return
    clearTimeout(this.timer)
    
    const player = this.players.find(p => p.id === userId)
    if (!player) return

    let total = customAmountCents ? Math.max(100, customAmountCents) : (this.config.baseAmountCents * this.multiplier)
    if (player.balance < total) total = Math.min(player.balance, 100)
    if (total <= 0) total = 100
    
    player.balance -= total
    const onlineCount = this.players.filter(p => !p.offline).length
    const count = customCount ? Math.max(1, customCount) : Math.max(1, onlineCount)
    
    this.packets = generatePackets(total, count)
    this.grabs = []
    this.phase = 'GRABBING'
    this.armTimer(this.config.grabWindowSec, () => this.resolve())
    
    this.emit('PACKET_ISSUED', { issuerId: this.issuerId, totalCents: total, packetCount: this.packets.length, multiplier: this.multiplier, deadline: this.deadline, players: this.players })

    this.players.filter(p => p.isBot).forEach(bot => {
      setTimeout(() => { if (this.phase === 'GRABBING') this.grab(bot.id) }, 1000 + Math.random() * 2000)
    })
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
    const eligibleGrabbers = this.players.filter(p => !p.offline).length
    if (this.grabs.length >= this.packets.length || this.grabs.length >= eligibleGrabbers) this.resolve()
  }

  resolve() {
    if (this.phase !== 'GRABBING') return
    clearTimeout(this.timer)
    this.phase = 'RESOLVING'
    const strategy = strategies[this.config.mode] ?? strategies.worst
    const result = strategy({ grabs: this.grabs, immuneIds: this.immuneIds, rule: this.config, currentMultiplier: this.multiplier })
    this.multiplier = result.multiplierAfter
    this.phase = 'SETTLING'
    
    this.emit('SETTLED', { grabs: this.grabs, nextIssuerId: result.nextIssuerId, mineHitters: result.mineHitters, multiplier: this.multiplier, players: this.players })
    
    this.timer = setTimeout(() => {
      this.round++
      if (this.round >= this.config.maxRounds) {
        this.phase = 'FINISHED'
        if (this.config.isPublic) updatePublicRoom(this.id, this.getLobbyInfo())
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
      if (!this.immuneIds.includes(next)) {
        this.immuneIds.push(next)
        if (this.immuneIds.length > 3) this.immuneIds.shift()
      }
      this.start(next)
    }, 3500)
  }

  onIssueTimeout() { if (this.phase === 'ISSUING') this.issue(this.issuerId) }

  armTimer(seconds, fn) {
    clearTimeout(this.timer)
    this.deadline = Date.now() + seconds * 1000
    this.timer = setTimeout(fn, seconds * 1000)
  }

  snapshot() {
    return {
      roomId: this.id, phase: this.phase, round: this.round, issuerId: this.issuerId, grabs: this.grabs,
      multiplier: this.multiplier, deadline: this.deadline, seq: this.seq, config: this.config, players: this.players, hostId: this.hostId
    }
  }
}