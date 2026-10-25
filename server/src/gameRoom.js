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
  }
  emit(type, payload = {}) {
    this.seq++
    this.broadcast({ type, seq: this.seq, phase: this.phase, ...payload })
  }
  start(issuerId) {
    this.issuerId = issuerId
    this.phase = 'ISSUING'
    this.armTimer(this.config.issueWindowSec, () => this.onIssueTimeout())
    this.emit('PHASE', { deadline: this.deadline, issuerId: this.issuerId })
  }
  issue(userId) {
    if (this.phase !== 'ISSUING' || userId !== this.issuerId) return
    clearTimeout(this.timer)
    const total = this.config.baseAmountCents * this.multiplier
    this.packets = generatePackets(total, this.config.packetCount)
    this.grabs = []
    this.phase = 'GRABBING'
    this.armTimer(this.config.grabWindowSec, () => this.resolve())
    this.emit('PACKET_ISSUED', {
      issuerId: this.issuerId,
      totalCents: total,
      packetCount: this.packets.length,
      multiplier: this.multiplier,
      deadline: this.deadline
    })
  }
  grab(userId) {
    if (this.phase !== 'GRABBING') return
    if (this.grabs.some(g => g.userId === userId)) return
    if (this.grabs.length >= this.packets.length) return
    const amount = this.packets[this.grabs.length]
    this.grabs.push({ userId, amount })
    this.emit('GRABBED', { userId, amount, remaining: this.packets.length - this.grabs.length })
    if (this.grabs.length === this.packets.length) this.resolve()
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
    this.emit('SETTLED', {
      grabs: this.grabs,
      nextIssuerId: result.nextIssuerId,
      mineHitters: result.mineHitters,
      multiplier: this.multiplier
    })
    this.timer = setTimeout(() => {
      this.round++
      if (this.round >= this.config.maxRounds) {
        this.phase = 'FINISHED'
        this.emit('FINISHED')
        return
      }
      if (result.nextIssuerId) this.start(result.nextIssuerId)
      else this.start(this.issuerId)
    }, 2200)
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
      config: this.config
    }
  }
}