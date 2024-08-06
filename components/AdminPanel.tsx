'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, Download, Loader2 } from 'lucide-react'

export default function AdminPanel() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'impactinsightsadmin') {
      setAuthenticated(true)
    } else {
      alert('Incorrect password')
    }
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch('/api/admin/download-chats')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'user_questions.csv'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      } else {
        alert('Failed to download chats')
      }
    } catch (error) {
      console.error('Error downloading chats:', error)
      alert('An error occurred while downloading chats')
    } finally {
      setIsDownloading(false)
    }
  }

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
          <div className="flex items-center justify-center">
            <Lock className="size-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800">Admin Access</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <Button type="submit" className="w-full py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition duration-300">
              Login
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-4">Admin Panel</h1>
        <div className="space-y-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">Download Chats</h2>
            <p className="text-gray-600 mb-4">Click the button below to download all chat data in CSV format.</p>
            <Button 
              onClick={handleDownload} 
              disabled={isDownloading}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-300"
            >
              {isDownloading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Download className="size-5" />
              )}
              <span>{isDownloading ? 'Preparing Download...' : 'Download All Chats'}</span>
            </Button>
          </div>
          {/* Add more admin features here */}
        </div>
      </div>
    </div>
  )
}