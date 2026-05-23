import OpenAI from 'openai'

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

let client = null
export function isNlpEnabled() {
  return Boolean(process.env.OPENAI_API_KEY)
}
function getClient() {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return client
}

const SYSTEM_PROMPT = `You are Mira, a friendly real-estate assistant.
Your job is to help users find homes by collecting three search criteria:

  - location       (city/area string, e.g. "New York" or "Miami, FL")
  - maxPrice       (max budget in USD, integer)
  - minBedrooms    (minimum number of bedrooms, integer >= 0)

You are given:
  - the full conversation so far
  - the criteria already gathered (some may be null)

On every turn:
  1. Extract any NEW criteria from the latest user message. Merge with the
     existing criteria — do NOT lose previously-collected values unless the
     user explicitly changes their mind ("actually make it 4 bedrooms").
  2. If anything is still missing, ask ONE concise follow-up question about
     the FIRST missing field, in order: location → maxPrice → minBedrooms.
  3. When all three are filled, set "ready": true and write a short
     confirmation like "Great — searching for matches now."
  4. If the user wants to start over, reset all criteria to null and set
     ready=false.
  5. Parse numbers flexibly: "500k" -> 500000, "half a million" -> 500000,
     "1.2M" -> 1200000. For bedrooms, "studio" or "0" -> 0.

Always reply in the JSON schema you are given. Keep "reply" friendly and
short (under 25 words).`

const responseSchema = {
  name: 'mira_turn',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      reply: { type: 'string' },
      criteria: {
        type: 'object',
        additionalProperties: false,
        properties: {
          location: { type: ['string', 'null'] },
          maxPrice: { type: ['integer', 'null'] },
          minBedrooms: { type: ['integer', 'null'] },
        },
        required: ['location', 'maxPrice', 'minBedrooms'],
      },
      ready: { type: 'boolean' },
    },
    required: ['reply', 'criteria', 'ready'],
  },
}

/**
 * Run one LLM turn.
 *
 * @param {{role:'user'|'assistant', content:string}[]} messages — full conversation
 * @param {{location:?string, maxPrice:?number, minBedrooms:?number}} currentCriteria
 * @returns {Promise<{reply:string, criteria:object, ready:boolean}>}
 */
export async function runChatTurn(messages, currentCriteria) {
  const contextMessage = {
    role: 'system',
    content: `Current criteria (already collected): ${JSON.stringify(currentCriteria)}`,
  }

  const completion = await getClient().chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      contextMessage,
      ...messages,
    ],
    response_format: { type: 'json_schema', json_schema: responseSchema },
    temperature: 0.2,
  })

  const raw = completion.choices[0]?.message?.content
  if (!raw) throw new Error('Empty response from OpenAI')
  return JSON.parse(raw)
}
