import os

file_path = r"c:\Users\saini\Downloads\CGUARD\dashboard\index.html"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

if "chatbot-widget" not in content:
    chatbot_code = """
<!-- ════════════ CHATBOT ════════════ -->
<style>
.chatbot-widget { position: fixed; bottom: 24px; right: 24px; z-index: 1000; font-family: var(--sans); }
.chat-btn { width: 68px; height: 68px; border-radius: 34px; background: var(--green); color: #000; display: flex; align-items: center; justify-content: center; font-size: 32px; cursor: pointer; box-shadow: 0 4px 16px var(--green-glow); transition: transform 0.2s; }
.chat-btn:hover { transform: scale(1.1); box-shadow: 0 4px 24px rgba(61,220,103,0.4); }
.chat-window { position: absolute; bottom: 85px; right: 0; width: 340px; height: 460px; background: var(--card); border: 1px solid var(--border); border-radius: 16px; display: none; flex-direction: column; box-shadow: 0 8px 32px rgba(0,0,0,0.5); overflow: hidden; }
.chat-window.show { display: flex; }
.chat-header { background: var(--card2); padding: 14px 18px; border-bottom: 1px solid var(--border); font-weight: 600; display: flex; justify-content: space-between; align-items: center; }
.chat-header-close { cursor: pointer; color: var(--text2); font-size: 16px; padding: 4px; }
.chat-header-close:hover { color: var(--red); }
.chat-messages { flex: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
.msg { max-width: 85%; padding: 12px 16px; font-size: 14px; line-height: 1.5; }
.msg.bot { background: rgba(61,220,103,0.1); border: 1px solid rgba(61,220,103,0.2); color: var(--text); border-radius: 12px 12px 12px 2px; align-self: flex-start; }
.msg.user { background: var(--border2); color: var(--text); border-radius: 12px 12px 2px 12px; align-self: flex-end; }
.chat-input-area { padding: 14px; border-top: 1px solid var(--border); display: flex; gap: 8px; background: rgba(8,15,10,0.9); }
.chat-input-area input { flex: 1; background: var(--card2); border: 1px solid var(--border); color: var(--text); padding: 12px 14px; border-radius: 20px; outline: none; font-family: var(--sans); font-size: 14px; }
.chat-input-area input:focus { border-color: var(--green); }
.chat-send { background: var(--green); color: #040a06; border: none; border-radius: 20px; padding: 0 16px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
.chat-send:hover { background: var(--green2); }
</style>

<div class="chatbot-widget">
  <div class="chat-window" id="chatWindow">
    <div class="chat-header">
      <div style="display:flex;align-items:center;gap:8px;">🤖 <span>Farm Assistant</span></div>
      <div class="chat-header-close" onclick="toggleChat()">✖</div>
    </div>
    <div class="chat-messages" id="chatBox">
      <div class="msg bot">Hello! I am your AI Farm Assistant. Ask me anything about your crops, weather, or soil!</div>
    </div>
    <div class="chat-input-area">
      <input type="text" id="chatInput" placeholder="Type a message..." onkeypress="if(event.key==='Enter') sendMsg()">
      <button class="chat-send" onclick="sendMsg()">Send</button>
    </div>
  </div>
  <div class="chat-btn" onclick="toggleChat()">💬</div>
</div>

<script>
function toggleChat() {
  document.getElementById('chatWindow').classList.toggle('show');
}

function sendMsg() {
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
}
</script>
"""
    content = content.replace("</body>", chatbot_code + "\n</body>")
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Chatbot successfully injected!")
else:
    print("Chatbot already exists!")
