import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import "dotenv/config";
import { logger } from "../utils/logger.js";
const mcp_client = new MultiServerMCPClient({
    // search:{
    //     transport:"http",
    //     url:process.env.TAVILY_MCP_URI,
    // },
    mospi: {
        transport: "http",
        url: process.env.MOSPI_MCP_URI,
        reconnect: {
            enabled: true
        }
    }
})

let tools = [];
try {
    tools = await mcp_client.getTools();
} catch (e) {
    logger.error("Failed to initialize mcp tools:", e);
}

export const mcp_tools = tools;