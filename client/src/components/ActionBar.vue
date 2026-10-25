<script setup>
import { playSound } from '../utils/audio'
defineProps({ phase: String, isMyIssue: Boolean, canGrab: Boolean })
const emit = defineEmits(['issue', 'grab'])

function handleIssue() { playSound('issue'); emit('issue') }
function handleGrab() { playSound('grab'); emit('grab') }
</script>

<template>
  <div class="h-20 flex items-center justify-center w-full">
    <button
      v-if="isMyIssue"
      class="px-12 py-4 rounded-full bg-gradient-to-b from-red-500 to-red-700 shadow-xl shadow-red-900/50 font-black text-xl animate-pulse hover:scale-105 active:scale-95 transition-transform"
      @click="handleIssue"
    >发红包</button>
    
    <button
      v-else-if="canGrab"
      class="px-16 py-4 rounded-full bg-gradient-to-b from-yellow-400 to-yellow-600 text-black shadow-xl shadow-yellow-900/50 font-black text-2xl animate-bounce hover:scale-105 active:scale-95 transition-transform"
      @click="handleGrab"
    >抢红包</button>

    <div v-else class="text-emerald-500 text-sm font-bold tracking-widest bg-emerald-900/50 px-6 py-3 rounded-full border border-emerald-800">
      {{ phase === 'GRABBING' ? '已抢，等待中...' : (phase === 'SETTLING' ? '结算中...' : '等待其他人发包...') }}
    </div>
  </div>
</template>