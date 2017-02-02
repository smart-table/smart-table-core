import {proxyListener, EXEC_CHANGED} from '../events';

const executionListener = proxyListener({[EXEC_CHANGED]: 'onExecutionChange'});

export default function ({table}) {
  return executionListener({emitter: table});
}
