const { Ollama } = require('ollama');

/**
 * Ollama Service
 * Provides local AI capabilities using Ollama.
 * Default model: llama3
 */

const ollama = new Ollama({ host: process.env.LOCAL_AI_URL || 'http://localhost:11434' });
const MODEL = 'llama3';

console.log(`🤖 Ollama Service Initialized: [Host: ${process.env.LOCAL_AI_URL || 'http://localhost:11434'}] [Model: ${MODEL}]`);

/**
 * Generate a chat response
 * @param {Array} messages - Array of message objects { role, content }
 * @returns {Promise<string>} - The AI generated response
 */
exports.generateChatResponse = async (messages) => {
    try {
        const response = await ollama.chat({
            model: MODEL,
            messages: messages,
            stream: false
        });
        return response.message.content;
    } catch (error) {
        console.error('Ollama generateWritingResponse Error:', error.message || error);
        if (error.stack) console.error(error.stack);
        throw error;
    }
};

/**
 * Generate a specialized response for Writing Studio tools
 * @param {string} type - The writing tool type
 * @param {string} text - The input text
 * @returns {Promise<string>} - The AI generated text
 */
exports.generateWritingResponse = async (type, text) => {
    try {
        let systemPrompt = 'You are an expert writing assistant.';
        let userPrompt = '';

        if (type === 'resume') {
            systemPrompt = `You are a professional AI Resume Builder. You generate resumes in an EXACT Markdown template. 
            NEVER include introductory or conversational text like "Here is your resume". 
            START IMMEDIATELY with the following structure:
            '# [FULL NAME]'
            '[Professional Title (e.g. Senior Software Engineer)]'
            '[Email] | [Phone] | [Location] | [LinkedIn URL] | [GitHub URL]'
            
            USE '***' for thick separators between sections.
            USE '## [SECTION NAME]' in ALL-CAPS for major headers (ABOUT ME, EDUCATION, EXPERIENCE, SKILLS).
            USE '### [Role/Degree] | [Company/University] | [Date Range]' for sub-headers.
            
            For the SKILLS section, provide a concise list of 9-12 skills.`;
        }

        switch (type) {
            case 'shorten':
                userPrompt = `Shorten the following text while maintaining its core meaning and tone:\n\n${text}`;
                break;
            case 'expand':
                userPrompt = `Expand the following text with more detail and depth, keeping the original tone:\n\n${text}`;
                break;
            case 'grammar':
                userPrompt = `Fix any grammar, spelling, or punctuation errors in the following text. Return ONLY the corrected text:\n\n${text}`;
                break;
            case 'translate':
                userPrompt = `Translate the following text into clear, natural-sounding English (if it's not already) or provide a refined English version if it is:\n\n${text}`;
                break;
            case 'email':
                userPrompt = `Write a professional email based on this content:\n${text}\n\nInclude a clear subject line and proper formatting.`;
                break;
            case 'meeting':
                userPrompt = `Summarize this meeting transcript and extract key decisions and action items:\n${text}`;
                break;
            case 'rewrite':
            case 'draft':
                userPrompt = `Rewrite the following content or goal into a high-quality, professional draft. Focus on clarity, tone, and impact:\n\n${text}`;
                break;
            case 'resume':
                userPrompt = `Generate a professional resume based on this data. Use the strict Markdown template provided in your system instructions.

            DATA:
            ${text}`;
                break;

            default:
                userPrompt = text;
        }

        const response = await ollama.chat({
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            stream: false
        });
        return response.message.content;
    } catch (error) {
        console.error('Ollama Writing Error:', error);
        throw error;
    }
};

/**
 * Analyze document text and return JSON summary/insights
 * @param {string} text - The text to analyze
 * @returns {Promise<Object>} - Analysis results
 */
/**
 * Normalizes AI output that should be an array of strings
 * Handles stringified arrays, objects with "point/insight" keys, or plain strings
 */
