'use client'

import { Navbar } from '@/components/Navbar'
import { BottomNav } from '@/components/BottomNav'
import { User, Bell, Shield, Wallet, Globe, Moon } from 'lucide-react'

// Settings page - User preferences and configuration

export default function DAppSettings() {
  return (
    <div className="min-h-screen pb-28">
      <Navbar />
      <div className="p-4 lg:p-8">

      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <h2 className="text-4xl font-bold mb-4 text-cyber-blue">Settings</h2>
        <p className="text-gray-400">Manage your account and preferences</p>
      </div>

      {/* Settings Sections */}
      <div className="max-w-4xl mx-auto space-y-4">
        
        {/* Account Settings */}
        <div className="cyber-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-6 h-6 text-cyber-blue" />
            <h3 className="text-xl font-bold">Account</h3>
          </div>
          <div className="space-y-3 pl-9">
            <button className="w-full text-left py-3 px-4 rounded-lg hover:bg-white/5 transition-all">
              <div className="font-medium">Profile Information</div>
              <div className="text-sm text-gray-400">Update your personal details</div>
            </button>
            <button className="w-full text-left py-3 px-4 rounded-lg hover:bg-white/5 transition-all">
              <div className="font-medium">Email & Password</div>
              <div className="text-sm text-gray-400">Change your login credentials</div>
            </button>
          </div>
        </div>

        {/* Wallet Settings */}
        <div className="cyber-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-6 h-6 text-cyber-blue" />
            <h3 className="text-xl font-bold">Wallet</h3>
          </div>
          <div className="space-y-3 pl-9">
            <button className="w-full text-left py-3 px-4 rounded-lg hover:bg-white/5 transition-all">
              <div className="font-medium">Connected Wallets</div>
              <div className="text-sm text-gray-400">Manage your connected wallets</div>
            </button>
            <button className="w-full text-left py-3 px-4 rounded-lg hover:bg-white/5 transition-all">
              <div className="font-medium">Transaction History</div>
              <div className="text-sm text-gray-400">View your past transactions</div>
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="cyber-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-6 h-6 text-cyber-blue" />
            <h3 className="text-xl font-bold">Notifications</h3>
          </div>
          <div className="space-y-3 pl-9">
            <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-white/5 transition-all">
              <div>
                <div className="font-medium">Push Notifications</div>
                <div className="text-sm text-gray-400">Receive alerts on your device</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyber-blue"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-white/5 transition-all">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-gray-400">Get updates via email</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyber-blue"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="cyber-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-cyber-blue" />
            <h3 className="text-xl font-bold">Privacy & Security</h3>
          </div>
          <div className="space-y-3 pl-9">
            <button className="w-full text-left py-3 px-4 rounded-lg hover:bg-white/5 transition-all">
              <div className="font-medium">Two-Factor Authentication</div>
              <div className="text-sm text-gray-400">Add extra security to your account</div>
            </button>
            <button className="w-full text-left py-3 px-4 rounded-lg hover:bg-white/5 transition-all">
              <div className="font-medium">Privacy Settings</div>
              <div className="text-sm text-gray-400">Control who can see your activity</div>
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div className="cyber-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Moon className="w-6 h-6 text-cyber-blue" />
            <h3 className="text-xl font-bold">Preferences</h3>
          </div>
          <div className="space-y-3 pl-9">
            <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-white/5 transition-all">
              <div>
                <div className="font-medium">Dark Mode</div>
                <div className="text-sm text-gray-400">Toggle dark theme</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyber-blue"></div>
              </label>
            </div>
            <button className="w-full text-left py-3 px-4 rounded-lg hover:bg-white/5 transition-all">
              <div className="font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Language
              </div>
              <div className="text-sm text-gray-400">English (US)</div>
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="cyber-card p-6 border-red-500/20">
          <h3 className="text-xl font-bold text-red-500 mb-4">Danger Zone</h3>
          <div className="space-y-3">
            <button className="w-full text-left py-3 px-4 rounded-lg hover:bg-red-500/10 transition-all border border-red-500/20">
              <div className="font-medium text-red-500">Disconnect Wallet</div>
              <div className="text-sm text-gray-400">Remove all connected wallets</div>
            </button>
            <button className="w-full text-left py-3 px-4 rounded-lg hover:bg-red-500/10 transition-all border border-red-500/20">
              <div className="font-medium text-red-500">Delete Account</div>
              <div className="text-sm text-gray-400">Permanently delete your account and data</div>
            </button>
          </div>
        </div>

      </div>
      </div>
      <BottomNav />
    </div>
  )
}




