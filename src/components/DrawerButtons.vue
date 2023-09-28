<template>
  <q-item clickable tag="a" target="_blank" :href="link">
    <q-item-section>
      <q-btn flat label class="q-btn-standard">Početna</q-btn>
      <q-btn flat label class="q-btn-standard">O nama</q-btn>
      <q-btn flat label class="q-btn-standard">Prijava</q-btn>
    </q-item-section>
  </q-item>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "DrawerButtons",
});
</script>
