<script setup lang="ts">
import { SITE } from '~/config/site'
</script>

<template>
  <span class="flex items-center gap-2">
    <UIcon
      :name="SITE.icon"
      class="size-6 text-primary shrink-0"
    />
    <span class="text-highlighted font-semibold text-lg leading-none">
      {{ SITE.name }}
    </span>
  </span>
</template>
