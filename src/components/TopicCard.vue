<script setup lang="ts">
import { computed } from "vue";
import {
  formatHeatChangePercent,
  formatDateTimeYmdHm,
  formatWindowHourMinute,
  getHeatChangeTagType,
  getTopicStageMeta,
  getSentimentPolarityColor,
  SENTIMENT_POLARITY_MAP
} from "@/common/const";
import type { Topic } from "@/api/sentiment";

defineOptions({
  name: "TopicCard"
});

const props = defineProps<{
  topic: Topic;
  selectable?: boolean;
}>();

const emit = defineEmits<{
  (event: "select", topic: Topic): void;
}>();

const sentimentTagType = computed(() => {
  const sentiment = (props.topic.sentiment || "").toLowerCase();
  if (sentiment === "positive") return "success";
  if (sentiment === "negative") return "danger";
  return "warning";
});

const displaySentiment = computed(() => {
  const s = (props.topic.sentiment || "").toLowerCase();
  return SENTIMENT_POLARITY_MAP[s] || SENTIMENT_POLARITY_MAP.unknown;
});

const stageMeta = computed(() => getTopicStageMeta(props.topic.stage));
const displayTitle = computed(() => {
  const llmTitle = String(props.topic.llm_title || "").trim();
  if (llmTitle) {
    return llmTitle;
  }

  const topic = String(props.topic.topic || "").trim();
  return topic || "无标题话题";
});
const heatChangeText = computed(() =>
  formatHeatChangePercent(props.topic.heat_change_percent)
);
const heatChangeTagType = computed(() =>
  getHeatChangeTagType(props.topic.heat_change_percent)
);

const sourceNameMap = computed<Record<string, string>>(() => {
  const rankData = props.topic.rank_data || {};
  return Object.entries(rankData).reduce<Record<string, string>>(
    (result, [sourceId, items]) => {
      result[sourceId] = items[0]?.source_name || sourceId;
      return result;
    },
    {}
  );
});

const platformBars = computed(() => {
  const list = props.topic.platform_distribution || [];
  const maxVolume = Math.max(1, ...list.map(item => item.volume || 0));

  return list.map(item => {
    return {
      ...item,
      displayName: sourceNameMap.value[item.platform] || item.platform,
      widthPercent: Math.max(2, (item.volume / maxVolume) * 100),
      color: getSentimentPolarityColor(item.sentiment),
      displaySentiment: SENTIMENT_POLARITY_MAP[item.sentiment?.toLowerCase()] || SENTIMENT_POLARITY_MAP.unknown
    };
  });
});

function handleSelect() {
  if (props.selectable === false) {
    return;
  }
  emit("select", props.topic);
}
</script>

<template>
  <el-card
    class="topic-card"
    shadow="hover"
    :class="{ 'is-selectable': props.selectable !== false }"
    :role="props.selectable === false ? undefined : 'button'"
    :tabindex="props.selectable === false ? undefined : 0"
    @click="handleSelect"
    @keyup.enter="handleSelect"
    @keyup.space.prevent="handleSelect"
  >
    <div class="title-row">
      <h3 class="topic-name">{{ displayTitle }}</h3>
      <div class="tag-row">
        <el-tag size="small" :type="sentimentTagType">{{
          displaySentiment
        }}</el-tag>
        <el-tag size="small" effect="plain" :type="stageMeta.tagType">{{
          stageMeta.label
        }}</el-tag>
      </div>
    </div>

    <div class="heat-row">
      <span class="label">热度变化趋势</span>
      <el-tag size="small" :type="heatChangeTagType">{{
        heatChangeText
      }}</el-tag>
    </div>

    <div class="stats-row">
      <div class="stats-item">
        <span class="label">新闻量</span>
        <span class="value">{{ props.topic.news_count }}</span>
      </div>
      <div class="stats-item">
        <span class="label">热度分</span>
        <span class="value">{{ props.topic.total_weight.toFixed(2) }}</span>
      </div>
      <div class="stats-item">
        <span class="label">分析窗口</span>
        <span class="value">{{
          formatWindowHourMinute(props.topic.window_size)
        }}</span>
      </div>
    </div>

    <div class="time-row">
      <span>{{ formatDateTimeYmdHm(props.topic.start_time) }}</span>
      <span>至</span>
      <span>{{ formatDateTimeYmdHm(props.topic.end_time) }}</span>
    </div>

    <div v-if="platformBars.length" class="platform-list">
      <div
        v-for="platform in platformBars"
        :key="platform.platform"
        class="platform-item"
      >
        <div class="platform-head">
          <span class="platform-name">{{ platform.displayName }}</span>
          <div class="platform-head-extra">
            <span>{{ platform.volume }} 总热度</span>
            <el-divider direction="vertical" />
            <span>{{ platform.displaySentiment }}</span>
          </div>
        </div>
        <div class="bar-track">
          <div
            class="bar-fill"
            :style="{
              width: `${platform.widthPercent}%`,
              backgroundColor: platform.color
            }"
          />
        </div>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.topic-card {
  border-radius: 12px;
}

.topic-card.is-selectable {
  cursor: pointer;
}

.title-row {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.tag-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.heat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.topic-name {
  margin: 0;
  font-size: 16px;
  line-height: 1.4;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.stats-item {
  display: flex;
  flex-direction: column;
  padding: 8px;
  background: #f7f8fa;
  border-radius: 8px;
}

.label {
  font-size: 12px;
  color: #7d8597;
}

.value {
  font-size: 14px;
  font-weight: 600;
  color: #222;
}

.time-row {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #5f6470;
}

.platform-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.platform-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 13px;
  color: #2f3340;
}

.platform-head-extra {
  font-size: 12px;
  color: #7d8597;
  display: flex;
  align-items: center;
}

.bar-track {
  width: 100%;
  height: 8px;
  overflow: hidden;
  background: #eef1f6;
  border-radius: 999px;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
}
</style>
