export interface StudentOnboardingData {
  // Step 1
  latestQualification: string
  universityName: string
  graduationYear: number | null
  gradeCgpa: string
  currentlyStudying: boolean
  // Step 2
  degreeToPursue: string
  preferredDestination: string
  preferredYearOfIntake: number | null
  budgetMin: number
  budgetMax: number
  applyForScholarships: boolean
  fieldsOfInterest: string[]
  whyThisField: string
}

export interface ProfessionalOnboardingData {
  // Step 1
  currentJobTitle: string
  companyName: string
  yearsOfExperience: number | null
  highestQualification: string
  industryField: string
  // Step 2
  preferredDestination: string
  budgetMin: number
  budgetMax: number
  // Step 3
  cvFileUrl: string
  cvParsedData: CVParsedData | null
}

export interface CVParsedData {
  personalInfo: {
    name?: string
    email?: string
    phone?: string
    location?: string
    linkedin?: string
    website?: string
  }
  summary?: string
  experience: {
    title: string
    company: string
    duration: string
    description: string[]
  }[]
  education: {
    degree: string
    institution: string
    year: string
    gpa?: string
  }[]
  skills: string[]
  certifications: string[]
  languages: string[]
  projects: {
    name: string
    description: string
    technologies?: string[]
  }[]
}

export const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Netherlands",
  "Sweden",
  "Switzerland",
  "Ireland",
  "New Zealand",
  "Singapore",
  "Japan",
  "South Korea",
  "United Arab Emirates",
  "Italy",
  "Spain",
  "Denmark",
  "Norway",
  "Finland",
  "Austria",
  "Poland",
  "Turkey",
  "Malaysia",
  "China",
  "Saudi Arabia",
]

export const QUALIFICATIONS = [
  "High School",
  "Diploma",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD",
  "Professional Certification",
  "Other",
]

export const DEGREES = [
  "Bachelor's Degree",
  "Master's Degree",
  "PhD / Doctorate",
  "MBA",
  "Professional Certificate",
  "Diploma",
  "Other",
]

export const INDUSTRIES = [
  "Technology / IT",
  "Healthcare",
  "Finance / Banking",
  "Education",
  "Engineering",
  "Marketing / Advertising",
  "Consulting",
  "Manufacturing",
  "Retail",
  "Media / Entertainment",
  "Legal",
  "Real Estate",
  "Hospitality / Tourism",
  "Non-Profit",
  "Government",
  "Other",
]

export const FIELDS_OF_INTEREST = [
  "Software Development",
  "Data Science / AI",
  "Product Management",
  "Design / UX",
  "Marketing",
  "Sales",
  "Operations",
  "Human Resources",
  "Finance / Accounting",
  "Research",
  "Consulting",
  "Healthcare",
  "Education",
  "Legal",
  "Other",
]
