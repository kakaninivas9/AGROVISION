const axios = require("axios");

let lastIotData = {
  temp: 0, hum: 0, soil: 0, n: 0, p: 0, k: 0, oil: 0, rain: 0,
  lastUpdate: new Date().toISOString(),
  source: "initial"
};

let localIotHistory = [];

// ── Pull from ThingSpeak if no recent push ─────────────────────
const fetchFromThingSpeak = async () => {
  const tsId  = process.env.THINGSPEAK_CHANNEL_ID;
  const tsKey = process.env.THINGSPEAK_READ_KEY;

  if (!tsId || !tsKey || tsId === "0" || tsKey.includes("YOUR")) return;

  try {
    const url = `https://api.thingspeak.com/channels/${tsId}/feeds/last.json?api_key=${tsKey}`;
    const response = await axios.get(url, { timeout: 10000 });
    const feed = response.data;

    if (feed && feed.created_at) {
        const hasData = parseFloat(feed.field1) > 0 || parseFloat(feed.field2) > 0;
        const isNewer = !lastIotData.lastUpdate || new Date(feed.created_at) > new Date(lastIotData.lastUpdate);

        if (hasData && isNewer) {
            // Real data from ThingSpeak
            lastIotData = {
                temp: parseFloat(feed.field1) || 0,
                hum:  parseFloat(feed.field2) || 0,
                soil: parseFloat(feed.field3) || 0,
                n:    parseFloat(feed.field4) || 0,
                p:    parseFloat(feed.field5) || 0,
                k:    parseFloat(feed.field6) || 0,
                oil:  parseFloat(feed.field7) || 0,
                rain: parseFloat(feed.field8) || 0,
                lastUpdate: feed.created_at,
                source: "thingspeak_sync"
            };
            console.log(`[Sync] Updated from ThingSpeak: ${feed.created_at}`);
        } else if (!hasData) {
            const now = new Date();
            lastIotData = {
                temp: 0, hum: 0, soil: 0, n: 0, p: 0, k: 0, oil: 0, rain: 0,
                lastUpdate: now.toISOString(),
                source: "sensor_offline"
            };
        }
    }
  } catch (err) {
    console.error("[Sync] ThingSpeak fetch failed:", err.message);
  }
};

// Start background polling
setInterval(fetchFromThingSpeak, 60000);
setTimeout(fetchFromThingSpeak, 1000); // Initial pull

const pushIotData = async (req, res, next) => {
  try {
    const timestamp = new Date().toISOString();
    lastIotData = { ...req.body, lastUpdate: timestamp, source: "local_push" };
    
    // Add to local history for realtime charts
    const historyEntry = {
      created_at: timestamp,
      field1: req.body.temp || 0,
      field2: req.body.hum || 0,
      field3: req.body.soil || 0,
      field4: req.body.n || 0,
      field5: req.body.p || 0,
      field6: req.body.k || 0,
      field7: req.body.oil || 0,
      field8: req.body.rain || 0
    };
    
    localIotHistory.push(historyEntry);
    if (localIotHistory.length > 24) {
      localIotHistory.shift(); // Keep max 24 points
    }
    
    // Forward to ThingSpeak if configured
    const tsWriteKey = process.env.THINGSPEAK_WRITE_KEY;
    const tsChannel = process.env.THINGSPEAK_CHANNEL_ID;
    
    if (tsWriteKey && tsChannel) {
        // Map to ThingSpeak fields
        const params = new URLSearchParams();
        params.append("api_key", tsWriteKey);
        params.append("field1", req.body.temp || 0);
        params.append("field2", req.body.hum || 0);
        params.append("field3", req.body.soil || 0);
        params.append("field4", req.body.n || 0);
        params.append("field5", req.body.p || 0);
        params.append("field6", req.body.k || 0);
        params.append("field7", req.body.oil || 0); // Light
        params.append("field8", req.body.rain || 0);

        axios.get(`https://api.thingspeak.com/update?${params.toString()}`).catch(() => {});
    }

    res.json({ success: true, message: "Data received and scheduled for push" });
  } catch (err) {
    next(err);
  }
};

const getIotData = (req, res) => {
  res.json(lastIotData);
};

const getIotHistory = async (req, res, next) => {
  // If we have local stream history, serve it immediately for hyper-fast graphs
  if (localIotHistory.length > 0) {
    return res.json(localIotHistory);
  }

  const tsId  = process.env.THINGSPEAK_CHANNEL_ID;
  const tsKey = process.env.THINGSPEAK_READ_KEY;
  if (!tsId || !tsKey || tsId === "0" || tsKey.includes("YOUR")) {
    return res.json([]); // Return empty if not configured
  }

  try {
    const url = `https://api.thingspeak.com/channels/${tsId}/feeds.json?api_key=${tsKey}&results=24`;
    const response = await axios.get(url, { timeout: 10000 });
    res.json(response.data.feeds || []);
  } catch (err) {
    console.error("[IoT History API Error]", err.message);
    res.status(503).json({ error: "External telemetry service unavailable" });
  }
};

module.exports = { getIotData, pushIotData, getIotHistory };
