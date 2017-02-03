import {EXEC_CHANGED} from '../events';
import {proxyListener} from 'smart-table-events';

const executionListener = proxyListener({[EXEC_CHANGED]: 'onExecutionChange'});

export default function ({table}) {
  return executionListener({emitter: table});
}
