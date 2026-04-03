export default {
  path: "/search-topics",
  name: "SearchTopics",
  component: () => import("@/views/search-topics/index.vue"),
  meta: {
    title: "话题搜索",
    icon: "ep:search",
    showLink: true,
    rank: 4,
    keepAlive: true
  }
} satisfies RouteConfigsTable;
