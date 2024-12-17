import { Button } from '@/components/ui/button';
import { ScrollText } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <ScrollText className="h-20 w-20 text-blue-400" />
          <h1 className="text-4xl md:text-6xl font-bold">Historical Social</h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl">
            Experience history as it happened, through the lens of social media.
            Start your journey from June 1st, 1789.
          </p>
          <div className="space-y-4">
            <Link href="/auth">
              <Button size="lg" className="bg-blue-500 hover:bg-blue-600">
                Start Your Journey
              </Button>
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
            <FeatureCard
              title="Historical Timeline"
              description="Experience history chronologically through social media posts from historical figures."
            />
            <FeatureCard
              title="Interactive Experience"
              description="Like and comment on historical events as they unfold in your timeline."
            />
            <FeatureCard
              title="Real-time Progression"
              description="Time moves forward from your start date, revealing new historical content."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}