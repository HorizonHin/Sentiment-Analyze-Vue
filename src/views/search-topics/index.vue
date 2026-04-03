<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from "vue";
import { useRouter } from "vue-router";
import {
  addFollowedKeyword,
  getTopicByKeyword,
  searchTermsByKeyword,
  type Topic
} from "@/api/sentiment";
import { message } from "@/utils/message";
import { useTopicStoreHook } from "@/store/modules/topic";

defineOptions({
  name: "KeywordTopicsView"
});

type CandidateOption = {
  label: string;
  source: "keyword" | "entity" | "mixed";
  weight: number;
};

const TopicPanel = defineAsyncComponent(
  () => import("@/components/TopicPanel.vue") as Promise<any>
);

const loadingTerms = ref(false);
const loadingTopics = ref(false);
const loadingFollow = ref(false);
const searchKeyword = ref("");
const selectedKeywords = ref<string[]>([]);
const candidateOptions = ref<CandidateOption[]>([]);
const topics = ref<Topic[]>([]);

const router = useRouter();
const topicStore = useTopicStoreHook();

const defaultEnd = Date.now();
const defaultStart = defaultEnd - 24 * 3600 * 1000;
const timeRange = ref<[Date, Date]>([new Date(defaultStart), new Date(defaultEnd)]);

const loading = computed(
  () => loadingTerms.value || loadingTopics.value || loadingFollow.value
);

async function handleFollowKeyword(keyword: string) {
  if (!keyword.trim()) return;
  loadingFollow.value = true;
  try {
    const res = await addFollowedKeyword(keyword);
    if (res.success) {
      message(`已成功关注：${keyword}`, { type: "success" });
    } else {
      message(res.error_message || "关注失败", { type: "warning" });
    }
  } catch {
    message("关注接口调用异常", { type: "error" });
  } finally {
    loadingFollow.value = false;
  }
}

function normalizeCandidateOptions(data: {
  keywords?: Array<{ term?: string; weigh?: number }>;
  entities?: Array<{ name?: string; weigh?: number }>;
}): CandidateOption[] {
  const resultMap = new Map<string, CandidateOption>();

  (data.keywords || []).forEach(item => {
    const label = String(item.term || "").trim();
    if (!label) return;

    const previous = resultMap.get(label);
    const weight = Number(item.weigh || 0);
    if (!previous) {
      resultMap.set(label, { label, source: "keyword", weight });
      return;
    }

    resultMap.set(label, {
      label,
      source: previous.source === "entity" ? "mixed" : previous.source,
      weight: Math.max(previous.weight, weight)
    });
  });

  (data.entities || []).forEach(item => {
    const label = String(item.name || "").trim();
    if (!label) return;

    const previous = resultMap.get(label);
    const weight = Number(item.weigh || 0);
    if (!previous) {
      resultMap.set(label, { label, source: "entity", weight });
      return;
    }

    resultMap.set(label, {
      label,
      source: previous.source === "keyword" ? "mixed" : previous.source,
      weight: Math.max(previous.weight, weight)
    });
  });

  return Array.from(resultMap.values()).sort((a, b) => b.weight - a.weight);
}

async function handleSearchTerms() {
  const keyword = searchKeyword.value.trim();
  if (!keyword) {
    message("请输入搜索关键词", { type: "warning" });
    return;
  }

  const [startDate, endDate] = timeRange.value || [];
  if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
    message("请选择有效的时间范围", { type: "warning" });
    return;
  }

  loadingTerms.value = true;
  try {
    const res = await searchTermsByKeyword({
      keyword,
      start_time: startDate,
      end_time: endDate,
      news_first_time: startDate,
      limit: 120
    });

    if (!res.success) {
      candidateOptions.value = [];
      message(res.error_message || "搜索关键词失败", { type: "warning" });
      return;
    }

    candidateOptions.value = normalizeCandidateOptions(res.data || {});

    if (!candidateOptions.value.length) {
      message("未检索到候选关键词/实体", { type: "warning" });
      return;
    }

    message(`已找到 ${candidateOptions.value.length} 个候选词`, {
      type: "success"
    });
  } catch {
    candidateOptions.value = [];
    message("搜索关键词失败", { type: "error" });
  } finally {
    loadingTerms.value = false;
  }
}

function toggleKeyword(option: CandidateOption) {
  const keyword = option.label;
  const index = selectedKeywords.value.indexOf(keyword);

  if (index >= 0) {
    selectedKeywords.value.splice(index, 1);
    return;
  }

  selectedKeywords.value.push(keyword);
}

function getTopicKey(topic: Topic): string {
  return `${topic.id}-${topic.created_at}-${topic.topic}`;
}

