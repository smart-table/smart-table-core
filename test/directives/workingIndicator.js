import workingIndicator from '../../src/directives/workingIndicator';
import {EXEC_CHANGED} from '../../src/events';
import {emitter} from 'smart-table-events';
import zora from 'zora';

export default zora()
  .test('summary directive should be able to register listener', function * (t) {
    let counter = 0;
    const table = emitter();
    const s = workingIndicator({table});
    s.onExecutionChange(() => counter++);
    table.dispatch(EXEC_CHANGED);
    t.equal(counter, 1, 'should have updated the counter');
  });


