"use client"

import { useRef, useState } from "react"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Upload, FileText, CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { API_ENDPOINTS } from "../../config/api"
import { parseResumeFile } from "../../utils/pdfParser"

export function ResumeUploadSection({ onResumeProcessed }) {
  const fileInputRef = useRef(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [uploadedFilePath, setUploadedFilePath] = useState("")

  const handleFileChange = async (e) => {
    setUploadError("")
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (file.type !== "application/pdf") {
      setUploadError("Please upload a PDF file only.")
      return
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be less than 5MB.")
      return
    }
    
    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append("resume", file)
      
      const res = await fetch(API_ENDPOINTS.PORTFOLIO_UPLOAD_RESUME, {
        method: "POST",
        body: formData,
      })
      
      if (!res.ok) {
        const err = await res.json()
        setUploadError(err.error || "Failed to upload resume.")
        setIsUploading(false)
        return
      }
      
      const data = await res.json()
      setUploadedFilePath(data.filePath)
      
      // Check if server-side parsing failed or Affinda is down (standardized response)
      if (data.useClientSideParsing || data.parsingMethod === 'client') {
        console.warn('Server-side parsing unavailable, using client-side fallback')
        
        // Use client-side parsing
        try {
          const clientResult = await parseResumeFile(file)
          
          if (clientResult.success && onResumeProcessed) {
            onResumeProcessed(clientResult.data, null)
          } else {
            setUploadError("Could not parse resume. Please enter your information manually.")
          }
        } catch (clientError) {
          console.error('Client-side parsing error:', clientError)
          setUploadError("Could not parse resume. Please enter your information manually.")
        }
      } else if (data.extractedDetails && onResumeProcessed) {
        // Server-side parsing successful
        onResumeProcessed(data.extractedDetails, data.huggingFaceError)
      }
    } catch (err) {
      console.error('Upload error:', err)
      setUploadError("Failed to upload resume. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Upload Your Resume</h2>
        <p className="text-gray-600">Upload your resume file. Only PDF files are supported.</p>
      </div>
      <Card>
        <CardContent className="p-8">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">Upload your resume</p>
              <p className="text-gray-600">PDF files only (Max 5MB)</p>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                id="resume-upload"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <Button
                variant="outline"
                className="cursor-pointer"
                disabled={isUploading}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                <FileText className="w-4 h-4 mr-2" />
                Choose File
              </Button>
              {isUploading && (
                <div className="mt-4 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-600" />
                  <span className="text-blue-800">Processing your resume...</span>
                </div>
              )}
              {uploadError && (
                <div className="mt-4 flex flex-col items-center">
                  <AlertCircle className="w-5 h-5 text-orange-600 mb-1" />
                  <span className="text-orange-800 text-sm">{uploadError}</span>
                </div>
              )}
              {uploadedFilePath && !uploadError && (
                <div className="mt-4 flex flex-col items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mb-1" />
                  <span className="text-green-800 font-medium">Resume uploaded successfully!</span>
                  <a
                    href={`${API_ENDPOINTS.PORTFOLIO.replace('/api/portfolio', '')}${uploadedFilePath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline mt-1"
                  >
                    View Uploaded Resume
                  </a>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> We&apos;ll automatically extract your information from the resume. 
              If extraction fails, you can still enter your information manually in the next steps.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
