
import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface AlgorithmToggleProps {
  algorithm: 'classical' | 'quantum';
  setAlgorithm: (algorithm: 'classical' | 'quantum') => void;
}

const AlgorithmToggle = ({ algorithm, setAlgorithm }: AlgorithmToggleProps) => {
  const { toast } = useToast();

  const handleQuantumToggle = () => {
    setAlgorithm('quantum');
    toast({
      title: "Quantum Algorithm Selected",
      description: "Quantum optimization is not fully implemented and will fallback to classical optimization.",
      variant: "default",
    });
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium mr-2">Algorithm:</span>
      <div className="flex bg-muted rounded-md p-1">
        <Button
          variant={algorithm === 'classical' ? "default" : "ghost"}
          size="sm"
          onClick={() => setAlgorithm('classical')}
          className={`transition-all ${algorithm === 'classical' ? 'text-primary-foreground' : 'text-muted-foreground'}`}
        >
          Classical
        </Button>
        <Button
          variant={algorithm === 'quantum' ? "default" : "ghost"}
          size="sm"
          onClick={handleQuantumToggle}
          className={`transition-all ${algorithm === 'quantum' ? 'text-primary-foreground' : 'text-muted-foreground'}`}
        >
          Quantum
        </Button>
      </div>
    </div>
  );
};

export default AlgorithmToggle;
