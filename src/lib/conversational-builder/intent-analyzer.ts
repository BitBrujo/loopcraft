import {
  UserIntent,
  DetectedEntity,
  Capability,
} from '@/types/conversational-builder';

/**
 * Analyzes user messages to extract intent, entities, and capabilities
 */
export class IntentAnalyzer {
  /**
   * Detect user intent from message
   */
  static detectIntent(message: string): UserIntent | undefined {
    const lowerMessage = message.toLowerCase();

    // Database intent
    if (
      lowerMessage.includes('database') ||
      lowerMessage.includes('postgresql') ||
      lowerMessage.includes('mysql') ||
      lowerMessage.includes('mongo') ||
      lowerMessage.includes('sql') ||
      lowerMessage.includes('table')
    ) {
      return {
        type: 'database',
        description: 'Database access and management',
        confidence: 0.8,
      };
    }

    // API intent
    if (
      lowerMessage.includes('api') ||
      lowerMessage.includes('rest') ||
      lowerMessage.includes('endpoint') ||
      lowerMessage.includes('http')
    ) {
      return {
        type: 'api',
        description: 'API integration and access',
        confidence: 0.8,
      };
    }

    // File system intent
    if (
      lowerMessage.includes('file') ||
      lowerMessage.includes('upload') ||
      lowerMessage.includes('download') ||
      lowerMessage.includes('storage') ||
      lowerMessage.includes('media')
    ) {
      return {
        type: 'file_system',
        description: 'File system operations',
        confidence: 0.8,
      };
    }

    // Notification intent
    if (
      lowerMessage.includes('notification') ||
      lowerMessage.includes('alert') ||
      lowerMessage.includes('email') ||
      lowerMessage.includes('message') ||
      lowerMessage.includes('notify')
    ) {
      return {
        type: 'notification',
        description: 'Notification and messaging',
        confidence: 0.8,
      };
    }

    // Custom/unknown
    if (lowerMessage.includes('server') || lowerMessage.includes('tool')) {
      return {
        type: 'custom',
        description: message,
        confidence: 0.5,
      };
    }

    return undefined;
  }

  /**
   * Extract entities from message
   */
  static extractEntities(message: string): DetectedEntity[] {
    const entities: DetectedEntity[] = [];
    const lowerMessage = message.toLowerCase();

    // Technologies
    const technologies = [
      'postgresql',
      'mysql',
      'mongodb',
      'redis',
      'rest',
      'graphql',
      's3',
      'firebase',
      'oauth',
    ];
    for (const tech of technologies) {
      if (lowerMessage.includes(tech)) {
        entities.push({
          type: 'technology',
          value: tech.toUpperCase(),
        });
      }
    }

    // Data types
    const dataTypes = ['users', 'orders', 'products', 'customers', 'invoices', 'tasks'];
    for (const dataType of dataTypes) {
      if (lowerMessage.includes(dataType)) {
        entities.push({
          type: 'data_type',
          value: dataType,
        });
      }
    }

    // Capabilities
    if (lowerMessage.includes('read') || lowerMessage.includes('get') || lowerMessage.includes('query')) {
      entities.push({
        type: 'capability',
        value: 'read',
      });
    }
    if (lowerMessage.includes('write') || lowerMessage.includes('create') || lowerMessage.includes('insert')) {
      entities.push({
        type: 'capability',
        value: 'write',
      });
    }
    if (lowerMessage.includes('update') || lowerMessage.includes('modify')) {
      entities.push({
        type: 'capability',
        value: 'update',
      });
    }
    if (lowerMessage.includes('delete') || lowerMessage.includes('remove')) {
      entities.push({
        type: 'capability',
        value: 'delete',
      });
    }

    // Requirements
    if (lowerMessage.includes('auth') || lowerMessage.includes('authentication')) {
      entities.push({
        type: 'requirement',
        value: 'authentication',
      });
    }
    if (lowerMessage.includes('real-time') || lowerMessage.includes('realtime') || lowerMessage.includes('live')) {
      entities.push({
        type: 'requirement',
        value: 'real-time',
      });
    }

    return entities;
  }

  /**
   * Infer required capabilities from intent and entities
   */
  static inferCapabilities(
    intent: UserIntent | undefined,
    entities: DetectedEntity[]
  ): Capability[] {
    const capabilities: Capability[] = [];
    const capabilityMap: Record<string, Capability> = {};

    // Add capability helper
    const addCapability = (id: string, name: string, type: Capability['type']) => {
      if (!capabilityMap[id]) {
        capabilityMap[id] = {
          id,
          name,
          type,
          implemented: false,
        };
      }
    };

    // CRUD capabilities from entities
    for (const entity of entities) {
      if (entity.type === 'capability') {
        if (entity.value === 'read') {
          addCapability('read', 'Read Data', 'CRUD');
        }
        if (entity.value === 'write') {
          addCapability('create', 'Create Data', 'CRUD');
        }
        if (entity.value === 'update') {
          addCapability('update', 'Update Data', 'CRUD');
        }
        if (entity.value === 'delete') {
          addCapability('delete', 'Delete Data', 'CRUD');
        }
      }
      if (entity.type === 'requirement') {
        if (entity.value === 'authentication') {
          addCapability('auth', 'Authentication', 'authentication');
        }
        if (entity.value === 'real-time') {
          addCapability('realtime', 'Real-time Updates', 'real_time');
        }
      }
    }

    // Default capabilities based on intent
    if (intent?.type === 'database') {
      addCapability('read', 'Read Data', 'CRUD');
      addCapability('search', 'Search Data', 'search');
    }

    if (intent?.type === 'file_system') {
      addCapability('file-upload', 'File Upload', 'file_upload');
      addCapability('read', 'Read Files', 'CRUD');
    }

    if (intent?.type === 'notification') {
      addCapability('notify', 'Send Notifications', 'custom');
    }

    return Object.values(capabilityMap);
  }

  /**
   * Detect if user is requesting UI
   */
  static detectUIRequest(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return (
      lowerMessage.includes('ui') ||
      lowerMessage.includes('interface') ||
      lowerMessage.includes('form') ||
      lowerMessage.includes('dashboard') ||
      lowerMessage.includes('page')
    );
  }

  /**
   * Detect deployment readiness request
   */
  static detectDeploymentRequest(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return (
      lowerMessage.includes('deploy') ||
      lowerMessage.includes('test') ||
      lowerMessage.includes('ready') ||
      lowerMessage.includes('done') ||
      lowerMessage.includes('finish')
    );
  }
}
