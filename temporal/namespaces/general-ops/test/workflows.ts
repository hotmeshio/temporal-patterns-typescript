import { proxyActivities, executeChild } from '@temporalio/workflow';

import { TestArgs } from '../../../../types/test';
import { config } from '../../../config';

import * as activities from './activities';

const { doTestProxy } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

/**
 * Test workflow (temporal variant without search)
 */
export const testWorkflow = async (args: TestArgs): Promise<number> => {
  if (args.depth > 1) {
    const childWorkflows: Array<Promise<any>> = [];
    for (let i = 0; i < args.width; i++) {
      //recursively call the workflow
      childWorkflows.push(
        executeChild(testWorkflow, {
          args: [{ ...args, depth: args.depth - 1 }],
          workflowId: `T${Date.now()}.${Math.random() * 1_000_000_000}.${args.depth}.${i}`,
          taskQueue: config.taskQueue,
        }),
      );
    }
    await Promise.all(childWorkflows);
  } else {
    //if final depth, test proxyActivity
    await doTestProxy(args.id);
  }

  const duration = Date.now() - args.timestamp;
  return duration;
};
