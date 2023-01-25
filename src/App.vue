<script setup lang="ts">
import { useMarkwhenStore } from "./Markwhen/markwhenStore";
import Timeline from "./Timeline/Timeline.vue";

const markwhenStore = useMarkwhenStore();
</script>

<template>
  <Timeline v-if="markwhenStore.markwhen"/>
</template>

<style scoped></style>
