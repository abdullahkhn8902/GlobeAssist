"use client"

import { User, GraduationCap, MapPin, Calendar, DollarSign, Award } from "lucide-react"

interface StudentProfileData {
  latestQualification: string
  universityName: string
  graduationYear: number
  gradeCgpa: string
  currentlyStudying: boolean
  degreeToPursue: string
  preferredDestination: string
  preferredYearOfIntake: number
  budgetMin: number
  budgetMax: number
  applyForScholarships: boolean
}

interface StudentProfileProps {
  profile: StudentProfileData
}

export function StudentProfile({ profile }: StudentProfileProps) {
  return (
    <div className="bg-slate-800 rounded-2xl p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center">
          <User className="w-10 h-10 text-slate-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Student Profile</h2>
          <p className="text-slate-400">Your academic information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Education
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-slate-400 text-sm">Latest Qualification</p>
              <p className="text-white">{profile.latestQualification}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">University</p>
              <p className="text-white">{profile.universityName}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Graduation Year</p>
              <p className="text-white">{profile.graduationYear}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Grade/CGPA</p>
              <p className="text-white">{profile.gradeCgpa}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Status</p>
              <p className="text-white">{profile.currentlyStudying ? "Currently Studying" : "Graduated"}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Study Abroad Preferences
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-slate-400 text-sm">Degree to Pursue</p>
              <p className="text-white">{profile.degreeToPursue}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Preferred Destination</p>
              <p className="text-white">{profile.preferredDestination}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Preferred Year of Intake
              </p>
              <p className="text-white">{profile.preferredYearOfIntake}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                Budget Range (Monthly)
              </p>
              <p className="text-white">
                ${profile.budgetMin.toLocaleString()} – ${profile.budgetMax.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm flex items-center gap-1">
                <Award className="w-4 h-4" />
                Scholarship Interest
              </p>
              <p className="text-white">{profile.applyForScholarships ? "Yes, applying for scholarships" : "No"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
