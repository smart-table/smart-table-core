import zora from 'zora';
import search from '../../src/directives/search';
import {SEARCH_CHANGED} from '../../src/events';
import {emitter} from 'smart-table-events';

function fakeTable () {
  const table = emitter();
  table.search = input => input;
  return table;
}

export default zora()
  .test('search directive should be able to register listener', (t) => {
    let counter = 0;
    const table = fakeTable();
    const dir = search({table});
    dir.onSearchChange(() => counter++);
    table.dispatch(SEARCH_CHANGED);
    t.equal(counter, 1, 'should have updated the counter');
  })
  .test('search directive should call table search method passing the appropriate argument', (t) => {
    const table = fakeTable();
    const dir = search({table, scope: ['foo', 'bar.woot']});
    const arg = dir.search(42);
    t.deepEqual(arg, {value: 42, scope: ['foo', 'bar.woot']});
  });