
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1"

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the session of the user
    const {
      data: { session },
    } = await supabaseClient.auth.getSession()

    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { service_name, api_key } = await req.json()

    if (!service_name || !api_key) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Store the API key in encrypted form using vault
    const { data: encryptionData, error: encryptionError } = await supabaseClient
      .rpc('encrypt_api_key', {
        key_value: api_key
      })

    if (encryptionError) {
      console.error('Error encrypting API key:', encryptionError);
      throw encryptionError;
    }

    // Store the API key reference and service info
    const { data, error } = await supabaseClient
      .from('user_ai_services')
      .upsert(
        {
          user_id: session.user.id,
          service_name,
          api_key_id: encryptionData,
          is_active: true,
        },
        { onConflict: 'user_id,service_name' }
      )

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error storing API key:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
