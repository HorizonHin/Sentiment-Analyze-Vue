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
import {
  formatDateTimeYmdHm,
  formatHeatChangePercent,
  getTopicStageColor,
  getTopicStageMeta,
  STAGE_SET
} from "../common/const";
import type { Topic } from "../api/sentiment";

defineOptions({
  name: "TopicHeatTimelineBarChart"
});

const props = defineProps<{
  timeline: Topic[];
}>();

const chartRef = ref<HTMLElement>();
const $echarts = (getCurrentInstance()?.proxy as any)?.$echarts;
let chartInstance: ReturnType<typeof echarts.init> | null = null;

const chartData = computed(() => {
  return [...(props.timeline || [])]
    .filter(item => !!item)
    .sort((a, b) => {
      const aTime = Number(a.updated_at || a.created_at || 0);
      const bTime = Number(b.updated_at || b.created_at || 0);
      return aTime - bTime;
    })
    .map(item => {
      const stageMeta = getTopicStageMeta(item.stage);
      const heat = Number(item.total_weight || 0);
      const change = Number(item.heat_change_percent || 0);
      return {
        timeLabel: formatDateTimeYmdHm(item.updated_at || item.created_at),
        totalWeight: Number.isFinite(heat) ? Number(heat.toFixed(2)) : 0,
        heatChangePercent: Number.isFinite(change) ? change : 0,
        stageLabel: stageMeta.label,
        stageColor: getTopicStageColor(item.stage)
      };
    });
});

function renderChart() {
  if (!chartRef.value || !$echarts) return;

  if (chartInstance) {
    chartInstance.dispose();
  }

  chartInstance = $echarts.init(chartRef.value);

  const weights = chartData.value.map(item => item.totalWeight);
  const maxWeight = Math.max(1, ...weights);

  chartInstance.setOption({
    title: {
      text: "Topic Heat Timeline",
      textStyle: {
        fontSize: 14,
        fontWeight: "bold"
      }
    },
    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        const index = Number(params?.data?.rawIndex ?? params?.dataIndex ?? 0);
        const item = chartData.value[index];
        if (!item) return "";

        return [
          item.timeLabel,
          `Heat: ${item.totalWeight.toFixed(2)}`,
          `Change: ${formatHeatChangePercent(item.heatChangePercent)}`,
          `Stage: ${item.stageLabel}`
        ].join("<br/>");
      }
    },
    grid: {
      top: 50,
      left: 50,
      right: 20,
      bottom: 80
    },
    dataZoom: [
      {
        type: "inside",
        filterMode: "none",
        xAxisIndex: 0
      },
      {
        type: "slider",
        bottom: 12,
        height: 18,
        filterMode: "none",
        xAxisIndex: 0
      }
    ],
    legend: {
      top: 24,
      data: [...STAGE_SET]
    },
    xAxis: {
      type: "category",
      data: chartData.value.map(item => item.timeLabel),
      axisLabel: {
        rotate: 35
      }
    },
    yAxis: {
      type: "value",
      name: "Heat"
    },
    series: [
      {
        name: "Total Weight",
        type: "scatter",
        data: chartData.value.map((item, index) => ({
          value: [index, item.totalWeight],
          rawIndex: index,
          stage: item.stageLabel,
          itemStyle: {
            color: item.stageColor
          },
          symbolSize: Math.max(
            10,
            Math.round((item.totalWeight / maxWeight) * 28)
          )
        }))
      }
    ]
  });
}

onMounted(() => {
  nextTick(renderChart);
});

watch(
  () => props.timeline,
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
