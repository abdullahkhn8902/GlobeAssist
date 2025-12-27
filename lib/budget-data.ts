// Budget and country data for personalization
// Based on researched package costs for students and professionals

export interface CountryBudgetData {
  country: string
  studentUsdMin: number
  studentUsdMax: number
  professionalUsdMin: number
  professionalUsdMax: number
  tier: 1 | 2 | 3 | 4 | 5
}

// Complete budget data for all supported countries
export const COUNTRY_BUDGET_DATA: CountryBudgetData[] = [
  // Tier 1 - Most Affordable
  {
    country: "Turkey",
    studentUsdMin: 14000,
    studentUsdMax: 20000,
    professionalUsdMin: 1700,
    professionalUsdMax: 3000,
    tier: 1,
  },
  {
    country: "Malaysia",
    studentUsdMin: 16000,
    studentUsdMax: 22000,
    professionalUsdMin: 1700,
    professionalUsdMax: 3200,
    tier: 1,
  },
  {
    country: "China",
    studentUsdMin: 17000,
    studentUsdMax: 23000,
    professionalUsdMin: 2500,
    professionalUsdMax: 4500,
    tier: 1,
  },
  {
    country: "Poland",
    studentUsdMin: 18000,
    studentUsdMax: 24000,
    professionalUsdMin: 2000,
    professionalUsdMax: 3500,
    tier: 1,
  },

  // Tier 2 - Budget-Friendly
  {
    country: "Germany",
    studentUsdMin: 22000,
    studentUsdMax: 32000,
    professionalUsdMin: 3300,
    professionalUsdMax: 5100,
    tier: 2,
  },
  {
    country: "Spain",
    studentUsdMin: 24000,
    studentUsdMax: 35000,
    professionalUsdMin: 3300,
    professionalUsdMax: 5800,
    tier: 2,
  },
  {
    country: "Italy",
    studentUsdMin: 25000,
    studentUsdMax: 36000,
    professionalUsdMin: 2900,
    professionalUsdMax: 5500,
    tier: 2,
  },
  {
    country: "Austria",
    studentUsdMin: 38000,
    studentUsdMax: 52000,
    professionalUsdMin: 3500,
    professionalUsdMax: 6000,
    tier: 2,
  },
  {
    country: "Japan",
    studentUsdMin: 40000,
    studentUsdMax: 54000,
    professionalUsdMin: 4500,
    professionalUsdMax: 7000,
    tier: 2,
  },
  {
    country: "South Korea",
    studentUsdMin: 38000,
    studentUsdMax: 52000,
    professionalUsdMin: 3500,
    professionalUsdMax: 6000,
    tier: 2,
  },

  // Tier 3 - Moderate
  {
    country: "Netherlands",
    studentUsdMin: 58000,
    studentUsdMax: 80000,
    professionalUsdMin: 5500,
    professionalUsdMax: 9500,
    tier: 3,
  },
  {
    country: "France",
    studentUsdMin: 58000,
    studentUsdMax: 78000,
    professionalUsdMin: 5500,
    professionalUsdMax: 9500,
    tier: 3,
  },
  {
    country: "New Zealand",
    studentUsdMin: 58000,
    studentUsdMax: 78000,
    professionalUsdMin: 5500,
    professionalUsdMax: 8500,
    tier: 3,
  },
  {
    country: "Ireland",
    studentUsdMin: 30000,
    studentUsdMax: 40000,
    professionalUsdMin: 4500,
    professionalUsdMax: 7500,
    tier: 3,
  },
  {
    country: "Saudi Arabia",
    studentUsdMin: 38000,
    studentUsdMax: 52000,
    professionalUsdMin: 3000,
    professionalUsdMax: 5500,
    tier: 3,
  },
  {
    country: "United Arab Emirates",
    studentUsdMin: 42000,
    studentUsdMax: 58000,
    professionalUsdMin: 4000,
    professionalUsdMax: 7000,
    tier: 3,
  },
  {
    country: "Finland",
    studentUsdMin: 40000,
    studentUsdMax: 55000,
    professionalUsdMin: 4500,
    professionalUsdMax: 7500,
    tier: 3,
  },

  // Tier 4 - Premium
  {
    country: "Australia",
    studentUsdMin: 58000,
    studentUsdMax: 80000,
    professionalUsdMin: 6500,
    professionalUsdMax: 10500,
    tier: 4,
  },
  {
    country: "Canada",
    studentUsdMin: 60000,
    studentUsdMax: 82000,
    professionalUsdMin: 6500,
    professionalUsdMax: 10000,
    tier: 4,
  },
  {
    country: "Singapore",
    studentUsdMin: 62000,
    studentUsdMax: 88000,
    professionalUsdMin: 6500,
    professionalUsdMax: 10500,
    tier: 4,
  },
  {
    country: "Sweden",
    studentUsdMin: 88000,
    studentUsdMax: 125000,
    professionalUsdMin: 6000,
    professionalUsdMax: 10500,
    tier: 4,
  },
  {
    country: "Denmark",
    studentUsdMin: 88000,
    studentUsdMax: 125000,
    professionalUsdMin: 7000,
    professionalUsdMax: 11000,
    tier: 4,
  },

  // Tier 5 - Ultra Premium
  {
    country: "United States",
    studentUsdMin: 85000,
    studentUsdMax: 120000,
    professionalUsdMin: 7500,
    professionalUsdMax: 12000,
    tier: 5,
  },
  {
    country: "United Kingdom",
    studentUsdMin: 88000,
    studentUsdMax: 125000,
    professionalUsdMin: 7000,
    professionalUsdMax: 11000,
    tier: 5,
  },
  {
    country: "Switzerland",
    studentUsdMin: 92000,
    studentUsdMax: 135000,
    professionalUsdMin: 8500,
    professionalUsdMax: 13500,
    tier: 5,
  },
  {
    country: "Norway",
    studentUsdMin: 95000,
    studentUsdMax: 145000,
    professionalUsdMin: 7500,
    professionalUsdMax: 12000,
    tier: 5,
  },
]

