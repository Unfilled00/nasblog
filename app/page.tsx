"use client"

import type React from "react"

import { useState } from "react"
import { Upload, X, ImageIcon, Check, Loader2 } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function PhotoUpload() {
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; path: string; size: number; type: string }[]>([])
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }))
      setPhotos((prev) => [...prev, ...newFiles])
    }
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      // Revoke the object URL to avoid memory leaks
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const uploadPhotos = async () => {
    if (photos.length === 0) {
      toast({
        title: "No photos selected",
        description: "Please select at least one photo to upload",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()

      // Přidáme všechny soubory do FormData
      photos.forEach((photo) => {
        formData.append("files", photo.file)
      })

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload photos")
      }

      const result = await response.json()

      // Uložíme informace o nahraných souborech
      setUploadedFiles(result.files)

      // Vyčistíme náhledy
      photos.forEach((photo) => URL.revokeObjectURL(photo.preview))
      setPhotos([])

      toast({
        title: "Upload successful",
        description: `Successfully uploaded ${result.files.length} photos`,
      })
    } catch (error) {
      console.error("Error uploading photos:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your photos",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Photo Upload</CardTitle>
          <CardDescription>Upload one or multiple photos to the server</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <div className="relative w-full max-w-md">
              <input
                type="file"
                id="file-upload"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                aria-label="Upload photos"
                disabled={uploading}
              />
              <Button
                variant="outline"
                className="h-32 w-full border-dashed border-2 flex flex-col items-center justify-center gap-2"
                disabled={uploading}
              >
                <Upload className="h-8 w-8" />
                <span>Click or drag photos here</span>
                <span className="text-xs text-muted-foreground">Supports: JPG, PNG, GIF</span>
              </Button>
            </div>
          </div>

          {photos.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Selected Photos ({photos.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group aspect-square">
                    <Image
                      src={photo.preview || "/placeholder.svg"}
                      alt={`Selected photo ${index + 1}`}
                      fill
                      className="object-cover rounded-md"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove photo"
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                      {photo.file.name.length > 15 ? photo.file.name.substring(0, 12) + "..." : photo.file.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {photos.length === 0 && !uploading && uploadedFiles.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 mb-4" />
              <p>No photos selected yet</p>
              <p className="text-sm">Your selected photos will appear here</p>
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Uploaded Photos ({uploadedFiles.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="relative aspect-square">
                    <Image
                      src={file.path || "/placeholder.svg"}
                      alt={`Uploaded photo ${index + 1}`}
                      fill
                      className="object-cover rounded-md"
                    />
                    <div className="absolute top-1 right-1 bg-green-500/90 text-white p-1 rounded-full">
                      <Check className="h-4 w-4" />
                    </div>
                    <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded-md">
                      {file.name.length > 15 ? file.name.substring(0, 12) + "..." : file.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={uploadPhotos} disabled={photos.length === 0 || uploading} className="w-full">
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Photos
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
