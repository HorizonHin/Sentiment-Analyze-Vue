import { defineStore } from "pinia";
import type { Topic } from "@/api/sentiment";
import { store } from "../utils";

export const useTopicStore = defineStore("sentiment-topic", {
  state: () => ({
    selectedTopic: null as Topic | null
  }),

  getters: {
    getSelectedTopic(state): Topic | null {
      return state.selectedTopic;
    }
  },

  actions: {
    setSelectedTopic(topic: Topic | null) {
      this.selectedTopic = topic;
    },

    clearSelectedTopic() {
      this.selectedTopic = null;
    }
  }
});

export function useTopicStoreHook() {
  return useTopicStore(store);
}
