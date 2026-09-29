<script setup lang="ts">
import { SITE } from '~/config/site'
</script>

<template>
  <div class="flex flex-col min-h-dvh">
    <UHeader>
      <template #left>
        <NuxtLink
          to="/"
          class="focus-visible:outline-3 outline-primary/25 rounded-md p-1 -ms-1"
        >
          <AppLogo class="w-auto h-6 shrink-0" />
        </NuxtLink>
      </template>

      <template #right>
        <UColorModeButton />
        <GitHubButton />
      </template>
    </UHeader>

    <!-- UMain's theme default is min-h-[calc(100vh-var(--ui-header-height))],
         which double-counts the header and forces a scrollbar; min-h-0 lets the
         flex-1 box fill exactly the space between header and footer so pages can
         stay on one screen. -->
    <UMain
      class="flex flex-col flex-1"
      :ui="{ base: 'min-h-0' }"
    >
      <slot />
    </UMain>

    <USeparator icon="i-simple-icons-nuxtdotjs" />

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          {{ SITE.name }} • Built with {{ SITE.framework }} • © {{ new Date().getFullYear() }}
        </p>
      </template>

      <template #right>
        <GitHubButton />
      </template>
    </UFooter>
  </div>
</template>
