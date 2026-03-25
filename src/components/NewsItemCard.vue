<script setup lang="ts">
import { computed, ref, defineAsyncComponent } from "vue";
import type { NewsItem } from "../api/sentiment";

defineOptions({
  name: "NewsItemCard"
});

const props = defineProps<{
  item: NewsItem;
  rank?: string;
}>();

const detailModalVisible = ref(false);

const NewsDetailModal = defineAsyncComponent(
  () => import("./NewsDetailModal.vue") as Promise<any>
);

const sentimentTagType = computed(() => {
  const polarity = (props.item.sentiment_polarity || "").toLowerCase();
  if (polarity === "positive") return "success";
  if (polarity === "negative") return "danger";
  return "info";
});

const newsLink = computed(() => props.item.url || props.item.mobile_url || "");

const displayTitle = computed(() => props.item.title || "Untitled News");

function handleCardClick() {
  detailModalVisible.value = true;
}
</script>

<template>
  <div>
    <el-card class="news-item-card" shadow="hover" @click="handleCardClick">
      <span v-if="props.rank" class="rank-badge">{{ props.rank }}</span>
      <h3 class="title">{{ displayTitle }}</h3>

          <div class="header-tags">
            <el-tag size="small" :type="sentimentTagType">{{ props.item.sentiment_polarity || "unknown" }}</el-tag>
          </div>

    </el-card>

    <NewsDetailModal v-model="detailModalVisible" :item="props.item" />
  </div>
</template>

<style scoped>
:deep(> div) {
  display: contents;
}

.news-item-card {
  border-radius: 12px;
  cursor: pointer;
  min-height: 60px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.news-item-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  background-color: #f7f8fa;
}

.rank-badge {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #f0f6ff;
  color: #1f5eff;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.title {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  width: 70%;              /* 标题固定占 70% */
  word-break: break-word;  /* 避免超长文字溢出 */
}

.header-tags {
  width: 30%;              /* 标签固定占 30% */
  display: flex;
  justify-content: flex-end; /* 靠右对齐 */
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}



.news-item-card :deep(.el-card__body) {
  padding: 6px 8px;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
}

.news-item-card :deep(.el-card__header) {
  padding: 8px 10px;
  border-bottom: 1px solid #ebeef5;
}
</style>
