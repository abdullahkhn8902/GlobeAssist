// profile page file (update/replace your existing file content with this)
"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  QUALIFICATIONS,
  COUNTRIES,
  DEGREES,
  INDUSTRIES,
  FIELDS_OF_INTEREST,
  type CVParsedData,
} from "@/lib/types/onboarding"
import {
  STUDENT_BUDGET_BRACKETS,
  PROFESSIONAL_BUDGET_BRACKETS,
  isBudgetSufficientForCountry,
  getBudgetWarningMessage,
  getRecommendedCountriesForBudget,
  COUNTRY_BUDGET_DATA,
  getMinimumBudget,
  normalizeCountryNameForBudget,
} from "@/lib/budget-data"
import {
  Camera,
  Loader2,
  Save,
  User,
  GraduationCap,
  Briefcase,
  DollarSign,
  FileText,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Building,
  Award,
  Target,
  BookOpen,
  Info,
} from "lucide-react"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"

interface UserProfile {
  user_id: string
  full_name: string | null
  email: string | null
  profile_type: "student" | "professional"
  avatar_url: string | null
}

interface StudentProfile {
  latest_qualification: string | null
  university_name: string | null
  graduation_year: number | null
  grade_cgpa: string | null
  currently_studying: boolean
  degree_to_pursue: string | null
  preferred_destination: string | null
  preferred_year_of_intake: number | null
  budget_min: number
  budget_max: number
  apply_for_scholarships: boolean
  fields_of_interest: string[] | null
  why_this_field: string | null
}

interface ProfessionalProfile {
  current_job_title: string | null
  company_name: string | null
  years_of_experience: number | null
  highest_qualification: string | null
  industry_field: string | null
  preferred_destination: string | null
  budget_min: number
  budget_max: number
  cv_file_url: string | null
  cv_parsed_data: CVParsedData | null
}

