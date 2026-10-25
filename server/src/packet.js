export function generatePackets(totalCents, count) {
  const packets = []
  let rest = totalCents
  let n = count
  for (let i = 0; i < count - 1; i++) {
    const maxCents = rest - (n - 1) * 1
    const avg = rest / n
    const cap = Math.min(Math.floor(avg * 2), maxCents)
    const amount = Math.floor(Math.random() * cap) + 1
    packets.push(amount)
    rest -= amount
    n--
  }
  packets.push(rest)
  return packets
}