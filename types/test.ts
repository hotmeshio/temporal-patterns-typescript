/**
 * Public HTTP Test route input payload/body
 */
export type TestInput = {
  type: ('ok' | 'error' | 'random' | 'batch');
  width: number; //max allowed is 25
  depth: number;
  wait: boolean;
  memo?: string;
  database?: string;
};

/**
 * Public HTTP Test route input payload/body for batch tests
 */
export interface BatchTestInput extends TestInput {
  count: number;
};


/**
 * Arguments for the recursive test workflow
 */
export type TestArgs = {
  id: string;
  type: ('ok' | 'error' | 'random' | 'batch');
  timestamp: number;
  width: number;
  depth: number;
  wait: boolean;
  memo?: string;
  database?: string;
};
