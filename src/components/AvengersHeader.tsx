import React from 'react';
const AvengersHeader = () => {
  return <header className="py-6 mb-8">
      <div className="avengers-container">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <div className="p-1 rounded-full">
              <img src="/lovable-uploads/15d691f2-db4b-4621-bf84-0900293313fb.png" alt="Proof that Tony Stark has a heart" className="h-12 w-12 object-cover" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight avengers-title">The Avengers Portfolio Optimizer</h1>
              <p className="text-muted-foreground text-sm">YQuantum: The Hartford and Capgemini’s Quantum Lab</p>
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
    </header>;
};
export default AvengersHeader;