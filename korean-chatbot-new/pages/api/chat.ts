import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
  reply: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { message } = req.body;

  // Mock response - replace with actual API call if needed
  const reply = message.includes('안녕') 
    ? '안녕하세요! 어떻게 도와드릴까요?'
    : '한국어 학습을 도와드릴게요. 더 구체적으로 질문해주세요.';

  res.status(200).json({ reply });
}