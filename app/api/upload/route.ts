import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 })
    }

    const savedFiles = []

    // Zpracování každého souboru
    for (const file of files) {
      // Vytvoříme unikátní název souboru s časovou značkou
      const timestamp = Date.now()
      const originalName = file.name
      const fileName = `${timestamp}-${originalName}`

      // Nahrání souboru do Vercel Blob
      const { url } = await put(fileName, file, {
        access: "public",
      })

      // Přidáme informace o uloženém souboru do seznamu
      savedFiles.push({
        name: originalName,
        path: url,
        size: file.size,
        type: file.type,
      })
    }

    return NextResponse.json({
      message: "Files uploaded successfully",
      files: savedFiles,
    })
  } catch (error) {
    console.error("Error uploading files:", error)
    return NextResponse.json({ error: "Failed to upload files" }, { status: 500 })
  }
}
