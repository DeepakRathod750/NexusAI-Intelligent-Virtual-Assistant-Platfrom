const ollamaService = require('../services/ollama.service');
const dbService = require('../services/db.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const brainstorm = async (req, res) => {
    try {
        const { topic } = req.body;
        const userId = req.user.id;

        if (!topic || typeof topic !== 'string' || !topic.trim()) {
            return errorResponse(res, 400, 'Topic is required');
        }

        const rawIdeas = await ollamaService.brainstormIdeas(topic.trim());
        
        // Parse ideas into an array
        const ideas = rawIdeas.split('\n')
            .map(line => line.replace(/^\d+\.\s*/, '').trim())
            .filter(line => line.length > 0);

        // Save to BrainstormIdea collection
        const saved = await dbService.saveBrainstormIdea(userId, topic.trim(), ideas);

        // Save to Session collection (For Recent Sessions list)
        const Session = require('../models/Session');
        await Session.create({
            user: userId,
            title: topic.trim().slice(0, 40) + (topic.trim().length > 40 ? "..." : ""),
            type: 'brainstorm',
            content: { topic: topic.trim(), ideas }
        });

        // Save to Unified History
        await dbService.saveHistory(userId, {
            type: 'brainstorm',
            title: topic.trim(),
            content: topic.trim(),
            response: ideas.join('\n')
        });


        successResponse(res, 'Ideas generated and saved', {
            id: saved._id,
            topic: saved.topic,
            ideas: saved.ideas
        });
    } catch (err) {
        errorResponse(res, 500, 'Brainstorming failed', err.message);
    }
};

const analyze = async (req, res) => {
    try {
        const { text, filename } = req.body;
        const userId = req.user.id;

        if (!text || typeof text !== 'string' || !text.trim()) {
            return errorResponse(res, 400, 'Document text is required');
        }

        const parsed = await ollamaService.analyzeDocumentText(text.trim());
        
        // Save to DocAnalysis collection
        const saved = await dbService.saveDocAnalysis(userId, {
            filename: filename || 'Untitled Document',
            original_text: text.slice(0, 500), 
            summary: parsed.summary,
            key_points: parsed.keyPoints,
            action_items: parsed.insights // Always use insights from normalized service
        });

        // Save to Session collection (For Recent Sessions list)
        const Session = require('../models/Session');
        await Session.create({
            user: userId,
            title: filename || 'Text Analysis',
            type: 'doc',
            content: {
                text: text.slice(0, 10000),
                summary: parsed.summary,
                keyPoints: parsed.keyPoints,
                insights: parsed.insights
            }
        });


        // Save to Unified History
        await dbService.saveHistory(userId, {
            type: 'doc',
            title: filename || 'Untitled Document',
            content: text.slice(0, 500),
            response: parsed.summary
        });

        successResponse(res, 'Document analyzed and results saved', {
            id: saved._id,
            ...parsed,
            sessionId: saved._id // For consistency with frontend expectation
        });
    } catch (err) {
        errorResponse(res, 500, 'Analysis failed', err.message);
    }
};

const saveLiveInteraction = async (req, res) => {
    try {
        const { transcript, duration } = req.body;
        const userId = req.user.id;

        if (!transcript || !Array.isArray(transcript)) {
            return errorResponse(res, 400, 'Transcript array is required');
        }

        const saved = await dbService.saveLiveInteraction(userId, transcript, duration);

        // Save to Unified History
        await dbService.saveHistory(userId, {
            type: 'live',
            title: saved.title,
            content: transcript.map(t => t.text).join(' '),
            response: 'Live audio interaction captured'
        });

        successResponse(res, 'Live interaction saved', {
            id: saved._id,
            title: saved.title
        });
    } catch (err) {
        errorResponse(res, 500, 'Failed to save interaction', err.message);
    }
};

const decompose = async (req, res) => {
    try {
        const { taskTitle, tasks, action } = req.body;
        const userId = req.user.id;

        if (action === 'analyze' && tasks) {
            const advice = await ollamaService.analyzeTasks(tasks);
            return successResponse(res, 'Board analysis complete', { advice });
        }

        if (!taskTitle) {
            return errorResponse(res, 400, 'taskTitle is required for decomposition');
        }

        const rawSubtasks = await ollamaService.decomposeTask(taskTitle.trim());
        let subtasks;
        try {
            subtasks = JSON.parse(rawSubtasks);
        } catch (e) {
            return errorResponse(res, 500, 'AI returned malformed subtasks JSON', rawSubtasks);
        }

        successResponse(res, 'Task decomposed', subtasks);
    } catch (err) {
        errorResponse(res, 500, 'AI processing failed', err.message);
    }
};

module.exports = {
    brainstorm,
    analyze,
    decompose,
    saveLiveInteraction
};
