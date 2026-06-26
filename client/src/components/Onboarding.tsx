import { useState, useEffect } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  action: () => Promise<void>;
  icon: string;
}

export function Onboarding() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(new Set<number>());
  const { isSupported, subscribe } = usePushNotifications();

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: 'Welcome to Ctrl Alt News',
      description: 'Your source for AI, Science, Robotics, and Gadgets news.',
      action: async () => {
        // Send welcome email
        await fetch('/api/transactional/send-welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: localStorage.getItem('userEmail') }),
        });
      },
      icon: '👋',
    },
    {
      id: 2,
      title: 'Enable Notifications',
      description: 'Get notified about the latest news and updates.',
      action: isSupported ? subscribe : async () => {},
      icon: '🔔',
    },
    {
      id: 3,
      title: 'Subscribe to Daily Digest',
      description: 'Get personalized news delivered to your inbox every day.',
      action: async () => {
        await fetch('/api/digest/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            frequency: 'daily',
            time: '09:00',
            categories: ['AI', 'Science'],
          }),
        });
      },
      icon: '📧',
    },
    {
      id: 4,
      title: 'Customize Your Preferences',
      description: 'Choose your favorite categories and notification frequency.',
      action: async () => {
        // Navigate to settings
        window.location.href = '/profile';
      },
      icon: '⚙️',
    },
    {
      id: 5,
      title: 'Explore the Dashboard',
      description: 'View real-time analytics and engagement metrics.',
      action: async () => {
        window.location.href = '/dashboard';
      },
      icon: '📊',
    },
  ];

  useEffect(() => {
    // Check if user has completed onboarding
    const hasOnboarded = localStorage.getItem('onboarding-completed');
    if (!hasOnboarded) {
      setIsOpen(true);
    }
  }, []);

  const handleStepComplete = async () => {
    try {
      await steps[currentStep].action();
      const newCompleted = new Set(completed);
      newCompleted.add(currentStep);
      setCompleted(newCompleted);

      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Onboarding complete
        localStorage.setItem('onboarding-completed', 'true');
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Onboarding step failed:', error);
      // Allow user to skip on error
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding-completed', 'true');
    setIsOpen(false);
  };

  if (!isOpen) {
    return null;
  }

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">
              {step.icon} {step.title}
            </h2>
            <p className="text-gray-400 mt-2">{step.description}</p>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-400">Step {currentStep + 1} of {steps.length}</p>
            <p className="text-sm text-gray-400">{Math.round(progress)}%</p>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex gap-2 mb-6">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`h-2 flex-1 rounded-full transition ${
                completed.has(index)
                  ? 'bg-green-600'
                  : index === currentStep
                  ? 'bg-blue-600'
                  : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1 px-4 py-2 border border-gray-700 hover:border-gray-600 rounded text-gray-300 hover:text-white transition"
            >
              Back
            </button>
          )}
          <button
            onClick={handleStepComplete}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-bold transition"
          >
            {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
          </button>
        </div>

        {/* Skip Link */}
        <button
          onClick={handleSkip}
          className="w-full mt-4 text-gray-400 hover:text-gray-300 text-sm transition"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

export default Onboarding;
