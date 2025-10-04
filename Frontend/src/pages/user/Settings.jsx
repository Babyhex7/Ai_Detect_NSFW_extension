import Navbar from '../../components/Navbar'
import { Settings as SettingsIcon, Shield, Bell, User } from 'lucide-react'

const Settings = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Kelola preferensi dan konfigurasi akun Anda
          </p>
        </div>

        {/* Coming Soon */}
        <div className="card p-12 text-center">
          <SettingsIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
          <p className="text-gray-600 mb-6">
            Halaman pengaturan sedang dalam pengembangan
          </p>
          <p className="text-sm text-gray-500">
            Fitur yang akan tersedia:
          </p>
          <div className="mt-4 space-y-2 text-sm text-gray-500">
            <div className="flex items-center justify-center space-x-2">
              <User className="w-4 h-4" />
              <span>Pengaturan profil pengguna</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Konfigurasi tingkat deteksi</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Bell className="w-4 h-4" />
              <span>Notifikasi dan peringatan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings