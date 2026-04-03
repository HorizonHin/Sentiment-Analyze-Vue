<script setup lang="ts">
import { defineAsyncComponent, ref } from "vue";
import { useRouter } from "vue-router";
import {
  deleteFollowedKeyword,
  getTopicByKeyword,
  listFollowedKeywords,
  type Topic
} from "@/api/sentiment";
import { message } from "@/utils/message";
import { useTopicStoreHook } from "@/store/modules/topic";

defineOptions({
  name: "FollowedTopicsView"
});

type FollowedTopicItem = {
  keyword_term: string;
  topic: Topic | null;
};

const TopicCard = defineAsyncComponent(
  () => import("@/components/TopicCard.vue") as Promise<any>
);

const loading = ref(false);
const items = ref<FollowedTopicItem[]>([]);
const selectedKeywordTerms = ref<string[]>([]);

const router = useRouter();
const topicStore = useTopicStoreHook();

function resetSelection() {
  selectedKeywordTerms.value = [];
}

function isSelected(keywordTerm: string): boolean {
  return selectedKeywordTerms.value.includes(keywordTerm);
}

function toggleSelection(keywordTerm: string, checked: boolean) {
  if (checked) {
    if (!selectedKeywordTerms.value.includes(keywordTerm)) {
      selectedKeywordTerms.value.push(keywordTerm);
    }
    return;
  }

  selectedKeywordTerms.value = selectedKeywordTerms.value.filter(
    value => value !== keywordTerm
  );
}

async function loadFollowedTopics() {
  loading.value = true;
  try {
    const listResponse = await listFollowedKeywords(1000);
    if (!listResponse.success) {
      items.value = [];
      message(listResponse.error_message || "获取关注关键词失败", {
        type: "warning"
      });
      return;
    }

    const keywords = Array.isArray(listResponse.data?.keywords)
      ? listResponse.data.keywords.map(item => String(item || "").trim()).filter(Boolean)
      : [];

    if (!keywords.length) {
      items.value = [];
      resetSelection();
      return;
    }

    const topicResults = await Promise.allSettled(
      keywords.map(keywordTerm =>
        getTopicByKeyword({
          keyword: keywordTerm
        })
      )
    );

    const nextItems: FollowedTopicItem[] = topicResults.map((result, index) => {
      const keywordTerm = keywords[index];
      if (result.status === "rejected") {
        return {
          keyword_term: keywordTerm,
          topic: null
        };
      }

      const response = result.value;
      if (!response.success || !response.data) {
        return {
          keyword_term: keywordTerm,
          topic: null
        };
      }

      return {
        keyword_term: keywordTerm,
        topic: response.data
      };
    });

    items.value = nextItems;
    selectedKeywordTerms.value = selectedKeywordTerms.value.filter(value =>
      nextItems.some(item => item.keyword_term === value)
    );
  } catch {
    items.value = [];
    message("获取关注话题失败", { type: "error" });
  } finally {
    loading.value = false;
  }
}

function openTopicDetail(topic: Topic) {
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

async function removeOne(keywordTerm: string) {
  const confirmed = window.confirm(`确认删除关注关键词：${keywordTerm} ？`);
  if (!confirmed) return;

  loading.value = true;
  try {
    const response = await deleteFollowedKeyword(keywordTerm);
    if (!response.success) {
      message(response.error_message || "删除关注失败", { type: "warning" });
      return;
    }

    message("删除关注成功", { type: "success" });
    await loadFollowedTopics();
  } catch {
    message("删除关注失败", { type: "error" });
  } finally {
    loading.value = false;
  }
}

async function removeSelected() {
  const targets = Array.from(
    new Set(selectedKeywordTerms.value.map(item => item.trim()).filter(Boolean))
  );

  if (!targets.length) {
    message("请先选择要删除的关注关键词", { type: "warning" });
    return;
  }

  const confirmed = window.confirm(`确认删除 ${targets.length} 个关注关键词？`);
  if (!confirmed) return;

  loading.value = true;
  try {
    const results = await Promise.allSettled(
      targets.map(keywordTerm => deleteFollowedKeyword(keywordTerm))
    );

    let successCount = 0;
    results.forEach(result => {
      if (result.status === "fulfilled" && result.value.success) {
        successCount += 1;
      }
    });

    if (!successCount) {
      message("批量删除失败", { type: "warning" });
      return;
    }

    if (successCount < targets.length) {
      message(`已删除 ${successCount}/${targets.length} 个关注关键词`, {
        type: "warning"
      });
    } else {
      message(`已删除 ${successCount} 个关注关键词`, { type: "success" });
    }

    await loadFollowedTopics();
  } finally {
    loading.value = false;
  }
}

loadFollowedTopics();
</script>

<template>
  <div class="followed-topics-page" v-loading="loading">
    <el-card shadow="never" class="toolbar-card">
      <div class="toolbar-row">
        <div class="left-info">
          <el-tag type="info" effect="plain">共 {{ items.length }} 个关注话题</el-tag>
          <el-tag type="warning" effect="plain">已选 {{ selectedKeywordTerms.length }} 个</el-tag>
        </div>
        <div class="right-actions">
          <el-button size="small" @click="loadFollowedTopics">刷新</el-button>
          <el-button
            type="danger"
            size="small"
            :disabled="!selectedKeywordTerms.length"
            @click="removeSelected"
          >
            删除选中
          </el-button>
        </div>
      </div>
    </el-card>

    <el-empty
      v-if="!items.length && !loading"
      description="暂无关注关键词，请先在其他入口新增关注"
    />

    <div v-else class="cards-grid">
      <el-card
        v-for="item in items"
        :key="item.keyword_term"
        shadow="never"
        class="followed-topic-card"
      >
        <div class="card-header">
          <div class="left-group">
            <el-checkbox
              :model-value="isSelected(item.keyword_term)"
              @change="checked => toggleSelection(item.keyword_term, Boolean(checked))"
            />
            <el-tag type="info" effect="plain">{{ item.keyword_term }}</el-tag>
          </div>
          <div class="right-group">
            <el-button
              size="small"
              type="primary"
              plain
              :disabled="!item.topic"
              @click="item.topic && openTopicDetail(item.topic)"
            >
              查看详情
            </el-button>
            <el-button
              size="small"
              type="danger"
              plain
              @click="removeOne(item.keyword_term)"
            >
              删除关注
            </el-button>
          </div>
        </div>

        <div class="topic-card-wrapper" @click="item.topic && openTopicDetail(item.topic)">
          <TopicCard v-if="item.topic" :topic="item.topic" :selectable="false" />
          <el-empty v-else description="该关键词当前未解析到 Topic" />
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.followed-topics-page {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar-card,
.followed-topic-card {
  border-radius: 12px;
}

.toolbar-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.left-info,
.right-actions,
.left-group,
.right-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 16px;
}

.topic-card-wrapper {
  cursor: pointer;
  transition: opacity 0.2s;
}

.topic-card-wrapper:hover {
  opacity: 0.9;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

@media (max-width: 992px) {
  .toolbar-row,
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>
