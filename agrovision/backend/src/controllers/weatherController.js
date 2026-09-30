const axios = require("axios");

// Risk calculation based on weather conditions
const calculateDiseaseRisk = (temp, humidity, rainfall) => {
  let score = 0;

  // High humidity = more disease risk
  if (humidity > 80) score += 3;
  else if (humidity > 60) score += 2;
  else score += 1;

  // Temperature sweet spots for fungal/bacterial diseases
  if (temp >= 15 && temp <= 30) score += 2;
  else if (temp >= 10 && temp <= 35) score += 1;

  // Rainfall increases risk
  if (rainfall > 10) score += 3;
  else if (rainfall > 2) score += 2;
  else score += 0;

  if (score >= 7) return { level: "High", color: "#EF4444", message: "Conditions highly favorable for fungal/bacterial diseases. Apply preventive fungicide.", score };
  if (score >= 4) return { level: "Medium", color: "#F59E0B", message: "Moderate risk. Monitor crops closely and ensure good drainage.", score };
  return { level: "Low", color: "#22C55E", message: "Low disease risk. Normal farming practices recommended.", score };
};

// GET /api/weather?lat=&lon=
const getWeather = async (req, res) => {
  try {
    const { lat, lon, city } = req.query;

    let url;
    if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHERMAP_KEY}&units=metric`;
    } else if (city) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPENWEATHERMAP_KEY}&units=metric`;
    } else {
      return res.status(400).json({ error: "Provide lat/lon or city parameter" });
    }

    const weatherRes = await axios.get(url, { timeout: 10000 });
    const data = weatherRes.data;

    const temperature = data.main.temp;
    const humidity = data.main.humidity;
    const rainfall = data.rain ? data.rain["1h"] || data.rain["3h"] || 0 : 0;
    const windSpeed = data.wind.speed;

    const risk = calculateDiseaseRisk(temperature, humidity, rainfall);

    // Also fetch 5-day forecast for trends
    let forecastUrl;
    if (lat && lon) {
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHERMAP_KEY}&units=metric&cnt=5`;
    } else {
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${process.env.OPENWEATHERMAP_KEY}&units=metric&cnt=5`;
    }

    const forecastRes = await axios.get(forecastUrl, { timeout: 10000 });
    const forecast = forecastRes.data.list.map((item) => ({
      time: item.dt_txt,
      temp: item.main.temp,
      humidity: item.main.humidity,
      description: item.weather[0].description,
      icon: item.weather[0].icon,
    }));

    res.json({
      location: {
        name: data.name,
        country: data.sys.country,
        lat: data.coord.lat,
        lon: data.coord.lon,
      },
      current: {
        temperature,
        feelsLike: data.main.feels_like,
        humidity,
        rainfall,
        windSpeed,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        pressure: data.main.pressure,
      },
      diseaseRisk: risk,
      forecast,
    });
  } catch (err) {
    if (err.response?.status === 401) {
      return res.status(502).json({ error: "Invalid OpenWeatherMap API key" });
    }
    if (err.response?.status === 404) {
      return res.status(404).json({ error: "Location not found" });
    }
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getWeather };
