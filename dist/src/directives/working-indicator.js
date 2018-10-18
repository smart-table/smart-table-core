import { proxyListener } from 'smart-table-events';
const executionListener = proxyListener({ ["EXEC_CHANGED" /* EXEC_CHANGED */]: 'onExecutionChange' });
export const workingIndicatorDirective = ({ table }) => executionListener({ emitter: table });
