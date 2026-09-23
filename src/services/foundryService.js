// services/foundryService.js

// IMPORTANT: Change this if your deployment is named differently in Azure!
const DEPLOYMENT_NAME = "gpt-5-mini"; 

/**
 * Parses the raw endpoint from the .env to handle Azure AI Foundry project routing.
 */
function getAzureEndpoint(rawEndpoint) {
  if (!rawEndpoint) return "";
  
  if (rawEndpoint.endsWith('proj-default') || rawEndpoint.endsWith('proj-default/')) {
    const base = rawEndpoint.split('/api/projects')[0];
    return `${base}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=2024-02-15-preview`;
  } else if (!rawEndpoint.includes('chat/completions')) {
    const base = rawEndpoint.replace(/\/$/, "");
    return `${base}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=2024-02-15-preview`;
  }
  return rawEndpoint;
}

/**
 * Sends a message to the published Microsoft Foundry Agent.
 */
export async function sendQueryToCourseAgent(userMessage, chatHistory = [], contextText = "") {
  const API_KEY = localStorage.getItem('foundry_api_key') || import.meta.env.VITE_FOUNDRY_API_KEY;
  const ENDPOINT = import.meta.env.VITE_FOUNDRY_ENDPOINT;

  if (!API_KEY || !ENDPOINT) {
    throw new Error("Missing Azure API Key or Endpoint.");
  }

  const finalEndpoint = getAzureEndpoint(ENDPOINT);

  try {
    const formattedMessages = [
      { 
        role: "system", 
        content: `You are a strict course assistant. You must ONLY answer questions related to the user's uploaded course materials. If the user asks an off-topic question, politely decline and remind them to stay on topic. Keep all your answers extremely short, concise, and compressed.\n\nCOURSE MATERIALS TEXT:\n${contextText.substring(0, 30000)}` 
      },
      ...chatHistory,
      { role: "user", content: userMessage }
    ];

    const response = await fetch(finalEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": API_KEY,
        "Authorization": `Bearer ${API_KEY}` // Some endpoints prefer Auth header
      },
      body: JSON.stringify({
        messages: formattedMessages,
        temperature: 1, // Changed to 1 as requested by the specific model
        model: DEPLOYMENT_NAME, 
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Failed to communicate with Azure Agent");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error communicating with Azure Agent:", error);
    throw error;
  }
}

/**
 * Requests the AI to generate a set of JSON flashcards based on the context.
 */
export async function generateFlashcards(contextString = "") {
  const API_KEY = localStorage.getItem('foundry_api_key') || import.meta.env.VITE_FOUNDRY_API_KEY;
  const ENDPOINT = import.meta.env.VITE_FOUNDRY_ENDPOINT;
  if (!API_KEY) throw new Error("Missing Azure API Key.");

  const finalEndpoint = getAzureEndpoint(ENDPOINT);

  const prompt = `Based on the following course materials, generate exactly 3 highly educational flashcards. Include 2 Multiple Choice Questions and 1 Assertion/Reasoning question. 
Make sure these questions are entirely new and different from typical questions (Randomization Seed: ${Date.now()}).
You MUST return ONLY a valid JSON array and nothing else. No markdown formatting, no backticks.

For the explanation field: You MUST explicitly include actionable advice on what exactly the user needs to study if they got the answer wrong. For example: "If you got this wrong, you need to study X topic."

COURSE MATERIALS:
${contextString.substring(0, 30000)}

Format:
[
  {
    "type": "mcq",
    "question": "Question text here?",
    "options": ["A", "B", "C", "D"],
    "answerIndex": 0,
    "explanation": "Why this is correct. Study Tip: If you got this wrong, review [Topic]."
  }
]`;

  try {
    const response = await fetch(finalEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": API_KEY,
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a JSON generator. Return strictly valid JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 1,
        model: DEPLOYMENT_NAME,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Azure Error: ${err.error?.message || JSON.stringify(err)}`);
    }
    
    const data = await response.json();
    let content = data.choices[0].message.content;
    // Strip markdown formatting if the model still includes it
    content = content.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(content);
  } catch (error) {
    console.error("Flashcard error:", error);
    throw error;
  }
}
