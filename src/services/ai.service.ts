import Product from '../models/Product';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AISearchResult {
  message: string;
  products: any[];
  suggestions: string[];
}

class AIService {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
    this.model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  }

  private async callGroq(messages: ChatMessage[], maxTokens: number = 500): Promise<string> {
    if (!this.apiKey || this.apiKey === 'your_groq_api_key_here') {
      return this.fallbackResponse(messages);
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json() as any;
      return data.choices?.[0]?.message?.content || this.fallbackResponse(messages);
    } catch (error) {
      console.error('Groq API error:', error);
      return this.fallbackResponse(messages);
    }
  }

  private fallbackResponse(messages: ChatMessage[]): string {
    const lastUser = messages.filter((m) => m.role === 'user').pop();
    const text = (lastUser?.content || '').toLowerCase();

    if (text.includes('hello') || text.includes('hi ') || text.includes('muraho')) {
      return "Hello! Welcome to Simba Supermarket. I can help you find products, check branches, or answer questions. What are you looking for today?";
    }
    if (text.includes('branch') || text.includes('location')) {
      return "We have branches in Remera, Kimironko, Kacyiru, Nyamirambo, Gikondo, Kanombe, Kinyinya, Kibagabaga, Nyanza, and Gisenyi. All support pick-up orders!";
    }
    if (text.includes('payment') || text.includes('pay') || text.includes('momo')) {
      return "We accept Mobile Money (MoMo) payments. A small 500 RWF deposit confirms your pick-up order — the rest is paid at the branch.";
    }
    if (text.includes('delivery') || text.includes('pickup') || text.includes('pick up')) {
      return "Simba offers fast pick-up from your chosen branch. Just add items to cart, select a branch and time, pay the deposit, and we'll prepare your order!";
    }
    return "I can help you find products, check branches, or track orders. Try asking: 'Do you have fresh milk?' or 'What branches are near me?'";
  }

  async chat(userMessage: string, language: string = 'en', history: ChatMessage[] = []): Promise<string> {
    const systemPrompts: Record<string, string> = {
      en: `You are Simba Assistant, a helpful AI for Simba Supermarket (Rwanda's largest supermarket chain).
- Be warm, concise, and helpful
- Help customers find products, locate branches, understand pick-up process
- Simba has branches in Remera, Kimironko, Kacyiru, Nyamirambo, Gikondo, Kanombe, Kinyinya, Kibagabaga, Nyanza, and Gisenyi
- Pick-up requires 500 RWF MoMo deposit
- Keep responses under 3 sentences unless asked for details`,
      rw: `Uri Simba Assistant, umufasha wa Simba Supermarket (supermarket nini muri Rwanda).
- Ba umunyakuri, witondere, kandi ufashe
- Fasha abakiriya kubona ibicuruzwa, kumenya amashami, kumva uburyo bwo gufata
- Simba ifite amashami muri Remera, Kimironko, Kacyiru, Nyamirambo, Gikondo, Kanombe, Kinyinya, Kibagabaga, Nyanza, na Gisenyi
- Gufata bisaba amafaranga 500 RWF kuri MoMo
- Subiza gake cyane, udatanga ibisobanuro birebire`,
      fr: `Vous êtes Simba Assistant, l'IA de Simba Supermarket (le plus grand supermarché du Rwanda).
- Soyez chaleureux, concis et utile
- Aidez les clients à trouver des produits et des succursales
- Simba a des succursales à Remera, Kimironko, Kacyiru, Nyamirambo, Gikondo, Kanombe, Kinyinya, Kibagabaga, Nyanza et Gisenyi
- La collecte nécessite un dépôt MoMo de 500 RWF
- Gardez les réponses courtes`,
    };

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompts[language] || systemPrompts.en },
      ...history.slice(-6),
      { role: 'user', content: userMessage },
    ];

    return this.callGroq(messages, 400);
  }

  async conversationalSearch(query: string, language: string = 'en'): Promise<AISearchResult> {
    let products: any[] = [];
    try {
      // First do a keyword search
      const regex = new RegExp(query.split(' ').join('|'), 'i');
      products = await Product.find({
        $and: [
          { isActive: true },
          {
            $or: [
              { name: regex },
              { nameRw: regex },
              { nameFr: regex },
              { tags: regex },
              { description: regex },
            ],
          },
        ],
      }).limit(12).lean();
    } catch (error) {
      console.error('Product search error:', error);
    }

    // Generate conversational response
    const productContext = products.length > 0
      ? products.slice(0, 5).map((p) => `- ${p.name} (${p.price} RWF)`).join('\n')
      : 'No products found in catalog for this query.';

    const systemPrompt = `You are a friendly shopping assistant for Simba Supermarket. 
A customer searched for: "${query}"
Available matching products:
${productContext}

Respond in ${language === 'rw' ? 'Kinyarwanda' : language === 'fr' ? 'French' : 'English'}.
Keep it to 1-2 sentences. Be helpful and conversational.`;

    const message = await this.callGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query },
    ], 200);

    const suggestions = this.generateSuggestions(query, products);

    return { message, products, suggestions };
  }

  private generateSuggestions(_query: string, products: any[]): string[] {
    if (products.length === 0) {
      return ['Fresh milk', 'Bread', 'Rice', 'Cooking oil'];
    }
    const categories = new Set(products.map((p) => p.categoryId?.toString()));
    return Array.from(categories).slice(0, 4).map(() => 'Related items');
  }
}

export const aiService = new AIService();
export default aiService;
