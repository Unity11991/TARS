import { ToolDefinition, ToolResult } from '../../../shared/types/index.js';

export interface ExecutableTool {
  definition: ToolDefinition;
  execute: (args: Record<string, any>) => Promise<ToolResult>;
}

export const TOOLS: Record<string, ExecutableTool> = {
  calculator: {
    definition: {
      name: 'calculator',
      description: 'Perform mathematical evaluations accurately (arithmetic, trigonometry, powers).',
      parameters: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: 'Math expression to evaluate, e.g., "982 * 27" or "sqrt(144) + 15"',
          },
        },
        required: ['expression'],
      },
    },
    execute: async ({ expression }) => {
      try {
        // Safe math evaluation using Function with sanitized input
        const sanitized = String(expression).replace(/[^0-9+\-*/().^% \t Math.sin|cos|tan|sqrt|pow|PI|E|abs|round]/g, '');
        // Replace math functions if written as simple names
        const mathExpr = sanitized
          .replace(/sqrt\(/g, 'Math.sqrt(')
          .replace(/pow\(/g, 'Math.pow(')
          .replace(/sin\(/g, 'Math.sin(')
          .replace(/cos\(/g, 'Math.cos(')
          .replace(/abs\(/g, 'Math.abs(')
          .replace(/pi/gi, 'Math.PI');

        const fn = new Function(`return (${mathExpr});`);
        const result = fn();

        if (typeof result !== 'number' || isNaN(result)) {
          return { success: false, error: 'Invalid calculation result' };
        }

        return { success: true, data: { expression, result: Number(result.toFixed(6)) } };
      } catch (err: any) {
        return { success: false, error: `Calculation failed: ${err.message}` };
      }
    },
  },

  get_time: {
    definition: {
      name: 'get_time',
      description: 'Get current time for a given city or timezone.',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'City or timezone name, e.g. "Tokyo", "London", "UTC", "PST"',
          },
        },
        required: ['location'],
      },
    },
    execute: async ({ location }) => {
      try {
        const now = new Date();
        const locLower = String(location).toLowerCase().trim();
        
        let timeZone = 'UTC';
        if (locLower.includes('tokyo') || locLower.includes('japan')) timeZone = 'Asia/Tokyo';
        else if (locLower.includes('london') || locLower.includes('uk')) timeZone = 'Europe/London';
        else if (locLower.includes('new york') || locLower.includes('est')) timeZone = 'America/New_York';
        else if (locLower.includes('los angeles') || locLower.includes('pst')) timeZone = 'America/Los_Angeles';
        else if (locLower.includes('paris') || locLower.includes('france')) timeZone = 'Europe/Paris';
        else if (locLower.includes('sydney') || locLower.includes('australia')) timeZone = 'Australia/Sydney';
        else if (locLower.includes('delhi') || locLower.includes('india') || locLower.includes('ist')) timeZone = 'Asia/Kolkata';

        const formatted = now.toLocaleTimeString('en-US', {
          timeZone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          weekday: 'short',
        });

        return {
          success: true,
          data: { location, timeZone, time: formatted, iso: now.toISOString() },
        };
      } catch (err: any) {
        return { success: false, error: `Time lookup failed: ${err.message}` };
      }
    },
  },

  weather: {
    definition: {
      name: 'weather',
      description: 'Fetch current weather conditions for a specified city.',
      parameters: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: 'City name, e.g. "Tokyo", "New York", "Delhi", "Berlin"',
          },
        },
        required: ['city'],
      },
    },
    execute: async ({ city }) => {
      try {
        // Geocode city using Open-Meteo Geocoding API
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
          return { success: false, error: `City '${city}' not found` };
        }

        const { latitude, longitude, name, country } = geoData.results[0];

        // Fetch current weather
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();

        if (!weatherData.current_weather) {
          return { success: false, error: `Weather data unavailable for ${name}` };
        }

        const cw = weatherData.current_weather;
        // WMO Weather interpretation codes
        const weatherCodeMap: Record<number, string> = {
          0: 'Clear sky',
          1: 'Mainly clear',
          2: 'Partly cloudy',
          3: 'Overcast',
          45: 'Foggy',
          48: 'Depositing rime fog',
          51: 'Light drizzle',
          61: 'Slight rain',
          63: 'Moderate rain',
          65: 'Heavy rain',
          71: 'Slight snow',
          80: 'Rain showers',
          95: 'Thunderstorm',
        };

        const condition = weatherCodeMap[cw.weathercode] || 'Clear/Cloudy';

        return {
          success: true,
          data: {
            city: name,
            country,
            temperature: Math.round(cw.temperature),
            unit: '°C',
            windspeed: cw.windspeed,
            condition,
          },
        };
      } catch (err: any) {
        return { success: false, error: `Weather fetch failed: ${err.message}` };
      }
    },
  },

  web_search: {
    definition: {
      name: 'web_search',
      description: 'Search the web for up-to-date information, facts, news, or scientific data.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query topic',
          },
        },
        required: ['query'],
      },
    },
    execute: async ({ query }) => {
      try {
        // Use DuckDuckGo Instant Answer API for live web search abstraction
        const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
        const response = await fetch(url);
        const data = await response.json();

        let snippet = data.AbstractText || '';
        if (!snippet && data.RelatedTopics && data.RelatedTopics.length > 0) {
          snippet = data.RelatedTopics[0].Text || '';
        }

        if (!snippet) {
          snippet = `No instant summary found for query '${query}'. Suggesting user verification.`;
        }

        return {
          success: true,
          data: {
            query,
            heading: data.Heading || query,
            snippet: snippet.substring(0, 300),
            source: data.AbstractURL || 'DuckDuckGo Knowledge Graph',
          },
        };
      } catch (err: any) {
        return { success: false, error: `Web search failed: ${err.message}` };
      }
    },
  },
};

export function getToolDefinitions(): ToolDefinition[] {
  return Object.values(TOOLS).map((t) => t.definition);
}
