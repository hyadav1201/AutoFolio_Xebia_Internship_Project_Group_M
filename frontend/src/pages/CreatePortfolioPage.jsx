"use client"

import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { useToast } from "../hooks/use-toast"
import { ArrowRight, ArrowLeft, Zap, Upload, FileCheck, Edit3 } from "lucide-react"
import { TemplateSelector3D } from "../components/3d/template-selector-3d"

// Import all form components
import { ResumeUploadSection } from "../components/portfolio/ResumeUploadSection"
import { PersonalInfoForm } from "../components/portfolio/PersonalInfoForm"
import { ContactInfoForm } from "../components/portfolio/ContactInfoForm"
import { AboutSectionForm } from "../components/portfolio/AboutSectionForm"
import { SkillsForm } from "../components/portfolio/SkillsForm"
import { ProjectsForm } from "../components/portfolio/ProjectsForm"
import { ExperienceForm } from "../components/portfolio/ExperienceForm"
import { EducationForm } from "../components/portfolio/EducationForm"
import { AdditionalSectionsForm } from "../components/portfolio/AdditionalSectionsForm"
import { useAuth } from "../components/auth-provider"
import { API_ENDPOINTS } from "../config/api"


export default function CreatePortfolioPage() {
  const [step, setStep] = useState(1)
  const [dataSource, setDataSource] = useState(null) // 'resume' or 'manual'
  const [autoOpenFilePicker, setAutoOpenFilePicker] = useState(false)
  const [isProcessingResume, setIsProcessingResume] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStatus, setProcessingStatus] = useState("")
  const [portfolioData, setPortfolioData] = useState({
    // Personal Info
    fullName: "",
    profilePicture: null,
    shortBio: "",
    currentRole: "",
    location: "",

    // Contact Info
    email: "",
    phone: "",
    linkedinUrl: "",
    githubUrl: "",
    twitterUrl: "",
    blogUrl: "",
    whatsappUrl: "",
    telegramUrl: "",

    // About Section
    aboutMe: "",
    careerGoals: "",
    resumeFile: null,
    resumePdfLink: "",

    // Skills
    technicalSkills: [],
    softSkills: [],
    toolsAndTech: [],

    // Projects
    projects: [],

    // Experience
    experience: [],

    // Education
    education: [],

    // Additional Sections
    certifications: [],
    awards: [],
    testimonials: [],
    blogs: [],
    languages: [],
    hobbies: "",
    openSource: [],
    socialProof: {
      leetcode: "",
      hackerrank: "",
      behance: "",
      dribbble: "",
    },

    // Template
    template: "modern",

    // Metadata
    extractedFromResume: new Set(), // Track which fields were extracted
  })

  const { toast } = useToast()
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [isAboutMeLoading, setIsAboutMeLoading] = useState(false);

  useEffect(() => {
    const hasPaid = localStorage.getItem("hasPaid")
    if (!loading && user && hasPaid !== "true") {
      navigate("/pricing")
    }
  }, [user, loading, navigate])

  useEffect(() => {
    const fetchPortfolio = async () => {
      const token = localStorage.getItem("token")
      if (!token) return
      try {
        const res = await fetch(API_ENDPOINTS.PORTFOLIO, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setPortfolioData((prev) => ({ ...prev, ...data }))
        }
      } catch (err) {
        // ignore if not found
      }
    }
    fetchPortfolio()
  }, [])

  const steps = [
    { id: 1, title: "Data Source", description: "Choose how to provide your information" },
    { id: 2, title: "Personal Info", description: "Basic personal information" },
    { id: 3, title: "Contact", description: "Contact information" },
    { id: 4, title: "About", description: "About section and resume" },
    { id: 5, title: "Skills", description: "Technical and soft skills" },
    { id: 6, title: "Projects", description: "Your projects and work" },
    { id: 7, title: "Experience", description: "Work experience" },
    { id: 8, title: "Education", description: "Educational background" },
    { id: 9, title: "Additional", description: "Certifications, awards, etc." },
    { id: 10, title: "Template", description: "Choose your template" },
  ]

  const handleNext = () => {
    if (step < steps.length) setStep(step + 1)
  }

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleDataSourceSelect = (source) => {
    setDataSource(source)
    if (source === "manual") {
      handleNext()
    } else if (source === "resume") {
      setAutoOpenFilePicker(true)
      handleNext()
    }
  }

  // Helper: map certifications (pair each certificate name with the following 'View Certificate' line, and extract link if present)
  const mapCertifications = (certArr) => {
    if (!Array.isArray(certArr)) return [];
    const result = [];
    for (let i = 0; i < certArr.length; i++) {
      let cert = certArr[i]?.trim();
      if (!cert || cert.toLowerCase() === 'view certificate') continue;
      // If next line is 'View Certificate', pair them
      let link = '';
      if (
        certArr[i + 1] &&
        typeof certArr[i + 1] === 'string' &&
        certArr[i + 1].trim().toLowerCase().startsWith('view certificate')
      ) {
        // Try to extract URL from the next line if present
        const urlMatch = certArr[i + 1].match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) link = urlMatch[0];
        i++; // Skip the next line
      }
      // Also try to extract URL from the current line
      const urlMatch = cert.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        link = urlMatch[0];
        cert = cert.replace(urlMatch[0], '').replace(/View Certificate:?/i, '').trim();
      }
      result.push({ name: cert, link });
    }
    return result;
  };

  // Helper: extract projects from Affinda sections
  const mapProjects = (extractedData) => {
    if (Array.isArray(extractedData.projects) && extractedData.projects.length > 0) {
      return extractedData.projects;
    }
    // Try to extract from sections
    if (Array.isArray(extractedData.sections)) {
      const projectSection = extractedData.sections.find(
        (s) => s.sectionType && s.sectionType.toLowerCase().includes('project')
      );
      if (projectSection && projectSection.text) {
        // Split by double newlines or project titles
        const lines = projectSection.text.split(/\n{2,}|\n(?=[A-Z][^\n]+\n)/).map(l => l.trim()).filter(Boolean);
        // Try to parse each project
        return lines.map(line => {
          // Try to extract name, tech, and description
          const nameMatch = line.match(/^[^\n]+/);
          const name = nameMatch ? nameMatch[0].split('\n')[0] : '';
          // Try to extract tech stack (comma or | separated) - simplified regex to avoid ReDoS
          const techMatch = line.match(/[A-Za-z0-9\-., ]+(?=\n|\|)/);
          const tech = techMatch ? techMatch[0].split(/[,|]/).map(t => t.trim()).filter(Boolean) : [];
          // Description: everything after the first line
          const desc = line.split('\n').slice(1).join(' ').trim();
          return { name, tech, description: desc };
        });
      }
    }
    return [];
  };

  const handleResumeProcessingError = (error) => {
    // Reset processing state
    setIsProcessingResume(false);
    setProcessingProgress(0);
    setProcessingStatus("");
    
    toast({
      title: "Resume Processing Failed",
      description: error || "Failed to process resume. You can retry or enter information manually.",
      variant: "destructive",
      duration: 5000,
    })
  }

  const handleResumeProcessed = async (extractedData, huggingFaceError) => {
    // Set initial processing state
    setIsProcessingResume(true);
    setProcessingProgress(50);
    setProcessingStatus("Populating form fields...");
    
    // Log the full Affinda response for mapping
    
    // Map as many fields as possible from extractedData (except About Me)
    // Extract current role from profession or latest work experience
    const currentRole = extractedData.profession || 
      (Array.isArray(extractedData.workExperience) && extractedData.workExperience.length > 0
        ? extractedData.workExperience[0]?.jobTitle
        : null) || '';
    
    // Extract location from various possible fields
    const location = extractedData.location?.formatted || 
      extractedData.location?.city || 
      extractedData.location || '';
    
    // Generate short bio from summary or objective
    const shortBio = extractedData.summary || 
      extractedData.objective || 
      extractedData.tagline || '';
    
    // Extract social media URLs from websites array
    const websites = Array.isArray(extractedData.websites) ? extractedData.websites : [];
    
    // Extract and cache URL findings to avoid repeated iterations
    const linkedinUrl = extractedData.linkedin || 
      websites.find(url => url && url.includes('linkedin.com')) || '';
    const githubUrl = extractedData.github || 
      websites.find(url => url && url.includes('github.com')) || '';
    const twitterUrl = extractedData.twitter || 
      websites.find(url => url && (url.includes('twitter.com') || url.includes('x.com'))) || '';
    // Match blog URLs more specifically to avoid false positives
    const blogUrl = extractedData.blog || 
      websites.find(url => url && (
        url.includes('medium.com') || 
        url.includes('dev.to') || 
        url.includes('hashnode') ||
        url.match(/\/(blog|posts?)\b/i)
      )) || '';
    const whatsappUrl = extractedData.whatsapp || 
      websites.find(url => url && url.includes('wa.me')) || '';
    const telegramUrl = extractedData.telegram || 
      websites.find(url => url && url.includes('t.me')) || '';
    
    // Process projects once and reuse
    const extractedProjects = mapProjects(extractedData);
    
    setPortfolioData((prev) => ({
      ...prev,
      fullName: extractedData.name?.raw || extractedData.fullName || prev.fullName,
      currentRole: currentRole || prev.currentRole,
      location: location || prev.location,
      shortBio: shortBio || prev.shortBio,
      email: extractedData.emails?.[0] || extractedData.email || prev.email,
      phone: extractedData.phoneNumbers?.[0] || extractedData.phone || prev.phone,
      linkedinUrl: linkedinUrl || prev.linkedinUrl,
      githubUrl: githubUrl || prev.githubUrl,
      twitterUrl: twitterUrl || prev.twitterUrl,
      blogUrl: blogUrl || prev.blogUrl,
      whatsappUrl: whatsappUrl || prev.whatsappUrl,
      telegramUrl: telegramUrl || prev.telegramUrl,
      education:
        Array.isArray(extractedData.education)
          ? extractedData.education.map(edu => ({
              degree: edu.accreditation?.inputStr || edu.degree || '',
              institution: edu.organization || '',
              startYear: edu.startDate || '',
              endYear: edu.endDate || '',
              percentage: edu.percentage || edu.grade || edu.gpa || '',
              cgpa: edu.cgpa || edu.gpa || '',
            })).filter(edu => edu.degree || edu.institution)
          : prev.education,
      experience: extractedData.workExperience || extractedData.experience || prev.experience,
      technicalSkills:
        Array.isArray(extractedData.skills)
          ? extractedData.skills.map(skill =>
              typeof skill === 'string'
                ? skill
                : skill.name || ''
            ).filter(Boolean)
          : prev.technicalSkills,
      softSkills: extractedData.softSkills || prev.softSkills,
      toolsAndTech: extractedData.toolsAndTech || prev.toolsAndTech,
      projects: extractedProjects,
      awards: extractedData.awards || prev.awards,
      certifications: mapCertifications(extractedData.certifications),
      careerGoals: extractedData.careerGoals || prev.careerGoals,
      // About Me will be handled separately
      // Track which fields were actually extracted and populated
      extractedFromResume: new Set([
        ...(extractedData.name?.raw || extractedData.fullName ? ['fullName'] : []),
        ...(currentRole ? ['currentRole'] : []),
        ...(location ? ['location'] : []),
        ...(shortBio ? ['shortBio'] : []),
        ...(extractedData.emails?.[0] || extractedData.email ? ['email'] : []),
        ...(extractedData.phoneNumbers?.[0] || extractedData.phone ? ['phone'] : []),
        ...(linkedinUrl ? ['linkedinUrl'] : []),
        ...(githubUrl ? ['githubUrl'] : []),
        ...(twitterUrl ? ['twitterUrl'] : []),
        ...(blogUrl ? ['blogUrl'] : []),
        ...(whatsappUrl ? ['whatsappUrl'] : []),
        ...(telegramUrl ? ['telegramUrl'] : []),
        ...(Array.isArray(extractedData.education) && extractedData.education.length > 0 ? ['education'] : []),
        ...(extractedData.workExperience || extractedData.experience ? ['experience'] : []),
        ...(Array.isArray(extractedData.skills) && extractedData.skills.length > 0 ? ['technicalSkills'] : []),
        ...(extractedData.softSkills ? ['softSkills'] : []),
        ...(extractedData.toolsAndTech ? ['toolsAndTech'] : []),
        ...(extractedProjects.length > 0 ? ['projects'] : []),
        ...(extractedData.awards ? ['awards'] : []),
        ...(extractedData.certifications ? ['certifications'] : []),
        ...(extractedData.careerGoals ? ['careerGoals'] : []),
      ]),
    }))
    
    // Update progress after populating fields
    setProcessingProgress(70);
    setProcessingStatus("Generating personalized About Me section...");
    setIsAboutMeLoading(true);
    
    // Trigger About Me generation as a separate async step with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('About Me generation timeout')), 30000)
    );
    
    const fetchPromise = fetch(API_ENDPOINTS.PORTFOLIO_GENERATE_ABOUT_ME, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ extractedData }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to generate About Me');
        return res.json();
      })
      .then(data => {
        setPortfolioData(prev => ({ ...prev, aboutMe: data.aboutMe || prev.aboutMe }));
        setProcessingProgress(100);
        setProcessingStatus("Processing complete!");
      });
    
    try {
      await Promise.race([fetchPromise, timeoutPromise]);
    } catch (error) {
      console.error('About Me generation failed:', error);
      // Continue even if About Me generation fails
      setProcessingProgress(100);
      setProcessingStatus("Processing complete (About Me skipped)");
    } finally {
      setIsAboutMeLoading(false);
      
      // Show success message
      if (huggingFaceError) {
        toast({
          title: "AI Generation Warning",
          description: `Some AI-generated fields may be missing: ${huggingFaceError}`,
          variant: "destructive",
          duration: 6000,
        })
      } else {
        toast({
          title: "Resume processed successfully!",
          description: "Your information has been extracted. You can review and edit it.",
          duration: 3000,
        })
      }
      
      // Wait a moment for user to see completion, then proceed
      setTimeout(() => {
        setIsProcessingResume(false);
        setProcessingProgress(0);
        setProcessingStatus("");
        handleNext();
      }, 1000);
    }
  }

  const updatePortfolioData = (section, data) => {
    setPortfolioData((prev) => ({
      ...prev,
      [section]: data,
    }))
  }

  const handleSubmit = async () => {
    // Validate required fields
    const requiredFields = {
      fullName: portfolioData.fullName,
      email: portfolioData.email,
      linkedinUrl: portfolioData.linkedinUrl,
      githubUrl: portfolioData.githubUrl,
      aboutMe: portfolioData.aboutMe,
      technicalSkills: portfolioData.technicalSkills.length > 0,
      projects: portfolioData.projects.length > 0,
      education: portfolioData.education.length > 0,
    }

    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) => !value)
      .map(([key]) => key)

    if (missingFields.length > 0) {
      toast({
        title: "Missing required information",
        description: `Please fill in: ${missingFields.join(", ")}`,
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(API_ENDPOINTS.PORTFOLIO, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(portfolioData),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to save portfolio")
      }
      toast({
        title: "Portfolio saved!",
        description: "Redirecting to dashboard...",
        duration: 2000,
      })
      navigate("/dashboard")
    } catch (error) {
      toast({
        title: "Failed to save portfolio",
        description: error.message || "Please try again",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">How would you like to provide your information?</h2>
              <p className="text-gray-600">Choose the method that works best for you</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Resume Upload Option */}
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
                onClick={() => handleDataSourceSelect("resume")}
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Upload Resume</h3>
                  <p className="text-gray-600 mb-4">
                    Upload your resume and we&apos;ll automatically extract all your information using AI
                  </p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center justify-center">
                      <FileCheck className="w-4 h-4 mr-2" />
                      <span>Supports PDF, DOC, DOCX</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <Edit3 className="w-4 h-4 mr-2" />
                      <span>Review and edit extracted data</span>
                    </div>
                  </div>
                  <Button className="mt-4 w-full">Choose This Option</Button>
                </CardContent>
              </Card>

              {/* Manual Entry Option */}
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-500"
                onClick={() => handleDataSourceSelect("manual")}
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Edit3 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Manual Entry</h3>
                  <p className="text-gray-600 mb-4">Fill in your information manually using our guided forms</p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center justify-center">
                      <FileCheck className="w-4 h-4 mr-2" />
                      <span>Step-by-step guidance</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <Edit3 className="w-4 h-4 mr-2" />
                      <span>Full control over your data</span>
                    </div>
                  </div>
                  <Button variant="outline" className="mt-4 w-full border-green-500 text-green-600 hover:bg-green-50">
                    Choose This Option
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case 2:
        if (dataSource === "resume") {
          return (
            <ResumeUploadSection
              onResumeProcessed={handleResumeProcessed}
              onProcessingError={handleResumeProcessingError}
              portfolioData={portfolioData}
              updatePortfolioData={updatePortfolioData}
              autoOpenFilePicker={autoOpenFilePicker}
              setAutoOpenFilePicker={setAutoOpenFilePicker}
              isProcessingResume={isProcessingResume}
              processingProgress={processingProgress}
              processingStatus={processingStatus}
            />
          )
        } else {
          return (
            <PersonalInfoForm
              data={portfolioData}
              updateData={updatePortfolioData}
              extractedFields={portfolioData.extractedFromResume}
            />
          )
        }

      case 3:
        return (
          <ContactInfoForm
            data={portfolioData}
            updateData={updatePortfolioData}
            extractedFields={portfolioData.extractedFromResume}
          />
        )

      case 4:
        return (
          <AboutSectionForm
            data={portfolioData}
            updateData={updatePortfolioData}
            extractedFields={portfolioData.extractedFromResume}
            isAboutMeLoading={isAboutMeLoading}
          />
        )

      case 5:
        return (
          <SkillsForm
            data={portfolioData}
            updateData={updatePortfolioData}
            extractedFields={portfolioData.extractedFromResume}
          />
        )

      case 6:
        return (
          <ProjectsForm
            data={portfolioData}
            updateData={updatePortfolioData}
            extractedFields={portfolioData.extractedFromResume}
          />
        )

      case 7:
        return (
          <ExperienceForm
            data={portfolioData}
            updateData={updatePortfolioData}
            extractedFields={portfolioData.extractedFromResume}
          />
        )

      case 8:
        return (
          <EducationForm
            data={portfolioData}
            updateData={updatePortfolioData}
            extractedFields={portfolioData.extractedFromResume}
          />
        )

      case 9:
        return (
          <AdditionalSectionsForm
            data={portfolioData}
            updateData={updatePortfolioData}
            extractedFields={portfolioData.extractedFromResume}
          />
        )

      case 10:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Choose Your Template</h2>
              <p className="text-gray-600">Select a template that best represents your style</p>
            </div>
            <TemplateSelector3D
              templates={[
                { id: "modern", name: "Modern", description: "Clean and professional", color: "#3b82f6" },
                { id: "creative", name: "Creative", description: "Bold and artistic", color: "#8b5cf6" },
                { id: "minimal", name: "Minimal", description: "Simple and elegant", color: "#10b981" },
                { id: "tech", name: "Tech", description: "Perfect for developers", color: "#f59e0b" },
              ]}
              selectedTemplate={portfolioData.template}
              onSelect={(templateId) => updatePortfolioData("template", templateId)}
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">AutoFolio</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Badge variant="outline">
              Step {step} of {steps.length}
            </Badge>
            <Link to="/dashboard">
              <Button variant="ghost">Cancel</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Your Portfolio</h1>
          <p className="text-gray-600">{steps[step - 1]?.description}</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 overflow-x-auto">
          <div className="flex items-center space-x-2">
            {steps.map((stepItem, index) => (
              <div key={stepItem.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    stepItem.id <= step ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {stepItem.id}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-1 mx-1 ${stepItem.id < step ? "bg-blue-600" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-6">{renderStepContent()}</CardContent>

          {/* Navigation */}
          {step > 1 && (
            <div className="flex justify-between p-6 border-t">
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                disabled={isProcessingResume}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              {step < steps.length ? (
                <Button 
                  onClick={handleNext}
                  disabled={isProcessingResume}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isProcessingResume}
                >
                  Save Portfolio
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}