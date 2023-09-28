const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        path: "",
        name: "IndexPage",
        component: () => import("pages/IndexPage.vue"),
        props: (route) => ({
          lon: route.query.lon,
          lat: route.query.lat,
        }),
      },
      {
        path: "/prijava",
        name: "PrijavaPage",
        component: () => import("pages/PrijavaPage.vue"),
      },
      {
        path: "/o_nama",
        name: "ONamaPage",
        component: () => import("pages/ONamaPage.vue"),
      },
      {
        path: "/registracija",
        name: "RegistracijaPage",
        component: () => import("pages/RegistracijaPage.vue"),
      },
      {
        path: "/profil",
        name: "ProfilPage",
        component: () => import("pages/ProfilPage.vue"),
      },
      {
        path: "/objave",
        name: "ObjavePage",
        component: () => import("pages/ObjavePage.vue"),
      },
      {
        path: "/admin/:postId",
        name: "AdminPagePost",
        component: () => import("pages/AdminPage.vue"),
        props: true,
      },
      {
        path: "/admin",
        name: "AdminPage",
        component: () => import("pages/AdminPage.vue"),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
