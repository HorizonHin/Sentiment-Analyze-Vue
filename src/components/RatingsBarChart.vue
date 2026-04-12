<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type * as echarts from "echarts";
import type { NewsItem } from "../api/sentiment";

defineOptions({
  name: "RatingsBarChart"
});

const props = defineProps<{
  item: NewsItem;
}>();

const chartRef = ref<HTMLElement>();
const $echarts = (getCurrentInstance()?.proxy as any)?.$echarts;
let chartInstance: ReturnType<typeof echarts.init> | null = null;

const ratingsData = computed(() => [
  {
    name: "乐观度",
    value: Math.round((props.item.optimism_score || 0) * 100),
    color: "#3f8ce8"
  },
  {
    name: "信任度",
    value: Math.round((props.item.trust_score || 0) * 100),
    color: "#1f5eff"
  },
  {
    name: "争议性",
    value: Math.round((props.item.controversy_score || 0) * 100),
    color: "#ff9f7f"
  },
  {
    name: "关注度",
    value: Math.round((props.item.attention_score || 0) * 100),
    color: "#fdbf00"
  }
]);

function renderChart() {
  if (!chartRef.value || !$echarts) return;

  if (chartInstance) {
    chartInstance.dispose();
  }

  chartInstance = $echarts.init(chartRef.value);
  chartInstance.setOption({
    title: {
      text: "情绪评分",
      textStyle: {
        fontSize: 14,
        fontWeight: "bold"
      }
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow"
      }
    },
    grid: {
      top: 50,
      left: 120,
      right: 20,
      bottom: 20
    },
    xAxis: {
      type: "value",
      min: 0,
      max: 100,
      boundaryGap: [0, 0.01]
    },
    yAxis: {
      type: "category",
      data: ratingsData.value.map(d => d.name)
    },
    series: [
      {
        type: "bar",
        data: ratingsData.value.map(d => ({
          value: d.value,
          itemStyle: { color: d.color }
        })),
        label: {
          show: true,
          position: "right",
          formatter: "{c}%"
        }
      }
    ]
  });
}

onMounted(() => {
  nextTick(renderChart);
});

watch(
  () => props.item,
  () => {
    nextTick(renderChart);
  },
  { deep: true }
);

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});
</script>

<template>
  <div ref="chartRef" class="chart"></div>
</template>

<style scoped>
.chart {
  width: 100%;
  min-height: 320px;
}
</style>
