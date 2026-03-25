import { http } from "@/utils/http";

export type ApiResult<T> = {
  success: boolean;
  data: T;
  error_message: string;
};

export type NewsEntity = {
  id: number;
  name: string;
  type: string;
  weigh: number;
};

export type NewsKeyword = {
  id: number;
  term: string;
  importance: number;
  weigh: number;
};

export type RankTimelineEntry = {
  id: number;
  time: string;
  rank: number | null;
};

export type NewsItem = {
  id: number;
  title: string;
  source_id: string;
  source_name: string;
  event_type: string;
  summary: string;
  entities: NewsEntity[];
  keywords: NewsKeyword[];
  latest_rank: number;
  url: string;
  mobile_url: string;
  sentiment_polarity: string;
  positive_ratio: number;
  negative_ratio: number;
  neutral_ratio: number;
  optimism_score: number;
  trust_score: number;
  controversy_score: number;
  attention_score: number;
  first_time: string;
  last_time: string;
  analyzed_time: string;
  count: number;
  total_weigh: number;
  rank_timeline: RankTimelineEntry[];
};

export type TopicPlatformDistribution = {
  platform: string;
  volume: number;
  sentiment: string;
  ratio: number;
};

export type Topic = {
  id: number;
  topic: string;
  rank_data: Record<string, NewsItem[]>;
  platform_distribution: TopicPlatformDistribution[];
  start_time: string;
  end_time: string;
  window_size: number;
  sentiment: string;
  news_count: number;
  total_weight: number;
  created_at: string;
  updated_at: string;
  version: number;
};

export type LatestRankedNewsResponse = ApiResult<Record<string, NewsItem[]>>;
export type TrendingTopicsResponse = ApiResult<Topic[]>;

export type LatestRankedNewsQuery = {
  start_time?: string | Date;
  end_time?: string | Date;
};



function toDateTimeString(value: string | Date): string {
  if (typeof value === "string") {
    return value;
  }

  const pad = (num: number) => String(num).padStart(2, "0");
  const yyyy = value.getFullYear();
  const mm = pad(value.getMonth() + 1);
  const dd = pad(value.getDate());
  const hh = pad(value.getHours());
  const mi = pad(value.getMinutes());
  const ss = pad(value.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

/**
 * Get analyzed latest-ranked news and group by source_id.
 */
export const getLatestRankedNews = (query?: LatestRankedNewsQuery) => {
  const params: Record<string, string> = {};

  if (query?.start_time) {
    params.start_time = toDateTimeString(query.start_time);
  }
  if (query?.end_time) {
    params.end_time = toDateTimeString(query.end_time);
  }

  return http.request<LatestRankedNewsResponse>("get", "/api/news/latest-ranked", {
    params
  });
};

/**
 * Get trending topics from cache.
 */
export const getTrendingTopics = () => {
  return http.request<TrendingTopicsResponse>("get", "/api/topics/trending");
};
