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
import type { NewsItem } from "../api/sentiment";
import {
  formatDateTimeYmdHm,
  formatTimestampToMilliseconds
} from "../common/const";

defineOptions({
  name: "RankTimelineChart"
});

const props = defineProps<{
  item: NewsItem;
}>();

const chartRef = ref<HTMLElement>();
const $echarts = (getCurrentInstance()?.proxy as any)?.$echarts;
let chartInstance: ReturnType<typeof echarts.init> | null = null;

function formatTimelineLabel(value: number | string): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "-";
  }
  return formatDateTimeYmdHm(numeric);
}

const timelineData = computed(() => {
  const sorted = [...(props.item.rank_timeline || [])].sort((a, b) => {
    const timeA = formatTimestampToMilliseconds(a.time);
    const timeB = formatTimestampToMilliseconds(b.time);
    return timeA - timeB;
  });

  return sorted
    .map(item => ({
      time: formatTimestampToMilliseconds(item.time),
      rank: item.rank || 0
    }))
    .filter(point => !Number.isNaN(point.time));
});

function renderChart() {
  if (!chartRef.value || !$echarts) return;

  if (chartInstance) {
    chartInstance.dispose();
  }

  chartInstance = $echarts.init(chartRef.value);
  chartInstance.setOption({
    title: {
      text: "Rank Timeline",
      textStyle: {
        fontSize: 14,
        fontWeight: "bold"
      }
    },
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const points = Array.isArray(params) ? params : [params];
        const axisValue = points[0]?.axisValue;
        const timeLabel = formatTimelineLabel(axisValue);

        const seriesText = points.map(point => {
          const value = Array.isArray(point.value)
            ? point.value[1]
            : point.value;
          return `${point.marker}${point.seriesName}: ${value ?? "-"}`;
        });

        return [timeLabel, ...seriesText].join("<br/>");
      }
    },
    grid: {
      top: 50,
      left: 50,
      right: 20,
      bottom: 80,
      containLabel: true
    },
    dataZoom: [
      {
        type: "inside",
        filterMode: "none"
      },
      {
        type: "slider",
        bottom: 12,
        height: 18,
        filterMode: "none"
      }
    ],
    xAxis: {
      type: "time",
      position: "bottom",
      boundaryGap: false,
      axisLine: {
        onZero: false
      },
      axisLabel: {
        rotate: 45,
        formatter: (value: number) => formatTimelineLabel(value)
      }
    },
    yAxis: {
      type: "value",
      inverse: true,
      min: 1,
      max: 30,
      minInterval: 1
    },
    series: [
      {
        name: "Rank",
        type: "line",
        data: timelineData.value.map(point => [point.time, point.rank]),
        smooth: true,
        showSymbol: timelineData.value.length <= 30,
        itemStyle: {
          color: "#1f5eff"
        },
        areaStyle: {
          color: "rgba(31, 94, 255, 0.1)"
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
  min-height: 280px;
}
</style>
