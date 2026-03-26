import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import "dotenv/config"
const mcp_client=new MultiServerMCPClient({
    search:{
        transport:"http",
        url:process.env.TAVILY_MCP_URI,
    },
    mospi:{
        transport:"http",
        url:process.env.MOSPI_MCP_URI,
    }
})

export const mcp_tools=await mcp_client.getTools();