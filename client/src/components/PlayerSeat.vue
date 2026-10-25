<script setup>
defineProps({ 
  playerId: String, label: String, isIssuer: Boolean, isMineHit: Boolean, balance: Number, offline: Boolean, isHost: Boolean
})
const emit = defineEmits(['kick'])
</script>

<template>
  <div 
    class="flex items-center gap-3 px-4 py-2.5 rounded-2xl border-2 transition-all duration-300 relative shadow-xl backdrop-blur-sm"
    :class="[
      offline ? 'opacity-50 grayscale bg-gray-900 border-gray-700' : 
      (isIssuer ? 'bg-gradient-to-b from-red-800/90 to-red-950/90 border-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.6)]' : 'bg-[#0d2a1c]/90 border-emerald-700/50'),
      isMineHit ? 'animate-shake border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.8)]' : ''
    ]"
  >
    <div class="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center text-xl font-black border-2 overflow-hidden relative"
         :class="isIssuer ? 'border-yellow-400' : 'border-emerald-600/50'">
      <span v-if="playerId?.startsWith('AI_')">🤖</span>
      <span v-else>{{ playerId?.slice(0, 1).toUpperCase() }}</span>
      <div v-if="offline" class="absolute inset-0 bg-black/70 flex items-center justify-center text-[10px] text-white font-bold">离线</div>
    </div>
    
    <div class="flex flex-col min-w-[80px]">
      <div class="flex items-center gap-1">
        <span class="text-sm font-black truncate max-w-[80px]" :class="isIssuer ? 'text-yellow-300' : 'text-emerald-100'">{{ label }}</span>
        <span v-if="isHost" class="text-[10px] bg-yellow-500 text-black px-1 rounded-sm font-bold">房主</span>
      </div>
      <span class="text-[12px] text-yellow-500 font-mono font-bold mt-0.5">
        {{ balance !== undefined ? (balance / 100).toFixed(2) : '0.00' }}
      </span>
    </div>
    
    <!-- 发包者标记 -->
    <div v-if="isIssuer" class="absolute -top-3 -right-3 bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-md border border-white z-30">发包中</div>
    
    <div v-if="isMineHit" class="absolute -bottom-3 -right-3 text-3xl animate-bounce z-30 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]">💣</div>
    
    <!-- 房主踢人按钮 -->
    <button v-if="isHost && playerId?.startsWith('AI_')" @click.stop="emit('kick')" class="absolute -top-2 -left-2 w-5 h-5 bg-red-600 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-red-500 z-40">×</button>
  </div>
</template>

<style>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px) rotate(-2deg); }
  50% { transform: translateX(5px) rotate(2deg); }
  75% { transform: translateX(-5px) rotate(-2deg); }
}
.animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
</style>