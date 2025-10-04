import { useEffect, useState } from 'react'
import { BarChart3, Shield, Eye, AlertTriangle, Activity } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useDetectionStore } from '../store/detectionStore'

const Home = () => {
  const { stats = {}, detections, fetchDetections, isLoading } = useDetectionStore()
  const [recentActivity] = useState([
    { id: 1, type: 'detection', level: 'high', domain: 'example.com', time: '2 menit lalu' },
    { id: 2, type: 'detection', level: 'medium', domain: 'test.com', time: '5 menit lalu' },
    { id: 3, type: 'detection', level: 'low', domain: 'sample.org', time: '10 menit lalu' },
  ])

  useEffect(() => {
    // Hanya fetch jika user sudah login dan backend ready
    if (typeof fetchDetections === 'function') {
      fetchDetections().catch(err => {
        console.log('Failed to fetch detections:', err.message)
      })
    }
  }, [fetchDetections])

  const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 bg-${color}-100 rounded-full`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  )

  const getLevelColor = (level) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getLevelText = (level) => {
    switch (level) {
      case 'high': return 'Tinggi'
      case 'medium': return 'Sedang'
      case 'low': return 'Rendah'
      default: return level
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Home</h1>
          <p className="text-gray-600 mt-2">
            Selamat datang! Berikut adalah ringkasan aktivitas deteksi NSFW Anda.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Deteksi" 
            value={stats.total || 0} 
            icon={BarChart3} 
            color="blue" 
          />
          <StatCard 
            title="Tingkat Rendah" 
            value={stats.low || 0} 
            icon={Shield} 
            color="green" 
          />
          <StatCard 
            title="Tingkat Sedang" 
            value={stats.medium || 0} 
            icon={Eye} 
            color="yellow" 
          />
          <StatCard 
            title="Tingkat Tinggi" 
            value={stats.high || 0} 
            icon={AlertTriangle} 
            color="red" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                <Activity className="w-5 h-5 text-gray-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Aktivitas Terbaru</h2>
              </div>
            </div>
            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading...</p>
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(activity.level)}`}>
                          {getLevelText(activity.level)}
                        </div>
                        <span className="text-sm text-gray-900">{activity.domain}</span>
                      </div>
                      <span className="text-xs text-gray-500">{activity.time}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Belum ada aktivitas deteksi</p>
                </div>
              )}
            </div>
          </div>

          {/* Extension Status */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Status Extension</h2>
            </div>
            <div className="p-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Extension Aktif</h3>
                <p className="text-gray-600 mb-4">
                  NSFW Detector sedang melindungi browsing Anda
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-green-600 font-medium">Aktif</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mode:</span>
                    <span>Otomatis</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Terakhir Update:</span>
                    <span>Hari ini</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="btn-secondary text-left p-4 h-auto">
                <div>
                  <h3 className="font-medium text-gray-900">View Reports</h3>
                  <p className="text-sm text-gray-600">Lihat laporan deteksi lengkap</p>
                </div>
              </button>
              <button className="btn-secondary text-left p-4 h-auto">
                <div>
                  <h3 className="font-medium text-gray-900">Extension Settings</h3>
                  <p className="text-sm text-gray-600">Atur preferensi extension</p>
                </div>
              </button>
              <button className="btn-secondary text-left p-4 h-auto">
                <div>
                  <h3 className="font-medium text-gray-900">Export Data</h3>
                  <p className="text-sm text-gray-600">Download data dalam format CSV</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home