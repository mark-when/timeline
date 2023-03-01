import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "./assets/main.css";
import router from "@/router/router"

const app = createApp(App);
const pinia = createPinia();

app.use(router)
app.use(pinia);

app.mount("#app");

// vue devtools
if (import.meta.env.DEV) {
  const script = document.createElement("script");
  script.src = "http://localhost:8098";
  document.head.append(script);
}
