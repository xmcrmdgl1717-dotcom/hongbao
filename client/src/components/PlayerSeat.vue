<script setup>
defineProps({ 
  playerId: String, 
  label: String,
  isIssuer: Boolean
})
</script>

<template>
  <div 
    class="flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-300"
    :class="isIssuer ? 'bg-red-900/50 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-emerald-900 border-emerald-700'"
  >
    <div class="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center text-xs overflow-hidden">
      {{ playerId?.slice(0, 2) }}
    </div>
    <span class="text-xs" :class="isIssuer ? 'text-red-300' : 'text-emerald-300'">{{ label }}</span>
  </div>
</template>