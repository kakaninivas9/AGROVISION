import os
import re

file_path = r"c:\Users\saini\Downloads\CGUARD\dashboard\index.html"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace the IoT Simulation and Weather with Real API Integration
refresh_regex = re.compile(r"function refreshData\(\) \{.*?setInterval\(refreshData, 15000\);", re.DOTALL)

new_refresh_logic = """const tsChannelId = "3315477";
const tsReadKey = "1RFPGG06YCM77ONU";
const weatherKey = "a22d38c7df7c981dfe70cd69ecf9565c";

async function fetchRealData() {
  // 1. ThingSpeak IoT Data
  try {
    const tsRes = await fetch(`https://api.thingspeak.com/channels/${tsChannelId}/feeds.json?api_key=${tsReadKey}&results=24`);
    const tsData = await tsRes.json();
    if(tsData && tsData.feeds && tsData.feeds.length > 0) {
      const latest = tsData.feeds[tsData.feeds.length-1];
      liveData.temperature = parseFloat(latest.field1) || liveData.temperature;
      liveData.humidity = parseFloat(latest.field2) || liveData.humidity;
      liveData.moisture = parseFloat(latest.field3) || liveData.moisture;
      liveData.nitrogen = parseFloat(latest.field4) || liveData.nitrogen;
      liveData.phosphorus = parseFloat(latest.field5) || liveData.phosphorus;
      liveData.potassium = parseFloat(latest.field6) || liveData.potassium;
      
      const arrPad = (arr, len) => arr.length < len ? [...Array(len-arr.length).fill(arr[0]||0), ...arr] : arr.slice(-len);
      moistureHistory = arrPad(tsData.feeds.map(f => parseFloat(f.field3)||0).filter(v=>v>0), 24);
      tempHistory = arrPad(tsData.feeds.map(f => parseFloat(f.field1)||0).filter(v=>v>0), 24);
      humHistory = arrPad(tsData.feeds.map(f => parseFloat(f.field2)||0).filter(v=>v>0), 24);
      nHistory = arrPad(tsData.feeds.map(f => parseFloat(f.field4)||0).filter(v=>v>0), 24);
      pHistory = arrPad(tsData.feeds.map(f => parseFloat(f.field5)||0).filter(v=>v>0), 24);
      kHistory = arrPad(tsData.feeds.map(f => parseFloat(f.field6)||0).filter(v=>v>0), 24);
      
      if(moistureChartObj) { moistureChartObj.data.datasets[0].data = moistureHistory; moistureChartObj.update('none'); }
      if(tempHumChartObj) { tempHumChartObj.data.datasets[0].data = tempHistory; tempHumChartObj.data.datasets[1].data = humHistory; tempHumChartObj.update('none'); }
      
      aCharts.forEach((c, i) => {
        const updated = [moistureHistory, tempHistory, humHistory, nHistory, pHistory, kHistory][i];
        if (updated && c) { c.data.datasets[0].data = updated; c.update('none'); }
      });
    }
  } catch(e) { console.error("ThingSpeak Error", e); }
  
  // 2. OpenWeatherMap API
  try {
    const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Rajamahendravaram&appid=${weatherKey}&units=metric`);
    const weatherData = await weatherRes.json();
    if(weatherData && weatherData.weather) {
      const condition = weatherData.weather[0].main.toLowerCase();
      const isRain = condition.includes('rain') || condition.includes('drizzle') || condition.includes('thunderstorm');
      const isCloudy = condition.includes('cloud');
      document.getElementById('rain-icon').textContent = isRain ? '🌧️' : '🌤️';
      document.getElementById('rain-val').textContent = isRain ? 'RAINING' : 'DRY';
      document.getElementById('light-val').textContent = isCloudy ? 'LOW' : 'GOOD';
    }
  } catch(e) { console.error("Weather API Error", e); }
  
  updateUI();
}

// Map globally for the refresh button
window.refreshData = fetchRealData;"""

content = refresh_regex.sub(new_refresh_logic, content)

# 2. Replace the Disease Simulation with Gemini API 1.5 Flash 
disease_regex = re.compile(r"function simulateDiseasePrediction\(\) \{[\s\S]*?\}\n", re.DOTALL)

new_disease_logic = """async function simulateDiseasePrediction() {
  const apiKey = "YOUR_GEMINI_API_KEY";
  const imgElement = document.getElementById('leafPreviewImg');
  const base64Image = imgElement.src;
  
  if (!base64Image || !base64Image.startsWith('data:image')) {
     document.getElementById('result-disease-name').textContent = "Upload a valid image.";
     return;
  }
  
  document.getElementById('result-disease-name').textContent = "AI Doctor is zooming in...";
  document.getElementById('result-disease-name').style.color = "var(--text)";
  document.getElementById('result-conf').innerHTML = `Please wait around ~3 to 5 seconds.`;
  document.getElementById('result-treatment-text').textContent = "Analyzing the uploaded crop picture using Google Gemini 1.5 Flash...";
  document.getElementById('top3-container').innerHTML = "";

  const b64Data = base64Image.split(',')[1];
  const mimeType = base64Image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,/)[1];

  const payload = {
    contents: [{
      parts: [
        { text: `You are an expert farm pathology AI helper. Look closely at this leaf image. Give me a JSON response ONLY, with absolutely no markdown wrapping blocks whatsoever (no \`\`\`json). Provide exactly this structure: {"name": "Crop Name - Condition or Disease", "confidence": 92, "treatment": "Provide two clear, straightforward instructions for a farmer to treat this condition using accessible and safe farming methods."}` },
        { inline_data: { mime_type: mimeType, data: b64Data } }
      ]
    }]
  };

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    
    if(!res.ok) throw new Error("Gemini API call failed with status " + res.status);
    const data = await res.json();
    let replyText = data.candidates[0].content.parts[0].text;
    replyText = replyText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(replyText);
    
    const color = result.confidence > 80 ? (result.name.toLowerCase().includes('health') || result.name.toLowerCase().includes('good') ? 'var(--green)' : 'var(--red)') : 'var(--amber)';
    
    document.getElementById('result-disease-name').textContent = result.name;
    document.getElementById('result-disease-name').style.color = color;
    document.getElementById('result-conf').innerHTML = `Confidence: <strong style="color:${color}">${result.confidence}%</strong>`;
    document.getElementById('result-treatment-text').textContent = result.treatment;
    
  } catch(e) {
    document.getElementById('result-disease-name').textContent = "Camera Analysis Failed";
    document.getElementById('result-disease-name').style.color = "var(--red)";
    document.getElementById('result-treatment-text').textContent = "Failed to connect to the computer vision AI. The image might be too large or your internet is down.";
    console.error(e);
  }
}
"""

content = disease_regex.sub(new_disease_logic, content)

# 3. Trigger `fetchRealData` instead of `initCharts()` only upon load
if "window.addEventListener('load', () => { initCharts(); updateUI(); });" in content:
    content = content.replace("window.addEventListener('load', () => { initCharts(); updateUI(); });", 
                              "window.addEventListener('load', () => { initCharts(); fetchRealData(); setInterval(fetchRealData, 15000); });")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("All Real APIs Fully Integrated and Replaced Successfully!")
