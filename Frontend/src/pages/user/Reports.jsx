import Navbar from '../../components/Navbar'
import { BarChart3, PieChart, TrendingUp } from 'lucide-react'

const Reports = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">
            Analisis mendalam tentang aktivitas deteksi
          </p>
        </div>

        {/* Coming Soon */}
        <div className="card p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
          <p className="text-gray-600 mb-6">
            Dashboard analytics sedang dalam pengembangan
          </p>
          <p className="text-sm text-gray-500">
            Fitur yang akan tersedia:
          </p>
          <div className="mt-4 space-y-2 text-sm text-gray-500">
            <div className="flex items-center justify-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Grafik statistik harian/mingguan/bulanan</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <PieChart className="w-4 h-4" />
              <span>Distribusi tingkat deteksi</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Tren dan analisis pola</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports