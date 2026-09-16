const OpenAI = require('openai');
const dotenv = require('dotenv');

dotenv.config();

// Initialize OpenAI lazily or with a check to prevent crash on Render if env var is missing during build
const openaiApiKey = process.env.OPENAI_API_KEY;
let openai;

if (openaiApiKey && openaiApiKey !== 'your_key_here') {
    try {
        openai = new OpenAI({
            apiKey: openaiApiKey,
        });
        console.log('✅ OpenAI service initialized');
    } catch (err) {
        console.error('❌ Failed to initialize OpenAI:', err.message);
    }
} else {
    console.warn('⚠️ OPENAI_API_KEY is missing or using placeholder. AI features will be limited.');
}

const DEFAULT_MODEL = 'gpt-4o-mini';

/**
 * Generate a response for the Neural Chat.
 */
const generateChatResponse = async (message, history = []) => {
    try {
        const messages = [
            { role: 'system', content: 'You are NexusAI, a high-performance enterprise AI assistant. Be concise, accurate, and professional.' },
            ...history.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            })),
            { role: 'user', content: message }
        ];

        if (!openai) {
            console.error('❌ OpenAI not initialized');
            return 'AI service is currently unavailable. Please check configuration.';
        }
        const response = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: messages,
            temperature: 0.7,
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI Chat Error:', error);
        throw new Error(`OpenAI Chat failed: ${error.message}`);
    }
};

/**
 * Generate a response for Writing Studio tools.
 */
const generateWritingResponse = async (type, text) => {
    try {
        let systemPrompt = 'You are an expert writing assistant.';
        let userPrompt = '';

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
            case 'resume':
                userPrompt = `Create professional resume bullet points and a matching cover letter introduction for:\n${text}`;
                break;
            default:
                userPrompt = text;
        }

        if (!openai) {
            console.error('❌ OpenAI not initialized');
            throw new Error('AI service is currently unavailable');
        }
        const response = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.5,
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI Writing Error:', error);
        throw new Error(`OpenAI Writing failed: ${error.message}`);
    }
};

/**
 * Analyze document text and return summary/insights.
 */
const analyzeDocumentText = async (text) => {
    try {
        if (!openai) {
            console.error('❌ OpenAI not initialized');
            throw new Error('AI service is currently unavailable');
        }
        const response = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                { 
                    role: 'system', 
                    content: 'You are a document analysis specialist. Analyze the provided text and return a JSON object with "summary", "insights" (array), and "keyPoints" (array).' 
                },
                { role: 'user', content: `Analyze this content:\n\n${text.slice(0, 15000)}` }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
        });

        return JSON.parse(response.choices[0].message.content);
    } catch (error) {
        console.error('OpenAI Doc Analysis Error:', error);
        throw new Error(`OpenAI Doc Analysis failed: ${error.message}`);
    }
};

/**
 * Generate 7 brainstorm ideas.
 */
const brainstormIdeas = async (topic) => {
    try {
        if (!openai) {
            console.error('❌ OpenAI not initialized');
            throw new Error('AI service is currently unavailable');
        }
        const response = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                { role: 'system', content: 'You are an ideation specialist. Generate 7 innovative, actionable ideas for the given topic.' },
                { role: 'user', content: `Topic: ${topic}\nReturn exactly 7 ideas, each on a new line started with a number (e.g., 1. Idea).` }
            ],
            temperature: 0.8,
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI Brainstorm Error:', error);
        throw new Error(`OpenAI Brainstorm failed: ${error.message}`);
    }
};

/**
 * Decompose a task into subtasks.
 */
const decomposeTask = async (taskTitle) => {
    try {
        if (!openai) {
            console.error('❌ OpenAI not initialized');
            throw new Error('AI service is currently unavailable');
        }
        const response = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                { 
                    role: 'system', 
                    content: 'You are a project management assistant. Break down the task into 3-5 subtasks and return a JSON array of objects with "title" and "priority" ("low"|"medium"|"high").' 
                },
                { role: 'user', content: `Task: ${taskTitle}` }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.4,
        });

        const parsed = JSON.parse(response.choices[0].message.content);
        // Ensure we return the array part if it's wrapped
        return JSON.stringify(parsed.subtasks || parsed.tasks || Object.values(parsed)[0] || parsed);
    } catch (error) {
        console.error('OpenAI Decompose Error:', error);
        throw new Error(`OpenAI Decompose failed: ${error.message}`);
    }
};

module.exports = {
    generateChatResponse,
    generateWritingResponse,
    analyzeDocumentText,
    brainstormIdeas,
    decomposeTask
};
