<script setup lang="ts">
import { TONE_TEXT_CLASS, type StatusMessage } from '~/utils/status'

defineProps<{ status: StatusMessage }>()
</script>

<template>
  <p
    role="status"
    aria-live="polite"
    class="text-2xl font-medium"
    :class="TONE_TEXT_CLASS[status.tone]"
  >
    {{ status.text }}
  </p>
</template>
