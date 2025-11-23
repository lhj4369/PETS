// backend/routes/chat.js
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { authMiddleware } from '../middleware/authMiddleware.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Google Gemini API 초기화
const ai = process.env.GEMINI_API_KEY 
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

// 채팅 메시지 전송 API
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: '메시지를 입력해주세요.' });
    }

    if (!ai) {
      return res.status(500).json({ error: 'Gemini API 키가 설정되지 않았습니다.' });
    }

    // 시스템 프롬프트 (운동 조언 전문가로 설정)
    const systemPrompt = `너는 친근하고 전문적인 운동 조언 AI 어시스턴트 "헬시"야. 
사용자에게 운동, 건강, 피트니스에 대한 실용적이고 동기부여가 되는 조언을 제공해줘.
답변은 간결하고 이해하기 쉽게 한국어로 작성해줘.
너무 길지 않고 친근한 톤으로 대답해줘.`;

    // 대화 히스토리 구성 (최근 10개만 사용)
    const contents = [];
    
    // 히스토리가 있으면 히스토리를 contents에 추가
    if (conversationHistory && conversationHistory.length > 0) {
      const actualHistory = conversationHistory.filter((msg) => msg && msg.text);
      
      // 최근 10개만 사용
      const recentHistory = actualHistory.slice(-10);
      
      for (const msg of recentHistory) {
        if (msg && msg.text) {
          contents.push({
            role: msg.isUser ? 'user' : 'model',
            parts: [{ text: msg.text }],
          });
        }
      }
    }
    
    // 현재 사용자 메시지 추가
    let messageToSend = message;
    if (contents.length === 0) {
      // 첫 대화인 경우 시스템 프롬프트를 메시지에 포함
      messageToSend = `${systemPrompt}\n\n사용자: ${message}`;
    }
    
    contents.push({
      role: 'user',
      parts: [{ text: messageToSend }],
    });

    // Gemini 2.5 Flash 모델로 응답 생성
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
    });

    const text = response.text;
    
    res.json({ 
      message: text,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('채팅 API 에러:', err.message);
    
    // Gemini API 에러 처리
    const errorMessage = err?.message || '채팅 응답 생성 중 오류가 발생했습니다.';
    
    if (errorMessage.includes('API_KEY') || errorMessage.includes('API key') || errorMessage.includes('API_KEY_INVALID')) {
      return res.status(401).json({ error: 'Gemini API 키가 유효하지 않습니다.' });
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? err?.stack : undefined
    });
  }
});

export default router;