async function handleBatchQueryTopics() {
  const [startDate, endDate] = timeRange.value || [];
  if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
    message("请选择有效的时间范围", { type: "warning" });
    return;
  }

  const keywordList = Array.from(
    new Set(selectedKeywords.value.map(item => item.trim()).filter(Boolean))
  );

  if (!keywordList.length) {
    message("请至少选择一个关键词", { type: "warning" });
    return;
  }

  loadingTopics.value = true;
  try {
    const results = await Promise.allSettled(
      keywordList.map(keyword =>
        getTopicByKeyword({
          keyword,
          start_time: startDate,
          end_time: endDate,
          news_first_time: startDate
        })
      )
    );

    const topicMap = new Map<string, Topic>();
    const failedKeywords: string[] = [];

    results.forEach((result, index) => {
      const keyword = keywordList[index];

      if (result.status === "rejected") {
        failedKeywords.push(keyword);
        return;
      }

      const response = result.value;
      if (!response.success || !response.data) {
        failedKeywords.push(keyword);
        return;
      }

      const topic = response.data;
      topicMap.set(getTopicKey(topic), topic);
    });

    topics.value = Array.from(topicMap.values());

    if (!topics.value.length) {
      message("未查询到匹配 Topic", { type: "warning" });
      return;
    }

    if (failedKeywords.length) {
      message(
        `已获取 ${topics.value.length} 个 Topic，${failedKeywords.length} 个关键词未命中`,
        { type: "warning" }
      );
      return;
    }

    message(`成功获取 ${topics.value.length} 个 Topic`, { type: "success" });
  } finally {
    loadingTopics.value = false;
  }
}

function handleTopicSelect(topic: Topic) {
  topicStore.setSelectedTopic(topic);
  sessionStorage.setItem("_selectedTopic", JSON.stringify(topic));
  
  const { href } = router.resolve({
    path: "/topic",
    query: {
      topic: topic.topic,
      id: String(topic.id),
      created_at: topic.created_at
    }
  });
  window.open(href, "_blank");
}
</script>

<template>
  <div class="keyword-topics-page" v-loading="loading">
    <el-card shadow="never" class="filter-card">
      <div class="filters-row">
        <el-input
          v-model="searchKeyword"
          placeholder="输入关键词，检索候选词"
          clearable
          @keyup.enter="handleSearchTerms"
        >
          <template #append>
            <el-button :loading="loadingTerms" @click="handleSearchTerms">
              搜索候选词
            </el-button>
          </template>
        </el-input>

        <el-date-picker
          v-model="timeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          :clearable="false"
          unlink-panels
        />
      </div>

      <div class="select-row">
        <el-select
          v-model="selectedKeywords"
          multiple
          filterable
          allow-create
          default-first-option
          collapse-tags
          collapse-tags-tooltip
          clearable
          placeholder="选择或输入多个关键词"
          class="keywords-select"
        >
          <el-option
            v-for="option in candidateOptions"
            :key="option.label"
            :label="option.label"
            :value="option.label"
          >
            <div class="option-content">
              <span>{{ option.label }}</span>
              <span class="option-meta">{{ option.source }}</span>
            </div>
          </el-option>
        </el-select>

        <el-button
          type="primary"
          :loading="loadingTopics"
          @click="handleBatchQueryTopics"
        >
          查询 Topic
        </el-button>
      </div>

      <div v-if="candidateOptions.length" class="candidate-tags">
        <el-popover
          v-for="option in candidateOptions"
          :key="option.label"
          placement="top"
          :width="200"
          trigger="hover"
        >
          <template #reference>
            <el-tag
              :effect="selectedKeywords.includes(option.label) ? 'dark' : 'plain'"
              class="candidate-tag"
              @click="toggleKeyword(option)"
            >
              {{ option.label }}
            </el-tag>
          </template>
          <div class="popover-content">
            <p>候选词：{{ option.label }}</p>
            <el-button
              size="small"
              type="primary"
              link
              @click.stop="handleFollowKeyword(option.label)"
            >
              关注此关键词
            </el-button>
          </div>
        </el-popover>
      </div>
    </el-card>

    <el-card shadow="never" class="result-card">
      <template #header>
        <div class="result-header">
          <span>Topic 结果</span>
          <el-tag type="info" effect="plain">{{ topics.length }} 个</el-tag>
        </div>
      </template>

      <el-empty
        v-if="!topics.length && !loadingTopics"
        description="请选择多个关键词后查询 Topic"
      />

      <TopicPanel
        v-else
        :loading="loadingTopics"
        :topics="topics"
        layout="two-col"
        @select="handleTopicSelect"
        @follow="handleFollowKeyword"
      />
    </el-card>
  </div>
</template>

<style scoped>
.keyword-topics-page {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-card,
.result-card {
  border-radius: 12px;
}

.filters-row {
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(320px, 1fr) auto;
  align-items: center;
}

.select-row {
  margin-top: 12px;
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(320px, 1fr) auto;
  align-items: center;
}

.keywords-select {
  width: 100%;
}

.option-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
}

.option-meta {
  color: #909399;
  font-size: 12px;
}

.candidate-tags {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.candidate-tag {
  cursor: pointer;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

@media (max-width: 992px) {
  .filters-row,
  .select-row {
    grid-template-columns: 1fr;
  }
}
</style>
