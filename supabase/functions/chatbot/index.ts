const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface ChatbotRequest {
  message: string
  user_id: string
  apiKey?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const { message, user_id, apiKey }: ChatbotRequest = await req.json()

    if (!message || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!apiKey) {
      const fallbackResponse = generateFallbackResponse(message)
      return new Response(
        JSON.stringify({ response: fallbackResponse }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are a helpful AI assistant specializing in field data collection and analysis. You help users understand their agricultural or scientific field data, provide insights, and offer guidance on best practices. Keep responses concise and practical.\n\nUser: ${message}`
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7,
        },
      }),
    })

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error(`Gemini API error: ${geminiResponse.status} - ${errorText}`)
      
      const fallbackResponse = generateFallbackResponse(message)
      return new Response(
        JSON.stringify({ response: fallbackResponse }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const geminiData = await geminiResponse.json()
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I encountered an error processing your request.'

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Chatbot function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred while processing your request',
        response: 'I apologize, but I\'m having trouble connecting right now. Please try again later.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

function generateFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('temperature')) {
    return 'For temperature measurements, ensure your sensors are calibrated and protected from direct sunlight. Normal soil temperatures range from 50-80°F depending on season and depth. Consider measuring at multiple depths for better insights.'
  }
  
  if (lowerMessage.includes('humidity')) {
    return 'Humidity levels are crucial for crop health. Ideal relative humidity varies by crop but generally ranges from 40-70%. High humidity can lead to fungal issues, while low humidity may stress plants. Monitor throughout the day as levels fluctuate.'
  }
  
  if (lowerMessage.includes('soil') || lowerMessage.includes('ph')) {
    return 'Soil pH affects nutrient availability. Most crops prefer slightly acidic to neutral soil (pH 6.0-7.0). Test soil pH regularly and consider amendments like lime to raise pH or sulfur to lower it. Take samples from multiple locations for accuracy.'
  }
  
  if (lowerMessage.includes('data') || lowerMessage.includes('record')) {
    return 'Consistent data collection is key to successful field management. Record measurements at the same time daily when possible, maintain detailed location notes, and look for patterns over time. Your data helps identify trends and optimize practices.'
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
    return 'I\'m here to help with your field data questions! I can provide insights on temperature, humidity, soil conditions, and data collection best practices. Feel free to ask about specific measurements or general field management guidance.'
  }
  
  return 'Thank you for your question! I can provide general guidance on field data practices. Please ensure consistent data collection timing, record detailed location information, and look for patterns in your data over time. For specific technical questions, consider consulting with agricultural extension services or field specialists.'
}