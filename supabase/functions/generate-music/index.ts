import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface Note {
  note: string;
  duration: number;
  startTime: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get OpenAI API key from environment
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // System prompt for music generation
    const systemPrompt = `You are a music composition assistant. Generate simple melodies based on user descriptions.

Rules:
1. Generate notes in the format: note name + octave (e.g., C4, D#5, E3)
2. Use standard note names: C, C#, D, D#, E, F, F#, G, G#, A, A#, B
3. Octaves range from 2 to 6 (middle C is C4)
4. Each note should have a duration (0.25, 0.5, 1.0 seconds)
5. IMPORTANT: Total song length must NOT exceed 60 seconds (1 minute)
6. Generate enough notes to fill approximately 45-60 seconds (adjust note count and durations accordingly)
7. Use common scales (C major, A minor, etc.) unless specified
8. Return ONLY a JSON array of notes in this format:
   [
     {"note": "C4", "duration": 0.5, "startTime": 0.0},
     {"note": "D4", "duration": 0.5, "startTime": 0.5},
     {"note": "E4", "duration": 0.5, "startTime": 1.0}
   ]
9. startTime should be cumulative (each note starts when the previous ends)
10. The last note's startTime + duration must be <= 60 seconds
11. Keep melodies simple and pleasant
12. For happy/upbeat: use major scales, higher notes
13. For sad/melancholic: use minor scales, lower notes
14. For energetic: use faster notes (0.25-0.5 duration)
15. For calm: use slower notes (0.5-1.0 duration)

Return ONLY valid JSON, no other text.`;

    const userPrompt = `Generate a melody based on this description: "${prompt}"

Return a JSON array of notes with note, duration, and startTime fields.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 401 || response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service error. Please try again.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate music' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON response
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1]);
      } else {
        // Try to find array directly
        const arrayMatch = content.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          result = JSON.parse(arrayMatch[0]);
        } else {
          throw new Error('Failed to parse response as JSON');
        }
      }
    }

    // Extract notes array (could be direct array or wrapped in object)
    let notes: Note[] = [];
    if (Array.isArray(result)) {
      notes = result;
    } else if (result.notes && Array.isArray(result.notes)) {
      notes = result.notes;
    } else if (result.melody && Array.isArray(result.melody)) {
      notes = result.melody;
    } else {
      // Try to find any array in the object
      const arrayKey = Object.keys(result).find(key => Array.isArray(result[key]));
      if (arrayKey) {
        notes = result[arrayKey];
      }
    }

    // Validate and normalize notes
    const validatedNotes: Note[] = notes
      .filter((n: any) => n.note && typeof n.note === 'string')
      .map((n: any, index: number) => ({
        note: n.note,
        duration: typeof n.duration === 'number' && n.duration > 0 ? n.duration : 0.5,
        startTime: typeof n.startTime === 'number' ? n.startTime : 
          index > 0 ? validatedNotes[index - 1].startTime + validatedNotes[index - 1].duration : 0
      }));

    if (validatedNotes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid notes generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ notes: validatedNotes }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating music:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred while generating music' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

