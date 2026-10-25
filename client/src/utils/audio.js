// 使用 Web Audio API 合成简单音效，无需外部文件
const ctx = new (window.AudioContext || window.webkitAudioContext)()

export function playSound(type) {
  if (ctx.state === 'suspended') ctx.resume()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)

  const now = ctx.currentTime

  if (type === 'grab') {
    // 抢红包：清脆的叮
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, now)
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1)
    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
    osc.start(now)
    osc.stop(now + 0.3)
  } else if (type === 'mine') {
    // 中雷：低沉的嗡鸣
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(150, now)
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.5)
    gain.gain.setValueAtTime(0.5, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5)
    osc.start(now)
    osc.stop(now + 0.5)
  } else if (type === 'issue') {
    // 发包：快速的滑音
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(400, now)
    osc.frequency.linearRampToValueAtTime(600, now + 0.2)
    gain.gain.setValueAtTime(0.2, now)
    gain.gain.linearRampToValueAtTime(0.01, now + 0.2)
    osc.start(now)
    osc.stop(now + 0.2)
  }
}