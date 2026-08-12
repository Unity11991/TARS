import { AIProvider, StreamOptions } from './provider.js';
import { buildSystemPrompt } from './promptBuilder.js';
import { getToolDefinitions, TOOLS } from '../tools/index.js';
import { ToolResult } from '../../../shared/types/index.js';
import Groq from 'groq-sdk';

export class GroqProvider implements AIProvider {
  name = 'GroqProvider';

  private getGroqClient(): Groq | null {
    const apiKey = (process.env.GROQ_API_KEY || '').trim();
    if (!apiKey) return null;
    return new Groq({ apiKey });
  }

  private getModel(): string {
    return process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  }

  async generateStream(options: StreamOptions): Promise<string> {
    const { personality, memories, messages, onEvent } = options;
    const systemPrompt = buildSystemPrompt(personality, memories);

    const groqClient = this.getGroqClient();
    const model = this.getModel();

    // If no GROQ_API_KEY configured, use fallback intelligent simulation
    if (!groqClient) {
      return this.handleFallbackMode(systemPrompt, messages, options);
    }

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    ];

    try {
      const toolDefs = getToolDefinitions().map((t) => ({
        type: 'function' as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));

      // Initial Call to Groq with tool definitions
      const response = await groqClient.chat.completions.create({
        model: model,
        messages: formattedMessages as any,
        tools: toolDefs as any,
        tool_choice: 'auto',
        temperature: 0.6,
        max_tokens: 500,
      });

      const choice = response.choices[0];
      const toolCalls = choice?.message?.tool_calls;

      let conversationMessages = [...formattedMessages];

      // Handle tool call if requested by LLM
      if (toolCalls && toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          const fnName = toolCall.function.name;
          const fnArgsStr = toolCall.function.arguments || '{}';
          let parsedArgs = {};
          try {
            parsedArgs = JSON.parse(fnArgsStr);
          } catch (e) {
            parsedArgs = {};
          }

          onEvent({
            type: 'tool_start',
            toolName: fnName,
            toolArgs: parsedArgs,
          });

          let toolResult: ToolResult = { success: false, error: `Tool ${fnName} not found` };
          if (TOOLS[fnName]) {
            toolResult = await TOOLS[fnName].execute(parsedArgs);
          }

          onEvent({
            type: 'tool_end',
            toolName: fnName,
            toolArgs: parsedArgs,
            toolResult,
          });

          // Append assistant tool call & tool response message
          conversationMessages.push(choice.message as any);
          conversationMessages.push({
            role: 'tool' as any,
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
          } as any);
        }
      }

      // Stream the final answer
      const stream = await groqClient.chat.completions.create({
        model: model,
        messages: conversationMessages as any,
        stream: true,
        temperature: 0.6,
        max_tokens: 400,
      });

      let accumulated = '';
      let currentSentence = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          accumulated += content;
          currentSentence += content;

          onEvent({ type: 'token', content });

          // Detect sentence boundaries for fast sentence-based TTS emission
          if (/[\.!\?\n]/.test(content) && currentSentence.trim().length > 3) {
            onEvent({ type: 'sentence', content: currentSentence.trim() });
            currentSentence = '';
          }
        }
      }

      // Emit leftover sentence if present
      if (currentSentence.trim().length > 0) {
        onEvent({ type: 'sentence', content: currentSentence.trim() });
      }

      onEvent({ type: 'done', content: accumulated });
      return accumulated;
    } catch (err: any) {
      console.error('[GroqProvider API Error - Switching to Fallback Mode]:', err.message);
      return this.handleFallbackMode(systemPrompt, messages, options);
    }
  }

  private async handleFallbackMode(
    systemPrompt: string,
    messages: any[],
    options: StreamOptions
  ): Promise<string> {
    const { onEvent } = options;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    const lastLower = lastUserMsg.toLowerCase();

    let reply = '';

    // Smart fallback responses based on queries or tool keywords
    if (lastLower.includes('weather')) {
      onEvent({ type: 'tool_start', toolName: 'weather', toolArgs: { city: 'Tokyo' } });
      const result = await TOOLS.weather.execute({ city: 'Tokyo' });
      onEvent({ type: 'tool_end', toolName: 'weather', toolArgs: { city: 'Tokyo' }, toolResult: result });
      reply = `Simulation mode: According to weather metrics, Tokyo is currently ${result.data?.temperature || 22}°C with ${result.data?.condition || 'clear skies'}. Configure GROQ_API_KEY in .env for live Groq AI streaming responses.`;
    } else if (lastLower.includes('time') || lastLower.includes('clock')) {
      onEvent({ type: 'tool_start', toolName: 'get_time', toolArgs: { location: 'Tokyo' } });
      const result = await TOOLS.get_time.execute({ location: 'Tokyo' });
      onEvent({ type: 'tool_end', toolName: 'get_time', toolArgs: { location: 'Tokyo' }, toolResult: result });
      reply = `Simulation mode: Tokyo telemetry time is ${result.data?.time || '12:00 PM'}. Systems are operational. Insert GROQ_API_KEY into server environment variables to activate full Groq LLM integration.`;
    } else if (/\d+[\+\-\*\/]\d+/.test(lastLower) || lastLower.includes('calculate') || lastLower.includes('*')) {
      const match = lastLower.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
      if (match) {
        const expr = `${match[1]} ${match[2]} ${match[3]}`;
        onEvent({ type: 'tool_start', toolName: 'calculator', toolArgs: { expression: expr } });
        const result = await TOOLS.calculator.execute({ expression: expr });
        onEvent({ type: 'tool_end', toolName: 'calculator', toolArgs: { expression: expr }, toolResult: result });
        reply = `Calculation complete: ${expr} equals ${result.data?.result}. TARS telemetry is fully operational. Add your GROQ_API_KEY in .env for live Groq LLM streaming.`;
      } else {
        reply = "TARS telemetry online. Probability of system success is 99.4%. Please configure GROQ_API_KEY in your .env file to enable full Groq neural response generation.";
      }
    } else {
      reply = `TARS systems operational. Received input: "${lastUserMsg}". I am currently running in fallback local mode because GROQ_API_KEY is not set. Add your Groq key to server/.env to unlock full real-time streaming LLM conversation.`;
    }

    // Stream simulated response sentence by sentence
    const words = reply.split(' ');
    let currentChunk = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i] + ' ';
      currentChunk += word;
      onEvent({ type: 'token', content: word });

      if (/[\.!\?]$/.test(words[i]) || i === words.length - 1) {
        onEvent({ type: 'sentence', content: currentChunk.trim() });
        currentChunk = '';
      }

      await new Promise((r) => setTimeout(r, 40));
    }

    onEvent({ type: 'done', content: reply });
    return reply;
  }
}
