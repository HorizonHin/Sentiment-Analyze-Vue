<script setup lang="ts">
import { ref, onMounted } from "vue";
import { message } from "@/utils/message";
import { 
  getDailyReport, 
  generateDailyReport, 
  type DailyReportData 
} from "@/api/sentiment";
import dayjs from "dayjs";

defineOptions({
  name: "DailyReport"
});

const selectedDate = ref(new Date());
const report = ref<DailyReportData | null>(null);
const loading = ref(false);
const activeNames = ref<string[]>([]);

const fetchReport = async () => {
  const dateStr = dayjs(selectedDate.value).format("YYYYMMDD");
  loading.value = true;
  try {
    const { success, data, error_message } = await getDailyReport(dateStr);
    if (success) {
      report.value = data;
      activeNames.value = []; // Reset accordion when switching dates
    } else {
      report.value = null;
      message(error_message || "未找到该日期的日报", { type: "warning" });
    }
  } catch (e) {
    message("获取日报失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const handleGenerateReport = async () => {
  try {
    const { success, error_message } = await generateDailyReport();
    if (success) {
      message("生成日报成功", { type: "success" });
      fetchReport();
    } else {
      message(error_message || "生成日报失败", { type: "error" });
    }
  } catch (e) {
    message("生成请求失败", { type: "error" });
  }
};

onMounted(() => {
  fetchReport();
});
</script>

<template>
  <div class="p-4">
    <el-card shadow="never">
      <template #header>
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-4">
            <span class="font-bold">舆情日报</span>
            <el-date-picker
              v-model="selectedDate"
              type="date"
              placeholder="选择日期"
              :clearable="false"
              @change="fetchReport"
            />
          </div>
          <el-button type="primary" @click="handleGenerateReport">
            手动生成今日日报
          </el-button>
        </div>
      </template>

      <div v-loading="loading">
        <template v-if="report">
          <el-descriptions title="1. 总体概况" :column="2" border class="mb-6">
            <el-descriptions-item label="时间范围">
              {{ dayjs(report.start_time * 1000).format("YYYY-MM-DD HH:mm:S") }} 至 
              {{ dayjs(report.end_time * 1000).format("YYYY-MM-DD HH:mm:ss") }}
            </el-descriptions-item>
            <el-descriptions-item label="活跃话题总数">
              {{ report.total_active_topics }}
            </el-descriptions-item>
            <el-descriptions-item label="情感分布" :span="2">
              <el-tag 
                v-for="(count, sentiment) in report.sentiment_stats" 
                :key="sentiment"
                class="mr-2"
                type="info"
              >
                {{ sentiment }}: {{ count }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <h3 class="text-lg font-bold mb-4">2. 详细内容 (点击展开)</h3>
          
          <el-collapse v-model="activeNames">
            <!-- Top 10 Topics -->
            <el-collapse-item title="热度 Top 10 话题" name="topics">
              <el-table :data="report.top_topics" stripe style="width: 100%">
                <el-table-column type="index" label="排名" width="60" align="center" />
                <el-table-column label="话题名称">
                  <template #default="{ row }">
                    <span class="font-medium">{{ row.llm_title || row.topic }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="total_weight" label="热度值" width="100" align="right">
                  <template #default="{ row }">
                    {{ row.total_weight.toFixed(1) }}
                  </template>
                </el-table-column>
                <el-table-column prop="stage" label="阶段" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag size="small">{{ row.stage }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="sentiment" label="情感" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag 
                      size="small" 
                      :type="row.sentiment === 'negative' ? 'danger' : row.sentiment === 'positive' ? 'success' : 'info'"
                    >
                      {{ row.sentiment }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </el-collapse-item>

            <!-- Risk Warnings -->
            <el-collapse-item title="风险预警 (高/危)" name="risks">
              <div v-if="report.risk_warnings.length === 0" class="text-gray-500 py-4 text-center">
                过去24小时内未发现高风险项
              </div>
              <el-timeline v-else class="mt-4">
                <el-timeline-item
                  v-for="(risk, index) in report.risk_warnings"
                  :key="index"
                  :type="risk.risk_level === 'critical' ? 'danger' : 'warning'"
                  :timestamp="dayjs(risk.occurred_at * 1000).format('HH:mm')"
                >
                  <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-2">
                      <el-tag size="small" :type="risk.risk_level === 'critical' ? 'danger' : 'warning'">
                        {{ risk.risk_level.toUpperCase() }}
                      </el-tag>
                      <span class="font-bold">{{ risk.topic_name }}</span>
                    </div>
                    <div class="text-sm text-gray-600">
                      {{ risk.reason }}
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </el-collapse-item>
          </el-collapse>
        </template>
        
        <el-empty v-else description="暂无报告数据" />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
:deep(.el-collapse-item__header) {
  font-size: 16px;
  font-weight: bold;
}
</style>
