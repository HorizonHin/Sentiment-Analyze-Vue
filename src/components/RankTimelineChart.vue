<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type * as echarts from "echarts";
import type { NewsItem } from "../api/sentiment";

defineOptions({
  name: "RankTimelineChart"
});

const props = defineProps<{
  item: NewsItem;
}>();

const chartRef = ref<HTMLElement>();
const $echarts = (getCurrentInstance()?.proxy as any)?.$echarts;
let chartInstance: ReturnType<typeof echarts.init> | null = null;

const timelineData = computed(() => {
  const sorted = [...(props.item.rank_timeline || [])].sort((a, b) => {
    const timeA = new Date(a.time).getTime();
    const timeB = new Date(b.time).getTime();
    return timeA - timeB;
  });

  return sorted
    .map(item => ({
      time: new Date(item.time).getTime(),
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
        const timeLabel = new Date(axisValue).toLocaleString("zh-CN", {
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        });

        const seriesText = points.map(point => {
          const value = Array.isArray(point.value) ? point.value[1] : point.value;
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
        formatter: (value: number) =>
          new Date(value).toLocaleString("zh-CN", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
          })
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
  <div ref="chartRef" class="chart"></div>
</template>

<style scoped>
.chart {
  width: 100%;
  min-height: 280px;
}
</style>
