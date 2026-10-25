<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'

const store = useGameStore()
const emit = defineEmits(['leave'])

const topPlayer = computed(() => store.finalStats[0])

function handleRestart() { window.location.reload() }
function handleLeave() {
  localStorage.removeItem('rp_roomId')
  localStorage.removeItem('rp_myId')
  emit('leave')
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-emerald-900 border-4 border-yellow-500 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.3)] animate-scale-up">
      <div class="bg-gradient-to-r from-yellow-600 to-yellow-400 p-4 text-center">
        <h2 class="text-2xl font-black text-emerald-950">牌局结算</h2>
      </div>

      <div class="p-6 flex flex-col items-center border-b border-emerald-800 relative">
        <div class="w-20 h-20 rounded-full bg-yellow-500 flex items-center justify-center text-3xl font-black text-white shadow-[0_0_20px_rgba(234,179,8,0.8)] mb-3">👑</div>
        <h3 class="text-xl font-bold text-yellow-400 mb-1">{{ topPlayer?.userId }}</h3>
        <p class="text-3xl font-mono text-green-400">+{{ (topPlayer?.net / 100).toFixed(2) }} 元</p>
      </div>

      <div class="p-4 max-h-60 overflow-y-auto">
        <div v-for="(stat, index) in store.finalStats" :key="stat.userId" 
             class="flex justify-between items-center py-2 px-3 rounded-lg mb-1"
             :class="stat.userId === store.myId ? 'bg-emerald-800/50' : ''">
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono w-4 text-emerald-500">{{ index + 1 }}</span>
            <span class="text-sm font-bold" :class="stat.userId === store.myId ? 'text-yellow-400' : 'text-emerald-200'">
              {{ stat.userId }}
            </span>
          </div>
          <div class="flex flex-col items-end">
            <span class="font-mono font-bold" :class="stat.net >= 0 ? 'text-green-400' : 'text-red-400'">
              {{ stat.net >= 0 ? '+' : '' }}{{ (stat.net / 100).toFixed(2) }}
            </span>
            <span class="text-[10px] text-emerald-500">余额: {{ (stat.balance / 100).toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <div class="p-4 flex gap-3 bg-emerald-950/50">
        <button @click="handleLeave" class="flex-1 py-3 rounded-xl border border-emerald-700 text-emerald-300 font-bold hover:bg-emerald-800 transition">返回大厅</button>
        <button @click="handleRestart" class="flex-1 py-3 rounded-xl bg-gradient-to-b from-red-500 to-red-700 text-white font-bold shadow-lg hover:from-red-400 hover:to-red-600 transition">再来一局</button>
      </div>
    </div>
  </div>
</template>

<style>
@keyframes scale-up {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.animate-scale-up {
  animation: scale-up 0.3s ease-out forwards;
}
</style>