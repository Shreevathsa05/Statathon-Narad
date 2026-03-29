import { TavilySearch } from "@langchain/tavily"

export const search_tool=new TavilySearch({
    maxResults:5,
    topic:"general",
});