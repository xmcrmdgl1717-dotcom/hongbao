<script setup>
import { ref } from 'vue'
import { useGameStore } from '../stores/game'

const store = useGameStore()
const emit = defineEmits(['close', 'confirm'])

// 默认金额 = 底金 (20元) * 当前倍数
const baseCents = store.config?.baseAmountCents || 2000
const amount = ref((baseCents * store.multiplier) / 100)
const count = ref(store.players.filter(p => !p.offline).length || 1)

function handleConfirm() {
  const cents = Math.floor(parseFloat(amount.value) * 100)
  if (isNaN(cents) || cents < 100) return alert('最低 1 元')
  if (count.value < 1) return alert('个数至少为 1')
  if (cents > (store.myBalance || 0)) return alert('余额不足！')
  
  emit('confirm', { amount: cents, count: count.value })
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm" @click.self="$emit('close')">
    <div class="bg-gradient-to-b from-[#1a3c2a] to-[#0d1f15] w-full max-w-sm rounded-3xl p-6 border border-emerald-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-scale-up relative overflow-hidden">
      <div class="absolute top-0 right-0 w-32 h-32 bg-red-500/20 blur-3xl rounded-full"></div>

      <h3 class="text-center text-2xl font-black text-yellow-400 mb-2 drop-shadow-md">发红包</h3>
      <p class="text-center text-xs text-emerald-400 mb-6">当前倍数 x{{ store.multiplier }} (基础20元)</p>
      
      <div class="flex flex-col gap-5">
        <div class="flex items-center gap-2 border-b border-emerald-700/50 pb-2">
          <span class="text-emerald-300 font-bold text-lg">金额</span>
          <input v-model="amount" type="number" step="0.01" class="flex-1 bg-transparent text-4xl font-black font-mono text-yellow-300 outline-none text-right" />
          <span class="text-emerald-300">元</span>
        </div>
        <div class="flex items-center gap-2 border-b border-emerald-700/50 pb-2">
          <span class="text-emerald-300 text-sm font-bold">个数</span>
          <input v-model="count" type="number" class="flex-1 bg-transparent text-2xl font-mono text-emerald-100 outline-none text-right" />
          <span class="text-emerald-300 text-sm">个</span>
        </div>
      </div>

      <div class="text-xs text-emerald-400/80 mt-3 text-center">
        我的余额: <span class="text-yellow-500 font-mono">{{ (store.myBalance / 100).toFixed(2) }}</span> 元
      </div>

      <div class="flex gap-3 mt-8">
        <button @click="$emit('close')" class="flex-1 py-3 rounded-xl bg-emerald-800/50 text-emerald-300 font-bold hover:bg-emerald-800 transition border border-emerald-700">取消</button>
        <button @click="handleConfirm" class="flex-1 py-3 rounded-xl bg-gradient-to-b from-red-500 to-red-700 text-white font-black shadow-lg hover:from-red-400 hover:to-red-600 transition border-b-4 border-red-900 active:border-b-0 active:translate-y-1">塞钱</button>
      </div>
    </div>
  </div>
</template>

<style>
@keyframes scale-up { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.animate-scale-up { animation: scale-up 0.2s ease-out forwards; }
</style>