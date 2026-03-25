<script setup lang="ts">
import { computed } from "vue";
import type { Topic } from "../api/sentiment";

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
      <h3 class="topic-name">{{ props.topic.topic || "Untitled Topic" }}</h3>
      <el-tag size="small" :type="sentimentTagType">{{ props.topic.sentiment || "unknown" }}</el-tag>
    </div>

    <div class="stats-row">
      <div class="stats-item">
        <span class="label">News</span>
        <span class="value">{{ props.topic.news_count }}</span>
      </div>
      <div class="stats-item">
        <span class="label">Weight</span>
        <span class="value">{{ props.topic.total_weight.toFixed(2) }}</span>
      </div>
      <div class="stats-item">
        <span class="label">Window</span>
        <span class="value">{{ props.topic.window_size }}m</span>
      </div>
    </div>

    <div class="time-row">
      <span>{{ props.topic.start_time || "-" }}</span>
      <span>to</span>
      <span>{{ props.topic.end_time || "-" }}</span>
    </div>

    <div v-if="props.topic.platform_distribution?.length" class="platform-list">
      <div
        v-for="platform in props.topic.platform_distribution"
        :key="platform.platform"
        class="platform-item"
      >
        <div class="platform-head">
          <span>{{ platform.platform }}</span>
          <span>{{ (platform.ratio * 100).toFixed(1) }}%</span>
        </div>
        <el-progress :percentage="Math.min(100, Math.max(0, platform.ratio * 100))" :stroke-width="8" />
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
  align-items: center;
  justify-content: space-between;
  gap: 12px;
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
  color: #7d8597;
  font-size: 12px;
}

.value {
  color: #222;
  font-size: 14px;
  font-weight: 600;
}

.time-row {
  display: flex;
  gap: 6px;
  color: #5f6470;
  font-size: 12px;
  margin-bottom: 12px;
}

.platform-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.platform-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  color: #2f3340;
  font-size: 13px;
}
</style>
