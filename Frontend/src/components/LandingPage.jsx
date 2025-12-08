import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  MapPin,
  Star,
  Target,
  Lightbulb,
  Play,
  CheckCircle,
  ArrowRight,
  Award,
  Users,
  TrendingUp,
  Shield,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { quizAPI, collegesAPI } from '../services/api';
import { contentAPI } from '../services/contentService';

const LandingPage = () => {
  const [stats, setStats] = useState({
    studentsGuided: 0,
    collegesListed: 0,
    careerPaths: 0,
    studyResources: 0
  });
  const [featuredQuiz, setFeaturedQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [quizzesRes, collegesRes, contentRes] = await Promise.all([
        quizAPI.getAll(),
        collegesAPI.getAll(),
        contentAPI.getAll()
      ]);

      setStats({
        studentsGuided: quizzesRes.data.totalAttempts || 10000,
        collegesListed: collegesRes.data.colleges?.length || 500,
        careerPaths: 50,
        studyResources: contentRes.data.content?.length || 1000
      });

      if (quizzesRes.data.quizzes?.length > 0) {
        setFeaturedQuiz(quizzesRes.data.quizzes[0]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats({
        studentsGuided: 10000,
        collegesListed: 500,
        careerPaths: 50,
        studyResources: 1000
      });
    } finally {
      setLoading(false);
    }
  };

  const heroSlides = [
    {
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1470&q=80',
      title: 'Confused about your future?',
      subtitle: 'Discover the right subject stream and career path tailored to your interests'
    },
    {
      image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1470&q=80',
      title: 'Explore Government Colleges Near You',
      subtitle: 'Find course details, eligibility, and facilities at government colleges'
    },
    {
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1470&q=80',
      title: 'Map Your Career Journey',
      subtitle: 'Explore degrees and the careers they unlock'
    },
    {
      image: 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=1470&q=80',
      title: 'Personalized Guidance Powered by AI',
      subtitle: 'Personalized picks for courses, colleges, and study materials'
    }
  ];

  const features = [
    {
      icon: <Target className="h-8 w-8 text-blue-600" />,
      title: 'Aptitude & Interest Quiz',
      description: 'Discover your strengths and interests with our comprehensive assessment.'
    },
    {
      icon: <MapPin className="h-8 w-8 text-green-600" />,
      title: 'Career Pathway Mapping',
      description: 'Visualize your career journey with interactive pathway maps.'
    },
    {
      icon: <GraduationCap className="h-8 w-8 text-purple-600" />,
      title: 'Government Colleges Directory',
      description: 'Explore 500+ government colleges with detailed program information.'
    },
    {
      icon: <Calendar className="h-8 w-8 text-orange-600" />,
      title: 'Timeline Tracker',
      description: 'Stay on track with personalized timelines for admissions and exams.'
    },
    {
      icon: <Lightbulb className="h-8 w-8 text-pink-600" />,
      title: 'Personalized Guidance',
      description: 'Get AI-powered recommendations tailored to your profile.'
    }
  ];

  const journeySteps = [
    {
      step: 'Take Quiz',
      icon: <Target className="h-6 w-6" />,
      description: 'Complete our aptitude assessment',
      color: "from-blue-500 to-blue-600"
    },
    {
      step: 'Discover Stream',
      icon: <Lightbulb className="h-6 w-6" />,
      description: 'Find your ideal subject stream',
      color: "from-green-500 to-green-600"
    },
    {
      step: 'Explore Careers',
      icon: <TrendingUp className="h-6 w-6" />,
      description: 'Discover exciting career options',
      color: "from-purple-500 to-purple-600"
    },
    {
      step: 'Find Colleges',
      icon: <GraduationCap className="h-6 w-6" />,
      description: 'Browse suitable colleges',
      color: "from-orange-500 to-orange-600"
    },
    {
      step: 'Plan Timeline',
      icon: <Calendar className="h-6 w-6" />,
      description: 'Create your success roadmap',
      color: "from-pink-500 to-pink-600"
    }
  ];

  const testimonials = [
    {
      name: 'Rahul Sharma',
      class: 'Class 12 Student',
      text: 'Amazing platform! The timeline tracker ensured I never missed any important admission deadlines.',
      rating: 5,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: 'Ananya Patel',
      class: 'Commerce Graduate',
      text: 'Found the perfect college for my CA course through their detailed college directory. Highly recommended!',
      rating: 5,
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: 'Rohan Mehta',
      class: 'Class 12, Science',
      text: 'The AI recommendations were spot on! Helped me choose between engineering branches.',
      rating: 4,
      image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: 'Sneha Sharma',
      class: 'Class 10',
      text: 'Thanks to the study resources, I aced my board exams. Great platform!',
      rating: 5,
      image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: 'Arjun Nair',
      class: 'Class 12, Arts',
      text: 'Discovered my interest in arts through the quiz. Now pursuing my passion!',
      rating: 5,
      image: "https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: 'Priya Singh',
      class: 'Science Student',
      text: 'The career quiz helped me discover my passion for environmental science. Now I\'m pursuing my dream course!',
      rating: 4,
      image: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=150&h=150&fit=crop&crop=face"
    }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroSlides[currentSlide].image})` }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-60"></div>
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 max-w-4xl px-6 text-center text-white">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 1 }}
            >
              <h1 className="text-4xl md:text-6xl font-extrabold drop-shadow-lg mb-6">
                {heroSlides[currentSlide].title}
              </h1>
              <p className="text-xl md:text-2xl max-w-3xl mx-auto drop-shadow-md mb-10">
                {heroSlides[currentSlide].subtitle}
              </p></motion.div>
          </AnimatePresence>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link to="/login">
                  <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                    <Lightbulb className="mr-2 h-5 w-5" />
                    Take the Quiz
                  </Button>
                </Link>
                <Link to="/colleges">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg rounded-full backdrop-blur-sm bg-white/10">
                    <MapPin className="mr-2 h-5 w-5" />
                    Explore Colleges
                  </Button>
                </Link>
              </div>
            
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Unlock Your Potential
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover the tools that will guide you towards your dream career
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-gradient-to-br from-white to-gray-50 group">
                  <CardContent className="p-8">
                    <motion.div
                      className="flex justify-center mb-6"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full group-hover:shadow-lg transition-shadow">
                        {feature.icon}
                      </div>
                    </motion.div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey Map Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Your Journey Starts Here
            </h2>
            <p className="text-xl text-gray-600">
              Begin your personalized career discovery
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-9">
            {journeySteps.map((step, index) => (
              <motion.div
                key={index}
                className="text-center relative mt-6"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <motion.div
                  className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-white shadow-lg`}
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  {step.icon}
                </motion.div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {step.step}
                </h3>
                <p className="text-gray-600 text-sm">
                  {step.description}
                </p>
                {index < journeySteps.length - 1 && (
                  <motion.div
                    className="hidden lg:block absolute top-5 -right-4 text-purple-400"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 + 0.5 }}
                  >
                    <ArrowRight className="h-6 w-6" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Why Choose Us?
            </h2>
            <p className="text-xl text-blue-100">
              See how we're making a difference in students' lives
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {[
              { number: `${stats.studentsGuided.toLocaleString()}+`, label: 'Students Guided', icon: <Users className="h-8 w-8" /> },
              { number: `${stats.collegesListed}+`, label: 'Colleges Listed', icon: <GraduationCap className="h-8 w-8" /> },
              { number: `${stats.careerPaths}+`, label: 'Career Paths', icon: <TrendingUp className="h-8 w-8" /> },
              { number: `${stats.studyResources}+`, label: 'Study Resources', icon: <BookOpen className="h-8 w-8" /> }
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex justify-center mb-4 text-yellow-300">
                  {stat.icon}
                </div>
                <div className="text-3xl md:text-4xl font-bold mb-2">
                  {loading ? '...' : stat.number}
                </div>
                <div className="text-blue-100 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="flex flex-wrap justify-center gap-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
              <Award className="h-6 w-6 text-yellow-300 mr-3" />
              <span className="font-semibold">Award-Winning Platform</span>
            </div>
            <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
              <Shield className="h-6 w-6 text-green-300 mr-3" />
              <span className="font-semibold">Government Collaboration</span>
            </div>
            <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
              <CheckCircle className="h-6 w-6 text-blue-300 mr-3" />
              <span className="font-semibold">Verified Content</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              What Students Say
            </h2>
            <p className="text-xl text-gray-600">
              Hear from our successful users
            </p>
          </motion.div>

          <div className="relative">
            <motion.div
              key={currentTestimonial}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex justify-center mb-6">
                    <img
                      src={testimonials[currentTestimonial].image}
                      alt={testimonials[currentTestimonial].name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  </div>
                  <div className="flex justify-center mb-4">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-lg text-gray-700 mb-6 italic">
                    "{testimonials[currentTestimonial].text}"
                  </blockquote>
                  <div>
                    <div className="font-semibold text-gray-900 text-lg">{testimonials[currentTestimonial].name}</div>
                    <div className="text-gray-600">{testimonials[currentTestimonial].class}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <div className="flex justify-center mt-8 space-x-4">
              <Button variant="outline" size="sm" onClick={prevTestimonial} className="rounded-full">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`mt-2 w-3 h-3 rounded-full transition-colors ${
                      index === currentTestimonial ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={nextTestimonial} className="rounded-full">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      {/* <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Apni Disha</h3>
              <p className="text-gray-400">
                Empowering students to make informed decisions about their future through personalized guidance and comprehensive resources.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/quiz" className="hover:text-white">Career Quiz</Link></li>
                <li><Link to="/colleges" className="hover:text-white">Colleges</Link></li>
                <li><Link to="/content" className="hover:text-white">Study Materials</Link></li>
                <li><Link to="/timeline" className="hover:text-white">Timeline</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/recommendations" className="hover:text-white">Recommendations</Link></li>
                <li><Link to="/profile" className="hover:text-white">Profile</Link></li>
                <li><Link to="/bookmarks" className="hover:text-white">Saved Items</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-gray-400">
                Have questions? We're here to help you on your career journey.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2024 Career & Education Advisor. All rights reserved.</p>
          </div>
        </div>
      </footer> */}
      {/* <Footer/> */}
    </div>
  );
};

export default LandingPage;