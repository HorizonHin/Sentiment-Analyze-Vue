<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from "vue";
import type { Topic } from "../api/sentiment";

defineOptions({
  name: "TopicPanel"
});

const props = defineProps<{
  loading: boolean;
  topics: Topic[];
  layout?: "one-col" | "two-col" | "three-col";
}>();

const emit = defineEmits<{
  (event: "select", topic: Topic): void;
}>();

const TopicCard = defineAsyncComponent(
  () => import("./TopicCard.vue") as Promise<any>
);

type TopicSortMode = "total_weight" | "heat_change_percent";

const sortMode = ref<TopicSortMode>("total_weight");

const sortedTopics = computed<Topic[]>(() => {
  const list = [...(props.topics || [])];
  const mode = sortMode.value;

  return list.sort((a, b) => {
    if (mode === "heat_change_percent") {
      return (b.heat_change_percent || 0) - (a.heat_change_percent || 0);
    }
    return (b.total_weight || 0) - (a.total_weight || 0);
  });
});

function handleSelect(topic: Topic) {
  emit("select", topic);
}

const topicListClass = computed(() => {
  if (props.layout === "two-col") return "topic-list two-col";
  if (props.layout === "three-col") return "topic-list three-col";
  return "topic-list";
});
</script>

<template>
  <aside class="topic-panel">
    <div class="section-header">
      <h3>热门 Topic</h3>
      <el-select v-model="sortMode" size="small" class="sort-select">
        <el-option label="按热度排序" value="total_weight" />
        <el-option label="按热度变化排序" value="heat_change_percent" />
      </el-select>
    </div>

    <el-empty
      v-if="!sortedTopics.length && !props.loading"
      description="暂无话题数据"
    />

    <el-scrollbar v-else max-height="1440" class="topic-scrollbar">
      <div :class="topicListClass">
        <div
          v-for="topicItem in sortedTopics"
          :key="`${topicItem.id}-${topicItem.topic}`"
          class="topic-clickable-item"
          role="button"
          tabindex="0"
          @click="handleSelect(topicItem)"
          @keyup.enter="handleSelect(topicItem)"
          @keyup.space.prevent="handleSelect(topicItem)"
        >
          <TopicCard :topic="topicItem" :selectable="false" />
        </div>
      </div>
    </el-scrollbar>
  </aside>
</template>

<style scoped>
.topic-panel {
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

.topic-scrollbar {
  padding-right: 4px;
}

.sort-select {
  width: 152px;
}

.topic-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.topic-list.two-col {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16px;
}
.topic-list.two-col .topic-clickable-item {
  width: calc(50% - 8px);
}
.topic-list.three-col {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16px;
}
.topic-list.three-col .topic-clickable-item {
  width: calc(33.333% - 11px);
}
.topic-clickable-item {
  cursor: pointer;
}
</style>