// Budget range brackets for selection
export interface BudgetBracket {
  label: string
  min: number
  max: number
  description: string
}

// Student budget brackets based on actual country costs
export const STUDENT_BUDGET_BRACKETS: BudgetBracket[] = [
  {
    label: "$14,000 - $25,000",
    min: 14000,
    max: 25000,
    description: "Budget-Friendly (Turkey, Malaysia, China, Poland)",
  },
  { label: "$25,000 - $40,000", min: 25000, max: 40000, description: "Affordable (Germany, Spain, Italy, Ireland)" },
  {
    label: "$40,000 - $60,000",
    min: 40000,
    max: 60000,
    description: "Moderate (Austria, Japan, South Korea, UAE, Finland)",
  },
  {
    label: "$60,000 - $90,000",
    min: 60000,
    max: 90000,
    description: "Premium (Australia, Canada, Singapore, France, Netherlands)",
  },
  {
    label: "$90,000 - $150,000",
    min: 90000,
    max: 150000,
    description: "Ultra-Premium (USA, UK, Switzerland, Norway, Sweden, Denmark)",
  },
]

// Professional budget brackets (initial settlement costs)
export const PROFESSIONAL_BUDGET_BRACKETS: BudgetBracket[] = [
  { label: "$1,700 - $3,500", min: 1700, max: 3500, description: "Budget-Friendly (Turkey, Malaysia, Poland)" },
  {
    label: "$3,500 - $5,500",
    min: 3500,
    max: 5500,
    description: "Affordable (Germany, Spain, Italy, China, Saudi Arabia)",
  },
  {
    label: "$5,500 - $7,500",
    min: 5500,
    max: 7500,
    description: "Moderate (France, Netherlands, New Zealand, Austria, Japan, UAE)",
  },
  {
    label: "$7,500 - $10,500",
    min: 7500,
    max: 10500,
    description: "Premium (Australia, Canada, Singapore, Sweden, Ireland)",
  },
  {
    label: "$10,500 - $15,000",
    min: 10500,
    max: 15000,
    description: "Ultra-Premium (USA, UK, Switzerland, Norway, Denmark)",
  },
]

// Get countries available within a budget
export function getCountriesWithinBudget(
  budgetMax: number,
  profileType: "student" | "professional",
): CountryBudgetData[] {
  return COUNTRY_BUDGET_DATA.filter((country) => {
    const minRequired = profileType === "student" ? country.studentUsdMin : country.professionalUsdMin
    return budgetMax >= minRequired
  }).sort((a, b) => {
    // Sort by minimum cost ascending
    const aMin = profileType === "student" ? a.studentUsdMin : a.professionalUsdMin
    const bMin = profileType === "student" ? b.studentUsdMin : b.professionalUsdMin
    return aMin - bMin
  })
}

