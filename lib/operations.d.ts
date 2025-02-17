// Type definitions for rolodexter4 operations
declare namespace Operations {
  interface ThreadOperation {
    threadId: string;
    sessionPath: string;
    timestamp: string;
    status: 'initializing' | 'active' | 'completed' | 'failed';
  }

  interface OperationStep {
    name: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    startTime?: string;
    endTime?: string;
    error?: string;
  }

  interface OperationMetrics {
    duration: number;
    memoryUsage: number;
    resourceUtilization: number;
  }

  interface OperationHooks {
    onStart?: () => void;
    onStep?: (step: OperationStep) => void;
    onComplete?: (metrics: OperationMetrics) => void;
    onError?: (error: Error) => void;
  }
}