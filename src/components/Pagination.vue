<script setup lang="ts">
import { computed, type Component } from 'vue'
import IconButton from './IconButton.vue'
export interface PaginationProps { page: number; pageCount: number; pageRangeDisplayed?: 5 | 7; size?: 'S' | 'M'; ariaLabelPrev?: string; ariaLabelNext?: string; makeUrl?: (page: number) => string; component?: string | Component; linkProps?: Record<string, unknown> }
const props = withDefaults(defineProps<PaginationProps>(), { pageRangeDisplayed: 7, size: 'M', ariaLabelPrev: 'Previous', ariaLabelNext: 'Next', component: 'a' })
const emit = defineEmits<{ change: [page: number]; 'update:page': [page: number] }>()
const pages = computed(() => {
  const last = Math.min(props.pageCount, Math.max(props.page + Math.floor(props.pageRangeDisplayed / 2), props.pageRangeDisplayed))
  if (last <= props.pageRangeDisplayed) return Array.from({ length: Math.max(0, last) }, (_, i) => i + 1)
  const start = last - (props.pageRangeDisplayed - 1) + 2
  return [1, '...' as const, ...Array.from({ length: last - start + 1 }, (_, i) => start + i)]
})
function change(page: number) { emit('change', page); emit('update:page', page) }
</script>
<template><nav class="charcoal-pagination" :data-size="size" aria-label="Pagination">
  <IconButton v-if="makeUrl" v-bind="linkProps" :component="component" :href="makeUrl(Math.max(1, page - 1))" icon="24/Prev" :size="size" class="charcoal-pagination-nav-button" :data-hidden="page <= 1 || undefined" :aria-disabled="page <= 1" :aria-label="ariaLabelPrev" />
  <IconButton v-else icon="24/Prev" :size="size" class="charcoal-pagination-nav-button" :data-hidden="page <= 1 || undefined" :disabled="page <= 1" :aria-label="ariaLabelPrev" @click="change(Math.max(1, page - 1))" />
  <template v-for="item in pages" :key="item">
    <IconButton v-if="item === '...'" icon="24/Dot" :size="size" disabled class="charcoal-pagination-spacer" aria-hidden="true" />
    <span v-else-if="item === page" class="charcoal-pagination-button" aria-current="page">{{ item }}</span>
    <component :is="component" v-else-if="makeUrl" v-bind="linkProps" :href="makeUrl(item)" class="charcoal-pagination-button">{{ item }}</component>
    <button v-else type="button" class="charcoal-pagination-button" @click="change(item)">{{ item }}</button>
  </template>
  <IconButton v-if="makeUrl" v-bind="linkProps" :component="component" :href="makeUrl(Math.min(pageCount, page + 1))" icon="24/Next" :size="size" class="charcoal-pagination-nav-button" :data-hidden="page >= pageCount || undefined" :aria-disabled="page >= pageCount" :aria-label="ariaLabelNext" />
  <IconButton v-else icon="24/Next" :size="size" class="charcoal-pagination-nav-button" :data-hidden="page >= pageCount || undefined" :disabled="page >= pageCount" :aria-label="ariaLabelNext" @click="change(Math.min(pageCount, page + 1))" />
</nav></template>
