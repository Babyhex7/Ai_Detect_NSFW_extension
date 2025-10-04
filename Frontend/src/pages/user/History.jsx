import Navbar from '../../components/Navbar'
import { Clock, Filter, Search } from 'lucide-react'

const History = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">History Deteksi</h1>
          <p className="text-gray-600 mt-2">
            Riwayat semua aktivitas deteksi NSFW content
          </p>
        </div>

        {/* Coming Soon */}
        <div className="card p-12 text-center">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
          <p className="text-gray-600 mb-6">
            Halaman history deteksi sedang dalam pengembangan
          </p>
          <p className="text-sm text-gray-500">
            Fitur yang akan tersedia:
          </p>
          <div className="mt-4 space-y-2 text-sm text-gray-500">
            <div className="flex items-center justify-center space-x-2">
              <Search className="w-4 h-4" />
              <span>Pencarian berdasarkan domain</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Filter berdasarkan tingkat deteksi</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Timeline aktivitas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default History