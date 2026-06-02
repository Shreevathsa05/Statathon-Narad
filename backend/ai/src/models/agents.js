// agents and their integerations here
import { llm_chat } from "./llms.js";
import { mcp_tools } from "../tools/multi_mcp_client.js";
import { createAgent } from "langchain";
import { 
    context_collector_system_prompt, 
    section_planner_system_prompt, 
    question_generator_system_prompt,
    improve_section_system_prompt_english,
    multilang_translator_system_prompt,
    prompt_validation_system_prompt
} from "../prompts/question_generation/index.js";
import { surveyLogs } from "../router/question_generation_route.js";

function pushLog(id, msg) {
    console.log(msg);
    if (!id) return;
    if (!surveyLogs.has(id)) surveyLogs.set(id, []);
    surveyLogs.get(id).push(msg);
}

// context collector agent
export async function context_collector_agent(user_input, surveyId) {
    pushLog(surveyId, "Context Collector Agent Started");
    const collector = createAgent({
        model: llm_chat,
        tools: mcp_tools,
        max_iterations: 10,
    });

    const res = await collector.invoke({
        messages: [
            {
                role: "user",
                content: `${context_collector_system_prompt}\n${user_input}`
            }
        ]
    }, { recursionLimit: 100 });

    const final = getFinalMessage(res.messages);
    pushLog(surveyId, "Context Collector Agent Completed");
    return final;
}

function getFinalMessage(messages) {
    return messages[messages.length - 1].content;
}

// section planner agent
export async function section_planner_agent(user_input, context_extracted, surveyId) {
    pushLog(surveyId, "Section Planner Agent Started");
    
    const planner = createAgent({
        model: llm_chat,
        tools: mcp_tools,
        max_iterations: 3,
    });

    const res = await planner.invoke({
        messages: [
            {
                role: "user",
                content: `${section_planner_system_prompt}\n\nUser Input: ${user_input}\nContext Extracted: ${context_extracted}`
            }
        ]
    }, { recursionLimit: 30 });

    pushLog(surveyId, "Section Planner Agent Completed");
    
    let content = getFinalMessage(res.messages);
    
    console.log("=== RAW PLANNER RESPONSE ===");
    console.log(content);
    console.log("============================");

    if (typeof content === "string") {
        content = content.replace(/```json/gi, "").replace(/```/g, "").trim();
        try {
            let parsed = JSON.parse(content);
            if (parsed && !Array.isArray(parsed)) {
                const keys = Object.keys(parsed);
                if (keys.length === 1 && Array.isArray(parsed[keys[0]])) {
                    parsed = parsed[keys[0]];
                } else if (parsed.sections && Array.isArray(parsed.sections)) {
                    parsed = parsed.sections;
                }
            }
            return parsed;
        } catch (e) {
            console.error("Failed to parse section planner JSON:", e);
            console.log("Returning raw content due to parse failure.");
            return content;
        }
    }
    return content;
}

// question generator agent
export async function question_generator_agent(user_input, context_summarized, section, previous_questions = [], surveyId) {
    pushLog(surveyId, `Question Generator Agent Started for section: ${section.sectionName}`);

    const generator = createAgent({
        model: llm_chat,
        tools: mcp_tools,
        max_iterations: 3,
    });

    const res = await generator.invoke({
        messages: [
            {
                role: "user",
                content: `${question_generator_system_prompt}\n\nTopic: ${user_input}\nMOSPI extracted Context: ${context_summarized}\n\nSection to Generate: ${JSON.stringify(section, null, 2)}\n\nPreviously Generated Questions (DO NOT REPEAT THESE):\n${JSON.stringify(previous_questions, null, 2)}`
            }
        ]
    }, { recursionLimit: 100 });

    pushLog(surveyId, `Question Generator Agent Completed for section: ${section.sectionName}`);
    
    let content = getFinalMessage(res.messages);
    
    console.log(`=== RAW QUESTION GENERATOR RESPONSE [${section.sectionName}] ===`);
    console.log(content);
    console.log("=============================================");

    if (typeof content === "string") {
        content = content.replace(/```json/gi, "").replace(/```/g, "").trim();
        try {
            let parsed = JSON.parse(content);
            if (parsed && !Array.isArray(parsed)) {
                const keys = Object.keys(parsed);
                if (keys.length === 1 && Array.isArray(parsed[keys[0]])) {
                    parsed = parsed[keys[0]];
                } else if (parsed.questions && Array.isArray(parsed.questions)) {
                    parsed = parsed.questions;
                }
            }
            return parsed;
        } catch (e) {
            console.error("Failed to parse generator JSON:", e);
            console.log("Returning raw content due to parse failure.");
            return content;
        }
    }
    return content;
}

