<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type * as echarts from "echarts";
import type { NewsItem } from "../api/sentiment";

defineOptions({
  name: "SentimentPieChart"
});

const props = defineProps<{
  item: NewsItem;
}>();

const chartRef = ref<HTMLElement>();
const $echarts = (getCurrentInstance()?.proxy as any)?.$echarts;
let chartInstance: ReturnType<typeof echarts.init> | null = null;

const pieChartData = computed(() => {
  return [
    {
      value: Math.round((props.item.positive_ratio || 0) * 100),
      name: "Positive",
      itemStyle: { color: "#67c23a" }
    },
    {
      value: Math.round((props.item.negative_ratio || 0) * 100),
      name: "Negative",
      itemStyle: { color: "#f56c6c" }
    },
    {
      value: Math.round((props.item.neutral_ratio || 0) * 100),
      name: "Neutral",
      itemStyle: { color: "#909399" }
    }
  ];
});

function renderChart() {
  if (!chartRef.value || !$echarts) return;

  if (chartInstance) {
    chartInstance.dispose();
  }

  chartInstance = $echarts.init(chartRef.value);
  chartInstance.setOption({
    title: {
      text: props.item.sentiment_polarity || "Sentiment",
      left: "center",
      textStyle: {
        fontSize: 14,
        fontWeight: "bold"
      }
    },
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c}%"
    },
    legend: {
      bottom: 10,
      data: ["Positive", "Negative", "Neutral"]
    },
    series: [
      {
        type: "pie",
        radius: "60%",
        data: pieChartData.value,
        label: {
          formatter: "{b}: {c}%"
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
