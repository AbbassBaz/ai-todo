import testTasks from '../testResponseAi.json';

console.log(testTasks);

export interface AITaskSuggestion {
  title: string;
  description?: string;
  subtasks?: string[];
}

export class AIService {
  private static readonly API_URL = 'https://api.openai.com/v1/chat/completions';
  private static readonly API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

  private static async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries = 3,
    backoff = 1000
  ): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      const res = await fetch(url, options);

      if (res.status !== 429) return res;

      console.warn(`Rate limited (429). Retrying in ${backoff}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      backoff *= 2;
    }

    throw new Error('Rate limit exceeded. Please try again later.');
  }

  static async generateTasks(userInput: string): Promise<AITaskSuggestion[]> {
    // return testTasks;
    if (!this.API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `Based on the user's input: "${userInput}", create structured tasks with subtasks. Return a JSON array of tasks where each task has:
- title: string (main task title)
- description: string (optional description)
- subtasks: string[] (array of subtask titles)

Keep it practical and actionable. Maximum 5 tasks per request.

Example format:
[
  {
    "title": "Prepare presentation",
    "description": "Create slides for quarterly review",
    "subtasks": ["Research data", "Create outline", "Design slides", "Practice delivery"]
  }
]`;

    try {
      const response = await this.fetchWithRetry(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful task planning assistant. Always respond with valid JSON only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content returned from AI response');
      }

      try {
      const parsed = JSON.parse(content);
      return parsed as AITaskSuggestion[];
    } catch (e) {
      console.error('JSON parse error:', e);
      throw new Error('Invalid JSON format returned from AI');
    }
      // return testTasks;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Failed to generate tasks. Please wait and try again.');
    }
  }
}

export default AIService;
