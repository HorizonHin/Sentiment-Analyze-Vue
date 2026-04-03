export default {
  path: "/keyword-topics",
  name: "KeywordTopics",
  component: () => import("@/views/keyword-topics/index.vue"),
  meta: {
    title: "关键词话题",
    icon: "ep:search",
    showLink: true,
    rank: 4
  }
} satisfies RouteConfigsTable;
