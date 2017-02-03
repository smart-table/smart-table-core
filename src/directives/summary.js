import {SUMMARY_CHANGED} from '../events';
import {proxyListener} from 'smart-table-events';

const executionListener = proxyListener({[SUMMARY_CHANGED]: 'onSummaryChange'});

export default function ({table}) {
  return executionListener({emitter: table});
}