// Check if budget is sufficient for a specific country
export function isBudgetSufficientForCountry(
  countryName: string,
  budgetMax: number,
  profileType: "student" | "professional",
): { sufficient: boolean; minRequired: number; maxRecommended: number; tier: number } {
  // Normalize country name variations
  const normalizedCountry = normalizeCountryNameForBudget(countryName)

  const countryData = COUNTRY_BUDGET_DATA.find((c) => c.country.toLowerCase() === normalizedCountry.toLowerCase())

  if (!countryData) {
    return { sufficient: true, minRequired: 0, maxRecommended: 0, tier: 3 }
  }

  const minRequired = profileType === "student" ? countryData.studentUsdMin : countryData.professionalUsdMin
  const maxRecommended = profileType === "student" ? countryData.studentUsdMax : countryData.professionalUsdMax

  return {
    sufficient: budgetMax >= minRequired,
    minRequired,
    maxRecommended,
    tier: countryData.tier,
  }
}

// Get budget warning message
export function getBudgetWarningMessage(
  countryName: string,
  budgetMax: number,
  profileType: "student" | "professional",
): string | null {
  const result = isBudgetSufficientForCountry(countryName, budgetMax, profileType)

  if (result.sufficient || result.minRequired === 0) {
    return null
  }

  const shortfall = result.minRequired - budgetMax
  const budgetType = profileType === "student" ? "total education" : "initial settlement"

  return `Your budget of $${budgetMax.toLocaleString()} is below the minimum ${budgetType} cost for ${countryName} ($${result.minRequired.toLocaleString()}). You need at least $${shortfall.toLocaleString()} more. Consider a Tier ${result.tier > 2 ? result.tier - 1 : 1} country or increase your budget.`
}

// Get recommended countries based on budget
export function getRecommendedCountriesForBudget(budgetMax: number, profileType: "student" | "professional"): string[] {
  const affordable = getCountriesWithinBudget(budgetMax, profileType)
  return affordable.map((c) => c.country)
}

// Get tier description
export function getTierDescription(tier: number): string {
  switch (tier) {
    case 1:
      return "Most Affordable"
    case 2:
      return "Budget-Friendly"
    case 3:
      return "Moderate"
    case 4:
      return "Premium"
    case 5:
      return "Ultra-Premium"
    default:
      return "Unknown"
  }
}

// Get countries by tier
export function getCountriesByTier(tier: number): string[] {
  return COUNTRY_BUDGET_DATA.filter((c) => c.tier === tier).map((c) => c.country)
}

// Normalize country name for budget lookup
export function normalizeCountryNameForBudget(name: string): string {
  const normalizations: Record<string, string> = {
    "United States of America": "United States",
    USA: "United States",
    US: "United States",
    UK: "United Kingdom",
    Britain: "United Kingdom",
    "Great Britain": "United Kingdom",
    England: "United Kingdom",
    UAE: "United Arab Emirates",
    Korea: "South Korea",
    "Republic of Korea": "South Korea",
  }
  return normalizations[name] || name
}

// Get minimum budget across all countries for validation
export function getMinimumBudget(profileType: "student" | "professional"): number {
  if (profileType === "student") {
    return Math.min(...COUNTRY_BUDGET_DATA.map((c) => c.studentUsdMin))
  }
  return Math.min(...COUNTRY_BUDGET_DATA.map((c) => c.professionalUsdMin))
}

// Generate compact budget context for LLM (minimal tokens)
export function generateBudgetContextForLLM(budgetMax: number, profileType: "student" | "professional"): string {
  const affordable = getCountriesWithinBudget(budgetMax, profileType)
  const affordableNames = affordable.map((c) => c.country).slice(0, 15) // Limit for token efficiency

  const budgetType = profileType === "student" ? "education" : "settlement"

  // Compact format for minimal tokens
  return `BUDGET:$${budgetMax}(${budgetType})|AFFORDABLE:${affordableNames.join(",")}`
}

// Get all tier data for display
export const BUDGET_TIERS = {
  1: { name: "Most Affordable", countries: ["Poland", "Turkey", "Malaysia", "China"] },
  2: { name: "Budget-Friendly", countries: ["Germany", "Spain", "Italy", "Austria", "Japan", "South Korea"] },
  3: {
    name: "Moderate",
    countries: ["Netherlands", "France", "New Zealand", "Ireland", "Saudi Arabia", "United Arab Emirates", "Finland"],
  },
  4: { name: "Premium", countries: ["Australia", "Canada", "Singapore", "Sweden", "Denmark"] },
  5: { name: "Ultra-Premium", countries: ["United States", "United Kingdom", "Switzerland", "Norway"] },
}
