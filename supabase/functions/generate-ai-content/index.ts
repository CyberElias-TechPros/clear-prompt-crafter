
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "*",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { service, prompt, model } = await req.json();

    // Handle different AI services
    switch (service) {
      case 'openai':
        return await handleOpenAI(prompt, model);
      case 'antropic':
        return await handleAntropic(prompt, model);
      case 'perplexity':
        return await handlePerplexity(prompt, model);
      default:
        return new Response(
          JSON.stringify({ error: 'Unsupported AI service' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in generate-ai-content function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleOpenAI(prompt: string, model = 'gpt-4o-mini') {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    return new Response(
      JSON.stringify({ error: 'OpenAI API key not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant that specializes in generating high-quality prompts for AI models.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  if (data.error) {
    return new Response(
      JSON.stringify({ error: data.error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ content: data.choices[0].message.content }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleAntropic(prompt: string, model = 'claude-3-haiku-20240307') {
  const antropicApiKey = Deno.env.get('ANTROPIC_API_KEY');
  if (!antropicApiKey) {
    return new Response(
      JSON.stringify({ error: 'Antropic API key not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': antropicApiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 1000,
      messages: [
        { role: 'user', content: prompt }
      ],
      system: 'You are a helpful assistant that specializes in generating high-quality prompts for AI models.'
    }),
  });

  const data = await response.json();
  if (data.error) {
    return new Response(
      JSON.stringify({ error: data.error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ content: data.content[0].text }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handlePerplexity(prompt: string, model = 'llama-3.1-sonar-small-128k-online') {
  const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
  if (!perplexityApiKey) {
    return new Response(
      JSON.stringify({ error: 'Perplexity API key not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${perplexityApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant that specializes in generating high-quality prompts for AI models.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      return_images: false,
      return_related_questions: false,
    }),
  });

  const data = await response.json();
  if (data.error) {
    return new Response(
      JSON.stringify({ error: data.error }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ content: data.choices[0].message.content }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
