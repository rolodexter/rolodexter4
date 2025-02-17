import { validateThreadInitialization, checkRepoHealth, validateUISync } from './utils';
import OperationLogger from './operation-logger';

interface InitializationResult {
  success: boolean;
  operationId: string;
  sessionPath: string;
  duration: number;
  errors?: string[];
  warnings?: string[];
}

export class ThreadInitializer {
  private logger: OperationLogger;

  constructor() {
    this.logger = OperationLogger.getInstance();
  }

  async initialize(threadId: string): Promise<InitializationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Step 1: Validate thread initialization
      const threadValidation = validateThreadInitialization(threadId);
      if (!threadValidation.isValid) {
        errors.push(...(threadValidation.errors || []));
      }
      if (threadValidation.warnings) {
        warnings.push(...threadValidation.warnings);
      }

      // Step 2: Check repository health
      const repoHealth = await checkRepoHealth();
      if (repoHealth.errors) {
        errors.push(...repoHealth.errors);
      }

      // Step 3: Validate UI synchronization
      const uiSync = validateUISync();
      if (!uiSync.headerValid || !uiSync.footerValid) {
        errors.push('UI components not properly synchronized');
      }

      const duration = Date.now() - startTime;
      const success = errors.length === 0;

      // Log the operation
      this.logger.logOperation(
        'new-thread',
        success ? 'success' : 'failure',
        duration,
        {
          threadId,
          sessionPath: threadValidation.sessionPath,
          warnings,
          errors
        }
      );

      return {
        success,
        operationId: threadId,
        sessionPath: threadValidation.sessionPath,
        duration,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);

      this.logger.logOperation(
        'new-thread',
        'failure',
        duration,
        {
          threadId,
          error: errorMessage
        }
      );

      return {
        success: false,
        operationId: threadId,
        sessionPath: '',
        duration,
        errors
      };
    }
  }
}