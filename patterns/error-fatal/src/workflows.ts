import { workflow } from '@hotmeshio/hotmesh';

import * as activities from './activities';

const { myFatalActivity } = workflow.proxyActivities<typeof activities>({
  activities,
});

async function example({ name }: Record<'name', string>): Promise<void> {
  try {
    return await myFatalActivity(name);
  } catch (error) {
    //this error is thrown to reveal the error / stack trace feature
    // when activity execution fails on a remote host
    console.error('rethrowing error >', error);
    throw error;
  }
}

export default { example };
