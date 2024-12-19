import { workflow } from '@hotmeshio/hotmesh';

export async function parentExample(
  name: string,
): Promise<Record<string, string>> {
  const workflowId1 = 'jimbo1';
  const workflowId2 = 'jimbo2';
  const childWorkflowOutput1 = await workflow.execChild<string>({
    args: [`${name} to CHILD`],
    taskQueue: 'child-world',
    workflowName: 'childExample',
    workflowId: workflowId1,
  });
  const childWorkflowOutput2 = await workflow.startChild({
    args: [`${name} to CHILD`],
    taskQueue: 'child-world',
    workflowName: 'childExample',
    workflowId: workflowId2,
    expire: 600, //don't expire immediately once complete
  });
  //interrupted flows are stopped immediately:
  // transition message that returns will be rejected and its
  // result discarded
  (await workflow.interrupt(workflowId2, {
    throw: false,
    expire: 600,
  })) as string;
  return {
    childWorkflowOutput: childWorkflowOutput1,
    cancelledWorkflowId: childWorkflowOutput2,
  };
}
