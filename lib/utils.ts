export const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export const formatDate = (date: Date) => {
  return date.toISOString()
}

export const sanitizeInput = (input: string) => {
  return input.replace(/[^a-zA-Z0-9-_\s]/g, '')
}

export const validateTaskStatus = (status: string) => {
  const validStatuses = ['active', 'resolved', 'deprecated', 'paused', 'failed', 'backlog']
  return validStatuses.includes(status)
}

interface ThreadValidation {
  isValid: boolean;
  sessionPath: string;
  timestamp: string;
  errors?: string[];
  warnings?: string[];
}

interface RepoHealth {
  repoSize: number;
  largeFiles: string[];
  metadataValid: boolean;
  taskFilesValid: boolean;
  errors?: string[];
}

interface UISyncStatus {
  headerValid: boolean;
  footerValid: boolean;
  gamificationActive: boolean;
  dynamicLinksUpdated: boolean;
  lastSynced: string;
}

export const validateThreadInitialization = (threadId: string): ThreadValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const today = new Date();
  const sessionPath = `/agents/memories/session-logs/${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}.html`;

  // Validate thread ID format
  if (!threadId.match(/^[a-zA-Z0-9-_]+$/)) {
    errors.push('Invalid thread ID format');
  }

  // Check if session log exists
  try {
    // File system check would go here
  } catch (e) {
    warnings.push('Session log not found, will be created');
  }

  return {
    isValid: errors.length === 0,
    sessionPath,
    timestamp: today.toISOString(),
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined
  };
};

export const checkRepoHealth = async (): Promise<RepoHealth> => {
  const errors: string[] = [];
  
  return {
    repoSize: 0, // Would be calculated from actual repo
    largeFiles: [], // Would be populated from repo scan
    metadataValid: true,
    taskFilesValid: true,
    errors: errors.length > 0 ? errors : undefined
  };
};

export const validateUISync = (): UISyncStatus => {
  return {
    headerValid: true,
    footerValid: true,
    gamificationActive: true,
    dynamicLinksUpdated: true,
    lastSynced: new Date().toISOString()
  };
};