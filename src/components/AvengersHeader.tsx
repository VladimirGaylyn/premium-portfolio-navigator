
import React from 'react';
import { Shield } from 'lucide-react';

const AvengersHeader = () => {
  return (
    <header className="py-6 mb-8">
      <div className="avengers-container">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <div className="p-1.5 bg-gradient-to-br from-avengers-red via-avengers-blue to-avengers-gold rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight avengers-title">
                Avengers Portfolio Optimizer
              </h1>
              <p className="text-muted-foreground text-sm">
                Assemble your optimal portfolio with our advanced optimization algorithms
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <div className="flex items-center space-x-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-avengers-green animate-pulse"></div>
              <span className="text-muted-foreground">Optimization Ready</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AvengersHeader;
