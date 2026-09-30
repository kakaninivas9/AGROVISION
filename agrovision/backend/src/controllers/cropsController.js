const Crop = require("../models/Crop");

// Seed data — used if DB is empty
const SEED_CROPS = [
  { name: "Rice", nameHindi: "चावल", season: "kharif", waterRequirement: "high", riskLevel: "medium", yieldPerAcre: 20, avgPricePerQuintal: 2000, costPerAcre: 15000, daysToHarvest: 150, soilType: ["clay", "loam"], states: ["Punjab", "Haryana", "UP", "WB", "AP"], description: "Major staple crop of India", fertilizers: ["Urea", "DAP", "MOP"], commonDiseases: ["Blast", "Bacterial Blight", "Brown Plant Hopper"] },
  { name: "Wheat", nameHindi: "गेहूं", season: "rabi", waterRequirement: "medium", riskLevel: "low", yieldPerAcre: 18, avgPricePerQuintal: 2200, costPerAcre: 12000, daysToHarvest: 120, soilType: ["loam", "clay-loam"], states: ["Punjab", "Haryana", "UP", "MP", "Rajasthan"], description: "India's second most important food crop", fertilizers: ["Urea", "DAP"], commonDiseases: ["Rust", "Smut", "Karnal Bunt"] },
  { name: "Tomato", nameHindi: "टमाटर", season: "all-year", waterRequirement: "medium", riskLevel: "high", yieldPerAcre: 120, avgPricePerQuintal: 1500, costPerAcre: 40000, daysToHarvest: 90, soilType: ["loam", "sandy-loam"], states: ["Karnataka", "AP", "Tamil Nadu", "Maharashtra", "HP"], description: "High-value vegetable with good market demand", fertilizers: ["NPK 19-19-19", "Calcium Nitrate", "Boron"], commonDiseases: ["Early Blight", "Late Blight", "Leaf Curl Virus"] },
  { name: "Cotton", nameHindi: "कपास", season: "kharif", waterRequirement: "medium", riskLevel: "medium", yieldPerAcre: 8, avgPricePerQuintal: 6000, costPerAcre: 25000, daysToHarvest: 180, soilType: ["black", "alluvial"], states: ["Gujarat", "Maharashtra", "Telangana", "Rajasthan"], description: "Cash crop known as white gold", fertilizers: ["Urea", "DAP", "MOP", "Micronutrients"], commonDiseases: ["Bollworm", "Whitefly", "Pink Bollworm"] },
  { name: "Sugarcane", nameHindi: "गन्ना", season: "all-year", waterRequirement: "high", riskLevel: "low", yieldPerAcre: 350, avgPricePerQuintal: 350, costPerAcre: 45000, daysToHarvest: 365, soilType: ["loam", "clay-loam"], states: ["UP", "Maharashtra", "Karnataka", "Tamil Nadu"], description: "Major cash crop for sugar mills", fertilizers: ["Urea", "SSP", "MOP", "Zinc Sulphate"], commonDiseases: ["Red Rot", "Smut", "Wilt"] },
  { name: "Maize", nameHindi: "मक्का", season: "kharif", waterRequirement: "medium", riskLevel: "low", yieldPerAcre: 25, avgPricePerQuintal: 1900, costPerAcre: 14000, daysToHarvest: 90, soilType: ["sandy-loam", "loam"], states: ["Karnataka", "Rajasthan", "MP", "Bihar"], description: "Versatile crop used for food, feed and starch", fertilizers: ["Urea", "DAP", "Zinc"], commonDiseases: ["Fall Army Worm", "Blight", "Stalk Rot"] },
  { name: "Soybean", nameHindi: "सोयाबीन", season: "kharif", waterRequirement: "medium", riskLevel: "medium", yieldPerAcre: 12, avgPricePerQuintal: 4500, costPerAcre: 15000, daysToHarvest: 100, soilType: ["loam", "clay-loam"], states: ["MP", "Maharashtra", "Rajasthan"], description: "Protein-rich oilseed crop", fertilizers: ["DAP", "MOP", "Rhizobium culture"], commonDiseases: ["Yellow Mosaic Virus", "Pod Borer", "Stem Fly"] },
  { name: "Potato", nameHindi: "आलू", season: "rabi", waterRequirement: "medium", riskLevel: "high", yieldPerAcre: 100, avgPricePerQuintal: 900, costPerAcre: 60000, daysToHarvest: 90, soilType: ["sandy-loam", "loam"], states: ["UP", "Punjab", "Bihar", "WB", "HP"], description: "Highest yielding food crop per acre", fertilizers: ["DAP", "Urea", "MOP", "Calcium"], commonDiseases: ["Late Blight", "Early Blight", "Black Scurf"] },
  { name: "Onion", nameHindi: "प्याज", season: "rabi", waterRequirement: "medium", riskLevel: "medium", yieldPerAcre: 80, avgPricePerQuintal: 1200, costPerAcre: 35000, daysToHarvest: 150, soilType: ["loam", "clay-loam"], states: ["Maharashtra", "Karnataka", "MP", "Rajasthan"], description: "Important export vegetable with volatile prices", fertilizers: ["DAP", "Urea", "Sulphur", "Boron"], commonDiseases: ["Purple Blotch", "Stemphylium Blight", "Fusarium Basal Rot"] },
  { name: "Mustard", nameHindi: "सरसों", season: "rabi", waterRequirement: "low", riskLevel: "low", yieldPerAcre: 8, avgPricePerQuintal: 5500, costPerAcre: 8000, daysToHarvest: 120, soilType: ["loam", "sandy-loam"], states: ["Rajasthan", "UP", "Haryana", "MP"], description: "Important oilseed crop in North India", fertilizers: ["DAP", "Urea", "Sulphur"], commonDiseases: ["Alternaria Blight", "Powdery Mildew", "Aphids"] },
];

