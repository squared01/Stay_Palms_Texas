import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

interface EmailRequest {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    })
  }

  try {
    console.log('Received request to send email');
    const { to, from, subject, html, text }: EmailRequest = await req.json()
    console.log('Email request:', { to, from, subject: subject.substring(0, 50) });

    // Validate required fields
    if (!to || !subject || !html) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get Resend API key from environment variables
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    console.log('RESEND_API_KEY exists:', !!RESEND_API_KEY);

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not found in environment variables')
      return new Response(
        JSON.stringify({ error: 'Email service not configured - missing API key' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Use provided from email or default to onboarding@resend.dev
    // Ensure the from email is properly formatted
    let fromEmail = from || 'onboarding@resend.dev';

    console.log('Raw from email received:', from);
    console.log('From email type:', typeof from);
    console.log('From email value:', JSON.stringify(from));

    // Validate and clean the from email
    if (fromEmail) {
      // Trim whitespace
      fromEmail = fromEmail.trim();

      // If the from email doesn't include a name, add one
      if (!fromEmail.includes('<')) {
        fromEmail = `Stay Palms TX <${fromEmail}>`;
      }
    }

    console.log('Using formatted from email:', fromEmail);

    // Send email using Resend API
    console.log('Calling Resend API...');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: subject,
        html: html,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
      }),
    })

    console.log('Resend API response status:', response.status);
    const result = await response.json()
    console.log('Resend API response:', result);

    if (!response.ok) {
      console.error('Resend API error:', result)
      return new Response(
        JSON.stringify({
          error: 'Failed to send email via Resend',
          details: result,
          message: result.message || 'Unknown Resend API error'
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in send-email function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})