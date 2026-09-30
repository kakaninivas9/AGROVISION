const axios = require('axios');
require('dotenv').config({ path: './agrovision/backend/.env' });

const API_URL = "http://localhost:5001/api/iot/push";
const TS_READ_URL = `https://api.thingspeak.com/channels/${process.env.THINGSPEAK_CHANNEL_ID}/feeds/last.json?api_key=${process.env.THINGSPEAK_READ_KEY}`;

async function testSync() {
  console.log("🚀 Testing AgroVision -> ThingSpeak Sync...");
  
  const testData = {
    soil: 65,      // Soil moisture %
    temp: 24,      // Temperature °C
    hum: 58,       // Humidity %
    oil: 85,       // Light level
    n: 42,         // Nitrogen
    p: 32,         // Phosphorus
    k: 38,         // Potassium
    raw: 650,      // Raw sensor value
    reads: 1       // Reading count
  };

  try {
    // 1. Push to Local Backend
    console.log(`1. Pushing data to ${API_URL}...`);
    await axios.post(API_URL, testData);
    console.log("   ✅ Data accepted by local backend.");

    // 2. Wait for ThingSpeak (it takes a few seconds to update)
    console.log("2. Waiting 5 seconds for ThingSpeak to update...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 3. Verify on ThingSpeak
    console.log(`3. Verifying on ThingSpeak: ${TS_READ_URL}...`);
    const response = await axios.get(TS_READ_URL);
    const lastFeed = response.data;
    
    console.log("\n📡 ThingSpeak Latest Entry:");
    console.log(`   Field 1 (Temp) : ${lastFeed.field1}`);
    console.log(`   Field 2 (Hum)  : ${lastFeed.field2}`);
    console.log(`   Field 3 (Soil) : ${lastFeed.field3}`);
    
    if (parseFloat(lastFeed.field3) === 65.5) {
      console.log("\n✅ SYNC VERIFIED! Cloud integration is working.");
    } else {
      console.log("\n❌ Sync mismatch or data not yet updated on ThingSpeak.");
    }
    
  } catch (err) {
    console.error("\n❌ ERROR during sync test:", err.message);
  }
}

testSync();
