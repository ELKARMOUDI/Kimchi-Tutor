// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
  reply: string;
}

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const GROQ_MODELS = {
  FAST: 'llama3-8b-8192',
  BALANCED: 'llama3-70b-8192',
  SMART: 'mixtral-8x7b-32768'
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ reply: 'Method not allowed' });
  }

  const { message } = req.body;

  try {
    const groqMessages: GroqMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful Korean language tutor. Respond in Korean unless explicitly asked to use English. Keep responses natural and conversational.'
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

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API Error:', errorData);
      throw new Error(errorData.error?.message || 'Groq API error');
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || '죄송합니다, 답변을 생성할 수 없습니다.';

    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      reply: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' 
    });
  }
}