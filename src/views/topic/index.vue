<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getTrendingTopics, type NewsItem, type Topic } from "../../api/sentiment";
import { message } from "../../utils/message";

defineOptions({
  name: "TopicView"
});

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const topicDetail = ref<Topic | null>(null);

const NewsPanel = defineAsyncComponent(
  () => import("../../components/NewsPanel.vue") as Promise<any>
);

const topicKeyword = computed(() => {
  const value = route.query.topic;
  return typeof value === "string" ? value.trim() : "";
});

const sentimentTagType = computed(() => {
  const sentiment = (topicDetail.value?.sentiment || "").toLowerCase();
  if (sentiment === "positive") return "success";
  if (sentiment === "negative") return "danger";
  return "warning";
});

const platformBars = computed(() => {
  const list = topicDetail.value?.platform_distribution || [];
  const maxVolume = Math.max(1, ...list.map(item => item.volume || 0));

  return list.map(item => {
    const sentiment = (item.sentiment || "").toLowerCase();
    let color = "#909399";
    if (sentiment === "positive") color = "#67c23a";
    if (sentiment === "negative") color = "#f56c6c";
    if (sentiment === "neutral") color = "#409eff";

    return {
      ...item,
      widthPercent: Math.max(2, (item.volume / maxVolume) * 100),
      color
    };
  });
});

const newsGroups = computed(() => {
  const rankData = topicDetail.value?.rank_data || {};
  return Object.entries(rankData)
    .map(([sourceId, items]) => {
      const sourceName = items[0]?.source_name || sourceId;
      return {
        sourceId,
        sourceName,
        items: Array.isArray(items) ? items : []
      };
    })
    .filter(group => group.items.length > 0);
});

async function loadTopicDetail() {
  const keyword = topicKeyword.value;
  if (!keyword) {
    topicDetail.value = null;
    return;
  }

  loading.value = true;
  try {
    const response = await getTrendingTopics().catch(() => null);
    if (!response) {
      throw new Error("获取话题详情失败");
    }

    if (!response.success) {
      throw new Error(response.error_message || "获取话题详情失败");
    }

    const topics = Array.isArray(response.data) ? response.data : [];
    const exactMatch = topics.find(item => item.topic === keyword);
    const insensitiveMatch = exactMatch
      ? exactMatch
      : topics.find(item => item.topic.toLowerCase() === keyword.toLowerCase());

    topicDetail.value = insensitiveMatch || null;
    if (!topicDetail.value) {
      message("未找到对应话题，请返回首页重新选择", { type: "warning" });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "获取话题详情失败";
    message(errorMessage, { type: "error" });
    topicDetail.value = null;
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.back();
}

watch(
  () => route.query.topic,
  () => {
    loadTopicDetail();
  },
  { immediate: true }
);
</script>

<template>
  <div v-loading="loading" class="topic-view-page">
    <el-page-header @back="goBack">
      <template #content>
        <div class="header-content">
          <span class="title">话题详情</span>
          <el-tag v-if="topicKeyword" type="info" effect="plain">{{ topicKeyword }}</el-tag>
        </div>
      </template>
    </el-page-header>

    <div class="content-wrapper">
      <el-empty v-if="!topicKeyword" description="未传入话题参数" />
      <el-empty v-else-if="!topicDetail" description="未找到对应话题" />
      <template v-else>
        <el-card class="detail-card" shadow="never">
          <template #header>
            <div class="detail-header">
              <h3>{{ topicDetail.topic }}</h3>
              <el-tag :type="sentimentTagType" effect="light">{{ topicDetail.sentiment || "unknown" }}</el-tag>
            </div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="ID">{{ topicDetail.id }}</el-descriptions-item>
            <el-descriptions-item label="Version">{{ topicDetail.version }}</el-descriptions-item>
            <el-descriptions-item label="News Count">{{ topicDetail.news_count }}</el-descriptions-item>
            <el-descriptions-item label="Total Weight">{{ topicDetail.total_weight.toFixed(2) }}</el-descriptions-item>
            <el-descriptions-item label="Window Size">{{ topicDetail.window_size }}m</el-descriptions-item>
            <el-descriptions-item label="Sentiment">{{ topicDetail.sentiment || "-" }}</el-descriptions-item>
            <el-descriptions-item label="Start Time">{{ topicDetail.start_time || "-" }}</el-descriptions-item>
            <el-descriptions-item label="End Time">{{ topicDetail.end_time || "-" }}</el-descriptions-item>
            <el-descriptions-item label="Created At">{{ topicDetail.created_at || "-" }}</el-descriptions-item>
            <el-descriptions-item label="Updated At">{{ topicDetail.updated_at || "-" }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="detail-card" shadow="never">
          <template #header>
            <div class="detail-title">Platform Distribution</div>
          </template>
          <div v-if="platformBars.length" class="platform-bars">
            <div v-for="item in platformBars" :key="item.platform" class="platform-bar-row">
              <div class="bar-head">
                <span class="platform-name">{{ item.platform }}</span>
                <span class="platform-meta">
                  {{ item.volume }} | {{ item.sentiment || "unknown" }} | {{ (item.ratio * 100).toFixed(2) }}%
                </span>
              </div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: `${item.widthPercent}%`, backgroundColor: item.color }"></div>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无平台分布数据" />
        </el-card>

        <div class="news-section-header">
          <div class="detail-title news-title">Rank Data (NewsPanel)</div>
          <el-button size="small" :loading="loading" @click="loadTopicDetail">刷新 NewsPanel</el-button>
        </div>
        <NewsPanel :loading="loading" :groups="newsGroups" />
      </template>
    </div>
  </div>
</template>

<style scoped>
.topic-view-page {
  padding: 16px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.content-wrapper {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-card {
  border-radius: 12px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.detail-header h3 {
  margin: 0;
  font-size: 18px;
}

.detail-title {
  font-size: 15px;
  font-weight: 600;
}

.platform-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.platform-bar-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bar-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.platform-name {
  font-weight: 600;
  color: #303133;
}

.platform-meta {
  color: #606266;
  font-size: 13px;
}

.bar-track {
  width: 100%;
  height: 12px;
  border-radius: 999px;
  background: #eef1f6;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.news-title {
  margin-top: 4px;
}

.news-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
</style>
