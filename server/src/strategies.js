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
  },
  
  mine({ grabs, rule }) {
    // 设定雷号为4, 中雷者向发包者赔付虚拟筹码 (这里仅记录状态)
    const mineDigit = String(rule.tailDigit || '4')
    const mineHitters = grabs.filter(g => String(g.amount).slice(-1) === mineDigit).map(g => g.userId)
    
    // 扫雷玩法中，通常由中雷者接棒发红包
    // 如果都未中雷，默认由手气最佳接棒
    let nextIssuerId = mineHitters[0]
    if (!nextIssuerId) {
      const max = [...grabs].sort((a, b) => b.amount - a.amount)[0]
      nextIssuerId = max?.userId
    }
    return { nextIssuerId: nextIssuerId ?? null, mineHitters, multiplierAfter: 1 }
  }
}