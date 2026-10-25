<script setup>
defineProps({ phase: String, isMyIssue: Boolean, canGrab: Boolean })
defineEmits(['issue', 'grab'])
</script>

<template>
  <div class="flex gap-4">
    <button
      v-if="isMyIssue"
      class="px-8 py-3 rounded-full bg-red-500 font-bold"
      @click="$emit('issue')"
    >发红包</button>
    <button
      v-if="canGrab"
      class="px-8 py-3 rounded-full bg-yellow-500 text-black font-bold"
      @click="$emit('grab')"
    >抢</button>
  </div>
</template>