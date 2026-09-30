const Scheme = require("../models/Scheme");

const SEED_SCHEMES = [
  {
    title: "PM-KISAN Samman Nidhi",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    description: "Direct income support of ₹6,000 per year to small and marginal farmers, paid in 3 instalments of ₹2,000 each.",
    eligibility: ["Small & marginal farmers", "Land ownership required", "Not applicable for institutional landholders"],
    benefits: ["₹6,000 per year direct cash transfer", "Paid directly to bank account"],
    subsidyAmount: "₹6,000/year",
    applicationUrl: "https://pmkisan.gov.in",
    states: [],
    category: "subsidy",
    isActive: true,
  },
  {
    title: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    description: "Comprehensive crop insurance scheme providing financial support to farmers suffering crop damage due to natural calamities, pests, and disease.",
    eligibility: ["All farmers including tenant farmers", "Must have an insurable interest in crop"],
    benefits: ["Insurance cover against crop failure", "Low premium rates", "Full sum insured for losses"],
    subsidyAmount: "Premium subsidy up to 90%",
    applicationUrl: "https://pmfby.gov.in",
    states: [],
    category: "insurance",
    isActive: true,
  },
  {
    title: "Kisan Credit Card (KCC)",
    ministry: "Ministry of Agriculture",
    description: "Provides farmers with timely access to credit for agricultural needs at concessional interest rates.",
    eligibility: ["All farmers (owner, tenant, sharecropper)", "SHGs or JLGs of farmers"],
    benefits: ["Credit limit based on land holding", "Interest rate 7% (4% with subsidy)", "Personal accident insurance"],
    loanAmount: "Up to ₹3 lakh at 4% interest",
    applicationUrl: "https://agricoop.nic.in",
    states: [],
    category: "loan",
    isActive: true,
  },
  {
    title: "National Mission on Micro Irrigation",
    ministry: "Ministry of Agriculture",
    description: "Subsidy on drip and sprinkler irrigation systems to promote water-efficient farming.",
    eligibility: ["All farmers with land", "Priority to small and marginal farmers"],
    benefits: ["55% subsidy for small/marginal farmers", "45% subsidy for other farmers", "Technical support"],
    subsidyAmount: "45-55% of system cost",
    applicationUrl: "https://pmksy.gov.in",
    states: [],
    category: "technology",
    isActive: true,
  },
  {
    title: "Rashtriya Krishi Vikas Yojana (RKVY)",
    ministry: "Ministry of Agriculture",
    description: "Funds state-specific agriculture development projects including infrastructure, technology adoption and crop improvement.",
    eligibility: ["State governments apply; benefits reach farmers"],
    benefits: ["Infrastructure development", "Agri-business development", "Farmer training"],
    subsidyAmount: "Varies by state and project",
    applicationUrl: "https://rkvy.nic.in",
    states: [],
    category: "subsidy",
    isActive: true,
  },
  {
    title: "Atal Bhujal Yojana",
    ministry: "Ministry of Jal Shakti",
    description: "Sustainable groundwater management in water-stressed regions through community participation.",
    eligibility: ["Farmers in select districts of 7 states"],
    benefits: ["Groundwater recharge support", "Crop diversification incentives", "Water-saving technology"],
    subsidyAmount: "₹6,000 crore national program",
    applicationUrl: "https://ataljal.mowr.gov.in",
    states: ["Gujarat", "Haryana", "Karnataka", "MP", "Maharashtra", "Rajasthan", "UP"],
    category: "technology",
    isActive: true,
  },
  {
    title: "e-NAM (National Agriculture Market)",
    ministry: "Ministry of Agriculture",
    description: "Online trading platform for agricultural produce allowing farmers to get better prices.",
    eligibility: ["Farmers with agricultural produce", "Registration through local APMC"],
    benefits: ["Online bidding for better prices", "Transparent price discovery", "Direct payment to bank"],
    applicationUrl: "https://enam.gov.in",
    states: [],
    category: "technology",
    isActive: true,
  },
  {
    title: "Paramparagat Krishi Vikas Yojana (PKVY)",
    ministry: "Ministry of Agriculture",
    description: "Promotes organic farming through cluster-based approach with financial assistance.",
    eligibility: ["Farmer groups of 50 farmers (50 acres)"],
    benefits: ["₹50,000/hectare over 3 years", "Certification support", "Marketing assistance"],
    subsidyAmount: "₹50,000/hectare",
    applicationUrl: "https://pgsindia-ncof.gov.in",
    states: [],
    category: "training",
    isActive: true,
  },
];

// GET /api/schemes
const getSchemes = async (req, res) => {
  try {
    const { category, state, search } = req.query;

    let query = { isActive: true };
    if (category) query.category = category;
    if (state) query.$or = [{ states: { $in: [state] } }, { states: { $size: 0 } }];
    if (search) query.title = { $regex: search, $options: "i" };

    let schemes = await Scheme.find(query);

    if (schemes.length === 0 && !category && !state && !search) {
      await Scheme.insertMany(SEED_SCHEMES);
      schemes = await Scheme.find({ isActive: true });
    }

    res.json({ count: schemes.length, schemes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getSchemes };
