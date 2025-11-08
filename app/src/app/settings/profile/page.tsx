'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { BottomNav } from '@/components/BottomNav'
import { User, ArrowLeft, Save, Mail, Calendar, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useSupabaseAuth } from '@/providers/SupabaseAuthProvider'
import { useInvisibleWallet } from '@/providers/InvisibleWalletProvider'
import Link from 'next/link'

// Profile Information Page

export default function ProfilePage() {
  const router = useRouter()
  const { user, supabase } = useSupabaseAuth()
  const { primaryAccount } = useInvisibleWallet()
  
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Form fields
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')
  
  // Load user data
  useEffect(() => {
    if (user) {
      setEmail(user.email || '')
      // Extract username from email (part before @)
      const username = user.email ? user.email.split('@')[0] : ''
      setDisplayName(user.user_metadata?.display_name || user.user_metadata?.full_name || username)
      setBio(user.user_metadata?.bio || '')
      setLocation(user.user_metadata?.location || '')
      setWebsite(user.user_metadata?.website || '')
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    setSaveStatus('idle')
    setErrorMessage(null)

    try {
      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: displayName,
          full_name: displayName,
          bio: bio,
          location: location,
          website: website,
        }
      })

      if (error) {
        throw error
      }

      setSaveStatus('success')
      setIsEditing(false)
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)
    } catch (err) {
      setSaveStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset form to original values
    if (user) {
      setEmail(user.email || '')
      const username = user.email ? user.email.split('@')[0] : ''
      setDisplayName(user.user_metadata?.display_name || user.user_metadata?.full_name || username)
      setBio(user.user_metadata?.bio || '')
      setLocation(user.user_metadata?.location || '')
      setWebsite(user.user_metadata?.website || '')
    }
    setIsEditing(false)
    setSaveStatus('idle')
    setErrorMessage(null)
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return 'N/A'
    }
  }

  return (
    <div className="min-h-screen pb-28">
      <Navbar />
      <div className="p-4 lg:p-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/settings"
              className="p-2 rounded-lg hover:bg-white/5 transition-all"
              aria-label="Back to settings"
            >
              <ArrowLeft className="w-6 h-6 text-gray-400" />
            </Link>
            <div>
              <h2 className="text-4xl font-bold text-cyber-blue">Profile Information</h2>
              <p className="text-gray-400">View and update your personal details</p>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Success/Error Messages */}
          {saveStatus === 'success' && (
            <div className="cyber-card p-4 bg-green-500/10 border-green-500/30">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">Profile updated successfully!</span>
              </div>
            </div>
          )}

          {saveStatus === 'error' && errorMessage && (
            <div className="cyber-card p-4 bg-red-500/10 border-red-500/30">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-red-400 font-semibold">Update Failed</div>
                  <div className="text-red-300 text-sm mt-1">{errorMessage}</div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Card */}
          <div className="cyber-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyber-blue to-cyber-pink flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">
                    {displayName || (user?.email ? user.email.split('@')[0] : 'User')}
                  </h3>
                  <p className="text-gray-400 text-sm">{email}</p>
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <div className="space-y-4">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Display Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-black/50 border border-cyber-blue/30 rounded-lg px-4 py-3 text-white focus:border-cyber-blue focus:outline-none"
                    placeholder="Enter your display name"
                  />
                ) : (
                  <div className="text-white text-lg">{displayName || 'Not set'}</div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <div className="text-white text-lg">{email || 'Not set'}</div>
                <p className="text-gray-500 text-xs mt-1">Email cannot be changed here</p>
              </div>

              {/* Account Created */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Account Created
                </label>
                <div className="text-white">{formatDate(user?.created_at)}</div>
              </div>
            </div>

            {/* Wallet Information */}
            {primaryAccount && primaryAccount.address && (
              <div className="mt-6 pt-6 border-t border-cyber-blue/20">
                <h4 className="text-lg font-semibold mb-4 text-cyber-blue">Wallet Information</h4>
                <div className="bg-black/50 border border-cyber-blue/30 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Wallet Address:</span>
                      <code className="text-cyber-blue font-mono text-sm">
                        {primaryAccount.address.slice(0, 6)}...{primaryAccount.address.slice(-4)}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-3 mt-6 pt-6 border-t border-cyber-blue/20">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    isSaving
                      ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                      : 'bg-cyber-blue text-black hover:bg-cyber-blue/90 hover:shadow-lg hover:shadow-cyber-blue/50'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-4 py-3 rounded-lg font-semibold border-2 border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
