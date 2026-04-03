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
  analyzed_time: string; //服务器会传入UTC+8的时间，前端需要本地化
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
  created_at: number;
  id: number;
  topic: string;
  llm_title: string;//优先展示这个字段，如果没有再展示topic字段
  topic_type: string;
  rank_data: Record<string, NewsItem[]>;
  platform_distribution: TopicPlatformDistribution[];
  start_time: number;
  end_time: number;
  window_size: number;
  sentiment: string;
  news_count: number;
  updated_at: number;
  version: number;

  total_weight: number;
  heat_change_percent: number;
  stage: string;
  
  source_diversity: number;
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

export type SearchTermsByKeywordQuery = {
  keyword: string;
  start_time: string | number | Date;
  end_time: string | number | Date;
  news_first_time?: string | number | Date;
  limit?: number;
};

export type SearchTermsByKeywordData = {
  keyword: string;
  keywords: NewsKeyword[];
  entities: NewsEntity[];
};

export type SearchTermsByKeywordResponse = ApiResult<SearchTermsByKeywordData>;

export type TopicByKeywordQuery = {
  keyword: string;
  start_time?: string | number | Date;
  end_time?: string | number | Date;
  news_first_time?: string | number | Date;
};

export type TopicByKeywordResponse = ApiResult<Topic>;

export type FollowedKeywordsListData = {
  keywords: string[];
};

export type FollowedKeywordsListResponse = ApiResult<FollowedKeywordsListData>;

export type FollowedKeywordMutationData = {
  keyword_term: string;
  added?: boolean;
  deleted?: boolean;
};

export type FollowedKeywordMutationResponse = ApiResult<FollowedKeywordMutationData>;

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

/**
 * Search candidate keywords/entities by user input keyword in a time window.
 */
export const searchTermsByKeyword = (query: SearchTermsByKeywordQuery) => {
  return http.request<SearchTermsByKeywordResponse>("get", "/api/news/search-terms", {
    params: {
      keyword: query.keyword,
      start_time: formatApiTimestamp(query.start_time),
      end_time: formatApiTimestamp(query.end_time),
      news_first_time: query.news_first_time
        ? formatApiTimestamp(query.news_first_time)
        : undefined,
      limit: query.limit
    }
  });
};

/**
 * Fetch single topic by keyword (or build one from related news if needed).
 */
export const getTopicByKeyword = (query: TopicByKeywordQuery) => {
  return http.request<TopicByKeywordResponse>("get", "/api/topics/by-keyword", {
    params: {
      keyword: query.keyword,
      start_time: query.start_time ? formatApiTimestamp(query.start_time) : undefined,
      end_time: query.end_time ? formatApiTimestamp(query.end_time) : undefined,
      news_first_time: query.news_first_time
        ? formatApiTimestamp(query.news_first_time)
        : undefined
    }
  });
};

/**
 * List followed keyword terms.
 */
export const listFollowedKeywords = (limit = 1000) => {
  return http.request<FollowedKeywordsListResponse>(
    "get",
    "/api/keywords/followed/list",
    {
      params: {
        limit
      }
    }
  );
};

/**
 * Add a followed keyword term.
 */
export const addFollowedKeyword = (keyword_term: string) => {
  return http.request<FollowedKeywordMutationResponse>(
    "post",
    "/api/keywords/followed/add",
    {
      data: {
        keyword_term
      }
    }
  );
};

/**
 * Delete a followed keyword term.
 */
export const deleteFollowedKeyword = (keyword_term: string) => {
  return http.request<FollowedKeywordMutationResponse>(
    "delete",
    "/api/keywords/followed/delete",
    {
      params: {
        keyword_term
      }
    }
  );
};

export type TopicRiskWarning = {
  topic_created_at: number;
  topic_id: number;
  topic_name: string;
  risk_type: "negative_cluster" | "burst_event" | "cross_platform_gap" | string;
  risk_level: "low" | "medium" | "high" | "critical" | string;
  risk_score: number;
  reason: string;
  metrics: Record<string, any>;
  detected_by_event: string;
  occurred_at: number;
};

export type SensitiveTitleRecord = {
  topic_created_at: number;
  topic_id: number;
  topic_name: string;
  old_topic: string;
  candidate_titles: string[];
  reason: string;
  risk_level: string;
  occurred_at: number;
  context: any;
};

/**
 * Get topic risk warnings.
 */
export const getTopicRiskWarnings = (params?: {
  topic_created_at?: number;
  topic_id?: number;
  start_time?: number;
  end_time?: number;
  risk_level?: string;
  limit?: number;
}) => {
  return http.request<ApiResult<TopicRiskWarning[]>>(
    "get",
    "/api/risk/topic-warnings",
    { params }
  );
};

/**
 * Get sensitive title audit records.
 */
export const getSensitiveTitleRecords = (params?: {
  topic_created_at?: number;
  topic_id?: number;
  start_time?: number;
  end_time?: number;
  limit?: number;
}) => {
  return http.request<ApiResult<SensitiveTitleRecord[]>>(
    "get",
    "/api/risk/sensitive-title-audit",
    { params }
  );
};

/**
 * Batch get topics by (created_at, id) keys.
 */
export const batchGetTopics = (keys: [number, number][]) => {
  return http.request<TrendingTopicsResponse>("post", "/api/topics/batch-get", {
    data: { keys }
  });
};
