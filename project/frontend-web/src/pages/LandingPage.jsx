import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Shield, 
  Zap, 
  Eye, 
  Lock, 
  CheckCircle, 
  ArrowRight,
  Star,
  Users,
  Download
} from 'lucide-react'
import { Button, Card } from '../components/UI'

const LandingPage = () => {
  const features = [
    {
      icon: <Shield className="w-8 h-8 text-primary-600" />,
      title: 'AI-Powered Detection',
      description: 'Advanced machine learning algorithms detect NSFW content with 99.9% accuracy in real-time.',
    },
    {
      icon: <Zap className="w-8 h-8 text-primary-600" />,
      title: 'Lightning Fast',
      description: 'Process thousands of images per second with our optimized detection engine.',
    },
    {
      icon: <Eye className="w-8 h-8 text-primary-600" />,
      title: 'Smart Filtering',
      description: 'Customizable sensitivity levels and content categories for precise control.',
    },
    {
      icon: <Lock className="w-8 h-8 text-primary-600" />,
      title: 'Privacy First',
      description: 'All processing happens locally or on secure servers. Your data never leaves your control.',
    },
  ]

  const stats = [
    { number: '99.9%', label: 'Detection Accuracy' },
    { number: '50M+', label: 'Images Processed' },
    { number: '10k+', label: 'Active Users' },
    { number: '<100ms', label: 'Response Time' },
  ]

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Content Manager',
      content: 'This tool has revolutionized how we moderate content. The accuracy is incredible and it saves us hours every day.',
      rating: 5,
    },
    {
      name: 'Mike Chen',
      role: 'Platform Safety Lead',
      content: 'The best NSFW detection solution we\'ve tried. Easy to integrate and extremely reliable.',
      rating: 5,
    },
    {
      name: 'Emily Rodriguez',
      role: 'Community Manager',
      content: 'Finally, a tool that understands context and provides accurate results. Highly recommended!',
      rating: 5,
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-blue-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
              Protect Your Platform with{' '}
              <span className="text-primary-600">AI-Powered</span>{' '}
              Content Detection
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto animate-slide-up">
              Advanced NSFW detection system that keeps inappropriate content away from your users. 
              Lightning-fast, accurate, and easy to integrate.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
              <Link to="/register">
                <Button size="lg" className="px-8 py-4 text-lg">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button variant="secondary" size="lg" className="px-8 py-4 text-lg">
                  <Eye className="w-5 h-5 mr-2" />
                  View Demo
                </Button>
              </Link>
            </div>
            
            {/* Trust indicators */}
            <div className="mt-12 flex items-center justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>5-minute setup</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>24/7 support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-primary-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our NSFW Detector?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built with cutting-edge AI technology to provide the most accurate and reliable content detection available.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-medium transition-shadow duration-300">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get up and running in minutes with our simple integration process.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                1. Sign Up
              </h3>
              <p className="text-gray-600">
                Create your account and get instant access to our detection API.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                2. Install Extension
              </h3>
              <p className="text-gray-600">
                Add our Chrome extension or integrate our API into your platform.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                3. Stay Protected
              </h3>
              <p className="text-gray-600">
                Enjoy automatic content filtering and real-time protection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of satisfied users who trust our platform for content protection.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {testimonial.role}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Protect Your Platform?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of companies using our AI-powered content detection system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" variant="secondary" className="px-8 py-4 text-lg">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="ghost" className="px-8 py-4 text-lg text-white border-white hover:bg-white hover:text-primary-600">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage