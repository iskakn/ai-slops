<script setup lang="ts">
import { SITE } from '~/config/site'
</script>

<template>
  <UButton
    :to="SITE.repository"
    target="_blank"
    icon="i-simple-icons-github"
    aria-label="GitHub"
    color="neutral"
    variant="ghost"
  />
</template>
