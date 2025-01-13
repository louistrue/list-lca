'use client'

import { useState } from 'react'
import Papa from 'papaparse'

interface CSVUploaderProps {
  onUpload: (data: string[][], headers: string[]) => void
}

export default function CSVUploader({ onUpload }: CSVUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleFileUpload = (file: File) => {
    Papa.parse(file, {
      complete: (results) => {
        const data = results.data as string[][]
        const headers = data[0]
        onUpload(data.slice(1), headers)
      },
    })
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    handleFileUpload(file)
  }

  return (
    <div
      className={`border-2 border-dashed p-8 text-center ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <p className="mb-4">
        Ziehen Sie Ihre CSV-Datei hierher oder klicken Sie, um eine Datei auszuwählen
      </p>
      <input
        type="file"
        accept=".csv"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
        className="hidden"
        id="csv-upload"
      />
      <label
        htmlFor="csv-upload"
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded cursor-pointer"
      >
        CSV-Datei auswählen
      </label>
    </div>
  )
}

