const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

const getGenAI = () => {
  if (!genAI && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

// POST /api/ai/generate-quiz
exports.generateQuiz = async (req, res) => {
  try {
    const { topic, numQuestions = 5, difficulty = 'medium' } = req.body;

    const ai = getGenAI();
    if (!ai) {
      // Return mock data if no API key
      return res.json({
        quiz: generateMockQuiz(topic, numQuestions),
        source: 'mock'
      });
    }

    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `Generate ${numQuestions} ${difficulty} difficulty multiple-choice quiz questions about "${topic}" for a classroom setting. Format as JSON array with objects containing: "question", "options" (array of 4), "correctAnswer" (index 0-3), "explanation". Only return valid JSON, no markdown.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let quiz;
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      quiz = JSON.parse(cleaned);
    } catch {
      quiz = generateMockQuiz(topic, numQuestions);
    }

    res.json({ quiz, source: 'gemini' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/ai/summarize
exports.summarize = async (req, res) => {
  try {
    const { content } = req.body;

    const ai = getGenAI();
    if (!ai) {
      return res.json({
        summary: `Summary of your notes:\n\n• Key concepts have been identified\n• Main topics: ${content.slice(0, 100)}...\n• Action items: Review and practice\n\nThis is a mock summary. Add your Gemini API key for AI-powered summaries.`,
        source: 'mock'
      });
    }

    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `Summarize the following lecture notes into clear, concise bullet points. Highlight key concepts, definitions, and important takeaways:\n\n${content}`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    res.json({ summary, source: 'gemini' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

function generateMockQuiz(topic, numQuestions) {
  const questions = [];
  for (let i = 0; i < numQuestions; i++) {
    questions.push({
      question: `Sample question ${i + 1} about ${topic}?`,
      options: [
        `Option A for Q${i + 1}`,
        `Option B for Q${i + 1}`,
        `Option C for Q${i + 1}`,
        `Option D for Q${i + 1}`
      ],
      correctAnswer: 0,
      explanation: `This is a sample explanation for question ${i + 1} about ${topic}.`
    });
  }
  return questions;
}
