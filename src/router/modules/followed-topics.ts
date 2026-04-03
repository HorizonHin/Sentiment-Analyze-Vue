export default {
  path: "/followed-topics",
  name: "FollowedTopics",
  component: () => import("@/views/followed-topics/index.vue"),
  meta: {
    title: "关注话题",
    icon: "ep:star",
    showLink: true,
    rank: 5
  }
} satisfies RouteConfigsTable;
