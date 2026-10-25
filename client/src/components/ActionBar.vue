<script setup>
defineProps({ phase: String, isMyIssue: Boolean, canGrab: Boolean })
defineEmits(['issue', 'grab'])
</script>

<template>
  <div class="h-16 flex items-center justify-center">
    <button
      v-if="isMyIssue"
      class="px-10 py-3 rounded-full bg-gradient-to-b from-red-500 to-red-700 shadow-lg shadow-red-900/50 font-bold text-lg animate-pulse"
      @click="$emit('issue')"
    >立即发包</button>
    
    <button
      v-else-if="canGrab"
      class="px-12 py-3 rounded-full bg-gradient-to-b from-yellow-400 to-yellow-600 text-black shadow-lg shadow-yellow-900/50 font-bold text-xl animate-bounce"
      @click="$emit('grab')"
    >抢</button>

    <div v-else class="text-emerald-500 text-sm">
      {{ phase === 'GRABBING' ? '已抢过，等待其他人...' : (phase === 'SETTLING' ? '正在结算...' : '等待发包...') }}
    </div>
  </div>
</template>