// improve section agent
export async function improve_section_agent(user_instructions, context_summarized, section, current_questions) {
    console.log(`Improve Section Agent Started for section: ${section.sectionName}`);

    const improver = createAgent({
        model: llm_chat,
        tools: mcp_tools,
        max_iterations: 3,
    });

    const res = await improver.invoke({
        messages: [
            {
                role: "user",
                content: `${improve_section_system_prompt_english}\n\nMOSPI extracted Context: ${context_summarized}\n\nSection Description: ${JSON.stringify(section, null, 2)}\n\nExisting Questions:\n${JSON.stringify(current_questions, null, 2)}\n\nUser Instructions for Improvement:\n${user_instructions}`
            }
        ]
    }, { recursionLimit: 100 });

    console.log(`Improve Section Agent Completed for section: ${section.sectionName}`);
    
    let content = getFinalMessage(res.messages);
    
    console.log(`=== RAW IMPROVE SECTION RESPONSE [${section.sectionName}] ===`);
    console.log(content);
    console.log("=========================================================");

    if (typeof content === "string") {
        content = content.replace(/```json/gi, "").replace(/```/g, "").trim();
        try {
            let parsed = JSON.parse(content);
            if (parsed && !Array.isArray(parsed)) {
                const keys = Object.keys(parsed);
                if (keys.length === 1 && Array.isArray(parsed[keys[0]])) {
                    parsed = parsed[keys[0]];
                } else if (parsed.questions && Array.isArray(parsed.questions)) {
                    parsed = parsed.questions;
                }
            }
            return parsed;
        } catch (e) {
            console.error("Failed to parse improver JSON:", e);
            console.log("Returning raw content due to parse failure.");
            return content;
        }
    }
    return content;
}

// multilang translator agent
export async function multilang_translator_agent(question, target_languages, surveyId) {
    pushLog(surveyId, `Multilang Translator Agent Started for languages: ${target_languages.join(", ")}`);

    const translator = createAgent({
        model: llm_chat,
        tools: mcp_tools,
        max_iterations: 3,
    });

    const res = await translator.invoke({
        messages: [
            {
                role: "user",
                content: `${multilang_translator_system_prompt}\n\nTarget Languages: ${target_languages.join(", ")}\n\nQuestion to translate:\n${JSON.stringify(question, null, 2)}`
            }
        ]
    }, { recursionLimit: 100 });

    pushLog(surveyId, `Multilang Translator Agent Completed.`);
    
    let content = getFinalMessage(res.messages);
    
    pushLog(surveyId, `=== RAW MULTILANG TRANSLATOR RESPONSE ===`);
    pushLog(surveyId, content);
    pushLog(surveyId, "=========================================");

    if (typeof content === "string") {
        content = content.replace(/```json/gi, "").replace(/```/g, "").trim();
        try {
            return JSON.parse(content);
        } catch (e) {
            console.error("Failed to parse translator JSON:", e);
            console.log("Returning raw content due to parse failure.");
            return content;
        }
    }
    return content;
}

// prompt validation agent
export async function prompt_validation_agent(user_input) {
    console.log("Prompt Validation Agent Started");

    const validator = createAgent({
        model: llm_chat,
        tools: [],
        max_iterations: 3,
    });

    const res = await validator.invoke({
        messages: [
        {
            role: "user",
            content: `${prompt_validation_system_prompt}\n\nUser Input: ${user_input}`
        }
        ]
    }, { recursionLimit: 100 });

    console.log(`Prompt Validation Agent Completed.`);
    
    let content = getFinalMessage(res.messages);
    
    console.log(`=== RAW PROMPT VALIDATOR RESPONSE ===`);
    console.log(content);
    console.log("=========================================");

    if (typeof content === "string") {
        content = content.replace(/```json/gi, "").replace(/```/g, "").trim();
        try {
            return JSON.parse(content);
        } catch (e) {
            console.error("Failed to parse validator JSON:", e);
            return { is_vague: false, questions: [] };
        }
    }
    return content;
}
