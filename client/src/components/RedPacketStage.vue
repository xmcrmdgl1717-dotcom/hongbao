<script setup>
import CountdownRing from './CountdownRing.vue'
defineProps({ phase: String, grabs: Array, deadline: Number })
</script>

<template>
  <div class="w-72 h-72 rounded-full bg-red-700 border-8 border-red-400 flex flex-col items-center justify-center relative">
    <CountdownRing v-if="deadline" :deadline="deadline" />
    <template v-if="phase === 'GRABBING'">
      <span class="text-4xl font-bold">红包</span>
      <span class="text-sm mt-2">{{ grabs.length }} 人已抢</span>
    </template>
    <template v-else-if="phase === 'SETTLING'">
      <span class="text-sm">结算中…</span>
    </template>
    <template v-else>
      <span class="text-sm">等待发包</span>
    </template>
  </div>
</template>