import { Response } from 'express';
import aiService from '../services/ai.service';
import { AuthRequest } from '../types';

export const chat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message, language = 'en', history = [] } = req.body;

    if (!message) {
      res.status(400).json({ success: false, message: 'Message required' });
      return;
    }

    const reply = await aiService.chat(message, language, history);
    res.json({ success: true, data: { reply } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const search = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { query, language = 'en' } = req.body;

    if (!query) {
      res.status(400).json({ success: false, message: 'Search query required' });
      return;
    }

    const result = await aiService.conversationalSearch(query, language);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
