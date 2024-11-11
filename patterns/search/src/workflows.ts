import { workflow } from '@hotmeshio/hotmesh';

import * as activities from './activities';

const { greet, bye } = workflow.proxyActivities<typeof activities>({
  activities,
});

export async function example(name: string): Promise<string> {
  //set values (they're added to the workflow HASH AND are indexed)
  //(`custom1` and `custom2` were added to the 'bye-bye' index)
  const search = await workflow.search();
  await search.set('custom1', 'meshflow');
  await search.set('custom2', '55');

  //'jimbo' is not indexed (but it can be retrieved)
  await search.set('jimbo', 'jones');
  const [hello, goodbye] = await Promise.all([greet(name), bye(name)]);

  //all data is available to the workflow
  await search.get('jimbo');
  await search.incr('counter', 10); //increment
  await search.get('jimbo');
  await search.mget('jimbo');
  await search.incr('counter', 1);
  await search.get('counter');
  await search.mult('multer', 12); //multiply

  //val4 is 120.00000000009 (rounding error due to logarithmic math)
  await search.mult('multer', 10);
  await workflow.waitFor<{ data: string }>('abcdefg');

  return `${hello} - ${goodbye}`;
}

/**
 * This is an example of a hook that can be called from another workflow
 * or via an external call to the HotMesh API. When a hook
 * is invoked, it does not spawn a new workflow; rather
 * it runs in the context of an existing, target workflow.
 * 
 * This example, udpates shared job data (counter)
 */
export async function exampleHook(name: string): Promise<void> {
  const search = await workflow.search();
  await search.incr('counter', 100);
  await workflow.sleepFor('1 second');
  workflow.signal('abcdefg', { data: 'hello' });
}
