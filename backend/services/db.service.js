const ChatMessage = require('../models/ChatMessage');
const Setting = require('../models/Setting');
const KnowledgeBase = require('../models/KnowledgeBase');
const Goal = require('../models/Goal');
const BrainstormIdea = require('../models/BrainstormIdea');
const DocumentAnalysis = require('../models/DocumentAnalysis');
const SystemLog = require('../models/SystemLog');
const LiveInteraction = require('../models/LiveInteraction');
const History = require('../models/History');

// ─── Unified History ───────────────────────────────────────────

const saveHistory = async (userId, historyData) => {
    return await History.create({ user: userId, ...historyData });
};

const getHistory = async (userId, limit = 20) => {
    return await History.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(limit);
};

// ─── Chat Messages ──────────────────────────────────────────────

const saveChatMessage = async (userId, role, content) => {
    const message = await ChatMessage.create({ user_id: userId, role, content });
    return message;
};

const getChatHistory = async (userId, limit = 50) => {
    const messages = await ChatMessage.find({ user_id: userId })
        .sort({ createdAt: 1 })
        .limit(limit);
    return messages;
};

const clearChatHistory = async (userId) => {
    await ChatMessage.deleteMany({ user_id: userId });
};

// ─── Settings ──────────────────────────────────────────────────

const getUserSettings = async (userId) => {
    const settings = await Setting.findOne({ user_id: userId });
    return settings; // Will return null if not found, consistent with old behavior
};

const updateUserSettings = async (userId, settingsData) => {
    const settings = await Setting.findOneAndUpdate(
        { user_id: userId },
        { ...settingsData },
        { new: true, upsert: true } // Upsert behaves like Supabase's upsert
    );
    return settings;
};


// ─── Knowledge Base ────────────────────────────────────────────

const getKnowledgeItems = async (userId) => {
    const items = await KnowledgeBase.find({ user: userId })
        .sort({ createdAt: -1 });
    return items;
};

const createKnowledgeItem = async (userId, itemData) => {
    const item = await KnowledgeBase.create({ user: userId, ...itemData });
    return item;
};

const deleteKnowledgeItem = async (itemId, userId) => {
    const result = await KnowledgeBase.findOneAndDelete({ _id: itemId, user: userId });
    if (!result) throw new Error('Knowledge item not found or unauthorized');
};

// ─── Brainstorm Ideas ──────────────────────────────────────────

const saveBrainstormIdea = async (userId, topic, ideas) => {
    return await BrainstormIdea.create({ user_id: userId, topic, ideas });
};

const getBrainstormHistory = async (userId) => {
    return await BrainstormIdea.find({ user_id: userId }).sort({ createdAt: -1 });
};

// ─── Document Analysis ──────────────────────────────────────────

const saveDocAnalysis = async (userId, analysisData) => {
    return await DocumentAnalysis.create({ user_id: userId, ...analysisData });
};

const getDocAnalyses = async (userId) => {
    return await DocumentAnalysis.find({ user_id: userId }).sort({ createdAt: -1 });
};

// ─── Goals ─────────────────────────────────────────────────────

const getGoals = async (userId) => {
    return await Goal.find({ user_id: userId }).sort({ createdAt: -1 });
};

const createGoal = async (userId, goalData) => {
    return await Goal.create({ user_id: userId, ...goalData });
};

const updateGoal = async (goalId, userId, goalData) => {
    return await Goal.findOneAndUpdate(
        { _id: goalId, user_id: userId },
        goalData,
        { new: true }
    );
};

const deleteGoal = async (goalId, userId) => {
    return await Goal.findOneAndDelete({ _id: goalId, user_id: userId });
};

// ─── System Logs ───────────────────────────────────────────────

const logEvent = async (logData) => {
    return await SystemLog.create(logData);
};

const getRecentLogs = async (limit = 10) => {
    return await SystemLog.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('user_id', 'email full_name');
};

// ─── Dashboard Stats ───────────────────────────────────────────

const getDashboardStats = async (userId) => {
    const Session = require('../models/Session');
    
    const [chats, docs, goals, emails, meetings, resumes] = await Promise.all([
        ChatMessage.countDocuments({ user_id: userId }),
        DocumentAnalysis.countDocuments({ user_id: userId }),
        Goal.countDocuments({ user_id: userId }),
        Session.countDocuments({ user: userId, type: 'email' }),
        Session.countDocuments({ user: userId, type: 'meeting' }),
        Session.countDocuments({ user: userId, type: 'resume' })
    ]);

    return {
        chats,
        docs,
        goals,
        emails,
        meetings,
        resumes
    };
};


// ─── Live Interactions ─────────────────────────────────────────

const saveLiveInteraction = async (userId, transcript, duration) => {
    return await LiveInteraction.create({
        user_id: userId,
        transcript,
        duration,
        title: `Voice Interaction on ${new Date().toLocaleDateString()}`
    });
};

const getLiveHistory = async (userId) => {
    return await LiveInteraction.find({ user_id: userId }).sort({ createdAt: -1 });
};

module.exports = {
    saveChatMessage,
    getChatHistory,
    clearChatHistory,
    getUserSettings,
    updateUserSettings,
    updateUserSettings,
    getKnowledgeItems,
    createKnowledgeItem,
    deleteKnowledgeItem,
    saveBrainstormIdea,
    getBrainstormHistory,
    saveDocAnalysis,
    getDocAnalyses,
    getGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    logEvent,
    getRecentLogs,
    getDashboardStats,
    saveLiveInteraction,
    getLiveHistory,
    saveLiveInteraction,
    getLiveHistory,
    saveHistory,
    getHistory
};
