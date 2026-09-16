const { analyzeDocumentText } = require('./ollama.service');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

async function test() {
    console.log('Testing Doc Analysis...');
    try {
        const text = "This is a test document about artificial intelligence. AI is a branch of computer science that deals with building smart machines. It has many applications in healthcare, finance, and education. Key points include neural networks, machine learning, and deep learning. Strategic insights suggest that AI will transform the workforce.";
        const result = await analyzeDocumentText(text);
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Test Failed:', error);
    }
}

test();
