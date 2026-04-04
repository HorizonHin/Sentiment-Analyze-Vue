<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import type { Topic, TopicRiskWarning, SensitiveTitleRecord } from "@/api/sentiment";
import { formatDateTimeYmdHm, getRiskTypeMeta, getRiskLevelMeta } from "@/common/const";

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

function handleSelect(topic: Topic) {
  emit("select", topic);
}

const lastOccurrence = props.risks[0]?.occurred_at || props.audits[0]?.occurred_at;

const getScoreStyle = (score: number) => {
  if (score >= 80) return { color: "#f56c6c", fontWeight: "bold" };
  if (score >= 50) return { color: "#e6a23c" };
  return { color: "#409eff" };
};
</script>

<template>
  <div class="risk-item-card" @click="handleSelect(topic)">
    <!-- 风险提示信息区 -->
    <div class="risk-info-overlay">
      <div v-for="risk in risks" :key="risk.occurred_at" class="risk-badge">
        <div class="risk-header">
          <span class="risk-type-wrap" :style="{ color: getRiskTypeMeta(risk.risk_type).color }">
            <el-icon><component :is="getRiskTypeMeta(risk.risk_type).icon" /></el-icon>
            <span class="ml-1">{{ getRiskTypeMeta(risk.risk_type).label }}</span>
          </span>
          <el-divider direction="vertical" />
          <el-tag :type="getRiskLevelMeta(risk.risk_level).type as any" size="small" effect="plain" round>
            {{ getRiskLevelMeta(risk.risk_level).label }}
          </el-tag>
          <span class="risk-score-val" :style="getScoreStyle(risk.risk_score)">
            {{ risk.risk_score }}
          </span>
        </div>
        <div class="risk-reason">{{ risk.reason }}</div>
      </div>
      
      <div v-for="audit in audits" :key="audit.occurred_at" class="risk-badge audit-badge">
        <div class="risk-header">
          <span class="risk-type-wrap" style="color: #f56c6c">
            <el-icon><Filter /></el-icon>
            <span class="ml-1">敏感标题屏蔽</span>
          </span>
          <el-divider direction="vertical" />
          <el-tag type="danger" size="small" effect="dark" round>高危</el-tag>
        </div>
        <div class="audit-flow">
          <span class="old-name">{{ audit.old_topic }}</span>
          <el-icon class="arrow"><Right /></el-icon>
          <span class="new-name">{{ audit.topic_name }}</span>
        </div>
        <div class="risk-reason">策略原因: {{ audit.reason }}</div>
      </div>
    </div>

    <!-- 话题主卡片 -->
    <div class="topic-card-wrapper">
      <TopicCard :topic="topic" @select="handleSelect" />
    </div>

    <div v-if="lastOccurrence" class="footer-meta">
      <el-icon><Clock /></el-icon>
      <span class="ml-1">最近检出: {{ formatDateTimeYmdHm(lastOccurrence) }}</span>
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  height: 100%;
  cursor: pointer;
}

.risk-item-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
  border-color: var(--el-color-primary-light-5);
}

.risk-info-overlay {
  padding: 16px;
  background: linear-gradient(180deg, var(--el-fill-color-light) 0%, var(--el-bg-color) 100%);
  border-bottom: 2px dashed var(--el-border-color-lighter);
}

.risk-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
}

.risk-type-wrap {
  display: inline-flex;
  align-items: center;
  font-weight: 600;
}

.risk-score-val {
  margin-left: auto;
  font-family: "Oswald", sans-serif;
  font-size: 16px;
  font-weight: 700;
}

.risk-badge {
  margin-bottom: 12px;
  padding: 8px;
  border-radius: 8px;
  background: var(--el-fill-color-blank);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.risk-badge:last-child {
  margin-bottom: 0;
}

.risk-reason {
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-top: 6px;
  line-height: 1.5;
  padding: 4px 8px;
  background: var(--el-fill-color-extra-light);
  border-radius: 4px;
  border-left: 3px solid var(--el-color-danger-light-3);
}

.audit-flow {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  margin: 6px 0;
  padding: 4px;
}

.old-name {
  color: var(--el-text-color-secondary);
  text-decoration: line-through;
}

.new-name {
  color: var(--el-color-success);
  font-weight: bold;
}

.topic-card-wrapper {
  padding: 12px;
  flex: 1;
}

.footer-meta {
  padding: 8px 16px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-extra-light);
  border-top: 1px solid var(--el-border-color-extra-light);
  display: flex;
  align-items: center;
}

.ml-1 {
  margin-left: 4px;
}
</style>
