<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue";
import type { NewsItem } from "../api/sentiment";

const SentimentPieChart = defineAsyncComponent(
  () => import("./SentimentPieChart.vue") as Promise<any>
);
const RatingsBarChart = defineAsyncComponent(
  () => import("./RatingsBarChart.vue") as Promise<any>
);
const RankTimelineChart = defineAsyncComponent(
  () => import("./RankTimelineChart.vue") as Promise<any>
);

defineOptions({
  name: "NewsDetailModal"
});

const props = defineProps<{
  modelValue: boolean;
  item: NewsItem;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
}>();

const formattedEntities = computed(() => {
  return props.item.entities?.map(e => e.name) || [];
});

const formattedKeywords = computed(() => {
  return props.item.keywords?.map(k => k.term) || [];
});


function handleClose() {
  emit("update:modelValue", false);
}
</script>

<template>
  <Teleport to="body">
    <el-dialog
      :model-value="modelValue"
      :title="item.title"
      width="90%"
      :z-index="99999"
      @update:model-value="handleClose"
    >
    <div class="news-detail-container">
      <!-- Charts Section -->
      <div class="charts-grid">
        <!-- Sentiment Pie Chart -->
        <div class="chart-container">
          <SentimentPieChart :item="item" />
        </div>

        <!-- Ratings Bar Chart -->
        <div class="chart-container">
          <RatingsBarChart :item="item" />
        </div>

        <!-- Timeline Line Chart -->
        <div class="chart-container full-width">
          <RankTimelineChart :item="item" />
        </div>

              <!-- Summary Section -->
      <div class="section">
        <div class="section-title">Summary</div>
        <p class="summary-text">{{ item.summary || "No summary available" }}</p>
      </div>

      <!-- Entities Section -->
      <div class="section">
        <div class="section-title">Entities</div>
        <div v-if="formattedEntities.length" class="entities-list">
          <el-tag v-for="(entity, idx) in formattedEntities" :key="idx" effect="light" size="large">
            {{ entity }}
          </el-tag>
        </div>
        <el-empty v-else description="No entities" />
      </div>

      <!-- Keywords Section -->
      <div class="section">
        <div class="section-title">Keywords</div>
        <div v-if="formattedKeywords.length" class="keywords-list">
          <el-tag
            v-for="(keyword, idx) in formattedKeywords"
            :key="idx"
            type="success"
            effect="light"
            size="large"
          >
            {{ keyword }}
          </el-tag>
        </div>
        <el-empty v-else description="No keywords" />
      </div>
      </div>

      <!-- Meta Info -->
      <div class="meta-info">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6">
            <div class="meta-item">
              <span class="meta-label">Source:</span>
              <span class="meta-value">{{ item.source_name || item.source_id }}</span>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <div class="meta-item">
              <span class="meta-label">Latest Rank:</span>
              <span class="meta-value">{{ item.latest_rank || "-" }}</span>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <div class="meta-item">
              <span class="meta-label">First Time:</span>
              <span class="meta-value">{{ new Date(item.first_time).toLocaleDateString() }}</span>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <div class="meta-item">
              <span class="meta-label">Count:</span>
              <span class="meta-value">{{ item.count }}</span>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- URL Link -->
      <div v-if="item.url || item.mobile_url" class="footer-links">
        <el-link
          v-if="item.url"
          :href="item.url"
          target="_blank"
          type="primary"
          icon="Link"
        >
          Open Original Link
        </el-link>
      </div>
    </div>
    </el-dialog>
  </Teleport>
</template>

<style scoped>
:deep(.el-dialog) {
  z-index: 99999 !important;
}

:deep(.el-overlay) {
  z-index: 99998 !important;
}

.news-detail-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  border-bottom: 2px solid #f0f6ff;
  padding-bottom: 8px;
}

.summary-text {
  margin: 0;
  line-height: 1.6;
  color: #4b5563;
  font-size: 13px;
}

.entities-list,
.keywords-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.chart-container {
  flex: 1;
  min-height: 320px;
}

.chart-container.full-width {
  grid-column: 1 / -1;
  min-height: 280px;
}

.meta-info {
  padding: 16px;
  background: #f7f8fa;
  border-radius: 8px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-size: 12px;
  color: #7d8597;
  font-weight: 500;
}

.meta-value {
  font-size: 13px;
  color: #1f2937;
  font-weight: 500;
}

.footer-links {
  display: flex;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #e4e7eb;
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
