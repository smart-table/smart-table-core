import {proxyListener} from 'smart-table-events';
import {EXEC_CHANGED} from '../events';

const executionListener = proxyListener({[EXEC_CHANGED]: 'onExecutionChange'});

export default ({table}) => executionListener({emitter: table});