export default function ProfilePage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isUploadingCV, setIsUploadingCV] = useState(false)

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [professionalProfile, setProfessionalProfile] = useState<ProfessionalProfile | null>(null)

  // Track original values for change detection
  const [originalStudentProfile, setOriginalStudentProfile] = useState<StudentProfile | null>(null)
  const [originalProfessionalProfile, setOriginalProfessionalProfile] = useState<ProfessionalProfile | null>(null)

  const [cvFileName, setCvFileName] = useState<string | null>(null)
  const [cvParseError, setCvParseError] = useState<string | null>(null)

  const studentBudgetValidation = useMemo(() => {
    if (!studentProfile?.preferred_destination || !studentProfile?.budget_max) return null
    return isBudgetSufficientForCountry(studentProfile.preferred_destination, studentProfile.budget_max, "student")
  }, [studentProfile?.preferred_destination, studentProfile?.budget_max])

  const studentBudgetWarning = useMemo(() => {
    if (!studentProfile?.preferred_destination || !studentProfile?.budget_max) return null
    return getBudgetWarningMessage(studentProfile.preferred_destination, studentProfile.budget_max, "student")
  }, [studentProfile?.preferred_destination, studentProfile?.budget_max])

  const studentAffordableCountries = useMemo(() => {
    if (!studentProfile?.budget_max) return []
    return getRecommendedCountriesForBudget(studentProfile.budget_max, "student")
  }, [studentProfile?.budget_max])

  const professionalBudgetValidation = useMemo(() => {
    if (!professionalProfile?.preferred_destination || !professionalProfile?.budget_max) return null
    return isBudgetSufficientForCountry(
      professionalProfile.preferred_destination,
      professionalProfile.budget_max,
      "professional",
    )
  }, [professionalProfile?.preferred_destination, professionalProfile?.budget_max])

  const professionalBudgetWarning = useMemo(() => {
    if (!professionalProfile?.preferred_destination || !professionalProfile?.budget_max) return null
    return getBudgetWarningMessage(
      professionalProfile.preferred_destination,
      professionalProfile.budget_max,
      "professional",
    )
  }, [professionalProfile?.preferred_destination, professionalProfile?.budget_max])

  const professionalAffordableCountries = useMemo(() => {
    if (!professionalProfile?.budget_max) return []
    return getRecommendedCountriesForBudget(professionalProfile.budget_max, "professional")
  }, [professionalProfile?.budget_max])

  const getStudentCountryBudgetInfo = (countryName: string) => {
    const normalizedCountryName = normalizeCountryNameForBudget(countryName)
    const countryData = COUNTRY_BUDGET_DATA.find((c) => c.country.toLowerCase() === normalizedCountryName.toLowerCase())
    if (!countryData) return null
    return {
      min: countryData.studentUsdMin,
      max: countryData.studentUsdMax,
      tier: countryData.tier,
    }
  }

  const getProfessionalCountryBudgetInfo = (countryName: string) => {
    const normalizedCountryName = normalizeCountryNameForBudget(countryName)
    const countryData = COUNTRY_BUDGET_DATA.find((c) => c.country.toLowerCase() === normalizedCountryName.toLowerCase())
    if (!countryData) return null
    return {
      min: countryData.professionalUsdMin,
      max: countryData.professionalUsdMax,
      tier: countryData.tier,
    }
  }

  // Check if preferences have changed (budget, destination, CV for professionals)
  const hasPreferencesChanged = useCallback(() => {
    if (userProfile?.profile_type === "student" && studentProfile && originalStudentProfile) {
      return (
        studentProfile.preferred_destination !== originalStudentProfile.preferred_destination ||
        studentProfile.budget_min !== originalStudentProfile.budget_min ||
        studentProfile.budget_max !== originalStudentProfile.budget_max ||
        studentProfile.degree_to_pursue !== originalStudentProfile.degree_to_pursue ||
        studentProfile.apply_for_scholarships !== originalStudentProfile.apply_for_scholarships ||
        JSON.stringify(studentProfile.fields_of_interest) !== JSON.stringify(originalStudentProfile.fields_of_interest)
      )
    }
    if (userProfile?.profile_type === "professional" && professionalProfile && originalProfessionalProfile) {
      return (
        professionalProfile.preferred_destination !== originalProfessionalProfile.preferred_destination ||
        professionalProfile.budget_min !== originalProfessionalProfile.budget_min ||
        professionalProfile.budget_max !== originalProfessionalProfile.budget_max ||
        professionalProfile.industry_field !== originalProfessionalProfile.industry_field ||
        professionalProfile.years_of_experience !== originalProfessionalProfile.years_of_experience ||
        professionalProfile.cv_file_url !== originalProfessionalProfile.cv_file_url
      )
    }
    return false
  }, [userProfile, studentProfile, originalStudentProfile, professionalProfile, originalProfessionalProfile])

  // CHANGE: Replace client-side cache clearing with server-side API call
  const clearCachedRecommendations = async () => {
    try {
      const response = await fetch("/api/clear-cache", {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to clear cache")
      }

      const data = await response.json()
      console.log(`[Profile] Cache cleared via API:`, data)
      return true
    } catch (error) {
      console.error("[Profile] Error clearing cache:", error)
      // Don't throw - we still want to save the profile even if cache clearing fails
      return false
    }
  }

  const handleStudentBudgetChange = (budgetMin: number, budgetMax: number) => {
    if (!studentProfile) return

    const newProfile = { ...studentProfile, budget_min: budgetMin, budget_max: budgetMax }

    // Check if current destination is still affordable with new budget
    if (studentProfile.preferred_destination) {
      const budgetInfo = getStudentCountryBudgetInfo(studentProfile.preferred_destination)
      if (budgetInfo && budgetMax < budgetInfo.min) {
        // Clear destination if no longer affordable
        newProfile.preferred_destination = null
        toast({
          title: "Destination cleared",
          description: `${studentProfile.preferred_destination} is no longer within your budget. Please select a new destination.`,
          variant: "destructive",
        })
      }
    }

    setStudentProfile(newProfile)
  }

  const handleProfessionalBudgetChange = (budgetMin: number, budgetMax: number) => {
    if (!professionalProfile) return

    const newProfile = { ...professionalProfile, budget_min: budgetMin, budget_max: budgetMax }

    // Check if current destination is still affordable with new budget
    if (professionalProfile.preferred_destination) {
      const budgetInfo = getProfessionalCountryBudgetInfo(professionalProfile.preferred_destination)
      if (budgetInfo && budgetMax < budgetInfo.min) {
        // Clear destination if no longer affordable
        newProfile.preferred_destination = null
        toast({
          title: "Destination cleared",
          description: `${professionalProfile.preferred_destination} is no longer within your budget. Please select a new destination.`,
          variant: "destructive",
        })
      }
    }

    setProfessionalProfile(newProfile)
  }

  // Load user data on mount
  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      // Fetch user profile
      const { data: userProfileData } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).single()

      if (userProfileData) {
        setUserProfile(userProfileData as UserProfile)

        // Fetch specific profile based on type
        if (userProfileData.profile_type === "student") {
          const { data: studentData } = await supabase
            .from("student_profiles")
            .select("*")
            .eq("user_id", user.id)
            .single()

          if (studentData) {
            const profile = {
              latest_qualification: studentData.latest_qualification,
              university_name: studentData.university_name,
              graduation_year: studentData.graduation_year,
              grade_cgpa: studentData.grade_cgpa,
              currently_studying: studentData.currently_studying ?? false,
              degree_to_pursue: studentData.degree_to_pursue,
              preferred_destination: studentData.preferred_destination,
              preferred_year_of_intake: studentData.preferred_year_of_intake,
              budget_min: studentData.budget_min ?? 0,
              budget_max: studentData.budget_max ?? 10000,
              apply_for_scholarships: studentData.apply_for_scholarships ?? false,
              fields_of_interest: studentData.fields_of_interest ?? [],
              why_this_field: studentData.why_this_field,
            }
            setStudentProfile(profile)
            setOriginalStudentProfile(JSON.parse(JSON.stringify(profile)))
          }
        } else if (userProfileData.profile_type === "professional") {
          const { data: profData } = await supabase
            .from("professional_profiles")
            .select("*")
            .eq("user_id", user.id)
            .single()

          if (profData) {
            const profile = {
              current_job_title: profData.current_job_title,
              company_name: profData.company_name,
              years_of_experience: profData.years_of_experience,
              highest_qualification: profData.highest_qualification,
              industry_field: profData.industry_field,
              preferred_destination: profData.preferred_destination,
              budget_min: profData.budget_min ?? 0,
              budget_max: profData.budget_max ?? 10000,
              cv_file_url: profData.cv_file_url,
              cv_parsed_data: profData.cv_parsed_data,
            }
            setProfessionalProfile(profile)
            setOriginalProfessionalProfile(JSON.parse(JSON.stringify(profile)))
            if (profData.cv_file_url) {
              setCvFileName(profData.cv_file_url.split("/").pop() || "CV uploaded")
            }
          }
        }
      }

      setIsLoading(false)
    }

    loadProfile()
  }, [])

  // Warn user about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPreferencesChanged()) {
        e.preventDefault()
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?"
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasPreferencesChanged])

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userProfile) return

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please upload an image file", variant: "destructive" })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be less than 5MB", variant: "destructive" })
      return
    }

    setIsUploadingAvatar(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath)

      // Update user profile
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)

      if (updateError) throw updateError

      setUserProfile({ ...userProfile, avatar_url: publicUrl })
      toast({ title: "Avatar updated", description: "Your profile picture has been updated" })
    } catch (error) {
      console.error("Avatar upload error:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  // Handle CV upload for professionals
  const handleCVUpload = async (file: File) => {
    if (!userProfile || userProfile.profile_type !== "professional") return

    const fileNameLower = file.name.toLowerCase()
    const validExtensions = [".pdf", ".doc", ".docx", ".txt"]
    const hasValidExtension = validExtensions.some((ext) => fileNameLower.endsWith(ext))

    if (!hasValidExtension) {
      setCvParseError("Please upload a PDF, DOC, DOCX, or TXT file")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setCvParseError("File size must be less than 10MB")
      return
    }

    setIsUploadingCV(true)
    setCvParseError(null)
    setCvFileName(file.name)

    try {
      const supabase = createClient()
      const { data: sessionRes, error: sessionErr } = await supabase.auth.getSession()

      if (sessionErr || !sessionRes.session) {
        setCvParseError("Session expired. Please login again.")
        setCvFileName(null)
        return
      }

      const formData = new FormData()
      formData.append("cv", file)

      const response = await fetch("/api/parse-cv", {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionRes.session.access_token}` },
        body: formData,
      })

      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        setCvParseError(result.error || "Failed to parse CV")
        setCvFileName(null)
        return
      }

      const result = await response.json()

      // Update local state with new CV data
      setProfessionalProfile((prev) =>
        prev ? { ...prev, cv_file_url: result.fileUrl, cv_parsed_data: result.parsedData } : null,
      )

      toast({ title: "CV uploaded", description: "Your CV has been parsed successfully" })
    } catch (error) {
      console.error("CV upload error:", error)
      setCvParseError("Network error. Please try again.")
      setCvFileName(null)
    } finally {
      setIsUploadingCV(false)
    }
  }

  // Save profile changes
  const handleSave = async () => {
    if (!userProfile) return

    setIsSaving(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const preferencesChanged = hasPreferencesChanged()

      if (userProfile.profile_type === "student" && studentProfile) {
        const { error } = await supabase
          .from("student_profiles")
          .update({
            latest_qualification: studentProfile.latest_qualification,
            university_name: studentProfile.university_name,
            graduation_year: studentProfile.graduation_year,
            grade_cgpa: studentProfile.grade_cgpa,
            currently_studying: studentProfile.currently_studying,
            degree_to_pursue: studentProfile.degree_to_pursue,
            preferred_destination: studentProfile.preferred_destination,
            preferred_year_of_intake: studentProfile.preferred_year_of_intake,
            budget_min: studentProfile.budget_min,
            budget_max: studentProfile.budget_max,
            apply_for_scholarships: studentProfile.apply_for_scholarships,
            fields_of_interest: studentProfile.fields_of_interest,
            why_this_field: studentProfile.why_this_field,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)

        if (error) throw error

        // CHANGE: Use server-side API to clear cache
        if (preferencesChanged) {
          await clearCachedRecommendations()
          toast({
            title: "Profile updated",
            description:
              "Your preferences have changed. All recommendations will be regenerated based on your new settings.",
            duration: 5000,
          })
        }

        // Update original profile to reflect saved state
        setOriginalStudentProfile(JSON.parse(JSON.stringify(studentProfile)))
      } else if (userProfile.profile_type === "professional" && professionalProfile) {
        const { error } = await supabase
          .from("professional_profiles")
          .update({
            current_job_title: professionalProfile.current_job_title,
            company_name: professionalProfile.company_name,
            years_of_experience: professionalProfile.years_of_experience,
            highest_qualification: professionalProfile.highest_qualification,
            industry_field: professionalProfile.industry_field,
            preferred_destination: professionalProfile.preferred_destination,
            budget_min: professionalProfile.budget_min,
            budget_max: professionalProfile.budget_max,
            cv_file_url: professionalProfile.cv_file_url,
            cv_parsed_data: professionalProfile.cv_parsed_data,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)

        if (error) throw error

        // CHANGE: Use server-side API to clear cache
        if (preferencesChanged) {
          await clearCachedRecommendations()
          toast({
            title: "Profile updated",
            description:
              "Your preferences have changed. All recommendations will be regenerated based on your new settings.",
            duration: 5000,
          })
        }

        // Update original profile to reflect saved state
        setOriginalProfessionalProfile(JSON.parse(JSON.stringify(professionalProfile)))
      }

      // Show success toast even if no preferences changed
      if (!preferencesChanged) {
        toast({
          title: "Profile saved",
          description: "Your profile has been updated successfully",
        })
      }
    } catch (error) {
      console.error("Save error:", error)
      toast({
        title: "Save failed",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1e2a3e" }} />
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">Please log in to view your profile</p>
      </div>
    )
  }

  const currentYear = new Date().getFullYear()
  const graduationYears = Array.from({ length: 30 }, (_, i) => currentYear - i)
  const intakeYears = Array.from({ length: 5 }, (_, i) => currentYear + i)
  const experienceYears = Array.from({ length: 31 }, (_, i) => i)

  const studentMinimumBudget = getMinimumBudget("student")
  const professionalMinimumBudget = getMinimumBudget("professional")

  // <-- IMPORTANT FIXES: force strict boolean types so TS doesn't infer union types (null | boolean)
  const isStudentBelowMinimum: boolean =
    !!studentProfile && studentProfile.budget_max > 0 && studentProfile.budget_max < studentMinimumBudget

  const isProfessionalBelowMinimum: boolean =
    !!professionalProfile &&
    professionalProfile.budget_max > 0 &&
    professionalProfile.budget_max < professionalMinimumBudget

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600 mt-1">Manage your account details and preferences</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving || isStudentBelowMinimum || isProfessionalBelowMinimum}
            className="gap-2 px-6 py-2 rounded-lg transition-all duration-200"
            style={{ backgroundColor: "#1e2a3e", color: "white" }}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden h-full ">
              <div className="h-32 w-full" style={{ backgroundColor: "#1e2a3e" }} />
              <CardContent className="pt-0 px-6 pb-6">
                <div className="relative -top-12 mb-2">
                  <div className="w-28 h-28 rounded-2xl mx-auto overflow-hidden border-4 border-white shadow-lg bg-white">
                    <div className="relative w-full h-full">
                      {userProfile.avatar_url ? (
                        <Image
                          src={userProfile.avatar_url || "/placeholder.svg"}
                          alt="Profile"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: "#1e2a3e" }}
                        >
                          <User className="w-12 h-12 text-white" />
                        </div>
                      )}
                      <label
                        className="absolute bottom-1 right-1 p-2 rounded-full cursor-pointer transition-all hover:scale-110 shadow-lg"
                        style={{ backgroundColor: "#1e2a3e" }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          disabled={isUploadingAvatar}
                        />
                        {isUploadingAvatar ? (
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4 text-white" />
                        )}
                      </label>
                    </div>
                  </div>
                </div>
                <div className="text-center -mt-8">
                  <h2 className="text-xl font-bold text-gray-900">{userProfile.full_name || "User"}</h2>
                  <p className="text-gray-600 text-sm mt-1">{userProfile.email}</p>
                  <div
                    className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full text-sm font-medium capitalize"
                    style={{ backgroundColor: "#1e2a3e", color: "white" }}
                  >
                    <User className="w-3.5 h-3.5" />
                    {userProfile.profile_type} Account
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-2">
            {userProfile.profile_type === "student" && studentProfile && (
              <Card className="border-0 shadow-lg rounded-2xl overflow-hidden ">
                <CardHeader className="pb-3 pt-5" style={{ backgroundColor: "#1e2a3e" }}>
                  <CardTitle className="text-white flex items-center gap-3 mb-11">
                    <GraduationCap className="w-6 h-6 " />
                    Student Profile
                  </CardTitle>
                  <CardDescription className="text-gray-300 px-9">
                    Manage your academic information and study preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Tabs defaultValue="academic" className="w-full">
                    <TabsList className="w-full grid grid-cols-3 mb-8 bg-gray-100 p-1 rounded-xl">
                      <TabsTrigger
                        value="academic"
                        className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-lg transition-all"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Academic
                      </TabsTrigger>
                      <TabsTrigger
                        value="preferences"
                        className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-lg transition-all"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Preferences
                      </TabsTrigger>
                      <TabsTrigger
                        value="interests"
                        className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-lg transition-all"
                      >
                        <Award className="w-4 h-4 mr-2" />
                        Interests
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="academic" className="space-y-6 animate-in fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-3">
                          <Label className="text-gray-700 font-medium">Latest Qualification</Label>
                          <Select
                            value={studentProfile.latest_qualification || ""}
                            onValueChange={(v) => setStudentProfile({ ...studentProfile, latest_qualification: v })}
                          >
                            <SelectTrigger
                              className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-offset-0"
                              style={{ borderColor: "#e5e7eb", "--tw-ring-color": "#1e2a3e" } as React.CSSProperties}
                            >
                              <SelectValue placeholder="Select qualification" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-lg">
                              {QUALIFICATIONS.map((q) => (
                                <SelectItem key={q} value={q}>
                                  {q}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-gray-700 font-medium">University Name</Label>
                          <Input
                            value={studentProfile.university_name || ""}
                            onChange={(e) => setStudentProfile({ ...studentProfile, university_name: e.target.value })}
                            placeholder="Enter university name"
                            className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-offset-0"
                            style={{ "--tw-ring-color": "#1e2a3e" } as React.CSSProperties}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-gray-700 font-medium">Graduation Year</Label>
                          <Select
                            value={studentProfile.graduation_year?.toString() || ""}
                            onValueChange={(v) =>
                              setStudentProfile({ ...studentProfile, graduation_year: Number.parseInt(v) })
                            }
                          >
                            <SelectTrigger
                              className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-offset-0"
                              style={{ borderColor: "#e5e7eb", "--tw-ring-color": "#1e2a3e" } as React.CSSProperties}
                            >
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-lg">
                              {graduationYears.map((y) => (
                                <SelectItem key={y} value={y.toString()}>
                                  {y}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-gray-700 font-medium">Grade/CGPA</Label>
                          <Input
                            value={studentProfile.grade_cgpa || ""}
                            onChange={(e) => setStudentProfile({ ...studentProfile, grade_cgpa: e.target.value })}
                            placeholder="e.g., 3.8 GPA or 85%"
                            className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-offset-0"
                            style={{ "--tw-ring-color": "#1e2a3e" } as React.CSSProperties}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl">
                        <Label className="text-gray-700 font-medium">Currently Studying?</Label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors">
                            <Checkbox
                              checked={studentProfile.currently_studying === true}
                              onCheckedChange={() => setStudentProfile({ ...studentProfile, currently_studying: true })}
                              style={{ "--tw-ring-color": "#1e2a3e" } as React.CSSProperties}
                            />
                            <span className="text-gray-700">Yes</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors">
                            <Checkbox
                              checked={studentProfile.currently_studying === false}
                              onCheckedChange={() =>
                                setStudentProfile({ ...studentProfile, currently_studying: false })
                              }
                              style={{ "--tw-ring-color": "#1e2a3e" } as React.CSSProperties}
                            />
                            <span className="text-gray-700">No</span>
                          </label>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="preferences" className="space-y-6 animate-in fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-3">
                          <Label className="text-gray-700 font-medium">Degree to Pursue</Label>
                          <Select
                            value={studentProfile.degree_to_pursue || ""}
                            onValueChange={(v) => setStudentProfile({ ...studentProfile, degree_to_pursue: v })}
                          >
                            <SelectTrigger
                              className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-offset-0"
                              style={{ borderColor: "#e5e7eb", "--tw-ring-color": "#1e2a3e" } as React.CSSProperties}
                            >
                              <SelectValue placeholder="Select degree" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-lg">
                              {DEGREES.map((d) => (
                                <SelectItem key={d} value={d}>
                                  {d}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-gray-700 font-medium">Preferred Year of Intake</Label>
                          <Select
                            value={studentProfile.preferred_year_of_intake?.toString() || ""}
                            onValueChange={(v) =>
                              setStudentProfile({ ...studentProfile, preferred_year_of_intake: Number.parseInt(v) })
                            }
                          >
                            <SelectTrigger
                              className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-offset-0"
                              style={{ borderColor: "#e5e7eb", "--tw-ring-color": "#1e2a3e" } as React.CSSProperties}
                            >
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-lg">
                              {intakeYears.map((y) => (
                                <SelectItem key={y} value={y.toString()}>
                                  {y}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-5 p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-700 font-medium flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Budget Range (Total Education Cost)
                          </Label>
                          {studentProfile.budget_max > 0 && (
                            <span className="text-sm font-medium px-3 py-1.5 rounded-full bg-white">
                              ${studentProfile.budget_min.toLocaleString()} - $
                              {studentProfile.budget_max.toLocaleString()}
                            </span>
                          )}
                        </div>

                        <Select
                          value={studentProfile.budget_max > 0 ? `${studentProfile.budget_max}` : ""}
                          onValueChange={(value) => {
                            const bracket = STUDENT_BUDGET_BRACKETS.find((b) => b.max.toString() === value)
                            if (bracket) {
                              handleStudentBudgetChange(bracket.min, bracket.max)
                            }
                          }}
                        >
                          <SelectTrigger
                            className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-offset-0"
                            style={{ borderColor: "#e5e7eb", "--tw-ring-color": "#1e2a3e" } as React.CSSProperties}
                          >
                            <SelectValue placeholder="Select your budget range" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg">
                            {STUDENT_BUDGET_BRACKETS.map((bracket) => (
                              <SelectItem key={bracket.max} value={bracket.max.toString()}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{bracket.label}</span>
                                  <span className="text-xs text-muted-foreground">{bracket.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {studentProfile.budget_max > 0 && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Info className="w-4 h-4" />
                            <span>
                              Selected: ${studentProfile.budget_min.toLocaleString()} - $
                              {studentProfile.budget_max.toLocaleString()}
                            </span>
                          </div>
                        )}

                        {isStudentBelowMinimum && (
                          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-red-700">
                              <p className="font-medium">Budget too low</p>
                              <p>
                                The minimum budget for any country is ${studentMinimumBudget.toLocaleString()}. Please
                                select a higher budget range.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Label className="text-gray-700 font-medium">Preferred Destination</Label>
                        <Select
                          value={studentProfile.preferred_destination || ""}
                          onValueChange={(v) => setStudentProfile({ ...studentProfile, preferred_destination: v })}
                        >
                          <SelectTrigger
                            className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-offset-0"
                            style={{ borderColor: "#e5e7eb", "--tw-ring-color": "#1e2a3e" } as React.CSSProperties}
                          >
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg">
                            {COUNTRIES.map((c) => {
                              const budgetInfo = getStudentCountryBudgetInfo(c)
                              const isAffordable =
                                !budgetInfo || !studentProfile.budget_max || studentProfile.budget_max >= budgetInfo.min

                              return (
                                <SelectItem key={c} value={c} disabled={studentProfile.budget_max > 0 && !isAffordable}>
                                  <div className="flex items-center justify-between w-full gap-2">
                                    <span
                                      className={
                                        studentProfile.budget_max > 0 && !isAffordable
                                          ? "text-muted-foreground opacity-50"
                                          : ""
                                      }
                                    >
                                      {c}
                                    </span>
                                    {budgetInfo && studentProfile.budget_max > 0 && (
                                      <span className={`text-xs ${isAffordable ? "text-green-600" : "text-red-500"}`}>
                                        {isAffordable ? "✓ Affordable" : `Min: $${(budgetInfo.min / 1000).toFixed(0)}k`}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>

                        {/* Budget validation feedback */}
                        {studentProfile.preferred_destination && studentBudgetValidation && (
                          <>
                            {studentBudgetValidation.sufficient ? (
                              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-green-700">
                                  <p className="font-medium">
                                    Budget compatible with {studentProfile.preferred_destination}
                                  </p>
                                  <p>
                                    Typical range: ${studentBudgetValidation.minRequired.toLocaleString()} - $
                                    {studentBudgetValidation.maxRecommended.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              studentBudgetWarning && (
                                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                  <div className="text-sm text-amber-700">
                                    <p className="font-medium">Budget may be insufficient</p>
                                    <p>{studentBudgetWarning}</p>
                                    {studentAffordableCountries.length > 0 && (
                                      <p className="mt-1">
                                        <strong>Suggested alternatives:</strong>{" "}
                                        {studentAffordableCountries.slice(0, 4).join(", ")}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl">
                        <Label className="text-gray-700 font-medium">Apply for Scholarships?</Label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors">
                            <Checkbox
                              checked={studentProfile.apply_for_scholarships === true}
                              onCheckedChange={() =>
                                setStudentProfile({ ...studentProfile, apply_for_scholarships: true })
                              }
                              style={{ "--tw-ring-color": "#1e2a3e" } as React.CSSProperties}
                            />
                            <span className="text-gray-700">Yes</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors">
                            <Checkbox
                              checked={studentProfile.apply_for_scholarships === false}
                              onCheckedChange={() =>
                                setStudentProfile({ ...studentProfile, apply_for_scholarships: false })
                              }
                              style={{ "--tw-ring-color": "#1e2a3e" } as React.CSSProperties}
                            />
                            <span className="text-gray-700">No</span>
                          </label>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="interests" className="space-y-6 animate-in fade-in">
                      <div className="space-y-3">
                        <Label className="text-gray-700 font-medium">Select your interests</Label>
                        <Select
                          onValueChange={(v) => {
                            const interests = studentProfile.fields_of_interest || []
                            if (!interests.includes(v)) {
                              setStudentProfile({ ...studentProfile, fields_of_interest: [...interests, v] })
                            }
                          }}
                          value=""
                        >
                          <SelectTrigger
                            className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-offset-0"
                            style={{ borderColor: "#e5e7eb", "--tw-ring-color": "#1e2a3e" } as React.CSSProperties}
                          >
                            <SelectValue placeholder="Add field of interest" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg">
                            {FIELDS_OF_INTEREST.filter(
                              (f) => !(studentProfile.fields_of_interest || []).includes(f),
                            ).map((f) => (
                              <SelectItem key={f} value={f}>
                                {f}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {(studentProfile.fields_of_interest || []).length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {(studentProfile.fields_of_interest || []).map((interest) => (
                              <span
                                key={interest}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium"
                              >
                                {interest}
                                <button
                                  onClick={() => {
                                    setStudentProfile({
                                      ...studentProfile,
                                      fields_of_interest: (studentProfile.fields_of_interest || []).filter(
                                        (i) => i !== interest,
                                      ),
                                    })
                                  }}
                                  className="hover:text-blue-600"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <Label className="text-gray-700 font-medium">Why this field? (Optional)</Label>
                        <Textarea
                          value={studentProfile.why_this_field || ""}
                          onChange={(e) => setStudentProfile({ ...studentProfile, why_this_field: e.target.value })}
                          placeholder="Tell us why you're interested in this field..."
                          className="min-h-[120px] rounded-lg border-gray-300 focus:ring-2 focus:ring-offset-0"
                          style={{ "--tw-ring-color": "#1e2a3e" } as React.CSSProperties}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {userProfile.profile_type === "professional" && professionalProfile && (
              <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="pb-3 pt-5" style={{ backgroundColor: "#1e2a3e" }}>
                  <CardTitle className="text-white flex items-center gap-3 mb-11">
                    <Briefcase className="w-6 h-6" />
                    Professional Profile
                  </CardTitle>
                  <CardDescription className="text-gray-300 px-9">
                    Manage your work experience and career preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Tabs defaultValue="work" className="w-full">
                    <TabsList className="w-full grid grid-cols-3 mb-8 bg-gray-100 p-1 rounded-xl">
                      <TabsTrigger
                        value="work"
                        className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-lg transition-all"
                      >
                        <Building className="w-4 h-4 mr-2" />
                        Work
                      </TabsTrigger>
                      <TabsTrigger
                        value="preferences"
                        className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-lg transition-all"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Preferences
                      </TabsTrigger>
                      <TabsTrigger
                        value="cv"
                        className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-lg transition-all"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Resume/CV
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="work" className="space-y-6 animate-in fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-3">
                          <Label className="text-gray-700 font-medium">Current Job Title</Label>
                          <Input
                            value={professionalProfile.current_job_title || ""}
                            onChange={(e) =>
                              setProfessionalProfile({ ...professionalProfile, current_job_title: e.target.value })
                            }
                            placeholder="e.g., Software Engineer"
                            className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-offset-0"
                            style={{ "--tw-ring-color": "#1e2a3e" } as React.CSSProperties}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-gray-700 font-medium">Company Name</Label>
                          <Input
                            value={professionalProfile.company_name || ""}
                            onChange={(e) =>
                              setProfessionalProfile({ ...professionalProfile, company_name: e.target.value })
                            }
                            placeholder="e.g., Google"
                            className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-offset-0"
                            style={{ "--tw-ring-color": "#1e2a3e" } as React.CSSProperties}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-gray-700 font-medium">Years of Experience</Label>
                          <Select
                            value={professionalProfile.years_of_experience?.toString() || ""}
                            onValueChange={(v) =>
                              setProfessionalProfile({
                                ...professionalProfile,
                                years_of_experience: Number.parseInt(v),
                              })
                            }
                          >
                            <SelectTrigger
                              className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-offset-0"
                              style={
                                {
                                  borderColor: "#e5e7eb",
                                  "--tw-ring-color": "#1e2a3e",
                                } as React.CSSProperties
                              }
                            >
                              <SelectValue placeholder="Select years" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-lg">
                              {experienceYears.map((y) => (
                                <SelectItem key={y} value={y.toString()}>
                                  {y === 0 ? "Less than 1 year" : y === 1 ? "1 year" : `${y} years`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-gray-700 font-medium">Highest Qualification</Label>
                          <Select
                            value={professionalProfile.highest_qualification || ""}
                            onValueChange={(v) =>
                              setProfessionalProfile({ ...professionalProfile, highest_qualification: v })
                            }
                          >
                            <SelectTrigger
                              className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-offset-0"
                              style={{ borderColor: "#e5e7eb", "--tw-ring-color": "#1e2a3e" } as React.CSSProperties}
                            >
                              <SelectValue placeholder="Select qualification" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-lg">
                              {QUALIFICATIONS.map((q) => (
                                <SelectItem key={q} value={q}>
                                  {q}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-gray-700 font-medium">Industry/Field</Label>
                          <Select
                            value={professionalProfile.industry_field || ""}
                            onValueChange={(v) => setProfessionalProfile({ ...professionalProfile, industry_field: v })}
                          >
                            <SelectTrigger
                              className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-offset-0"
                              style={{ borderColor: "#e5e7eb", "--tw-ring-color": "#1e2a3e" } as React.CSSProperties}
                            >
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-lg">
                              {INDUSTRIES.map((i) => (
                                <SelectItem key={i} value={i}>
                                  {i}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="preferences" className="space-y-6 animate-in fade-in">
                      <div className="space-y-5 p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-700 font-medium flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Budget Range (Initial Settlement Cost)
                          </Label>
                          {professionalProfile.budget_max > 0 && (
                            <span className="text-sm font-medium px-3 py-1.5 rounded-full bg-white">
                              ${professionalProfile.budget_min.toLocaleString()} - $
                              {professionalProfile.budget_max.toLocaleString()}
                            </span>
                          )}
                        </div>

                        <Select
                          value={professionalProfile.budget_max > 0 ? `${professionalProfile.budget_max}` : ""}
                          onValueChange={(value) => {
                            const bracket = PROFESSIONAL_BUDGET_BRACKETS.find((b) => b.max.toString() === value)
                            if (bracket) {
                              handleProfessionalBudgetChange(bracket.min, bracket.max)
                            }
                          }}
                        >
                          <SelectTrigger
                            className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-offset-0"
                            style={{ borderColor: "#e5e7eb", "--tw-ring-color": "#1e2a3e" } as React.CSSProperties}
                          >
                            <SelectValue placeholder="Select your budget range" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg">
                            {PROFESSIONAL_BUDGET_BRACKETS.map((bracket) => (
                              <SelectItem key={bracket.max} value={bracket.max.toString()}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{bracket.label}</span>
                                  <span className="text-xs text-muted-foreground">{bracket.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {professionalProfile.budget_max > 0 && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Info className="w-4 h-4" />
                            <span>
                              Selected: ${professionalProfile.budget_min.toLocaleString()} - $
                              {professionalProfile.budget_max.toLocaleString()} (Initial settlement costs)
                            </span>
                          </div>
                        )}

                        {isProfessionalBelowMinimum && (
                          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-red-700">
                              <p className="font-medium">Budget too low</p>
                              <p>
                                The minimum initial settlement budget for any country is $
                                {professionalMinimumBudget.toLocaleString()}. Please select a higher budget range.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Label className="text-gray-700 font-medium">Preferred Destination</Label>
                        <Select
                          value={professionalProfile.preferred_destination || ""}
                          onValueChange={(v) =>
                            setProfessionalProfile({ ...professionalProfile, preferred_destination: v })
                          }
                        >
                          <SelectTrigger
                            className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-offset-0"
                            style={{ borderColor: "#e5e7eb", "--tw-ring-color": "#1e2a3e" } as React.CSSProperties}
                          >
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg">
                            {COUNTRIES.map((c) => {
                              const budgetInfo = getProfessionalCountryBudgetInfo(c)
                              const isAffordable =
                                !budgetInfo ||
                                !professionalProfile.budget_max ||
                                professionalProfile.budget_max >= budgetInfo.min

                              return (
                                <SelectItem
                                  key={c}
                                  value={c}
                                  disabled={professionalProfile.budget_max > 0 && !isAffordable}
                                >
                                  <div className="flex items-center justify-between w-full gap-2">
                                    <span
                                      className={
                                        professionalProfile.budget_max > 0 && !isAffordable
                                          ? "text-muted-foreground opacity-50"
                                          : ""
                                      }
                                    >
                                      {c}
                                    </span>
                                    {budgetInfo && professionalProfile.budget_max > 0 && (
                                      <span className={`text-xs ${isAffordable ? "text-green-600" : "text-red-500"}`}>
                                        {isAffordable ? "✓ Affordable" : `Min: $${(budgetInfo.min / 1000).toFixed(1)}k`}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>

                        {/* Budget validation feedback */}
                        {professionalProfile.preferred_destination && professionalBudgetValidation && (
                          <>
                            {professionalBudgetValidation.sufficient ? (
                              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-green-700">
                                  <p className="font-medium">
                                    Budget compatible with {professionalProfile.preferred_destination}
                                  </p>
                                  <p>
                                    Typical initial costs: ${professionalBudgetValidation.minRequired.toLocaleString()}{" "}
                                    - ${professionalBudgetValidation.maxRecommended.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              professionalBudgetWarning && (
                                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                  <div className="text-sm text-amber-700">
                                    <p className="font-medium">Budget may be insufficient</p>
                                    <p>{professionalBudgetWarning}</p>
                                    {professionalAffordableCountries.length > 0 && (
                                      <p className="mt-1">
                                        <strong>Suggested alternatives:</strong>{" "}
                                        {professionalAffordableCountries.slice(0, 4).join(", ")}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )
                            )}
                          </>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="cv" className="space-y-6 animate-in fade-in">
                      {!cvFileName ? (
                        <div className="relative border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center transition-all cursor-pointer hover:border-blue-500 hover:bg-blue-50/50">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={(e) => e.target.files?.[0] && handleCVUpload(e.target.files[0])}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={isUploadingCV}
                          />
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-20 h-20 rounded-xl bg-blue-100 flex items-center justify-center">
                              <Upload className="w-10 h-10" style={{ color: "#1e2a3e" }} />
                            </div>
                            <div>
                              <p className="text-lg font-semibold text-gray-900">Upload CV</p>
                              <p className="text-sm text-gray-600 mt-1">PDF, DOC, DOCX, or TXT (max 10MB)</p>
                              <p className="text-xs text-gray-500 mt-2">Click or drag to upload</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-gray-200 rounded-2xl p-6 bg-white">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-green-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 truncate max-w-64">{cvFileName}</p>
                                {isUploadingCV ? (
                                  <p className="text-sm text-gray-600 flex items-center gap-2">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Parsing CV...
                                  </p>
                                ) : professionalProfile.cv_parsed_data ? (
                                  <p className="text-sm text-green-600 flex items-center gap-2">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Parsed successfully
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setCvFileName(null)
                                setProfessionalProfile({
                                  ...professionalProfile,
                                  cv_file_url: null,
                                  cv_parsed_data: null,
                                })
                                setCvParseError(null)
                              }}
                              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                              disabled={isUploadingCV}
                            >
                              <X className="w-5 h-5 text-gray-500" />
                            </button>
                          </div>
                        </div>
                      )}

                      {cvParseError && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                          <p className="text-sm text-red-700 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {cvParseError}
                          </p>
                        </div>
                      )}

                      {professionalProfile.cv_parsed_data && (
                        <div className="bg-blue-50 rounded-2xl p-6 space-y-4">
                          <h3 className="font-semibold text-gray-900 text-lg">Extracted Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {professionalProfile.cv_parsed_data.personalInfo?.name && (
                              <div>
                                <p className="text-sm text-gray-600">Name</p>
                                <p className="font-medium">{professionalProfile.cv_parsed_data.personalInfo.name}</p>
                              </div>
                            )}
                            {professionalProfile.cv_parsed_data.personalInfo?.email && (
                              <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="font-medium">{professionalProfile.cv_parsed_data.personalInfo.email}</p>
                              </div>
                            )}
                            {professionalProfile.cv_parsed_data.skills &&
                              professionalProfile.cv_parsed_data.skills.length > 0 && (
                                <div className="md:col-span-2">
                                  <p className="text-sm text-gray-600 mb-2">Skills</p>
                                  <div className="flex flex-wrap gap-2">
                                    {professionalProfile.cv_parsed_data.skills.slice(0, 8).map((skill, i) => (
                                      <span
                                        key={i}
                                        className="px-3 py-1.5 bg-white text-gray-800 rounded-lg text-sm font-medium border border-blue-200"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                    {professionalProfile.cv_parsed_data.skills.length > 8 && (
                                      <span className="px-3 py-1.5 text-gray-600 text-sm">
                                        +{professionalProfile.cv_parsed_data.skills.length - 8} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            {professionalProfile.cv_parsed_data.experience &&
                              professionalProfile.cv_parsed_data.experience.length > 0 && (
                                <div>
                                  <p className="text-sm text-gray-600">Experience</p>
                                  <p className="font-medium">
                                    {professionalProfile.cv_parsed_data.experience.length} position(s)
                                  </p>
                                </div>
                              )}
                            {professionalProfile.cv_parsed_data.education &&
                              professionalProfile.cv_parsed_data.education.length > 0 && (
                                <div>
                                  <p className="text-sm text-gray-600">Education</p>
                                  <p className="font-medium">
                                    {professionalProfile.cv_parsed_data.education.length} entry(ies)
                                  </p>
                                </div>
                              )}
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
