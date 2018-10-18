import test from 'zora';
import {emitter} from 'smart-table-events';
import {SmartTableEvents as evts, summaryDirective as summary} from '../../dist/src';

test('summary directive should be able to register listener', (t) => {
    let counter = 0;
    const table = emitter();
    const s = summary({table});
    s.onSummaryChange(() => counter++);
    table.dispatch(evts.SUMMARY_CHANGED);
    t.equal(counter, 1, 'should have updated the counter');
});