// GET /api/crops
const getCrops = async (req, res) => {
  try {
    const { season, water, risk, state, search } = req.query;

    let query = {};
    if (season) query.season = season;
    if (water) query.waterRequirement = water;
    if (risk) query.riskLevel = risk;
    if (state) query.states = { $in: [state] };
    if (search) query.name = { $regex: search, $options: "i" };

    let crops = await Crop.find(query);

    // Seed if empty
    if (crops.length === 0 && !season && !water && !risk && !state && !search) {
      await Crop.insertMany(SEED_CROPS);
      crops = await Crop.find({});
    }

    res.json({ count: crops.length, crops });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/crops/calculate — Income calculator
const calculateIncome = async (req, res) => {
  try {
    const { cropId, landSize } = req.body; // landSize in acres

    if (!cropId || !landSize)
      return res.status(400).json({ error: "cropId and landSize are required" });

    const crop = await Crop.findById(cropId);
    if (!crop) return res.status(404).json({ error: "Crop not found" });

    const acres = parseFloat(landSize);
    const totalYield = crop.yieldPerAcre * acres;
    const grossRevenue = totalYield * crop.avgPricePerQuintal;
    const totalCost = crop.costPerAcre * acres;
    const netProfit = grossRevenue - totalCost;
    const roi = ((netProfit / totalCost) * 100).toFixed(1);
    const profitPerAcre = (netProfit / acres).toFixed(0);

    res.json({
      crop: crop.name,
      landSize: acres,
      daysToHarvest: crop.daysToHarvest,
      totalYield: `${totalYield} quintals`,
      grossRevenue: `₹${grossRevenue.toLocaleString("en-IN")}`,
      totalCost: `₹${totalCost.toLocaleString("en-IN")}`,
      netProfit: `₹${netProfit.toLocaleString("en-IN")}`,
      profitPerAcre: `₹${Number(profitPerAcre).toLocaleString("en-IN")}`,
      roi: `${roi}%`,
      recommendation: netProfit > 0 ? "Profitable" : "Not Recommended",
      riskLevel: crop.riskLevel,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getCrops, calculateIncome };
