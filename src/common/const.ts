export const SENTIMENT_POLARITY_COLORS = {
  positive: "#67c23a",
  negative: "#f56c6c",
  neutral: "#409eff",
  mixed: "#e6a23c",
  other: "#909399",
  unknown: "#909399"
} as const;

export const SENTIMENT_POLARITY_MAP: Record<string, string> = {
  positive: "正面",
  negative: "负面",
  neutral: "中性",
  mixed: "混合",
  unknown: "未知"
};

export const API_TIMESTAMP_UNIT = "seconds";

export function getSentimentPolarityColor(polarity?: string): string {
  const key = (
    polarity || "other"
  ).toLowerCase() as keyof typeof SENTIMENT_POLARITY_COLORS;
  return SENTIMENT_POLARITY_COLORS[key] || SENTIMENT_POLARITY_COLORS.other;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function formatDateToYmdHms(date: Date): string {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  const seconds = pad2(date.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function normalizeTimestampToMilliseconds(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const absValue = Math.abs(value);

  // Support second/millisecond/microsecond/nanosecond timestamps from backend.
  if (absValue >= 1_000_000_000_000_000_000) {
    return Math.trunc(value / 1_000_000);
  }
  if (absValue >= 1_000_000_000_000_000) {
    return Math.trunc(value / 1_000);
  }
  if (absValue >= 1_000_000_000_000) {
    return Math.trunc(value);
  }

  // Default to seconds.
  return Math.trunc(value * 1000);
}

function parseTimeValueToDate(value: string | number | Date): Date | null {
  if (value instanceof Date) {
    // Return a clone so downstream code cannot mutate the original Date object.
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }

  if (typeof value === "number") {
    const timestampMs = normalizeTimestampToMilliseconds(value);
    const date = new Date(timestampMs);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const text = value.trim();
  if (!text) {
    return null;
  }

  if (/^-?\d+(\.\d+)?$/.test(text)) {
    const numeric = Number(text);
    const timestampMs = normalizeTimestampToMilliseconds(numeric);
    const date = new Date(timestampMs);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // Keep fallback support for legacy non-timestamp strings.
  const dateTimeMatch = text.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/
  );
  if (dateTimeMatch) {
    const year = Number(dateTimeMatch[1]);
    const month = Number(dateTimeMatch[2]) - 1;
    const day = Number(dateTimeMatch[3]);
    const hour = Number(dateTimeMatch[4]);
    const minute = Number(dateTimeMatch[5]);
    const second = Number(dateTimeMatch[6] || 0);
    const date = new Date(year, month, day, hour, minute, second);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const dateOnlyMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]) - 1;
    const day = Number(dateOnlyMatch[3]);
    const date = new Date(year, month, day, 0, 0, 0);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const fallback = new Date(text);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export function formatApiTimestamp(value: string | number | Date): number {
  const date = parseTimeValueToDate(value);
  return date ? Math.trunc(date.getTime() / 1000) : 0;
}

export function formatTimestampToMilliseconds(
  value?: string | number | Date | null
): number {
  if (value === null || value === undefined || value === "") {
    return NaN;
  }

  const date = parseTimeValueToDate(value);
  return date ? date.getTime() : NaN;
}

// Backward-compatible alias for existing callsites.
export const formatApiDateTime = formatApiTimestamp;

export function formatDateTimeYmdHm(
  value?: string | number | Date | null
): string {
  if (!value) {
    return "-";
  }

  const date = parseTimeValueToDate(value);
  if (!date) {
    return String(value);
  }

  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function formatUtc8DateTimeStringToLocalYmdHms(
  value?: string | null
): string {
  if (!value) {
    return "-";
  }

  const text = value.trim();
  if (!text) {
    return "-";
  }

  const utcMatch = text.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/
  );
  if (!utcMatch) {
    return value;
  }

  const year = Number(utcMatch[1]);
  const month = Number(utcMatch[2]) - 1;
  const day = Number(utcMatch[3]);
  const hour = Number(utcMatch[4]);
  const minute = Number(utcMatch[5]);
  const second = Number(utcMatch[6]);

  // Backend string is in UTC+8. Convert to UTC instant, then format in client local timezone.
  const utcMillis = Date.UTC(year, month, day, hour, minute, second) - 8 * 60 * 60 * 1000;
  const localDate = new Date(utcMillis);
  return Number.isNaN(localDate.getTime())
    ? value
    : formatDateToYmdHms(localDate);
}

export function formatWindowHourMinute(value?: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  const totalMinutes = Math.max(0, Math.round(value));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours} Hour ${minutes} Minute`;
  }
  if (hours > 0) {
    return `${hours} Hour`;
  }
  return `${minutes} Minute`;
}

export const STAGE_SET = ["Inception", "Growth", "Climax", "Decline", "Maturity"] as const;



export type TopicStage = (typeof STAGE_SET)[number];

export const TOPIC_STAGE_COLORS: Record<TopicStage, string> = {
  Inception: "#409eff",
  Growth: "#67c23a",
  Climax: "#e6a23c",
  Decline: "#f56c6c",
  Maturity: "#750e5b"
};

type StageMeta = {
  label: string;
  tagType: "success" | "warning" | "info" | "danger";
};

const TOPIC_STAGE_META: Record<TopicStage, StageMeta> = {
  Inception: { label: "起步期", tagType: "info" },
  Growth: { label: "增长期", tagType: "success" },
  Climax: { label: "爆发期", tagType: "warning" },
  Decline: { label: "衰退期", tagType: "danger" },
  Maturity: { label: "高峰期", tagType: "warning" }
};

const TOPIC_STAGE_ALIAS: Record<string, TopicStage> = {
  inception: "Inception",
  growth: "Growth",
  climax: "Climax",
  decline: "Decline",
  // Keep common Chinese aliases for compatibility with mixed backend data.
  "起步期": "Inception",
  "增长期": "Growth",
  "爆发期": "Climax",
  "高峰期": "Climax",
  "衰退期": "Decline",
  "降温期": "Decline"
};
// Risk Management Constants
export const RISK_TYPE_META = {
  negative_cluster: { label: "负面聚簇", icon: "Warning", color: "#f56c6c" },
  burst_event: { label: "舆情突发", icon: "TrendCharts", color: "#e6a23c" },
  cross_platform_gap: { label: "认知偏差", icon: "Share", color: "#409eff" }
} as const;

export const RISK_LEVEL_META = {
  low: { label: "低风险", type: "info", color: "#909399" },
  medium: { label: "中风险", type: "warning", color: "#e6a23c" },
  high: { label: "高风险", type: "danger", color: "#f56c6c" },
  critical: { label: "极高危", type: "danger", color: "#750e5b" }
} as const;

export function getRiskTypeMeta(type: string) {
  return RISK_TYPE_META[type as keyof typeof RISK_TYPE_META] || { label: type, icon: "InfoFilled", color: "#909399" };
}

export function getRiskLevelMeta(level: string) {
  return RISK_LEVEL_META[level as keyof typeof RISK_LEVEL_META] || { label: level, type: "info", color: "#909399" };
}
function normalizeTopicStage(stage?: string | null): TopicStage | null {
  const text = String(stage || "").trim();
  if (!text) {
    return null;
  }

  const direct = text as TopicStage;
  if (TOPIC_STAGE_META[direct]) {
    return direct;
  }

  const byAlias = TOPIC_STAGE_ALIAS[text.toLowerCase()];
  return byAlias || null;
}

export function getTopicStageMeta(stage?: string | null): StageMeta {
  const normalized = normalizeTopicStage(stage);
  if (normalized) {
    return TOPIC_STAGE_META[normalized];
  }

  const fallbackLabel = String(stage || "").trim() || "Unknown";
  return { label: fallbackLabel, tagType: "info" };
}

export function getTopicStageColor(stage?: string | null): string {
  const normalized = normalizeTopicStage(stage);
  return normalized ? TOPIC_STAGE_COLORS[normalized] : "#909399";
}

export function formatHeatChangePercent(value?: number | null): string {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return "0.00%";
  }

  const sign = numericValue > 0 ? "+" : "";
  return `${sign}${numericValue.toFixed(2)}%`;
}

export function getHeatChangeTagType(
  value?: number | null
): "success" | "warning" | "info" | "danger" {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return "info";
  }
  if (numericValue >= 20) {
    return "success";
  }
  if (numericValue > 0) {
    return "warning";
  }
  if (numericValue <= -15) {
    return "danger";
  }
  return "info";
}
