<script setup lang="ts">
defineProps<{ disabled?: boolean }>()

const emit = defineEmits<{ replay: [] }>()
</script>

<template>
  <!-- Hidden with `invisible`, never `v-if`: unmounting it would re-centre the
       flex column and make the whole page jump when a round ends. -->
  <UButton
    label="Play again"
    color="neutral"
    variant="subtle"
    size="lg"
    :disabled="disabled"
    :class="disabled && 'invisible'"
    @click="emit('replay')"
  />
</template>
