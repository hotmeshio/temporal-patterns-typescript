import { workflow } from '@hotmeshio/hotmesh';
import * as activities from './activities';

// NOTE: when `./activities` exports a `default` function,
//      it is imported as shown here (using the type)
import type greetFunctionType from './activities';
type ActivitiesType = {
  greet: typeof greetFunctionType;
};

type responseType = {
  random1: number;
  proxyGreeting: {
    complex: string;
  };
  random2: number;
  payload: { id: string; data: { hello: string; id: string } };
  proxyGreeting3: {
    complex: string;
  };
  proxyGreeting4: {
    complex: string;
  };
  jobId: string;
  jobBody: void;
};

type payloadType = {
  id: string;
  data: {
    hello: string;
    id: string;
  };
};

const { greet } = workflow.proxyActivities<ActivitiesType>({
  activities,
});

export async function example(name: string): Promise<responseType> {
  //deterministic random number
  const random1 = workflow.random();
  
  //suspend and await proxyActivities result
  const proxyGreeting = await greet(name);
  
  //suspend and await proxyActivities result
  await greet(`${name}2`)
  
  //deterministic random number
  const random2 = workflow.random();
  
  //suspend and await workflow.sleepFor completion
  await workflow
    .sleepFor('2 seconds');

  //suspend and await workflow.execChild completion
  await workflow
    .execChild({
      workflowName: 'childExample',
      args: [name],
      taskQueue: 'everything-world',
    });
  
  //suspend and await workflow.startChild completion
  await workflow
    .startChild({
      workflowName: 'childExample',
      args: [`start-${name}`],
      taskQueue: 'everything-world',
    });

  //suspend...the test runner will send this signalId to awaken the workflow at this point
  const payload = await workflow.waitFor<payloadType>('abcdefg');

  //test promise.all suspend-and-collate with workflow.proxyActivities
  const [proxyGreeting3, proxyGreeting4] = await Promise.all([
    //execIndex: 10 (this execIndex is reassigned after collation is complete)
    greet(`${name}3`), //execIndex: 10 (first child in the promise inherits the collator id)
    greet(`${name}4`), //execIndex: 11
  ]);

  //test promise.all suspend-and-collate with workflow.startChild and workflow.execChild
  const [jobId, jobBody] = await Promise.all([
    workflow.startChild({
      workflowName: 'childExample',
      args: [`start-${name}x`],
      taskQueue: 'everything-world',
      workflowId: 'MyWorkflowId123',
    }),
    workflow.execChild<void>({
      workflowName: 'childExample',
      args: [`start-${name}y`],
      taskQueue: 'everything-world',
    }),
  ]);

  //return structured response
  return {
    random1,
    proxyGreeting,
    random2,
    payload,
    proxyGreeting3,
    proxyGreeting4,
    jobId,
    jobBody,
  };
}

export async function childExample(name: string): Promise<void> {
  //test the 'void' return type
  return;
}
