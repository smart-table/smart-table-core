import {SmartTableEvents as evts, workingIndicatorDirective as workingIndicator} from '../../dist/bundle/module.js';
import {emitter} from 'smart-table-events';

export default ({test}) => {
    test('summary directive should be able to register listener', t => {
        let counter = 0;
        const table = emitter();
        const s = workingIndicator({table});
        s.onExecutionChange(() => counter++);
        table.dispatch(evts.EXEC_CHANGED);
        t.equal(counter, 1, 'should have updated the counter');
    });
}