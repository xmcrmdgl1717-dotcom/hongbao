export const strategies = {
  worst({ grabs, immuneIds }) {
    const sorted = [...grabs].sort((a, b) => a.amount - b.amount)
    const issuer = sorted.find(g => !immuneIds.includes(g.userId))
    return { nextIssuerId: issuer?.userId ?? null, mineHitters: [], multiplierAfter: 1 }
  },
  tail({ grabs, rule }) {
    const hit = grabs.filter(g => String(g.amount).slice(-1) === String(rule.tailDigit))
    return { nextIssuerId: hit[0]?.userId ?? null, mineHitters: [], multiplierAfter: 1 }
  },
  multiplier({ grabs, rule, currentMultiplier }) {
    const max = [...grabs].sort((a, b) => b.amount - a.amount)[0]
    const after = Math.min(currentMultiplier * 2, rule.multiplierCap ?? 4)
    return { nextIssuerId: max?.userId ?? null, mineHitters: [], multiplierAfter: after }
  }
}