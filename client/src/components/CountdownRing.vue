<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
const props = defineProps({ deadline: Number })
const left = ref(0)
let raf

function tick() {
  left.value = Math.max(0, Math.ceil((props.deadline - Date.now()) / 1000))
  raf = requestAnimationFrame(tick)
}
onMounted(tick)
onUnmounted(() => cancelAnimationFrame(raf))
</script>

<template>
  <span class="absolute -top-10 text-2xl font-mono">{{ left }}s</span>
</template>