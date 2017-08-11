import zora from 'zora';
import tableFactory from '../../src/table';
import {
  TOGGLE_SORT,
  PAGE_CHANGED,
  FILTER_CHANGED,
  SUMMARY_CHANGED,
  SEARCH_CHANGED,
  DISPLAY_CHANGED,
  EXEC_CHANGED
} from '../../src/events'

function wait (time) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve('finished');
    }, time)
  });
}

export default zora()
  .test('table directive: should be able to register listener on display change', (t) => {
    let displayed = null;
    const table = tableFactory({});
    table.onDisplayChange((args) => displayed = args);
    table.dispatch(DISPLAY_CHANGED, 'foo');
    t.equal(displayed, 'foo');
  })
  .test('table directive: sort should dispatch the mutated sort state', (t) => {
    let sortState = null;
    let sliceState = null;
    const table = tableFactory({});
    table.on(TOGGLE_SORT, arg => sortState = arg);
    table.on(PAGE_CHANGED, arg => sliceState = arg);
    const newState = {direction: 'asc', pointer: 'foo.bar'};
    table.sort(newState);
    t.deepEqual(sortState, newState);
    t.deepEqual(sliceState, {page: 1}, 'should have reset to first page');
  })
  .test('table directive: sort should trigger an execution with the new state', (t) => {
    const table = tableFactory({}, function ({tableState}) {
      return {
        exec(){
          return tableState;
        }
      };
    });
    const newState = table.sort({direction: 'asc', pointer: 'foo.bar'});
    t.deepEqual(newState, {slice: {page: 1}, filter: {}, search: {}, sort: {direction: 'asc', pointer: 'foo.bar'}});
  })
  .test('table directive: slice should dispatch the mutated slice state', (t) => {
    let sliceState = null;
    const table = tableFactory({});
    table.on(PAGE_CHANGED, arg => sliceState = arg);
    const newState = {page: 7, size: 25};
    table.slice(newState);
    t.deepEqual(sliceState, newState);
  })
  .test('table directive: slice should trigger an execution with the new state', (t) => {
    const table = tableFactory({}, function ({tableState}) {
      return {
        exec(){
          return tableState;
        }
      };
    });
    const newState = table.slice({page: 4, size: 12});
    t.deepEqual(newState, {"sort": {}, "slice": {"page": 4, "size": 12}, "filter": {}, "search": {}});
  })
  .test('table directive: filter should dispatch the mutated filter state', (t) => {
    let filterState = null;
    let sliceState = null;
    const table = tableFactory({});
    table.on(FILTER_CHANGED, arg => filterState = arg);
    table.on(PAGE_CHANGED, arg => sliceState = arg);
    const newState = {foo: [{value: 'bar'}]};
    table.filter(newState);
    t.deepEqual(filterState, newState);
    t.deepEqual(sliceState, {page: 1}, 'should have reset the page');
  })
  .test('table directive: filter should trigger an execution with the new state', (t) => {
    const table = tableFactory({}, function ({tableState}) {
      return {
        exec(){
          return tableState;
        }
      };
    });
    const newState = table.filter({foo: [{value: 'bar'}]});
    t.deepEqual(newState, {"sort": {}, "slice": {"page": 1}, "filter": {"foo": [{"value": "bar"}]}, "search": {}}
    );
  })
  .test('table directive: search should dispatch the mutated search state', (t) => {
    let searchState = null;
    let sliceState = null;
    const table = tableFactory({});
    table.on(SEARCH_CHANGED, arg => searchState = arg);
    table.on(PAGE_CHANGED, arg => sliceState = arg);
    const newState = {value: 'foo'};
    table.search(newState);
    t.deepEqual(searchState, newState);
    t.deepEqual(sliceState, {page: 1}, 'should have reset to the first page');
  })
  .test('table directive: search should trigger an execution with the new state', (t) => {
    const table = tableFactory({}, function ({tableState}) {
      return {
        exec(){
          return tableState;
        }
      };
    });
    const newState = table.search({value: 'bar'});
    t.deepEqual(newState, {"sort": {}, "slice": {"page": 1}, "filter": {}, "search": {"value": "bar"}});
  })
  .test('table directive: eval should return the displayed collection based on table state by default', async function (t) {
    const tableState = {
      sort: {pointer: 'id', direction: 'desc'},
      search: {},
      filter: {},
      slice: {page: 1, size: 2}
    };
    const table = tableFactory({
      data: [
        {id: 1, name: 'foo'},
        {id: 2, name: 'blah'},
        {id: 3, name: 'bip'}
      ],
      tableState
    });
    const output = await table.eval();
    t.deepEqual(output, [
      {"index": 2, "value": {"id": 3, "name": "bip"}},
      {"index": 1, "value": {"id": 2, "name": "blah"}}
    ]);

    //table state has mutated !
    tableState.slice = {page: 2, size: 2};
    const outputBis = await table.eval();
    t.deepEqual(outputBis, [{"index": 0, "value": {"id": 1, "name": "foo"}}]);
  })
  .test('table directive: eval should be able to take any state as input', async function (t) {
    const tableState = {
      sort: {pointer: 'id', direction: 'desc'},
      search: {},
      filter: {},
      slice: {page: 1, size: 2}
    };
    const table = tableFactory({
      data: [
        {id: 1, name: 'foo'},
        {id: 2, name: 'blah'},
        {id: 3, name: 'bip'}
      ],
      tableState
    });
    const output = await table.eval({sort: {}, slice: {}, filter: {}, search: {}});
    t.deepEqual(output, [
      {"index": 0, "value": {"id": 1, "name": "foo"}},
      {"index": 1, "value": {"id": 2, "name": "blah"}},
      {"index": 2, "value": {"id": 3, "name": "bip"}}
    ]);
  })
  .test('table directive: eval should not dispatch any event', async function (t) {
    let counter = 0;
    const tableState = {
      sort: {pointer: 'id', direction: 'desc'},
      search: {},
      filter: {},
      slice: {page: 1, size: 2}
    };
    const incrementCounter = () => counter++;
    const table = tableFactory({
      tableState
    });
    table.on(DISPLAY_CHANGED, incrementCounter);
    table.on(TOGGLE_SORT, incrementCounter);
    table.on(PAGE_CHANGED, incrementCounter);
    table.on(FILTER_CHANGED, incrementCounter);
    table.on(SEARCH_CHANGED, incrementCounter);
    table.on(SUMMARY_CHANGED, incrementCounter);
    table.on(EXEC_CHANGED, incrementCounter);
    await table.eval();
    t.equal(counter, 0, 'counter should not have been updated');
    t.deepEqual(tableState, {
      sort: {pointer: 'id', direction: 'desc'},
      search: {},
      filter: {},
      slice: {page: 1, size: 2}
    }, 'table state should not have changed');
  })
  .test('exec should first set the working state to true then false', async function (t) {
    let workingState;
    const table = tableFactory({
      data: [
        {id: 1, name: 'foo'},
        {id: 2, name: 'blah'},
        {id: 3, name: 'bip'}
      ]
    });
    table.on(EXEC_CHANGED, function ({working}) {
      workingState = working;
    });
    table.exec();
    t.equal(workingState, true);
    await wait(25);
    t.equal(workingState, false);
  })
  .test('exec should dispatch the display changed event with the new displayed value', async function (t) {
    let displayed;
    const tableState = {
      sort: {pointer: 'id', direction: 'desc'},
      search: {},
      filter: {},
      slice: {page: 1, size: 2}
    };
    const table = tableFactory({
      data: [
        {id: 1, name: 'foo'},
        {id: 2, name: 'blah'},
        {id: 3, name: 'bip'}
      ],
      tableState
    });

    table.onDisplayChange(val => displayed = val);
    table.exec();
    await wait(25);
    t.deepEqual(displayed, [
      {"index": 2, "value": {"id": 3, "name": "bip"}},
      {"index": 1, "value": {"id": 2, "name": "blah"}}
    ]);
  })
  .test('exec should dispatch the summary changed event with the new value', async function (t) {
    let summary;
    const tableState = {
      sort: {pointer: 'id', direction: 'desc'},
      search: {},
      filter: {name: [{value: 'b'}]},
      slice: {page: 1, size: 1}
    };
    const table = tableFactory({
      data: [
        {id: 1, name: 'foo'},
        {id: 2, name: 'blah'},
        {id: 3, name: 'bip'}
      ],
      tableState
    });

    table.on(SUMMARY_CHANGED, val => summary = val);
    table.exec();
    await wait(25);
    t.deepEqual(summary, {"page": 1, "size": 1, "filteredCount": 2}
    );
  })
  .test('getTableState should return a deep copy of the tableState', (t) => {
    const tableState = {
      sort: {pointer: 'foo'},
      slice: {page: 2, size: 25},
      search: {value: 'wat', scope: []},
      filter: {foo: [{value: 'blah'}]}
    };
    const table = tableFactory({data: [], tableState});
    const copy = table.getTableState();
    t.deepEqual(copy, tableState);
    t.ok(!Object.is(copy.sort, tableState.sort));
    t.ok(!Object.is(copy.search, tableState.search));
    t.ok(!Object.is(copy.filter, tableState.filter));
    t.ok(!Object.is(copy.slice, tableState.slice));
  })
