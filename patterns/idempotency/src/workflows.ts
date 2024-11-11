import { workflow } from '@hotmeshio/hotmesh';

import * as activities from './activities';

//NOTE: when `./activities` exports a `default` function,
//      it is imported as shown here (using the type)
import type greetFunctionType from './activities';
type ActivitiesType = {
  greet: typeof greetFunctionType;
};

const { greet } = workflow.proxyActivities<ActivitiesType>({
  activities,
});

export async function example(name: string): Promise<string> {
  const greet1 = await greet(name);
  await workflow.execChild<string>({
    args: ['Howdy!'],
    taskQueue: 'idempotency-world',
    workflowName: 'childExample',
    workflowId: 'idempotency-child', //the parent is already named this,
    expire: 10_000,
  });
  //this line will never be reached (workflow id collision)
  return greet1;
}

export async function childExample(name: string): Promise<string> {
  return await greet(name);
}

const STATE = {
  count: 0,
};

export async function fixableExample(badCount: number): Promise<string> {
  //add unique suffix to workflowId after `badCount` failures
  const uniqueSuffix = STATE.count++ > badCount ? '-fixed' : '';

  const childOutput = await workflow.execChild<string>({
    args: ['FIXED'],
    taskQueue: 'idempotency-world',
    workflowName: 'childExample',
    workflowId: `fixable-idempotency-child${uniqueSuffix}`,
  });
  return childOutput;
}
