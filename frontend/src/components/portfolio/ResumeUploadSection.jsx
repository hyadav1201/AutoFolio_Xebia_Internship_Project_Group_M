"use client"

import { useRef, useState } from "react"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Upload, FileText, CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { API_ENDPOINTS } from "../../config/api"
import { parseResumeFile } from "../../utils/pdfParser"

export function ResumeUploadSection({ onResumeProcessed, onProcessingError, isProcessingResume, processingProgress, processingStatus }) {
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
        const errorMsg = err.error || "Failed to upload resume."
        setUploadError(errorMsg)
        setIsUploading(false)
        if (onProcessingError) onProcessingError(errorMsg)
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
            await onResumeProcessed(clientResult.data, null)
          } else {
            const errorMsg = "Could not parse resume. Please enter your information manually."
            setUploadError(errorMsg)
            if (onProcessingError) onProcessingError(errorMsg)
          }
        } catch (clientError) {
          console.error('Client-side parsing error:', clientError)
          const errorMsg = "Could not parse resume. Please enter your information manually."
          setUploadError(errorMsg)
          if (onProcessingError) onProcessingError(errorMsg)
        }
      } else if (data.extractedDetails && onResumeProcessed) {
        // Server-side parsing successful - pass to parent which will handle the full process
        try {
          await onResumeProcessed(data.extractedDetails, data.huggingFaceError)
        } catch (processingError) {
          console.error('Processing error:', processingError)
          const errorMsg = processingError.message || "Failed to process resume data."
          setUploadError(errorMsg)
          if (onProcessingError) onProcessingError(errorMsg)
        }
      }
    } catch (err) {
      console.error('Upload error:', err)
      const errorMsg = "Failed to upload resume. Please try again."
      setUploadError(errorMsg)
      if (onProcessingError) onProcessingError(errorMsg)
    } finally {
      setIsUploading(false)
    }
  }
  
  const handleRetry = () => {
    setUploadError("")
    setUploadedFilePath("")
    fileInputRef.current?.click()
  }
  
  const handleManualEntry = () => {
    setUploadError("")
    setUploadedFilePath("")
    // Navigate to manual entry by going to next step
    // This will be handled by the parent component
    if (onProcessingError) {
      onProcessingError(null) // Clear error state
    }
  }

  // Show processing overlay when resume is being processed
  if (isProcessingResume) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Processing Your Resume</h2>
          <p className="text-gray-600">Please wait while we extract and populate your information</p>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center">
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-2">Processing in Progress</h3>
                <p className="text-gray-600">{processingStatus || "Extracting information from your resume..."}</p>
              </div>
              
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-500 ease-out"
                    style={{ width: `${processingProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500">{processingProgress}% complete</p>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Please wait:</strong> Do not close this page or navigate away. 
                  We&apos;re populating your form fields with the extracted data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Show error state with retry and manual entry options
  if (uploadError) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Upload Failed</h2>
          <p className="text-gray-600">We encountered an issue processing your resume</p>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-2 text-red-900">Processing Failed</h3>
                <p className="text-red-700 mb-4">{uploadError}</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={handleRetry} variant="outline" className="w-full sm:w-auto">
                  Try Again
                </Button>
                <Button onClick={handleManualEntry} className="w-full sm:w-auto">
                  Enter Information Manually
                </Button>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <p className="text-sm text-blue-800">
                  <strong>Troubleshooting tips:</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Ensure your PDF is not password-protected</li>
                  <li>Try a different file format or re-export your resume</li>
                  <li>Make sure the file size is under 5MB</li>
                  <li>If issues persist, you can enter your information manually</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
