<script setup lang="ts">
import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from "vue";
import type * as echarts from "echarts";
import { getSentimentPolarityColor, SENTIMENT_POLARITY_MAP } from "../common/const";
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
      name: "正面",
      itemStyle: { color: getSentimentPolarityColor("positive") }
    },
    {
      value: Math.round((props.item.negative_ratio || 0) * 100),
      name: "负面",
      itemStyle: { color: getSentimentPolarityColor("negative") }
    },
    {
      value: Math.round((props.item.neutral_ratio || 0) * 100),
      name: "中性",
      itemStyle: { color: getSentimentPolarityColor("neutral") }
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
      text: SENTIMENT_POLARITY_MAP[props.item.sentiment_polarity?.toLowerCase()] || "情感倾向",
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
      data: ["正面", "负面", "中性"]
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
  <div ref="chartRef" class="chart" />
</template>

<style scoped>
.chart {
  width: 100%;
  min-height: 320px;
}
</style>
