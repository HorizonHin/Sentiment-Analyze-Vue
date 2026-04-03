export default {
  path: "/risk-topics",
  redirect: "/risk-topics/index",
  meta: {
    title: "风险话题",
    icon: "ep:warning",
    rank: 4
  },
  children: [
    {
      path: "/risk-topics/index",
      name: "RiskTopicsIndex",
      component: () => import("@/views/risk-topics.vue"),
      meta: {
        title: "风险话题",
        keepAlive: true
      }
    }
  ]
} satisfies RouteConfigsTable;
