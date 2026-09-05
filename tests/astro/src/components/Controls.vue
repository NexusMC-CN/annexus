<script setup lang="ts">
import { ref } from 'vue'
import { AnnexusProvider, Button, Checkbox, TextField, Modal, ModalHeader, ModalBody, ModalButtons } from '@nexusmc/annexus'
defineProps<{ label: string }>()
const count = ref(0)
const enabled = ref(false)
const text = ref('Astro + Vue')
const open = ref(false)
</script>
<template>
  <AnnexusProvider>
    <section :aria-label="label">
      <Button variant="Primary" @click="count++">Count {{ count }}</Button>
      <Checkbox v-model="enabled">Enable</Checkbox>
      <TextField v-model="text" :label="label" show-label show-count />
      <Button @click="open = true">Open</Button>
      <output>{{ text }} / {{ enabled }}</output>
      <Modal v-model="open" title="Astro dialog" is-dismissable>
        <ModalHeader />
        <ModalBody>{{ text }}</ModalBody>
        <ModalButtons><Button @click="open = false">Done</Button></ModalButtons>
      </Modal>
    </section>
  </AnnexusProvider>
</template>
