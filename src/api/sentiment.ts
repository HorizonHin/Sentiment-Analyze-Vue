import { http } from "@/utils/http";
import { formatApiTimestamp } from "@/common/const";

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
  // entity_type?: string;
  news_first_time?: number;
  news_item_id?: number;
};

export type NewsKeyword = {
  id: number;
  term: string;
  importance: number;
  weigh: number;
  news_first_time?: number;
  news_item_id?: number;
};

export type RankTimelineEntry = {
  id: number;
  time: number;
  rank: number | null;
  news_first_time?: number;
  news_item_id?: number;
  rank_value?: number;
  timeline_time?: number;
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
  first_time: number;
  last_time: number;
  analyzed_time: string; //服务器会传入UTC+0的时间，前端需要本地化
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
  start_time: number;
  end_time: number;
  window_size: number;
  sentiment: string;
  news_count: number;
  total_weight: number;
  heat_change_percent: number;
  stage: string;
  created_at: number;
  updated_at: number;
  version: number;
};

export type LatestRankedNewsResponse = ApiResult<Record<string, NewsItem[]>>;
export type TrendingTopicsResponse = ApiResult<Topic[]>;
export type TopicSnapshotDetail = {
  topic: Topic;
  timeline: Topic[];
};
export type TopicSnapshotDetailResponse = ApiResult<TopicSnapshotDetail>;

export type LatestRankedNewsQuery = {
  start_time?: string | number | Date;
  end_time?: string | number | Date;
};

export type TopicSnapshotDetailQuery = {
  created_at: string | number | Date;
  id: number;
  history_limit?: number;
};

/**
 * Get analyzed latest-ranked news and group by source_id.
 */
export const getLatestRankedNews = (query?: LatestRankedNewsQuery) => {
  const params: Record<string, number> = {};

  if (query?.start_time) {
    params.start_time = formatApiTimestamp(query.start_time);
  }
  if (query?.end_time) {
    params.end_time = formatApiTimestamp(query.end_time);
  }

  return http.request<LatestRankedNewsResponse>(
    "get",
    "/api/news/latest-ranked",
    {
      params
    }
  );
};

/**
 * Get trending topics from cache.
 */
export const getTrendingTopics = () => {
  return http.request<TrendingTopicsResponse>("get", "/api/topics/trending");
};

/**
 * Get topic snapshot detail and timeline.
 */
export const getTopicSnapshotDetail = (query: TopicSnapshotDetailQuery) => {
  return http.request<TopicSnapshotDetailResponse>(
    "get",
    "/api/topics/snapshot-detail",
    {
      params: {
        created_at: formatApiTimestamp(query.created_at),
        id: query.id,
        history_limit: query.history_limit
      }
    }
  );
};
