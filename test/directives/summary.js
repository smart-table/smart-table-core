import summary from '../../src/directives/summary';
import {emitter, SUMMARY_CHANGED} from '../../src/events';
import zora from 'zora';

export default zora()
  .test('summary directive should be able to register listener', function * (t) {
    let counter = 0;
    const table = emitter();
    const s = summary({table});
    s.onSummaryChange(() => counter++);
    table.dispatch(SUMMARY_CHANGED);
    t.equal(counter, 1, 'should have updated the counter');
  });


