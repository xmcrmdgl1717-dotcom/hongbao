<script setup>
import { computed } from 'vue'
import CountdownRing from './CountdownRing.vue'
const props = defineProps({ phase: String, grabs: Array, deadline: Number, lastSettle: Object })
</script>

<template>
  <div class="relative w-80 h-[22rem] flex flex-col items-center justify-center perspective-1000">
    <!-- 红包本体 3D 质感 -->
    <div 
      class="w-64 h-80 rounded-2xl bg-gradient-to-b from-red-500 via-red-600 to-red-800 border-t-2 border-red-400/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center relative transition-all duration-500 preserve-3d"
      :class="{'scale-95 opacity-90 rotate-x-12': phase === 'SETTLING'}"
    >
      <!-- 红包封口 -->
      <div class="absolute top-0 w-full h-20 bg-gradient-to-b from-red-400 to-red-600 rounded-t-2xl border-b-2 border-red-900/30 flex items-center justify-center shadow-md">
        <span class="text-4xl drop-shadow-lg">🧧</span>
      </div>
      <!-- 封口高光 -->
      <div class="absolute top-0 w-full h-10 bg-white/10 rounded-t-2xl pointer-events-none"></div>

      <CountdownRing v-if="deadline && phase !== 'SETTLING'" :deadline="deadline" />
      
      <!-- 文字状态 -->
      <div class="mt-12 flex flex-col items-center z-10">
        <template v-if="phase === 'GRABBING'">
          <span class="text-6xl font-black text-yellow-300 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">{{ grabs.length }}</span>
          <span class="text-sm text-red-200 mt-2 font-bold tracking-widest">已抢人数</span>
        </template>
        <template v-else-if="phase === 'SETTLING'">
          <span class="text-3xl font-black text-yellow-100 animate-pulse drop-shadow-lg">开奖中...</span>
        </template>
        <template v-else>
          <span class="text-2xl font-bold text-red-200 drop-shadow-md">等待发包</span>
        </template>
      </div>
    </div>

    <!-- 结算飘字 -->
    <div v-if="phase === 'SETTLING' && lastSettle" class="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
      <div class="animate-float-up flex flex-col items-center bg-black/60 px-6 py-3 rounded-2xl backdrop-blur-sm border border-yellow-500/30">
        <span v-if="lastSettle.nextIssuerId === lastSettle.issuerId" class="text-lg text-red-300 font-bold">无人接棒，继续发包</span>
        <span v-else class="text-lg text-emerald-300 font-bold">接棒人: <span class="text-yellow-300">{{ lastSettle.nextIssuerId }}</span></span>
      </div>
    </div>
  </div>
</template>

<style>
@keyframes float-up {
  0% { transform: translateY(20px) scale(0.9); opacity: 0; }
  20% { transform: translateY(0) scale(1); opacity: 1; }
  80% { transform: translateY(-20px) scale(1); opacity: 1; }
  100% { transform: translateY(-40px) scale(0.9); opacity: 0; }
}
.animate-float-up { animation: float-up 2.5s ease-out forwards; }
</style>