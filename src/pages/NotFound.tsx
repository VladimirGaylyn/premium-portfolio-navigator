
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Home, Compass } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 tech-pattern">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="mx-auto w-20 h-20 mb-4 relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-avengers-red via-avengers-blue to-avengers-gold p-[3px]">
              <div className="h-full w-full rounded-full bg-card flex items-center justify-center">
                <Shield className="h-10 w-10 text-white avengers-glow" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold avengers-title mb-2">404</h1>
          <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The page you're looking for seems to have disappeared like half the universe after a snap.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button className="avengers-button" onClick={() => navigate('/')}>
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Button>
            <Button className="avengers-button-alt" onClick={() => navigate(-1)}>
              <Compass className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
