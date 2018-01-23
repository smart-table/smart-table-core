import {proxyListener} from 'smart-table-events';
import {SUMMARY_CHANGED} from '../events';

const summaryListener = proxyListener({[SUMMARY_CHANGED]: 'onSummaryChange'});

export default ({table}) => summaryListener({emitter: table});
