<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { message } from "../../utils/message";
import {
  getLatestRankedNews,
  type NewsItem,
  type Topic
} from "../../api/sentiment";
import { useTopicStoreHook } from "@/store/modules/topic";

const NewsPanel = defineAsyncComponent(
  () => import("../../components/NewsPanel.vue") as Promise<any>
);
const TopicPanel = defineAsyncComponent(
  () => import("../../components/TopicPanel.vue") as Promise<any>
);

defineOptions({
  name: "Welcome"
});

type SourceNewsGroup = {
  sourceId: string;
  sourceName: string;
  items: NewsItem[];
};

const loading = ref(false);
const sourceNewsMap = ref<Record<string, NewsItem[]>>({});
const topics = ref<Topic[]>([]);
const router = useRouter();
const topicStore = useTopicStoreHook();

const sourceGroups = computed<SourceNewsGroup[]>(() => {
  return Object.entries(sourceNewsMap.value)
    .map(([sourceId, items]) => ({
      sourceId,
      sourceName: items[0]?.source_name || sourceId,
      items
    }))
    .sort((a, b) => b.items.length - a.items.length);
});

const totalNewsCount = computed(() => {
  return sourceGroups.value.reduce((sum, group) => sum + group.items.length, 0);
});

async function loadDashboardData() {
  loading.value = true;
  try {
    const newsRes = await getLatestRankedNews().catch(() => null);
    if (!newsRes) {
      throw new Error("获取新闻数据失败");
    }
    if (!newsRes.success) {
      throw new Error(newsRes.error_message || "获取新闻数据失败");
    }
    sourceNewsMap.value = newsRes.data;

  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "数据加载失败";
    message(errorMessage, { type: "error" });
    sourceNewsMap.value = {};
  } finally {
    loading.value = false;
  }
}

function handleTopicSelect(topic: Topic) {
  topicStore.setSelectedTopic(topic);
  sessionStorage.setItem("_selectedTopic", JSON.stringify(topic));
  router.push({
    path: "/topic",
    query: {
      topic: topic.topic,
      id: String(topic.id),
      created_at: topic.created_at
    }
  });
}

onMounted(() => {
  loadDashboardData();
});
</script>

<template>
  <div v-loading="loading" class="welcome-page">
    <div class="page-header">
      <h2 class="page-title">舆情看板</h2>
      <el-tag type="info" effect="plain">
        来源 {{ sourceGroups.length }} 个 | 新闻 {{ totalNewsCount }} 条 | 话题
        {{ topics.length }} 个
      </el-tag>
    </div>

    <div class="dashboard-layout">
      <NewsPanel
        :loading="loading"
        :groups="sourceGroups"
        @refresh="loadDashboardData"
      />
    </div>
  </div>
</template>

<style scoped>
.welcome-page {
  padding: 16px;
}

.page-header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-title {
  margin: 0;
  font-size: 22px;
}

.dashboard-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}
</style>
