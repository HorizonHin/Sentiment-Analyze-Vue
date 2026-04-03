<script setup lang="ts">
import { defineAsyncComponent, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  getTopicRiskWarnings,
  getSensitiveTitleRecords,
  batchGetTopics,
  type Topic,
  type TopicRiskWarning,
  type SensitiveTitleRecord
} from "@/api/sentiment";
import { message } from "@/utils/message";
import { useTopicStoreHook } from "@/store/modules/topic";

const RiskTopicCard = defineAsyncComponent(
  () => import("@/components/RiskTopicCard.vue")
);

const loading = ref(false);
const topicsWithRisks = ref<
  Array<{
    topic: Topic;
    risks: TopicRiskWarning[];
    audits: SensitiveTitleRecord[];
  }>
>([]);

const router = useRouter();
const topicStore = useTopicStoreHook();

async function loadTopics() {
  loading.value = true;
  try {
    const [riskRes, auditRes] = await Promise.all([
      getTopicRiskWarnings({ limit: 100 }),
      getSensitiveTitleRecords({ limit: 100 })
    ]);

    const keysMap = new Map<string, [number, number]>();
    const riskByTopic = new Map<string, TopicRiskWarning[]>();
    const auditByTopic = new Map<string, SensitiveTitleRecord[]>();

    if (riskRes.success && Array.isArray(riskRes.data)) {
      riskRes.data.forEach(item => {
        const key = `${item.topic_created_at}_${item.topic_id}`;
        keysMap.set(key, [item.topic_created_at, item.topic_id]);
        if (!riskByTopic.has(key)) riskByTopic.set(key, []);
        riskByTopic.get(key).push(item);
      });
    }

    if (auditRes.success && Array.isArray(auditRes.data)) {
      auditRes.data.forEach(item => {
        const key = `${item.topic_created_at}_${item.topic_id}`;
        keysMap.set(key, [item.topic_created_at, item.topic_id]);
        if (!auditByTopic.has(key)) auditByTopic.set(key, []);
        auditByTopic.get(key).push(item);
      });
    }

    const uniqueKeys = Array.from(keysMap.values());
    if (uniqueKeys.length === 0) {
      topicsWithRisks.value = [];
      return;
    }

    const topicsRes = await batchGetTopics(uniqueKeys);
    if (!topicsRes.success) {
      message(topicsRes.error_message || "获取详情失败", { type: "warning" });
      topicsWithRisks.value = [];
    } else {
      const fetchedTopics = Array.isArray(topicsRes.data) ? topicsRes.data : [];
      topicsWithRisks.value = fetchedTopics
        .map(t => {
          const key = `${t.created_at}_${t.id}`;
          return {
            topic: t,
            risks: riskByTopic.get(key) || [],
            audits: auditByTopic.get(key) || []
          };
        })
        .sort((a, b) => {
          // 按最高风险分数排序
          const maxRiskA = Math.max(0, ...a.risks.map(r => r.risk_score));
          const maxRiskB = Math.max(0, ...b.risks.map(r => r.risk_score));
          return maxRiskB - maxRiskA;
        });
    }
  } catch (error) {
    message("获取风险话题失败", { type: "error" });
    topicsWithRisks.value = [];
  } finally {
    loading.value = false;
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
  <div class="risk-topics-container" v-loading="loading">
    <div class="header-actions">
      <h2>风险 Topic 监控</h2>
      <el-button icon="Refresh" circle @click="loadTopics" />
    </div>

    <el-empty
      v-if="!topicsWithRisks.length && !loading"
      description="暂无存在风险的话题"
    />

    <div class="risk-grid">
      <RiskTopicCard
        v-for="item in topicsWithRisks"
        :key="`${item.topic.created_at}_${item.topic.id}`"
        :topic="item.topic"
        :risks="item.risks"
        :audits="item.audits"
        @select="handleTopicSelect"
      />
    </div>
  </div>
</template>

<style scoped>
.risk-topics-container {
  padding: 20px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.risk-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
}
</style>
