"use client"

import { StudentProfile } from "@/components/dashboard/student-profile"
import { dummyStudentProfile } from "@/lib/student-data"

export default function AboutPage() {
  // In real app, fetch from Supabase based on authenticated user
  const profile = {
    latestQualification: dummyStudentProfile.latestQualification,
    universityName: dummyStudentProfile.universityName,
    graduationYear: dummyStudentProfile.graduationYear,
    gradeCgpa: dummyStudentProfile.gradeCgpa,
    currentlyStudying: dummyStudentProfile.currentlyStudying,
    degreeToPursue: dummyStudentProfile.degreeToPursue,
    preferredDestination: dummyStudentProfile.preferredDestination,
    preferredYearOfIntake: dummyStudentProfile.preferredYearOfIntake,
    budgetMin: dummyStudentProfile.budgetMin,
    budgetMax: dummyStudentProfile.budgetMax,
    applyForScholarships: dummyStudentProfile.applyForScholarships,
  }

  return (
    <div className="p-6 md:p-8 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">About You</h1>
        <p className="text-slate-600">Your profile information used for personalized recommendations</p>
      </div>
      <StudentProfile profile={profile} />
    </div>
  )
}
