import React, { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Eye,
  Clock,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { analyticsAPI, detectionAPI } from '../services/api'
import { useAsync } from '../hooks/useCommon'
import { Card, Button, Loading } from '../components/UI'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [refreshing, setRefreshing] = useState(false)

  // Fetch dashboard data
  const { 
    data: dashboardStats, 
    loading: statsLoading, 
    refetch: refetchStats 
  } = useAsync(() => analyticsAPI.getDashboardStats(selectedPeriod), [selectedPeriod])

  const { 
    data: recentDetections, 
    loading: detectionsLoading, 
    refetch: refetchDetections 
  } = useAsync(() => detectionAPI.getHistory(1, 5), [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([refetchStats(), refetchDetections()])
      toast.success('Dashboard refreshed')
    } catch (error) {
      toast.error('Failed to refresh dashboard')
    } finally {
      setRefreshing(false)
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num?.toString() || '0'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'safe': return 'text-green-600'
      case 'nsfw': return 'text-red-600'
      case 'questionable': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'safe': return <CheckCircle className="w-4 h-4" />
      case 'nsfw': return <AlertTriangle className="w-4 h-4" />
      case 'questionable': return <Eye className="w-4 h-4" />
      default: return <Shield className="w-4 h-4" />
    }
  }

  if (statsLoading && detectionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" text="Loading dashboard..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.name}
              </h1>
              <p className="text-gray-600 mt-1">
                Here's what's happening with your content detection
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              {/* Period Selector */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="input w-auto"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              
              <Button
                variant="secondary"
                onClick={handleRefresh}
                loading={refreshing}
                className="flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Detections</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(dashboardStats?.totalDetections)}
                </p>
                <p className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{dashboardStats?.detectionGrowth || 0}%
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Safe Content</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(dashboardStats?.safeContent)}
                </p>
                <p className="text-sm text-gray-500">
                  {dashboardStats?.safePercentage || 0}% of total
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">NSFW Detected</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(dashboardStats?.nsfwContent)}
                </p>
                <p className="text-sm text-gray-500">
                  {dashboardStats?.nsfwPercentage || 0}% of total
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Eye className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Questionable</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(dashboardStats?.questionableContent)}
                </p>
                <p className="text-sm text-gray-500">
                  {dashboardStats?.questionablePercentage || 0}% of total
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Detections */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Detections
                </h2>
                <div className="flex items-center space-x-2">
                  <Button variant="secondary" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="secondary" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              {detectionsLoading ? (
                <Loading text="Loading recent detections..." />
              ) : (
                <div className="space-y-4">
                  {recentDetections?.data?.map((detection) => (
                    <div 
                      key={detection.id} 
                      className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <img
                          src={detection.imageUrl || '/placeholder-image.jpg'}
                          alt="Detection"
                          className="w-12 h-12 rounded-lg object-cover"
                          onError={(e) => {
                            e.target.src = '/placeholder-image.jpg'
                          }}
                        />
                      </div>
                      
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Detection #{detection.id}
                            </p>
                            <p className="text-sm text-gray-500">
                              Confidence: {Math.round((detection.confidence || 0) * 100)}%
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className={`flex items-center space-x-1 ${getStatusColor(detection.status)}`}>
                              {getStatusIcon(detection.status)}
                              <span className="text-sm font-medium capitalize">
                                {detection.status}
                              </span>
                            </div>
                            
                            <div className="text-xs text-gray-500 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(detection.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {recentDetections?.data?.length === 0 && (
                    <div className="text-center py-12">
                      <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No detections yet
                      </h3>
                      <p className="text-gray-600">
                        Start analyzing content to see your detection history here.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Quick Actions & System Status */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <Button className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Analyze New Content
                </Button>
                <Button variant="secondary" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Download Extension
                </Button>
                <Button variant="secondary" className="w-full justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </div>
            </Card>

            {/* System Status */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                System Status
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API Status</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Online</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Detection Engine</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Active</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Queue Status</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-yellow-600">
                      {dashboardStats?.queueSize || 0} pending
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Account Info */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Account Info
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Plan</span>
                  <span className="text-sm font-medium text-gray-900">
                    {user?.plan || 'Free'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">API Calls</span>
                  <span className="text-sm font-medium text-gray-900">
                    {dashboardStats?.apiCalls || 0} / {dashboardStats?.apiLimit || 1000}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="text-sm font-medium text-gray-900">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard