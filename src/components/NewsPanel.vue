<script setup lang="ts">
import { computed, defineAsyncComponent, getCurrentInstance } from "vue";
import type { NewsItem } from "../api/sentiment";

defineOptions({
  name: "NewsPanel"
});

type SourceNewsGroup = {
  sourceId: string;
  sourceName: string;
  items: NewsItem[];
};

const props = defineProps<{
  loading: boolean;
  groups: SourceNewsGroup[];
}>();

const emit = defineEmits<{
  (event: "refresh"): void;
}>();

const instance = getCurrentInstance();

const NewsItemCard = defineAsyncComponent(
  () => import("./NewsItemCard.vue") as Promise<any>
);

const limitedGroups = computed(() => {
  return props.groups.map(group => ({
    ...group,
    items: [...group.items].sort((a, b) => {
      const rankA = Number.isFinite(a.latest_rank)
        ? a.latest_rank
        : Number.MAX_SAFE_INTEGER;
      const rankB = Number.isFinite(b.latest_rank)
        ? b.latest_rank
        : Number.MAX_SAFE_INTEGER;
      return rankA - rankB;
    })
  }));
});

const showRefreshButton = computed(() => {
  const handler = instance?.vnode.props?.onRefresh;
  if (Array.isArray(handler)) {
    return handler.length > 0;
  }
  return typeof handler === "function";
});

function displayRank(
  rank: number | string | undefined,
  fallbackIndex: number
): string {
  if (typeof rank === "number" && Number.isFinite(rank)) {
    return String(rank);
  }
  if (typeof rank === "string" && rank.trim()) {
    return rank;
  }
  return String(fallbackIndex + 1);
}

function handleRefresh() {
  emit("refresh");
}
</script>

<template>
  <section class="news-panel">
    <div class="section-header">
      <h3>按来源展示 NewsItem</h3>
      <el-button
        v-if="showRefreshButton"
        size="small"
        :loading="loading"
        @click="handleRefresh"
      >
        刷新
      </el-button>
    </div>

    <el-empty v-if="!groups.length && !loading" description="暂无新闻数据" />

    <div v-else class="source-group-list">
      <el-card
        v-for="group in limitedGroups"
        :key="group.sourceId"
        class="source-group-card"
        shadow="never"
      >
        <template #header>
          <div class="group-header">
            <span class="group-title">{{ group.sourceName }}</span>
            <el-tag size="small" type="primary" effect="plain"
              >{{ group.items.length }} 条</el-tag
            >
          </div>
        </template>

        <el-scrollbar max-height="360px" class="news-scrollbar">
          <div class="news-list">
            <NewsItemCard
              v-for="(newsItem, index) in group.items"
              :key="`${group.sourceId}-${newsItem.id}-${newsItem.title}`"
              :rank="displayRank(newsItem.latest_rank, index)"
              :item="newsItem"
            />
          </div>
        </el-scrollbar>
      </el-card>
    </div>
  </section>
</template>

<style scoped>
.news-panel {
  min-width: 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
}

.source-group-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.source-group-card {
  border-radius: 12px;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.group-title {
  font-weight: 600;
}

.news-scrollbar {
  padding-right: 4px;
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (width <= 1200px) {
  .source-group-list {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (width <= 768px) {
  .source-group-list {
    grid-template-columns: 1fr;
  }
}
</style>
