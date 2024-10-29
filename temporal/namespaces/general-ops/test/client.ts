import { WorkflowClient, Connection } from '@temporalio/client';

import { TestArgs } from '../../../../types/test';
import { config } from '../../../config';
import { connection as connectionConfig } from '../../../connection';
import { testCount } from '../../../../modules/utils';

export class TemporalClient {
  private client: WorkflowClient;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    const connection = await Connection.connect(connectionConfig.connection);

    this.client = new WorkflowClient({
      connection,
      namespace: connectionConfig.namespace,
    });
  }

  async startWorkflow(args: TestArgs): Promise<{ id: string, expectedCount: number }> {
    if (!this.client) {
      await this.initializeClient();
    }

    const handle = await this.client.start(config.workflow, {
      workflowId: args.id,
      taskQueue: config.taskQueue,
      args: [args],
    });
    return { id: handle.workflowId, expectedCount: testCount(args.width, args.depth) };
  }
};

export const temporalClient = new TemporalClient();
