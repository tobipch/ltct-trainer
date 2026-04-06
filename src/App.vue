<script setup>
import {RouterView} from 'vue-router'
import NavBar from "@/components/nav/NavBar.vue";
import "@/assets/global.css"
import {useThemeStore} from "@/stores/ThemeStore";
import {useSessionStore} from "@/stores/SessionStore";
import {useSelectedStore} from "@/stores/SelectedStore";
import {watch} from "vue";

useThemeStore().applyCurrentTheme();
const selected = useSelectedStore()
const session = useSessionStore()

// bind selectStore and sessionStore
watch(() => selected.store.keys, () => {
  session.setSelectedKeys(selected.store.keys)
})
session.setSelectedKeys(selected.store.keys)

</script>

<template>
  <div class="min-vh-100 d-flex flex-column">
    <NavBar/>
    <div class="app-content flex-grow-1 d-flex flex-column">
      <RouterView/>
    </div>
  </div>
</template>

<style>
:root {
  --app-gutter: 12px;
}
.app-content {
  max-width: 1500px;
  width: 100%;
  margin: 0 auto;
  padding-left: var(--app-gutter);
  padding-right: var(--app-gutter);
}
</style>

