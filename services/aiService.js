

const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  // 🔹 Input sanitize
  sanitizeTopicInput(input) {
    if (!input || typeof input !== "string") return "general knowledge";
    return input.replace(/\s+/g, " ").trim().slice(0, 200);
  }

  // 🔥 MAIN FUNCTION (Quiz Generation)
  async generateQuizQuestions(topic = "general knowledge", numQuestions = 5) {
    try {
      const cleanTopic = this.sanitizeTopicInput(topic);

      const model = this.genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });

      const prompt = `
Generate ${numQuestions} multiple choice questions on "${cleanTopic}".

Return ONLY JSON array:
[
  {
    "question": "Question text",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0,
    "explanation": "Explanation"
  }
]
`;

      const result = await model.generateContent(prompt);
      const text = await result.response.text();

      // Extract JSON safely
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("Invalid AI response");

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        questions: parsed.map((q, i) => ({
          question: q.question,
          type: "multiple-choice",
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || "",
          topic: cleanTopic,
          difficulty: "medium",
          points: 2,
          timeLimit: 45,
          isAIGenerated: true,
          order: i,
        })),
        suggestedCategory: "general",
      };
    } catch (error) {
      console.error("Gemini Error:", error.message);

      // 🔥 fallback (important)
      return {
        questions: [
          {
            question: "What is 2 + 2?",
            type: "multiple-choice",
            options: ["1", "2", "3", "4"],
            correctAnswer: 3,
            explanation: "2 + 2 = 4",
            topic: "math",
            difficulty: "easy",
            points: 1,
            timeLimit: 30,
            isAIGenerated: true,
            order: 0,
          },
          {
            question: "Capital of India?",
            type: "multiple-choice",
            options: ["Delhi", "Mumbai", "Kolkata", "Chennai"],
            correctAnswer: 0,
            explanation: "Delhi is the capital of India",
            topic: "general",
            difficulty: "easy",
            points: 1,
            timeLimit: 30,
            isAIGenerated: true,
            order: 1,
          },
        ],
        suggestedCategory: "general",
      };
    }
  }

  // 🔹 Optional: topic suggestions
  async generateTopicSuggestionsFromContext(context) {
    try {
      const model = this.genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });

      const prompt = `
Suggest 5 quiz topics based on this context:
${context}

Return JSON:
{
  "topics": ["topic1", "topic2", "topic3"]
}
`;

      const result = await model.generateContent(prompt);
      const text = await result.response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid response");

      const parsed = JSON.parse(jsonMatch[0]);

      return parsed.topics || ["General Quiz", "Basic Knowledge"];
    } catch (error) {
      return ["General Quiz", "Mixed Questions"];
    }
  }

  // 🔹 Optional: enhance question
  async enhanceQuestion(questionText) {
    return questionText; // simple fallback
  }

  // 🔹 Optional: analysis
  async generateQuizAnalysis() {
    return {
      overallAssessment: "Good attempt",
      strengths: ["Basic understanding"],
      weaknesses: ["Needs practice"],
      improvements: ["Revise topics"],
      studyRecommendations: ["Practice daily"],
      timeManagement: "Average",
      encouragement: "Keep going!",
    };
  }
}

module.exports = new AIService();
