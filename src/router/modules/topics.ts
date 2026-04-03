export default {
  path: "/topics",
  redirect: "/topics/index",
  meta: {
    title: "热门话题",
    icon: "ep:list",
    // showLink: true,
    rank: 3
  },
  children: [
    {
      path: "/topics/index",
      name: "TopicsIndex",
      component: () => import("@/views/topics/index.vue"),
      meta: {
        title: "热门话题",
        // showLink: true
      }
    }
  ]
} satisfies RouteConfigsTable;
