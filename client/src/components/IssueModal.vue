<script setup>
import { ref } from 'vue'
import { useGameStore } from '../stores/game'

const store = useGameStore()
const emit = defineEmits(['close', 'confirm'])

const amount = ref(store.multiplier * 20) // 默认金额（元）
const count = ref(store.players.length)

function handleConfirm() {
  const cents = Math.floor(parseFloat(amount.value) * 100)
  if (isNaN(cents) || cents < 100) return alert('最低 1 元')
  if (count.value < 1) return alert('个数至少为 1')
  if (cents > (store.myBalance || 0)) return alert('余额不足！')
  
  emit('confirm', { amount: cents, count: count.value })
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm" @click.self="$emit('close')">
    <div class="bg-emerald-900 w-full max-w-sm rounded-2xl p-6 border border-emerald-700 shadow-2xl animate-scale-up relative">
      <h3 class="text-center text-xl font-bold text-emerald-100 mb-6">发红包</h3>
      
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-2 border-b border-emerald-700 pb-2">
          <span class="text-emerald-300 font-bold text-lg">金额</span>
          <input v-model="amount" type="number" step="0.01" class="flex-1 bg-transparent text-3xl font-mono text-yellow-400 outline-none text-right" />
          <span class="text-emerald-300">元</span>
        </div>
        <div class="flex items-center gap-2 border-b border-emerald-700 pb-2">
          <span class="text-emerald-300 text-sm">个数</span>
          <input v-model="count" type="number" class="flex-1 bg-transparent text-xl font-mono text-emerald-100 outline-none text-right" />
          <span class="text-emerald-300 text-sm">个</span>
        </div>
      </div>

      <div class="text-xs text-emerald-400 mt-2 text-center">
        我的余额: {{ (store.myBalance / 100).toFixed(2) }} 元
      </div>

      <div class="flex gap-3 mt-8">
        <button @click="$emit('close')" class="flex-1 py-3 rounded-xl bg-emerald-800 text-emerald-300 font-bold">取消</button>
        <button @click="handleConfirm" class="flex-1 py-3 rounded-xl bg-gradient-to-b from-red-500 to-red-700 text-white font-bold shadow-lg">塞钱进红包</button>
      </div>
    </div>
  </div>
</template>