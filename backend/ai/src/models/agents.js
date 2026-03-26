// agents and their integerations here
import { llm_chat } from "./llms.js";
import {mcp_tools} from "../tools/multi_mcp_client.js"
import { createAgent, HumanMessage } from "langchain";
import { question_generator_system_prompt } from "../prompt_collection/agent_collection/question_generator_system.js";

// Question Qenerator Agent
const question_generator_agent = createAgent({
    model:llm_chat,
    tools:mcp_tools,
    // systemPrompt: JSON.stringify(question_generator_system_prompt),
});

export {question_generator_agent}

const res = await question_generator_agent.invoke({
  messages: [{ role: "user", content: question_generator_system_prompt + "Generate a survey for consumption study number of questions" }],
})
console.log(res)