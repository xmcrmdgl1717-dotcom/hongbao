<script setup>
defineProps({ 
  playerId: String, 
  label: String,
  isIssuer: Boolean,
  isMineHit: Boolean,
  balance: Number,
  offline: Boolean
})
</script>

<template>
  <div 
    class="flex items-center gap-3 px-4 py-2 rounded-2xl border-2 transition-all duration-300 relative"
    :class="[
      offline ? 'opacity-50 grayscale bg-gray-900 border-gray-700' : 
      (isIssuer ? 'bg-red-900/80 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] scale-110 z-10' : 'bg-emerald-900 border-emerald-700'),
      isMineHit ? 'animate-shake border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.8)]' : ''
    ]"
  >
    <div class="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center text-sm font-bold border border-emerald-600 overflow-hidden relative">
      <span v-if="playerId?.startsWith('AI_')">🤖</span>
      <span v-else>{{ playerId?.slice(0, 2) }}</span>
      <div v-if="offline" class="absolute inset-0 bg-black/60 flex items-center justify-center text-xs">断开</div>
    </div>
    <div class="flex flex-col">
      <span class="text-sm font-bold" :class="isIssuer ? 'text-red-200' : 'text-emerald-200'">{{ label }}</span>
      <span class="text-[10px] text-yellow-400 font-mono">
        {{ balance !== undefined ? (balance / 100).toFixed(2) : '0.00' }} 元
      </span>
    </div>
    
    <div v-if="isMineHit" class="absolute -top-3 -right-3 text-3xl animate-bounce">💣</div>
  </div>
</template>

<style>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px) rotate(-2deg); }
  50% { transform: translateX(5px) rotate(2deg); }
  75% { transform: translateX(-5px) rotate(-2deg); }
}
.animate-shake {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}
</style>