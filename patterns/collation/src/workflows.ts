import { workflow } from '@hotmeshio/hotmesh';

import * as activities from './activities';

const { greet } = workflow.proxyActivities<typeof activities>({
  activities,
});

export async function example(): Promise<[string, string, string, number]> {
  return await Promise.all([
    greet('1'),
    greet('2'),
    greet('3'),
    workflow.sleepFor('5 seconds'),
  ]);
}
