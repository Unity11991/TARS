import 'dotenv/config';
import { app } from './app.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  TARS VOICE AGENT BACKEND ONLINE`);
  console.log(`  Server Listening on: http://localhost:${PORT}`);
  console.log(`  Target Model: ${process.env.GROQ_MODEL || 'llama-3.1-8b-instant'}`);
  console.log(`  Groq API Key Configured: ${Boolean(process.env.GROQ_API_KEY)}`);
  console.log(`====================================================`);
});
