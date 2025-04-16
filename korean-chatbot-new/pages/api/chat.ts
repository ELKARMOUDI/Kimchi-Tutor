import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
  reply: string;
}

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const GROQ_MODELS = {
  BALANCED: 'llama3-70b-8192'
};

// Helper to detect if text contains Korean
const containsKorean = (text: string): boolean => {
  const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/;
  return koreanRegex.test(text);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ reply: 'Method not allowed' });
  }

  const { message } = req.body;
  const isKorean = containsKorean(message);

  try {
    const systemPrompt = isKorean
      ? `You are a Korean tutor. Respond naturally in Korean (Hangul). Keep responses warm and helpful.`
      : `You are a Korean tutor. When users speak English:
         1. First answer in English
         2. Then provide the Korean translation in parentheses
         3. Example: "Hello (안녕하세요)"`;

    const groqMessages: GroqMessage[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: message
      }
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODELS.BALANCED,
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: false
      }),
    });

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || 
      (isKorean ? '응답을 생성할 수 없습니다' : 'Could not generate response');
    
    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      reply: isKorean 
        ? '오류가 발생했습니다. 다시 시도해주세요.' 
        : 'An error occurred. Please try again.'
    });
  }
}