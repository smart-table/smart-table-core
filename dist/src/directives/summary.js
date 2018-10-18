import { proxyListener } from 'smart-table-events';
const summaryListener = proxyListener({ ["SUMMARY_CHANGED" /* SUMMARY_CHANGED */]: 'onSummaryChange' });
export const summaryDirective = ({ table }) => summaryListener({ emitter: table });
