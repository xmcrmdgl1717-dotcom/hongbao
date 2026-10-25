import { generatePackets } from './packet.js'
import { strategies } from './strategies.js'

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
    this.immuneIds = config.immuneIds ?? []
    this.multiplier = 1
    this.deadline = null
    this.timer = null
    this.seq = 0
    this.lastActive = Date.now()
    
    this.players = [] 
    this.hostId = null
    this.totalStats = {}
  }

  addPlayer(userId, isBot = false) {
    let player = this.players.find(p => p.id === userId)
    this.lastActive = Date.now()

    if (!player) {
      this.players.push({ id: userId, balance: 10000, isBot, offline: false })
      this.totalStats[userId] = { sent: 0, received: 0 }
      if (!this.hostId) {
        this.hostId = userId
        this.issuerId = userId
        this.immuneIds.push(userId)
      }
    } else {
      // 重连
      player.offline = false
    }
    this.emit('PLAYER_JOINED', { players: this.players })
  }

  playerOffline(userId) {
    const player = this.players.find(p => p.id === userId)
    if (player) {
      player.offline = true
      this.lastActive = Date.now()
      // 如果房主掉线，转移房主给下一个人在线的玩家
      if (this.hostId === userId) {
        const nextHost = this.players.find(p => !p.offline && !p.isBot)
        this.hostId = nextHost ? nextHost.id : null
      }
      this.emit('PLAYER_OFFLINE', { players: this.players })
    }
  }

  chat(userId, content) {
    this.emit('CHAT', { userId, content })
  }

  emit(type, payload = {}) {
    this.seq++
    this.broadcast({ type, seq: this.seq, phase: this.phase, ...payload })
  }

  start(issuerId) {
    this.issuerId = issuerId
    this.phase = 'ISSUING'
    this.grabs = []
    this.lastActive = Date.now()
    
    const bot = this.players.find(p => p.id === issuerId && p.isBot)
    if (bot) {
      this.deadline = Date.now() + this.config.issueWindowSec * 1000
      this.timer = setTimeout(() => { this.issue(bot.id) }, 1500)
    } else {
      this.armTimer(this.config.issueWindowSec, () => this.onIssueTimeout())
    }
    this.emit('PHASE', { deadline: this.deadline, issuerId: this.issuerId })
  }

  issue(userId, customAmountCents, customCount) {
    if (this.phase !== 'ISSUING' || userId !== this.issuerId) return
    clearTimeout(this.timer)
    this.lastActive = Date.now()
    
    const player = this.players.find(p => p.id === userId)
    if (!player) return

    let total = customAmountCents ? Math.max(100, customAmountCents) : (this.config.baseAmountCents * this.multiplier)
    if (player.balance < total) total = Math.min(player.balance, 100)
    if (total <= 0) total = 100
    
    player.balance -= total
    this.totalStats[userId].sent += total

    // 根据在线人数分配红包（排除离线玩家）
    const onlineCount = this.players.filter(p => !p.offline).length
    const count = customCount ? Math.max(1, customCount) : Math.max(1, onlineCount)
    
    this.packets = generatePackets(total, count)
    this.grabs = []
    this.phase = 'GRABBING'
    this.armTimer(this.config.grabWindowSec, () => this.resolve())
    
    this.emit('PACKET_ISSUED', {
      issuerId: this.issuerId,
      totalCents: total,
      packetCount: this.packets.length,
      multiplier: this.multiplier,
      deadline: this.deadline,
      players: this.players
    })

    // 机器人抢包
    this.players.filter(p => p.isBot).forEach(bot => {
      setTimeout(() => {
        if (this.phase === 'GRABBING') this.grab(bot.id)
      }, 1000 + Math.random() * 2000)
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
    this.totalStats[userId].received += amount
    this.lastActive = Date.now()

    this.emit('GRABBED', { userId, amount, remaining: this.packets.length - this.grabs.length, players: this.players })
    
    // 获取当前还能抢的在线人数
    const eligibleGrabbers = this.players.filter(p => !p.offline).length
    
    // 如果所有包都被抢了，或者所有在线的人都抢过了，就提前结算
    if (this.grabs.length >= this.packets.length || this.grabs.length >= eligibleGrabbers) {
      this.resolve()
    }
  }

  resolve() {
    if (this.phase !== 'GRABBING') return
    clearTimeout(this.timer)
    this.phase = 'RESOLVING'
    const strategy = strategies[this.config.mode] ?? strategies.worst
    const result = strategy({
      grabs: this.grabs,
      immuneIds: this.immuneIds,
      rule: this.config,
      currentMultiplier: this.multiplier
    })
    this.multiplier = result.multiplierAfter
    this.phase = 'SETTLING'
    this.lastActive = Date.now()
    
    this.emit('SETTLED', {
      grabs: this.grabs,
      nextIssuerId: result.nextIssuerId,
      mineHitters: result.mineHitters,
      multiplier: this.multiplier,
      players: this.players
    })
    
    this.timer = setTimeout(() => {
      this.round++
      if (this.round >= this.config.maxRounds) {
        this.phase = 'FINISHED'
        const finalStats = this.players.map(p => ({
          userId: p.id,
          balance: p.balance,
          net: p.balance - 10000
        })).sort((a, b) => b.balance - a.balance)
        this.emit('FINISHED', { finalStats })
        return
      }
      
      // 如果选出的接棒人掉线了，顺延给下一个人
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

  onIssueTimeout() {
    if (this.phase !== 'ISSUING') return
    this.issue(this.issuerId)
  }

  armTimer(seconds, fn) {
    clearTimeout(this.timer)
    this.deadline = Date.now() + seconds * 1000
    this.timer = setTimeout(fn, seconds * 1000)
  }

  snapshot() {
    return {
      roomId: this.id,
      phase: this.phase,
      round: this.round,
      issuerId: this.issuerId,
      grabs: this.grabs,
      multiplier: this.multiplier,
      deadline: this.deadline,
      seq: this.seq,
      config: this.config,
      players: this.players,
      hostId: this.hostId
    }
  }
}