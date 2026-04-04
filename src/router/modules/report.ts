export default {
  path: "/report",
  redirect: "/report/daily",
  meta: {
    title: "每日分析报告",
    icon: "ep:document",
    rank: 8
  },
  children: [
    {
      path: "/report/daily",
      name: "DailyReport",
      component: () => import("@/views/report/daily-report.vue"),
      meta: {
        title: "舆情日报",
        keepAlive: true
      }
    }
  ]
} satisfies RouteConfigsTable;
