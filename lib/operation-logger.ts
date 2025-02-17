import { generateId, formatDate } from './utils'

interface OperationLog {
  operationId: string;
  operationType: 'new-thread' | 'task-update' | 'memory-consolidation';
  timestamp: string;
  status: 'success' | 'failure';
  duration: number;
  details: Record<string, any>;
}

class OperationLogger {
  private static instance: OperationLogger;
  private logs: OperationLog[] = [];

  private constructor() {}

  static getInstance(): OperationLogger {
    if (!OperationLogger.instance) {
      OperationLogger.instance = new OperationLogger();
    }
    return OperationLogger.instance;
  }

  logOperation(
    operationType: OperationLog['operationType'],
    status: OperationLog['status'],
    duration: number,
    details: Record<string, any>
  ): void {
    const log: OperationLog = {
      operationId: generateId(),
      operationType,
      timestamp: formatDate(new Date()),
      status,
      duration,
      details
    };
    this.logs.push(log);
    this.persistLog(log);
  }

  private persistLog(log: OperationLog): void {
    // Will be implemented with database integration
    console.log('Operation logged:', log);
  }

  getRecentLogs(limit: number = 10): OperationLog[] {
    return this.logs.slice(-limit);
  }

  getOperationStats(): Record<string, any> {
    return {
      totalOperations: this.logs.length,
      successRate: this.calculateSuccessRate(),
      averageDuration: this.calculateAverageDuration()
    };
  }

  private calculateSuccessRate(): number {
    if (this.logs.length === 0) return 0;
    const successful = this.logs.filter(log => log.status === 'success').length;
    return (successful / this.logs.length) * 100;
  }

  private calculateAverageDuration(): number {
    if (this.logs.length === 0) return 0;
    const total = this.logs.reduce((acc, log) => acc + log.duration, 0);
    return total / this.logs.length;
  }
}

export default OperationLogger;