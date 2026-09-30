import os

file_path = r"c:\Users\saini\Downloads\CGUARD\dashboard\index.html"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_sendmsg = """function sendMsg() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if(!text) return;
  
  const box = document.getElementById('chatBox');
  box.innerHTML += `<div class="msg user">${text}</div>`;
  input.value = '';
  box.scrollTop = box.scrollHeight;
  
  setTimeout(() => {
    let reply = "I am not exactly sure, but the overall numbers look okay. Try asking about 'water' or 'fertilizer'!";
    const t = text.toLowerCase();
    
    if (t.includes('water') || t.includes('irrigation') || t.includes('dry') || t.includes('rain')) {
       if (liveData.moisture < 40) reply = `Your soil is quite dry (${Math.round(liveData.moisture)}% wetness). It is a highly recommended to turn on the water pump now!`;
       else reply = `Your soil has enough water right now (${Math.round(liveData.moisture)}% wetness). No need to water yet!`;
    } 
    else if (t.includes('hot') || t.includes('temp') || t.includes('weather') || t.includes('heat')) {
       if (liveData.temperature > 32) reply = `It's quite hot at ${liveData.temperature.toFixed(1)}°C. Make sure your plants have enough water to survive the heat.`;
       else reply = `The temperature is a comfortable ${liveData.temperature.toFixed(1)}°C. Perfect for growing crops!`;
    }
    else if (t.includes('fertilizer') || t.includes('urea') || t.includes('nitrogen') || t.includes('npk') || t.includes('potash')) {
       if (liveData.nitrogen < 30) reply = `Your soil's nitrogen is low (${Math.round(liveData.nitrogen)}). Adding some Urea or compost will help the leaves grow greener!`;
       else if (liveData.phosphorus < 20) reply = `Your soil needs a bit of Phosphorus for stronger roots.`;
       else reply = `Your soil nutrients (Nitrogen, Phosphorus, Potassium) are well balanced right now. Good job!`;
    }
    else if (t.includes('health')) {
       reply = `Your overall farm health score is strong. The environment is looking good!`;
    }
    else if (t.includes('hello') || t.includes('hi')) {
       reply = "Hello! How can I help you with your farm today?";
    }
    else if (t.includes('disease') || t.includes('sick') || t.includes('leaf')) {
       reply = "If you think a plant is sick, go to the 'Check Crop Health' page on the menu and upload a photo of the leaf. Our AI Doctor will check it!";
    }

    box.innerHTML += `<div class="msg bot">${reply}</div>`;
    box.scrollTop = box.scrollHeight;
  }, 1000);
}"""

new_sendmsg = """async function sendMsg() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if(!text) return;
  
  const box = document.getElementById('chatBox');
  box.innerHTML += `<div class="msg user">${text}</div>`;
  input.value = '';
  box.scrollTop = box.scrollHeight;
  
  const loadingId = 'load-' + Date.now();
  box.innerHTML += `<div class="msg bot" id="${loadingId}">The AI is thinking...</div>`;
  box.scrollTop = box.scrollHeight;

  try {
    const promptContext = `You are a very friendly, helpful AI Farm Assistant. You are talking to a farmer. 
Keep your answers extremely short (1 or 2 sentences max) and use very simple, everyday language. Do not use complex scientific terms. 
Here is the live data from their farm right now: 
- Soil Wetness: ${Math.round(liveData.moisture)}%
- Temperature: ${Math.round(liveData.temperature)}°C
- Air Moisture: ${Math.round(liveData.humidity)}%
- Nitrogen: ${Math.round(liveData.nitrogen)}
- Phosphorus: ${Math.round(liveData.phosphorus)}
- Potassium: ${Math.round(liveData.potassium)}

The farmer asked: "${text}"`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_GROQ_API_KEY'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [{ role: 'user', content: promptContext }],
        temperature: 0.6,
        max_tokens: 100
      })
    });
    
    const data = await res.json();
    document.getElementById(loadingId).remove();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const reply = data.choices[0].message.content.replace(/\\n/g, '<br>');
      box.innerHTML += `<div class="msg bot">${reply}</div>`;
    } else {
      box.innerHTML += `<div class="msg bot">Sorry, the AI received an empty response.</div>`;
    }
    box.scrollTop = box.scrollHeight;
  } catch(e) {
    const loader = document.getElementById(loadingId);
    if (loader) loader.remove();
    box.innerHTML += `<div class="msg bot">Sorry, there was an error connecting to Groq. Check your internet connection.</div>`;
    console.error(e);
    box.scrollTop = box.scrollHeight;
  }
}"""

content = content.replace(old_sendmsg, new_sendmsg)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Groq Chatbot integrated!")
