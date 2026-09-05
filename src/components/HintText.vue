<script setup lang="ts">
import Icon from './Icon.vue'
export type HintTextContext = 'page' | 'section'
export interface HintTextProps { context?: HintTextContext }
withDefaults(defineProps<HintTextProps>(), { context: 'section' })
</script>
<template><div class="charcoal-hint-text" :data-context="context"><div class="charcoal-hint-text-icon"><Icon name="16/Info" /></div><p class="charcoal-hint-text-message"><slot /></p></div></template>
