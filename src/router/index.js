import { createRouter, createWebHistory } from "vue-router";
import Lobby from "../views/Lobby.vue";

const routes = [
  {
    path: "/",
    redirect: "/lobby",
  },
  {
    path: "/lobby",
    name: "Lobby",
    component: Lobby,
  },
  {
    path: "/room/:id",
    name: "RoomWaiting",
    component: () => import(/* webpackChunkName: "room" */ "../views/RoomWaiting.vue"),
  },
  {
    path: "/game/:id",
    name: "Game",
    component: () => import(/* webpackChunkName: "game" */ "../views/Game.vue"),
  },
  {
    path: "/about",
    name: "About",
    component: () => import(/* webpackChunkName: "about" */ "../views/About.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