const normalizeArray = (input) => {
    if (!input) return [];
    let arr = [];
    if (Array.isArray(input)) {
        arr = input.map(item => {
            if (typeof item === 'string') return item;
            if (typeof item === 'object') return item.point || item.insight || item.text || item.action || JSON.stringify(item);
            return String(item);
        });
    } else if (typeof input === 'string') {
        // Handle stringified JSON array
        if (input.startsWith('[') && input.endsWith(']')) {
            try {
                arr = normalizeArray(JSON.parse(input));
            } catch (e) {
                arr = input.split('\n');
            }
        } else {
            // Handle newline separated list
            arr = input.split('\n');
        }
    } else {
        arr = [String(input)];
    }

    // Aggressive cleaning:
    // 1. Strip list markers (numbers, bullets, dashes)
    // 2. Remove zero-width spaces and weird characters
    // 3. Filter out items that are too short (< 10 chars)
    // 4. Filter out pure numbers (e.g., "1.7")
    return arr
        .map(s => s.replace(/^[-*•\d.]+\s*/, '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim())
        .filter(s => s && s.length >= 10 && !/^\d+(\.\d+)*$/.test(s));
};

exports.analyzeDocumentText = async (text) => {
    try {
        const response = await ollama.chat({
            model: MODEL,
            messages: [
                { 
                    role: 'system', 
                    content: `You are an expert document analyst. Extract exhaustive detail and provide:
1. Executive Summary: A profound, high-density summary (at least 500 words).
2. Key Points: A list of 10-12 detailed, technical key points.
3. Action Items: A list of 7-10 strategic, actionable next steps.

IMPORTANT: Return valid JSON with keys: "summary", "keyPoints", "actionItems".
"keyPoints" and "actionItems" MUST be non-empty arrays of descriptive strings.
Do not include conversational filler or section headers inside strings.`
                },
                { role: 'user', content: `Perform meticulous analysis and return ONLY JSON:\n\n${text.slice(0, 100000)}` }
            ],
            format: 'json',
            stream: false,
            options: {
                temperature: 0.1,
                num_ctx: 131072, // 128k context window
                timeout: 600000 // 10 minutes for massive doc analysis
            }
        });
        
        console.log('🤖 Ollama Analysis Response:', response.message.content);
        const parsed = JSON.parse(response.message.content);
        
        // Normalize results with more robust field picking
        const findField = (obj, keys) => {
            for (const key of keys) {
                if (obj[key]) return obj[key];
                // Case-insensitive check
                const foundKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
                if (foundKey) return obj[foundKey];
            }
            return null;
        };

        const result = {
            summary: findField(parsed, ['summary', 'executiveSummary', 'analysis', 'note', 'content', 'overview', 'summary_text', 'data.summary']) || 'No summary generated.',
            keyPoints: normalizeArray(findField(parsed, ['keyPoints', 'key_points', 'points', 'keyPointsList', 'majorPoints', 'key_point_list', 'data.keyPoints', 'points.list'])),
            actionItems: normalizeArray(findField(parsed, ['actionItems', 'action_items', 'insights', 'strategic_insights', 'nextSteps', 'recommendations', 'action_item_list', 'data.actionItems', 'insights.list']))
        };

        // Filter out items that are just headers
        const filterHeaders = (arr) => (arr || []).filter(item => 
            item && !/^(key points|strategic insights|insights|summary|action items|key_points|keyPoints|actionItems):?$/i.test(item.trim())
        );

        result.keyPoints = filterHeaders(result.keyPoints);
        result.actionItems = filterHeaders(result.actionItems);
        result.insights = result.actionItems; 

        console.log('🤖 Analysis Stats:', { 
            summaryLength: result.summary.length, 
            keyPointsCount: result.keyPoints.length, 
            actionItemsCount: result.actionItems.length 
        });

        return result;
    } catch (error) {
        console.error('Ollama Doc Analysis Error:', error);
        throw error;
    }
};

/**
 * Generate 3-5 tags for a knowledge item
 */
exports.generateKnowledgeTags = async (title, content) => {
    try {
        const response = await ollama.chat({
            model: MODEL,
            messages: [
                { 
                    role: 'system', 
                    content: 'You are a metadata assistant. Generate 3-5 short, relevant tags for the given knowledge entry. Return ONLY a comma-separated list of tags (e.g., ai, research, strategy).' 
                },
                { role: 'user', content: `Title: ${title}\nContent: ${content.slice(0, 1000)}` }
            ],
            stream: false
        });
        
        return response.message.content.split(',')
            .map(t => t.trim().toLowerCase())
            .filter(t => t.length > 0)
            .slice(0, 5);
    } catch (error) {
        console.error('Ollama Tag Generation Error:', error);
        return [];
    }
};

/**
 * Generate 7 brainstorm ideas
 */
exports.brainstormIdeas = async (topic) => {
    try {
        const response = await ollama.chat({
            model: MODEL,
            messages: [
                { role: 'system', content: 'You are an ideation specialist. Generate 7 innovative, actionable ideas for the given topic.' },
                { role: 'user', content: `Topic: ${topic}\nReturn exactly 7 ideas, each on a new line started with a number (e.g., 1. Idea).` }
            ],
            stream: false
        });
        return response.message.content;
    } catch (error) {
        console.error('Ollama Brainstorm Error:', error);
        throw error;
    }
};

/**
 * Decompose a task into subtasks
 */
exports.decomposeTask = async (taskTitle) => {
    try {
        const response = await ollama.chat({
            model: MODEL,
            messages: [
                { 
                    role: 'system', 
                    content: 'You are a project management assistant. Break down the task into 3-5 subtasks and return a JSON array of objects with "title" and "priority" ("low"|"medium"|"high"). Start your response with {.' 
                },
                { role: 'user', content: `Task: ${taskTitle}` }
            ],
            format: 'json',
            stream: false
        });
        
        const parsed = JSON.parse(response.message.content);
        return JSON.stringify(parsed.subtasks || parsed.tasks || Object.values(parsed)[0] || parsed);
    } catch (error) {
        console.error('Ollama Decompose Error:', error);
        throw error;
    }
};

/**
 * Generate a dynamic tip and motivation for a goal milestone
 * @param {string} title - Goal title
 * @param {string} category - Goal category
 * @param {number} progress - Current progress percentage
 * @returns {Promise<Object>} - { tip, motivation }
 */
exports.generateGoalMilestoneTip = async (title, category, progress) => {
    try {
        const response = await ollama.chat({
            model: MODEL,
            messages: [
                { 
                    role: 'system', 
                    content: `You are a high-performance executive coach. Generate a short, contextually relevant strategic tip and a punchy motivational quote for a user who just reached a progress milestone in their goal. 

STAGE AWARENESS:
- 0-30%: Focus on momentum, habit formation, and overcoming initial friction.
- 31-70%: Focus on consistency, optimizing workflows, and avoiding the "mid-project slump".
- 71-99%: Focus on refinement, intensity, and the "final push".
- 100%: Celebration of achievement and advice on sustainability or next steps.

Return JSON with "tip" and "motivation". Use extreme clarity and zero filler.` 
                },
                { 
                    role: 'user', 
                    content: `Goal: ${title}\nCategory: ${category}\nProgress: ${progress}%\nDetermine the specific stage and provide targeted strategy.` 
                }

            ],
            format: 'json',
            stream: false,
            options: {
                timeout: 30000 // 30s timeout for local AI
            }
        });
        return JSON.parse(response.message.content);
    } catch (error) {
        console.error('Ollama Milestone Tip Error:', error.message);
        // Fallback to generic tips if Ollama fails
        return {
            tip: `Keep focusing on the next ${100 - progress}% of your ${title} journey.`,
            motivation: "Consistency is the bridge between goals and accomplishment."
        };
    }
};

/**
 * Analyze task board state and provide advice
 */
exports.analyzeTasks = async (tasks) => {
    try {
        const response = await ollama.chat({
            model: MODEL,
            messages: [
                { 
                    role: 'system', 
                    content: 'You are a productivity expert. Analyze the task list and provide a 2-3 sentence strategic advice on how to optimize the workflow. Focus on priorities and potential bottlenecks.' 
                },
                { role: 'user', content: `Task List: ${tasks}` }
            ],
            stream: false
        });
        return response.message.content;
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            throw new Error('Ollama is not running. Please start Ollama to use AI features.');
        }
        console.error('Ollama Task Analysis Error:', error);
        throw error;
    }
};
