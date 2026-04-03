<script setup lang="ts">
import { ref, onMounted } from "vue";
import * as echarts from "echarts";
import "echarts-wordcloud";
import { http } from "@/utils/http";

const loading = ref(false);
const keywords = ref<any[]>([]);
const entities = ref<any[]>([]);
const keywordCloudRef = ref<HTMLElement>();
const entityCloudRef = ref<HTMLElement>();
let keywordChart: echarts.ECharts | null = null;
let entityChart: echarts.ECharts | null = null;

async function fetchHotTerms() {
  loading.value = true;
  try {
    const now = Math.floor(Date.now() / 1000);
    // 默认查最近24小时
    const end_time = now;
    const start_time = now - 24 * 3600;
    const res = await http.request<any>("get", "/api/news/recommend-hot-terms", {
      params: { start_time, end_time, top_n: 60 }
    });
    if (res.success) {
      // 合并同名key，计算总weight
      function aggregateByKey(arr: any[]) {
        const map = new Map<string, { list: any[] }>();
        arr.forEach(item => {
          const key = item.term || item.name;
          if (!map.has(key)) {
            map.set(key, { list: [item] });
          } else {
            map.get(key)!.list.push(item);
          }
        });
        // 计算sumWeigh，保留置信度（原重要性）
        return Array.from(map.entries()).map(([key, obj]) => {
          const sumWeigh = obj.list.reduce((sum, i) => sum + (i.weigh || 0), 0);
          const sumCount = obj.list.reduce((sum, i) => sum + (i.count || 0), 0);
          // 取第一个对象的其他属性
          const val = obj.list[0];
          return {
            key,
            sumWeigh: sumWeigh || sumCount || 1,
            confidence: val.importance,
            ...val,
            _all: obj.list // 可选: 保留原始list
          };
        });
      }
      keywords.value = aggregateByKey(Object.values(res.data.keywords || {}).flat());
      entities.value = aggregateByKey(Object.values(res.data.entities || {}).flat());
      // 赋值给外部变量，方便 resize
      keywordChart = renderWordCloud(keywordCloudRef.value, keywords.value, "关键词词云");
      entityChart = renderWordCloud(entityCloudRef.value, entities.value, "实体词云");
    }
  } finally {
    loading.value = false;
  }
}

function renderWordCloud(
  dom: HTMLElement | undefined,
  data: any[],
  title: string
) {
  if (!dom) return null;

  // 获取旧实例并销毁（防止重复初始化）
  const existInstance = echarts.getInstanceByDom(dom);
  if (existInstance) existInstance.dispose();

  const chart = echarts.init(dom);

  const option = {
    title: { text: title, left: "center" },
    tooltip: {
            show: true,
            formatter: (params: any) => {
              const d = params.data;
              // 修正字段名，使用 sumWeigh
              let html = `<b>${d.name}</b><br/>权重: ${d.sumWeigh}`;
              if (d.confidence !== undefined) html += `<br/>置信度: ${d.confidence}`;
              // type 存在就展示
              if (d.type) html += `<br/>类型: ${d.type}`;
              return html;
      }
    },
    series: [{
      type: "wordCloud",
      shape: "circle",
      sizeRange: [14, 80], // 这里的跨度决定了视觉差异！
      gridSize: 4,         // 减小间距，防止大词因为没地方放而缩小
      rotationRange: [-30, 30],
      drawOutOfBound: false,
      textStyle: {
        fontWeight: 600,
        color: () => `rgb(${[
          Math.round(Math.random() * 160),
          Math.round(Math.random() * 160),
          Math.round(Math.random() * 160)
        ].join(',')})`
      },
      // 关键：数据映射
      data: data.sort((a, b) => b.sumWeigh - a.sumWeigh).map(item => ({
        ...item,
        name: item.key,
        value: item.sumWeigh
      }))
    }]
  };

  chart.setOption(option);
  return chart;
}

onMounted(() => {
  fetchHotTerms();
});
</script>

<template>
  <div class="hot-terms-page" v-loading="loading">
    <div class="clouds-row">
      <div class="cloud-panel">
        <div ref="keywordCloudRef" class="cloud-chart"></div>
      </div>
      <div class="cloud-panel">
        <div ref="entityCloudRef" class="cloud-chart"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hot-terms-page {
  padding: 24px;
}

.clouds-row {
  display: flex;
  gap: 32px;
  justify-content: center;
  align-items: flex-start;
}

.cloud-panel {
  flex: 1 1 0;
  min-width: 320px;
  min-height: 420px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px #0001;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cloud-chart {
  width: 100%;
  height: 380px;
}
</style>
