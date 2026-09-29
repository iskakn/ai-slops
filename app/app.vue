<script setup lang="ts">
import { SITE } from '~/config/site'
import { publicPath } from '~/utils/publicPath'

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: publicPath(SITE.favicon) }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

useSeoMeta({
  title: SITE.name,
  description: SITE.description,
  ogTitle: SITE.name,
  ogDescription: SITE.description
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
