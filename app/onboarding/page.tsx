"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Globe } from "lucide-react"
import Link from "next/link"
import { Stepper } from "@/components/onboarding/stepper"
import { StudentStepOne } from "@/components/onboarding/student-step-one"
import { StudentStepTwo } from "@/components/onboarding/student-step-two"
import { StudentStepThree } from "@/components/onboarding/student-step-three"
import { ProfessionalStepOne } from "@/components/onboarding/professional-step-one"
import { ProfessionalStepTwo } from "@/components/onboarding/professional-step-two"
import { ProfessionalStepThree } from "@/components/onboarding/professional-step-three"
import { message } from "antd"
import type { StudentOnboardingData, ProfessionalOnboardingData } from "@/lib/types/onboarding"

export default function OnboardingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [profileType, setProfileType] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [messageApi, contextHolder] = message.useMessage()

  const [studentData, setStudentData] = useState<StudentOnboardingData>({
    latestQualification: "",
    universityName: "",
    graduationYear: null,
    gradeCgpa: "",
    currentlyStudying: false,
    degreeToPursue: "",
    preferredDestination: "",
    preferredYearOfIntake: null,
    budgetMin: 0,
    budgetMax: 0,
    applyForScholarships: false,
    fieldsOfInterest: [],
    whyThisField: "",
  })

  const [professionalData, setProfessionalData] = useState<ProfessionalOnboardingData>({
    currentJobTitle: "",
    companyName: "",
    yearsOfExperience: null,
    highestQualification: "",
    industryField: "",
    preferredDestination: "",
    budgetMin: 0,
    budgetMax: 0,
    cvFileUrl: "",
    cvParsedData: null,
  })

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setUserId(user.id)
      setUserEmail(user.email || null)
      setUserName(user.user_metadata?.full_name || null)

      const metadataProfileType = user.user_metadata?.profile_type

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("onboarding_completed, profile_type")
        .eq("user_id", user.id)
        .maybeSingle()

      if (profile?.onboarding_completed) {
        router.push("/dashboard")
        return
      }

      const finalProfileType = profile?.profile_type || metadataProfileType

      if (!finalProfileType || !["student", "professional"].includes(finalProfileType)) {
        console.warn("No valid profile type found, defaulting to student")
        setProfileType("student")
      } else {
        setProfileType(finalProfileType)
      }

      if (!profile && metadataProfileType) {
        const { error: createError } = await supabase.from("user_profiles").upsert(
          {
            user_id: user.id,
            full_name: user.user_metadata?.full_name || null,
            email: user.email,
            profile_type: metadataProfileType,
            onboarding_completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        )

        if (createError) {
          console.error("Error creating user profile:", createError)
        }
      }

      setIsLoading(false)
    }

    checkUser()
  }, [router])

  const handleStudentDataChange = (data: Partial<StudentOnboardingData>) => {
    setStudentData((prev) => ({ ...prev, ...data }))
  }

  const handleProfessionalDataChange = (data: Partial<ProfessionalOnboardingData>) => {
    setProfessionalData((prev) => ({ ...prev, ...data }))
  }

  const handleStudentSubmit = async () => {
    if (!userId) return

    const supabase = createClient()

    const { error: profileError } = await supabase.from("user_profiles").upsert(
      {
        user_id: userId,
        full_name: userName,
        email: userEmail,
        profile_type: "student",
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )

    if (profileError) {
      console.error("Error creating user profile:", profileError)
      messageApi.error("Failed to save profile. Please try again.")
      throw profileError
    }

    const { error: studentError } = await supabase.from("student_profiles").upsert(
      {
        user_id: userId,
        latest_qualification: studentData.latestQualification,
        university_name: studentData.universityName,
        graduation_year: studentData.graduationYear,
        grade_cgpa: studentData.gradeCgpa,
        currently_studying: studentData.currentlyStudying,
        degree_to_pursue: studentData.degreeToPursue,
        preferred_destination: studentData.preferredDestination,
        preferred_year_of_intake: studentData.preferredYearOfIntake,
        budget_min: studentData.budgetMin,
        budget_max: studentData.budgetMax,
        apply_for_scholarships: studentData.applyForScholarships,
        fields_of_interest: studentData.fieldsOfInterest,
        why_this_field: studentData.whyThisField,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )

    if (studentError) {
      console.error("Error creating student profile:", studentError)
      messageApi.error("Failed to save student details. Please try again.")
      throw studentError
    }

    messageApi.success("Profile completed successfully!")
    router.push("/dashboard")
  }

  const handleProfessionalSubmit = async () => {
    if (!userId) return

    const supabase = createClient()

    const { error: profileError } = await supabase.from("user_profiles").upsert(
      {
        user_id: userId,
        full_name: userName,
        email: userEmail,
        profile_type: "professional",
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )

    if (profileError) {
      console.error("Error creating user profile:", profileError)
      messageApi.error("Failed to save profile. Please try again.")
      throw profileError
    }

    const { error: professionalError } = await supabase.from("professional_profiles").upsert(
      {
        user_id: userId,
        current_job_title: professionalData.currentJobTitle,
        company_name: professionalData.companyName,
        years_of_experience: professionalData.yearsOfExperience,
        highest_qualification: professionalData.highestQualification,
        industry_field: professionalData.industryField,
        preferred_destination: professionalData.preferredDestination,
        budget_min: professionalData.budgetMin,
        budget_max: professionalData.budgetMax,
        cv_file_url: professionalData.cvFileUrl,
        cv_parsed_data: professionalData.cvParsedData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )

    if (professionalError) {
      console.error("Error creating professional profile:", professionalError)
      messageApi.error("Failed to save professional details. Please try again.")
      throw professionalError
    }

    messageApi.success("Profile completed successfully!")
    router.push("/dashboard")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#e2e8f0] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1d293d]/30 border-t-[#1d293d] rounded-full animate-spin" />
      </div>
    )
  }

  const totalSteps = 3
  const isStudent = profileType === "student"

  return (
    <div className="min-h-screen bg-[#e2e8f0]">
      {contextHolder}
      {/* Header */}
      <header className="bg-[#e2e8f0] border-b border-[#cbd5e1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#1d293d] flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
            </Link>

            <nav className="hidden sm:flex items-center gap-8">
              <Link href="/" className="text-sm text-[#1d293d] hover:text-[#0f172a] transition-colors font-medium">
                Home
              </Link>
              <Link href="/about" className="text-sm text-[#1d293d] hover:text-[#0f172a] transition-colors font-medium">
                About
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-[#1d293d] hover:text-[#0f172a] transition-colors font-medium"
              >
                Privacy
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/auth/sign-up"
                className="border border-[#1d293d] text-[#1d293d] hover:bg-[#1d293d] hover:text-white bg-transparent rounded-full px-6 py-2 text-sm font-medium transition-colors"
              >
                Sign up
              </Link>
              <Link
                href="/auth/login"
                className="bg-[#1d293d] text-white hover:bg-[#0f172a] rounded-full px-6 py-2 text-sm font-medium transition-colors"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-lg">
          {/* Card - Updated to lighter green-gray */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg">
            <h1 className="text-2xl font-bold text-[#1d293d] text-center mb-6">Your global journey begins here.</h1>

            <Stepper currentStep={currentStep} totalSteps={totalSteps} />

            {/* Student Steps */}
            {isStudent && currentStep === 1 && (
              <StudentStepOne data={studentData} onChange={handleStudentDataChange} onNext={() => setCurrentStep(2)} />
            )}
            {isStudent && currentStep === 2 && (
              <StudentStepTwo
                data={studentData}
                onChange={handleStudentDataChange}
                onNext={() => setCurrentStep(3)}
                onPrev={() => setCurrentStep(1)}
              />
            )}
            {isStudent && currentStep === 3 && (
              <StudentStepThree
                data={studentData}
                onChange={handleStudentDataChange}
                onPrev={() => setCurrentStep(2)}
                onSubmit={handleStudentSubmit}
              />
            )}

            {/* Professional Steps */}
            {!isStudent && currentStep === 1 && (
              <ProfessionalStepOne
                data={professionalData}
                onChange={handleProfessionalDataChange}
                onNext={() => setCurrentStep(2)}
              />
            )}
            {!isStudent && currentStep === 2 && (
              <ProfessionalStepTwo
                data={professionalData}
                onChange={handleProfessionalDataChange}
                onNext={() => setCurrentStep(3)}
                onPrev={() => setCurrentStep(1)}
              />
            )}
            {!isStudent && currentStep === 3 && (
              <ProfessionalStepThree
                data={professionalData}
                onChange={handleProfessionalDataChange}
                onPrev={() => setCurrentStep(2)}
                onSubmit={handleProfessionalSubmit}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
