<script setup>
defineProps({ playerId: String, label: String })
</script>

<template>
  <div class="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900 border border-emerald-700">
    <div class="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs">
      {{ playerId ?? '-' }}
    </div>
    <span class="text-xs text-emerald-300">{{ label }}</span>
  </div>
</template>