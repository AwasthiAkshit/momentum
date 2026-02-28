import React from 'react';
import { CheckCircle, Zap, Shield, Clock, BarChart, Brain } from 'lucide-react';

const FeaturesPage = () => {
    const features = [
        {
            name: 'Smart Task Management',
            description: 'Organize your assignments, readings, and projects with ease. Prioritize what matters most.',
            icon: CheckCircle,
        },
        {
            name: 'Focus Timer',
            description: 'Built-in Pomodoro timer to help you stay zoned in and avoid burnout.',
            icon: Clock,
        },
        {
            name: 'Analytics Dashboard',
            description: 'Visualize your progress with detailed charts and stats. Know exactly how you spend your time.',
            icon: BarChart,
        },
        {
            name: 'AI Insights',
            description: 'Get personalized recommendations on when to study and what to focus on based on your habits.',
            icon: Brain,
        },
        {
            name: 'Goal Tracking',
            description: 'Set long-term academic goals and track your journey towards achieving them.',
            icon: Zap,
        },
        {
            name: 'Secure & Private',
            description: 'Your data is encrypted and safe. We prioritize your privacy above all else.',
            icon: Shield,
        },
    ];

    return (
        <div className="bg-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:text-center">
                    <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Features</h2>
                    <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                        Everything you need to excel
                    </p>
                    <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                        Our platform combines powerful tools to help you manage your academic life efficiently.
                    </p>
                </div>

                <div className="mt-10">
                    <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                        {features.map((feature) => (
                            <div key={feature.name} className="relative">
                                <dt>
                                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                                        <feature.icon className="h-6 w-6" aria-hidden="true" />
                                    </div>
                                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">{feature.name}</p>
                                </dt>
                                <dd className="mt-2 ml-16 text-base text-gray-500">{feature.description}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </div>
    );
};

export default FeaturesPage;
