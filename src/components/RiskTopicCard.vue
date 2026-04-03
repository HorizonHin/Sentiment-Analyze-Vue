<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import type { Topic, TopicRiskWarning, SensitiveTitleRecord } from "@/api/sentiment";
import { formatDateTimeYmdHm } from "@/common/const";

interface Props {
  topic: Topic;
  risks?: TopicRiskWarning[];
  audits?: SensitiveTitleRecord[];
}

const props = withDefaults(defineProps<Props>(), {
  risks: () => [],
  audits: () => []
});

const emit = defineEmits(["select"]);

const TopicCard = defineAsyncComponent(
  () => import("@/components/TopicCard.vue")
);

function getRiskTypeLabel(type: string) {
  const map: Record<string, string> = {
    negative_cluster: "负面信息聚簇",
    burst_event: "舆情突发暴增",
    cross_platform_gap: "跨平台认知偏差"
  };
  return map[type] || type;
}

function getRiskLevelTag(level: string) {
  const map: Record<string, string> = {
    low: "info",
    medium: "warning",
    high: "danger",
    critical: "danger"
  };
  return map[level] || "info";
}

function handleSelect(topic: Topic) {
  emit("select", topic);
}

const lastOccurrence = props.risks[0]?.occurred_at || props.audits[0]?.occurred_at;
</script>

<template>
  <div class="risk-item-card" @click="handleSelect(topic)">
    <!-- 风险提示信息区 -->
    <div class="risk-info-overlay">
      <div v-for="risk in risks" :key="risk.occurred_at" class="risk-badge">
        <el-tag :type="getRiskLevelTag(risk.risk_level) as any" size="small" effect="dark">
          {{ getRiskTypeLabel(risk.risk_type) }} ({{ risk.risk_score }})
        </el-tag>
        <div class="risk-reason">{{ risk.reason }}</div>
      </div>
      <div v-for="audit in audits" :key="audit.occurred_at" class="risk-badge audit-badge">
        <el-tag type="danger" size="small" effect="plain">
          敏感标题屏蔽: {{ audit.old_topic }} -> {{ audit.topic_name }}
        </el-tag>
        <div class="risk-reason">原因: {{ audit.reason }}</div>
      </div>
    </div>

    <!-- 话题主卡片 -->
    <div class="topic-card-wrapper">
      <TopicCard :topic="topic" @select="handleSelect" />
    </div>

    <div v-if="lastOccurrence" class="footer-meta">
      最近检出: {{ formatDateTimeYmdHm(lastOccurrence) }}
    </div>
  </div>
</template>

<style scoped>
.risk-item-card {
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  overflow: hidden;
  transition: transform 0.3s;
  position: relative;
  height: 100%;
  cursor: pointer;
}

.risk-item-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.risk-info-overlay {
  padding: 16px;
  background: var(--el-color-info-light-9);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.risk-badge {
  margin-bottom: 8px;
}

.risk-badge:last-child {
  margin-bottom: 0;
}

.risk-reason {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
  line-height: 1.4;
  padding-left: 4px;
  border-left: 2px solid var(--el-color-danger-light-3);
}

.audit-badge .risk-reason {
  border-left-color: var(--el-color-warning);
}

.topic-card-wrapper {
  padding: 8px;
  flex: 1;
}

.footer-meta {
  padding: 10px 16px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-extra-light);
  border-top: 1px solid var(--el-border-color-extra-light);
}
</style>
