import filter from '../../src/directives/filter';
import {emitter, FILTER_CHANGED} from '../../src/events';
import zora from 'zora';

function fakeTable () {
  const table = emitter();
  table.filter = input => input;
  return table;
}

export default zora()
  .test('filter directive should be able to register listener', function * (t) {
    let counter = 0;
    const table = fakeTable();
    const fd = filter({table, pointer: 'foo'});
    fd.onFilterChange(() => counter++);
    table.dispatch(FILTER_CHANGED);
    t.equal(counter, 1, 'should have updated the counter');
  })
  .test('filter directive should call table filter method passing the appropriate argument', function * (t) {
    const table = fakeTable();
    const fd = filter({table, pointer: 'foo.bar', operator: 'is', type: 'number'});
    const arg = fd.filter(42);
    t.deepEqual(arg, {'foo.bar': [{value: 42, operator: 'is', type: 'number'}]});
  });


