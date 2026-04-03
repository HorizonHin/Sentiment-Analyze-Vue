<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from "vue";
import { useRouter } from "vue-router";
import { useTopicStoreHook } from "@/store/modules/topic";
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
  (event: "follow", keyword: string): void;
}>();

const router = useRouter();
const topicStore = useTopicStoreHook();

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
  // 统一跳转逻辑
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

  emit("select", topic);
}

function handleFollow(keyword: string) {
  emit("follow", keyword);
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
          class="topic-item-wrapper"
        >
          <div
            class="topic-clickable-area"
            role="button"
            tabindex="0"
            @click="handleSelect(topicItem)"
            @keyup.enter="handleSelect(topicItem)"
            @keyup.space.prevent="handleSelect(topicItem)"
          >
            <TopicCard :topic="topicItem" :selectable="false" />
          </div>
          <div class="topic-action-bar">
            <el-button
              type="primary"
              size="small"
              link
              icon="Star"
              @click.stop="handleFollow(topicItem.topic)"
            >
              关注此 Topic 词
            </el-button>
          </div>
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
  gap: 16px;
}
.topic-list.two-col {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16px;
}
.topic-list.two-col .topic-item-wrapper {
  width: calc(50% - 8px);
}
.topic-list.three-col {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16px;
}
.topic-list.three-col .topic-item-wrapper {
  width: calc(33.333% - 11px);
}

.topic-item-wrapper {
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.topic-item-wrapper:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-color: var(--el-color-primary-light-7);
}

.topic-clickable-area {
  cursor: pointer;
  flex: 1;
}

.topic-action-bar {
  padding: 4px 12px 8px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px dashed var(--el-border-color-lighter);
}
</style>
