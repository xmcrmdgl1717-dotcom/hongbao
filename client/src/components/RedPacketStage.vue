<script setup>
import { computed } from 'vue'
import CountdownRing from './CountdownRing.vue'
const props = defineProps({ phase: String, grabs: Array, deadline: Number, lastSettle: Object })

// 如果是我抢到了，显示浮动金额
const myGrab = computed(() => {
  if (!props.lastSettle) return null
  return props.lastSettle.grabs.find(g => g.userId === props.lastSettle.myId)
})
</script>

<template>
  <div class="relative w-80 h-96 flex flex-col items-center justify-center">
    <!-- 红包本体 -->
    <div 
      class="w-64 h-80 rounded-2xl bg-gradient-to-b from-red-600 to-red-800 border-4 border-red-400 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center relative transition-transform duration-500"
      :class="{'scale-95 opacity-80': phase === 'SETTLING'}"
    >
      <!-- 封口装饰 -->
      <div class="absolute top-0 w-full h-16 bg-red-500 rounded-t-xl border-b-2 border-red-400/50 flex items-center justify-center">
        <span class="text-2xl">🧧</span>
      </div>

      <CountdownRing v-if="deadline && phase !== 'SETTLING'" :deadline="deadline" />
      
      <div class="mt-8 flex flex-col items-center">
        <template v-if="phase === 'GRABBING'">
          <span class="text-5xl font-black text-yellow-300 drop-shadow-md">{{ grabs.length }}</span>
          <span class="text-sm text-red-200 mt-2">人已抢</span>
        </template>
        <template v-else-if="phase === 'SETTLING'">
          <span class="text-2xl font-bold text-yellow-100 animate-pulse">结算中...</span>
        </template>
        <template v-else>
          <span class="text-xl font-bold text-red-200">等待发包</span>
        </template>
      </div>
    </div>

    <!-- 结算飘字 -->
    <div v-if="phase === 'SETTLING' && lastSettle" class="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div class="text-4xl font-black text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.8)] animate-float-up flex flex-col items-center">
        <span v-if="lastSettle.nextIssuerId === lastSettle.issuerId" class="text-xl text-red-300 mb-2">无人接棒，继续发包</span>
        <span v-else class="text-xl text-emerald-300 mb-2">接棒人: {{ lastSettle.nextIssuerId }}</span>
      </div>
    </div>
  </div>
</template>

<style>
@keyframes float-up {
  0% { transform: translateY(20px); opacity: 0; }
  20% { transform: translateY(0); opacity: 1; }
  80% { transform: translateY(-20px); opacity: 1; }
  100% { transform: translateY(-40px); opacity: 0; }
}
.animate-float-up {
  animation: float-up 2s ease-out forwards;
}
</style>