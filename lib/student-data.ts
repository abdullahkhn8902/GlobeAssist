// Dummy student profile data based on the schema
export const dummyStudentProfile = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  userId: "user-123",
  // Step 1 - Education
  latestQualification: "Bachelor's Degree",
  universityName: "University of Delhi",
  graduationYear: 2024,
  gradeCgpa: "3.7/4.0",
  currentlyStudying: false,
  // Step 2 - Preferences
  degreeToPursue: "Master's in Computer Science",
  preferredDestination: "United States, Canada, Germany",
  preferredYearOfIntake: 2025,
  budgetMin: 800,
  budgetMax: 2500,
  applyForScholarships: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export type StudentProfile = typeof dummyStudentProfile
