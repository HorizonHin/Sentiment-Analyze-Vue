<script setup lang="ts">
import { defineAsyncComponent, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getTrendingTopics, addFollowedKeyword, type Topic } from "@/api/sentiment";
import { message } from "@/utils/message";
import { useTopicStoreHook } from "@/store/modules/topic";

const TopicPanel = defineAsyncComponent(() => import("@/components/TopicPanel.vue"));
const loading = ref(false);
const topics = ref<Topic[]>([]);
const router = useRouter();
const topicStore = useTopicStoreHook();

async function loadTopics() {
  loading.value = true;
  try {
    const res = await getTrendingTopics();
    if (!res.success) {
      message(res.error_message || "获取热门话题失败", { type: "warning" });
      topics.value = [];
    } else {
      topics.value = Array.isArray(res.data) ? res.data : [];
    }
  } catch (error) {
    message("获取热门话题失败", { type: "error" });
    topics.value = [];
  } finally {
    loading.value = false;
  }
}

async function handleTopicFollow(keyword: string) {
  try {
    const res = await addFollowedKeyword(keyword);
    if (res.success) {
      message(`已关注话题：${keyword}`, { type: "success" });
    } else {
      message(res.error_message || "关注失败", { type: "error" });
    }
  } catch (error) {
    message("关注请求失败", { type: "error" });
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
  loadTopics();
});
</script>

<template>
  <div class="topics-page" v-loading="loading">
    <div class="topics-header">
      <el-button size="small" :loading="loading" @click="loadTopics">刷新</el-button>
    </div>
    <div class="topics-panel-2col">
      <TopicPanel
        :loading="loading"
        :topics="topics"
        layout="two-col"
        @select="handleTopicSelect"
        @follow="handleTopicFollow"
      />
    </div>
  </div>
</template>

<style scoped>
.topics-page {
  padding: 24px;
}
.topics-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}
.topics-panel-2col {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 24px;
  justify-content: center;
}
</style>
