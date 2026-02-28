import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import { CheckCircle, Target, BarChart, Zap, BookOpen, Shield } from 'lucide-react';
import heroImage from '../assets/hero.png';

const LandingPage = () => {
    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gray-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto">
                    <div className="relative z-10 pb-8 bg-gray-50 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
                        <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                            <div className="sm:text-center lg:text-left">
                                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                                    <span className="block xl:inline">Master your time with</span>{' '}
                                    <span className="block text-blue-600 xl:inline">AI-powered planning</span>
                                </h1>
                                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                                    Boost your productivity, track your goals, and get personalized insights to work smarter, not harder. Join thousands achieving their dreams.
                                </p>
                                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                                    <div className="rounded-md shadow">
                                        <Link to="/signup">
                                            <Button size="lg" className="w-full flex items-center justify-center px-8 py-3 text-base font-medium md:py-4 md:text-lg md:px-10">
                                                Get Started
                                            </Button>
                                        </Link>
                                    </div>
                                    <div className="mt-3 sm:mt-0 sm:ml-3">
                                        <Link to="/login">
                                            <Button variant="secondary" size="lg" className="w-full flex items-center justify-center px-8 py-3 text-base font-medium md:py-4 md:text-lg md:px-10">
                                                Log In
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>

                <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 bg-blue-50 flex items-center justify-center">
                    <img
                        className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
                        src={heroImage}
                        alt="AI Study Planner Hero"
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/600x400?text=Hero+Image+Placeholder"; }}
                    />
                </div>
            </div>

            {/* Features Overview */}
            <div id="features" className="py-12 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="lg:text-center">
                        <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Features</h2>
                        <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                            Everything you need to succeed
                        </p>
                        <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                            Our platform combines powerful tools with simple design to keep you focused and on track.
                        </p>
                    </div>

                    <div className="mt-10">
                        <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                            <div className="relative">
                                <dt>
                                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                                        <CheckCircle className="h-6 w-6" aria-hidden="true" />
                                    </div>
                                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Task Management</p>
                                </dt>
                                <dd className="mt-2 ml-16 text-base text-gray-500">
                                    Organize your projects and assignments with our intuitive task planner. Prioritize what matters most.
                                </dd>
                            </div>

                            <div className="relative">
                                <dt>
                                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                                        <Target className="h-6 w-6" aria-hidden="true" />
                                    </div>
                                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Goal Tracking</p>
                                </dt>
                                <dd className="mt-2 ml-16 text-base text-gray-500">
                                    Break down ambitious milestones into actionable steps. Track your progress daily and stay motivated.
                                </dd>
                            </div>

                            <div className="relative">
                                <dt>
                                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                                        <BarChart className="h-6 w-6" aria-hidden="true" />
                                    </div>
                                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Analytics Dashboard</p>
                                </dt>
                                <dd className="mt-2 ml-16 text-base text-gray-500">
                                    Visualize your progress with detailed charts. See how your productivity improves over time.
                                </dd>
                            </div>

                            <div className="relative">
                                <dt>
                                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                                        <Zap className="h-6 w-6" aria-hidden="true" />
                                    </div>
                                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">AI Insights</p>
                                </dt>
                                <dd className="mt-2 ml-16 text-base text-gray-500">
                                    Get personalized recommendations from our AI to optimize your schedule and prevent burnout.
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>

            {/* How it works */}
            <div className="py-16 bg-gray-50 overflow-hidden lg:py-24">
                <div className="relative max-w-xl mx-auto px-4 sm:px-6 lg:px-8 lg:max-w-7xl">
                    <div className="relative">
                        <h2 className="text-center text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                            How it works
                        </h2>
                        <p className="mt-4 max-w-3xl mx-auto text-center text-xl text-gray-500">
                            Three simple steps to supercharge your productivity.
                        </p>
                    </div>

                    <div className="relative mt-12 lg:mt-24 lg:grid lg:grid-cols-3 lg:gap-8 lg:items-center">
                        <div className="flex flex-col items-center">
                            <span className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 text-2xl font-bold">1</span>
                            <h3 className="mt-6 text-xl font-bold text-gray-900">Set Your Goals</h3>
                            <p className="mt-2 text-center text-base text-gray-500">
                                Define what you want to achieve. Break down big goals into manageable tasks.
                            </p>
                        </div>
                        <div className="flex flex-col items-center mt-10 lg:mt-0">
                            <span className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 text-2xl font-bold">2</span>
                            <h3 className="mt-6 text-xl font-bold text-gray-900">Execute & Track</h3>
                            <p className="mt-2 text-center text-base text-gray-500">
                                Stay consistent by checking off daily habits and quickly managing ad-hoc tasks as they arrive.
                            </p>
                        </div>
                        <div className="flex flex-col items-center mt-10 lg:mt-0">
                            <span className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 text-2xl font-bold">3</span>
                            <h3 className="mt-6 text-xl font-bold text-gray-900">Review & Optimize</h3>
                            <p className="mt-2 text-center text-base text-gray-500">
                                Check your analytics and AI insights to see where you can improve and celebrate wins.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Benefits Section */}
            <div className="bg-white py-16 lg:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl font-extrabold text-gray-900">Why choose Momentum?</h2>
                    </div>
                    <div className="mt-12 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-6">
                        <div className="group block">
                            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-50 text-blue-600 mb-4 mx-auto group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <BookOpen className="h-6 w-6" />
                            </div>
                            <h3 className="text-center text-xl font-medium text-gray-900">Evidence-Based Methods</h3>
                            <p className="mt-2 text-center text-base text-gray-500">Built on proven productivity techniques like Pomodoro and Time Blocking.</p>
                        </div>
                        <div className="group block">
                            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-50 text-blue-600 mb-4 mx-auto group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Shield className="h-6 w-6" />
                            </div>
                            <h3 className="text-center text-xl font-medium text-gray-900">Data Privacy</h3>
                            <p className="mt-2 text-center text-base text-gray-500">Your data is yours. We prioritize security and privacy above all else.</p>
                        </div>
                        <div className="group block">
                            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-50 text-blue-600 mb-4 mx-auto group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Zap className="h-6 w-6" />
                            </div>
                            <h3 className="text-center text-xl font-medium text-gray-900">Constant Improvement</h3>
                            <p className="mt-2 text-center text-base text-gray-500">Our AI gets smarter the more you use it, tailoring advice just for you.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer is handled by MainLayout */}
        </div>
    );
};

export default LandingPage;
