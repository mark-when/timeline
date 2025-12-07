import { createRouter, createWebHistory } from "vue-router";
import App from "../App.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/:user?/:timeline(.*)?",
      name: "home",
      component: App,
    },
  ],
});

export default router