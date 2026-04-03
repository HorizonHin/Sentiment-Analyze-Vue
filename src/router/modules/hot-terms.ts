export default {
  path: "/hot-terms",
  name: "HotTerms",
  component: () => import("@/views/hot-terms/index.vue"),
  meta: {
    title: "热词发现",
    icon: "ep:trend-charts",
    showLink: true,
    rank: 2
  }
} satisfies RouteConfigsTable;
