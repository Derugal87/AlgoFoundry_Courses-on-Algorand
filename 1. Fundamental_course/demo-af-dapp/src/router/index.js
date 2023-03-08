import Vue from "vue";
import VueRouter from "vue-router";

const homeView = () => import("../views/HomeView.vue");
const walletDemoView = () => import("../views/WalletDemoView.vue");
const asaDemoView = () => import("../views/ASADemoView.vue");

Vue.use(VueRouter);
const router = new VueRouter({
    mode: "history",
    routes: [
        {
            path: "/",
            component: homeView,
            name: "home",
        },
        {
            path: "/wallet-demo",
            component: walletDemoView,
            name: "walletDemo",
        },
        {
            path: "/asa-demo",
            component: asaDemoView,
            name: "asaDemo",
        },
    ],
});

export default router;
