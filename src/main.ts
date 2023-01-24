import { createApp } from "vue";
import { createPinia } from "pinia";
import Timeline from "./Timeline/Timeline.vue";

import "./assets/main.css";

const app = createApp(Timeline);

app.use(createPinia());

app.mount("#app");
console.log('timeline mounted')