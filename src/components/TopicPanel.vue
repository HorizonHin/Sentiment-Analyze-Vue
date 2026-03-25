<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import type { Topic } from "../api/sentiment";

defineOptions({
  name: "TopicPanel"
});

const props = defineProps<{
  loading: boolean;
  topics: Topic[];
}>();

const emit = defineEmits<{
  (event: "select", topic: Topic): void;
}>();

const TopicCard = defineAsyncComponent(
  () => import("./TopicCard.vue") as Promise<any>
);

function handleSelect(topic: Topic) {
  emit("select", topic);
}
</script>

<template>
  <aside class="topic-panel">
    <div class="section-header">
      <h3>热门 Topic</h3>
    </div>

    <el-empty v-if="!topics.length && !loading" description="暂无话题数据" />

    <el-scrollbar v-else max-height="560px" class="topic-scrollbar">
      <div class="topic-list">
        <div
          v-for="topicItem in topics"
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
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
}

.topic-scrollbar {
  padding-right: 4px;
}

.topic-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.topic-clickable-item {
  cursor: pointer;
}
</style>
