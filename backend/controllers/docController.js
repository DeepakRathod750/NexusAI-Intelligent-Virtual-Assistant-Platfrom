const fs = require('fs');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { analyzeDocumentText } = require('../services/ollama.service');
const { saveHistory } = require('../services/db.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const Session = require('../models/Session');

const analyzeDoc = async (req, res) => {
    let filePath = '';
    try {
        const userId = req.user.id;
        const file = req.file;

        if (!file) {
            return errorResponse(res, 400, 'No file uploaded');
        }

        filePath = file.path;
        console.log(`📄 Processing file: ${file.originalname} (${file.mimetype}) - Size: ${file.size}`);
        console.log(`📁 File path: ${filePath}`);

        let extractedText = '';

        try {
            if (file.mimetype === 'application/pdf') {
                const dataBuffer = fs.readFileSync(filePath);
                console.log('📄 Processing PDF with type-safe parser...');
                const { PDFParse } = require('pdf-parse');
                const parser = new PDFParse(new Uint8Array(dataBuffer));
                const result = await parser.getText();
                extractedText = result.text || '';
                console.log('✅ PDF extraction successful, text length:', extractedText.length);
            } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const data = await mammoth.extractRawText({ path: filePath });
                extractedText = data.value;
            } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.originalname.endsWith('.xlsx')) {
                const XLSX = require('xlsx');
                const workbook = XLSX.readFile(filePath);
                let text = '';
                workbook.SheetNames.forEach(sheetName => {
                    const sheet = workbook.Sheets[sheetName];
                    text += `--- Sheet: ${sheetName} ---\n`;
                    text += XLSX.utils.sheet_to_txt(sheet) + '\n';
                });
                extractedText = text;
            } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || file.originalname.endsWith('.pptx')) {
                const AdmZip = require('adm-zip');
                const zip = new AdmZip(filePath);
                const zipEntries = zip.getEntries();
                let text = '';
                
                // Sort entries to process slides in order
                const slideEntries = zipEntries
                    .filter(entry => entry.entryName.startsWith('ppt/slides/slide') && entry.entryName.endsWith('.xml'))
                    .sort((a, b) => a.entryName.localeCompare(b.entryName));

                for (const entry of slideEntries) {
                    const slideXml = entry.getData().toString('utf8');
                    // Simple regex to extract text from PowerPoint XML tags <a:t>
                    const matches = slideXml.match(/<a:t>([^<]*)<\/a:t>/g);
                    if (matches) {
                        text += `--- Slide ---\n`;
                        text += matches.map(m => m.replace(/<\/?[^>]+(>|$)/g, "")).join(' ') + '\n';
                    }
                }
                extractedText = text;
            } else if (file.mimetype.startsWith('image/')) {
                console.log('🖼️ Processing image with OCR (Tesseract)...');
                const Tesseract = require('tesseract.js');
                const { data: { text } } = await Tesseract.recognize(filePath, 'eng', {
                    logger: m => console.log(`  [OCR] ${m.status}: ${Math.round(m.progress * 100)}%`)
                });
                extractedText = text;
                console.log('✅ OCR successful, text length:', extractedText.length);
            } else {
                // Try reading as plain text for unknown types
                extractedText = fs.readFileSync(filePath, 'utf8');
            }
        } catch (parseError) {
            console.error('File Parsing Error:', parseError);
            return errorResponse(res, 400, `Failed to parse ${file.mimetype || 'file'}. Ensure the file is not corrupted.`);
        }

        // Clean up temp file IMMEDIATELY after extraction
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            filePath = ''; 
        }

        if (!extractedText || extractedText.trim().length < 10) {
            return errorResponse(res, 400, 'Could not extract enough text from the document. Please ensure it has readable content.');
        }

        console.log(`🧠 Sending text for AI analysis (${extractedText.length} chars)...`);

        // Analyze using Ollama
        let analysis;
        try {
            analysis = await analyzeDocumentText(extractedText);
        } catch (aiError) {
            console.error('AI Analysis Error:', aiError);
            throw new Error(`AI processing failed: ${aiError.message || 'The AI model might be slow or unavailable. Please try again.'}`);
        }

        // Save to Session
        const session = new Session({
            user: userId,
            title: file.originalname,
            type: 'doc',
            content: {
                text: extractedText.slice(0, 10000),
                summary: analysis.summary,
                keyPoints: analysis.keyPoints,
                insights: analysis.actionItems 
            }
        });
        await session.save();

        // Save to DocumentAnalysis (For Dashboard Stats)
        const DocumentAnalysis = require('../models/DocumentAnalysis');
        await DocumentAnalysis.create({
            user_id: userId,
            filename: file.originalname,
            original_text: extractedText.slice(0, 5000),
            summary: analysis.summary,
            key_points: analysis.keyPoints,
            action_items: analysis.actionItems,
            file_type: file.mimetype,
            file_size: file.size
        });

        // Save to Legacy History
        await saveHistory(userId, {
            type: 'doc',
            title: file.originalname,
            content: extractedText.slice(0, 1000),
            response: analysis.summary,
            metadata: {
                keyPoints: analysis.keyPoints,
                insights: analysis.actionItems
            }
        });


        successResponse(res, 'Document analyzed', { ...analysis, sessionId: session._id });
    } catch (error) {
        console.error('Doc Analysis Error:', error);
        
        // Final cleanup attempt
        if (filePath && fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (e) {}
        }

        const status = error.message && error.message.includes('Ollama') ? 503 : 500;
        errorResponse(res, status, 'Document analysis failed', error.message);
    }
};

module.exports = {
    analyzeDoc
};
