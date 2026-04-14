<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  formatHeatChangePercent,
  formatDateTimeYmdHm,
  formatWindowHourMinute,
  getHeatChangeTagType,
  getTopicStageMeta,
  getSentimentPolarityColor,
  SENTIMENT_POLARITY_MAP
} from "@/common/const";
import {
  getTopicSnapshotDetail,
  type Topic
} from "@/api/sentiment";
import { message } from "@/utils/message";
import { useTopicStoreHook } from "@/store/modules/topic";

defineOptions({
  name: "TopicView"
});

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const topicDetail = ref<Topic | null>(null);
const topicTimeline = ref<Topic[]>([]);
const topicStore = useTopicStoreHook();
let defaultTopic = topicStore.getSelectedTopic;
const NewsPanel = defineAsyncComponent(
  () => import("@/components/NewsPanel.vue") as Promise<any>
);
const TopicHeatTimelineBarChart = defineAsyncComponent(
  () => import("../../components/TopicHeatTimelineBarChart.vue") as Promise<any>
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

const stageMeta = computed(() => getTopicStageMeta(topicDetail.value?.stage));

const displaySentiment = computed(() => {
  const s = (topicDetail.value?.sentiment || "").toLowerCase();
  return SENTIMENT_POLARITY_MAP[s] || SENTIMENT_POLARITY_MAP.unknown;
});

const topicDisplayTitle = computed(() => {
  const llmTitle = String(topicDetail.value?.llm_title || "").trim();
  if (llmTitle) {
    return llmTitle;
  }

  const topic = String(topicDetail.value?.topic || "").trim();
  return topic || "-";
});
const heatChangeText = computed(() =>
  formatHeatChangePercent(topicDetail.value?.heat_change_percent)
);
const heatChangeTagType = computed(() =>
  getHeatChangeTagType(topicDetail.value?.heat_change_percent)
);

const sourceNameMap = computed<Record<string, string>>(() => {
  const rankData = topicDetail.value?.rank_data || {};
  return Object.entries(rankData).reduce<Record<string, string>>(
    (result, [sourceId, items]) => {
      result[sourceId] = items[0]?.source_name || sourceId;
      return result;
    },
    {}
  );
});

const platformBars = computed(() => {
  const list = topicDetail.value?.platform_distribution || [];
  const maxVolume = Math.max(1, ...list.map(item => item.volume || 0));

  return list.map(item => {
    return {
      ...item,
      displayName: sourceNameMap.value[item.platform] || item.platform,
      widthPercent: Math.max(2, (item.volume / maxVolume) * 100),
      color: getSentimentPolarityColor(item.sentiment)
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

  if (!defaultTopic) {
    const rawTopic = sessionStorage.getItem("_selectedTopic");
    if (rawTopic) {
      try {
        defaultTopic = JSON.parse(rawTopic) as Topic;
      } catch {
        defaultTopic = null;
      }
    }
  }

  if (!defaultTopic) {
    topicDetail.value = null;
    topicTimeline.value = [];
    message("缺少 Topic 入参，请返回上一页重新选择", { type: "warning" });
    return;
  }

  topicStore.setSelectedTopic(defaultTopic);
  topicDetail.value = defaultTopic;
  topicTimeline.value = [defaultTopic];
  topicStore.clearSelectedTopic();
  sessionStorage.removeItem("_selectedTopic");

  const snapshotId =
    typeof defaultTopic.id === "number" && Number.isFinite(defaultTopic.id)
      ? defaultTopic.id
      : null;
  const snapshotCreatedAt =
    typeof defaultTopic.created_at === "number" &&
    Number.isFinite(defaultTopic.created_at)
      ? defaultTopic.created_at
      : null;

  if (!snapshotCreatedAt || snapshotId === null) {
    message("Topic 参数缺少 created_at 或 id，已展示默认 Topic", {
      type: "warning"
    });
    return;
  }

  loading.value = true;
  try {
    const detailResponse = await getTopicSnapshotDetail({
      created_at: snapshotCreatedAt,
      id: snapshotId,
      history_limit: 100
    }).catch(() => null);

    if (!detailResponse || !detailResponse.success) {
      message(
        detailResponse?.error_message || "获取话题时间线失败，已展示默认 Topic",
        {
          type: "warning"
        }
      );
      return;
    }

    topicDetail.value = detailResponse.data?.topic || defaultTopic;
    topicTimeline.value = Array.isArray(detailResponse.data?.timeline)
      ? detailResponse.data.timeline
      : [topicDetail.value || defaultTopic];
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "获取话题详情失败";
    message(`${errorMessage}，已展示默认 Topic`, { type: "warning" });
    topicDetail.value = defaultTopic;
    topicTimeline.value = [defaultTopic];
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.back();
}

watch(
  () => route.fullPath,
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
          <el-tag v-if="topicKeyword" type="info" effect="plain">{{
            topicKeyword
          }}</el-tag>
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
              <h3>{{ topicDisplayTitle }}</h3>
              <div class="detail-tag-row">
                <el-tag :type="sentimentTagType" effect="light">{{
                  displaySentiment
                }}</el-tag>
                <el-tag :type="stageMeta.tagType" effect="plain">{{
                  stageMeta.label
                }}</el-tag>
                <el-tag :type="heatChangeTagType" effect="light">{{
                  heatChangeText
                }}</el-tag>
              </div>
            </div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="话题 ID">{{
              topicDetail.id
            }}</el-descriptions-item>
            <el-descriptions-item label="版本号">{{
              topicDetail.version
            }}</el-descriptions-item>
            <el-descriptions-item label="相关新闻数">{{
              topicDetail.news_count
            }}</el-descriptions-item>
            <el-descriptions-item label="总热度权重">{{
              topicDetail.total_weight.toFixed(2)
            }}</el-descriptions-item>
            <el-descriptions-item label="热度变化">{{
              heatChangeText
            }}</el-descriptions-item>
            <el-descriptions-item label="发展阶段">{{
              stageMeta.label
            }}</el-descriptions-item>
            <el-descriptions-item label="窗口粒度">
              {{ formatWindowHourMinute(topicDetail.window_size) }}
            </el-descriptions-item>
            <el-descriptions-item label="情感极性">{{
              displaySentiment
            }}</el-descriptions-item>
            <el-descriptions-item label="起始分析时间">
              {{ formatDateTimeYmdHm(topicDetail.start_time) }}
            </el-descriptions-item>
            <el-descriptions-item label="截止分析时间">
              {{ formatDateTimeYmdHm(topicDetail.end_time) }}
            </el-descriptions-item>
            <el-descriptions-item label="首次检出时间">
              {{ formatDateTimeYmdHm(topicDetail.created_at) }}
            </el-descriptions-item>
            <el-descriptions-item label="最后更新时间">
              {{ formatDateTimeYmdHm(topicDetail.updated_at) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="detail-card" shadow="never">
          <template #header>
            <div class="detail-title">热度趋势分析</div>
          </template>
          <TopicHeatTimelineBarChart :timeline="topicTimeline" />
        </el-card>

        <el-card class="detail-card" shadow="never">
          <template #header>
            <div class="detail-title">各平台分布情况</div>
          </template>
          <div v-if="platformBars.length" class="platform-bars">
            <div
              v-for="item in platformBars"
              :key="item.platform"
              class="platform-bar-row"
            >
              <div class="bar-head">
                <span class="platform-name">{{ item.displayName }}</span>
                <span class="platform-meta">
                  总热度: {{ item.volume }} || 情感偏向:
                  {{
                    SENTIMENT_POLARITY_MAP[item.sentiment?.toLowerCase()] ||
                    SENTIMENT_POLARITY_MAP.unknown
                  }}
                  || 情感占比: {{ (item.ratio * 100).toFixed(2) }}%
                </span>
              </div>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :style="{
                    width: `${item.widthPercent}%`,
                    backgroundColor: item.color
                  }"
                />
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无平台分布数据转换" />
        </el-card>

        <div class="news-section-header">
          <div class="detail-title news-title">排名数据 (新闻列表)</div>
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
  gap: 8px;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.detail-card {
  border-radius: 12px;
}

.detail-header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.detail-tag-row {
  display: flex;
  gap: 8px;
  align-items: center;
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
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.platform-name {
  font-weight: 600;
  color: #303133;
}

.platform-meta {
  font-size: 13px;
  color: #606266;
}

.bar-track {
  width: 100%;
  height: 12px;
  overflow: hidden;
  background: #eef1f6;
  border-radius: 999px;
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
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}
</style>
