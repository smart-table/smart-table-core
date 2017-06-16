import {SUMMARY_CHANGED} from '../events';
import {proxyListener} from 'smart-table-events';

const summaryListener = proxyListener({[SUMMARY_CHANGED]: 'onSummaryChange'});

export default ({table}) => summaryListener({emitter: table});
