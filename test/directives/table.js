import test from 'zora';
import {smartTable as tableFactory, FilterOperator, SortDirection, SmartTableEvents as evts} from '../../dist/bundle/module';

const wait = time => new Promise(resolve => {
    setTimeout(() => {
        resolve('finished');
    }, time);
});

test('table directive: should be able to register listener on display change', t => {
    let displayed = null;
    const table = tableFactory({});
    table.onDisplayChange((args) => displayed = args);
    table.dispatch(evts.DISPLAY_CHANGED, 'foo');
    t.equal(displayed, 'foo');
});

test('table directive: sort should dispatch the mutated sort state', t => {
    let sortState = null;
    let sliceState = null;
    const table = tableFactory({});
    table.on(evts.TOGGLE_SORT, arg => sortState = arg);
    table.on(evts.PAGE_CHANGED, arg => sliceState = arg);
    const newState = {direction: SortDirection.ASC, pointer: 'foo.bar'};
    table.sort(newState);
    t.deepEqual(sortState, newState);
    t.deepEqual(sliceState, {page: 1}, 'should have reset to first page');
});

test('table directive: sort should trigger an execution with the new state', async t => {
    const table = tableFactory({});
    table.sort({direction: SortDirection.ASC, pointer: 'foo.bar'});
    t.deepEqual(table.getTableState(), {
        slice: {page: 1},
        filter: {},
        search: {},
        sort: {direction: SortDirection.ASC, pointer: 'foo.bar'}
    });
});

test('table directive: slice should dispatch the mutated slice state', t => {
    let sliceState = null;
    const table = tableFactory({});
    table.on(evts.PAGE_CHANGED, arg => sliceState = arg);
    const newState = {page: 7, size: 25};
    table.slice(newState);
    t.deepEqual(sliceState, newState);
});

test('table directive: slice should trigger an execution with the new state', t => {
    const table = tableFactory({});
    table.slice({page: 4, size: 12});
    t.deepEqual(table.getTableState(), {'sort': {}, 'slice': {'page': 4, 'size': 12}, 'filter': {}, 'search': {}});
});

test('table directive: filter should dispatch the mutated filter state', t => {
    let filterState = null;
    let sliceState = null;
    const table = tableFactory({});
    table.on(evts.FILTER_CHANGED, arg => filterState = arg);
    table.on(evts.PAGE_CHANGED, arg => sliceState = arg);
    const newState = {foo: [{value: 'bar'}]};
    table.filter(newState);
    t.deepEqual(filterState, newState);
    t.deepEqual(sliceState, {page: 1}, 'should have reset the page');
});

test('table directive: filter should trigger an execution with the new state', t => {
    const table = tableFactory({});
    table.filter({foo: [{value: 'bar'}]});
    t.deepEqual(table.getTableState(), {
        'sort': {},
        'slice': {'page': 1},
        'filter': {'foo': [{'value': 'bar'}]},
        'search': {}
    });
});

test('table directive: search should dispatch the mutated search state', t => {
    let searchState = null;
    let sliceState = null;
    const table = tableFactory({});
    table.on(evts.SEARCH_CHANGED, arg => searchState = arg);
    table.on(evts.PAGE_CHANGED, arg => sliceState = arg);
    const newState = {value: 'foo', scope: ['bar']};
    table.search(newState);
    t.deepEqual(searchState, newState);
    t.deepEqual(sliceState, {page: 1}, 'should have reset to the first page');
});

test('table directive: search should trigger an execution with the new state', t => {
    const table = tableFactory({});
    table.search({value: 'bar', scope: ['bar']});
    t.deepEqual(table.getTableState(), {
        'sort': {},
        'slice': {'page': 1},
        'filter': {},
        'search': {'value': 'bar', scope: ['bar']}
    });
});

test('table directive: eval should return the displayed collection based on table state by default', async t => {
    const tableState = {
        sort: {pointer: 'id', direction: SortDirection.DESC},
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
        {'index': 2, 'value': {'id': 3, 'name': 'bip'}},
        {'index': 1, 'value': {'id': 2, 'name': 'blah'}}
    ]);

    //table state has mutated !
    tableState.slice = {page: 2, size: 2};
    const outputBis = await table.eval();
    t.deepEqual(outputBis, [{'index': 0, 'value': {'id': 1, 'name': 'foo'}}]);
});

test('table directive: eval should be able to take any state as input', async t => {
    const tableState = {
        sort: {pointer: 'id', direction: SortDirection.DESC},
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
        {'index': 0, 'value': {'id': 1, 'name': 'foo'}},
        {'index': 1, 'value': {'id': 2, 'name': 'blah'}},
        {'index': 2, 'value': {'id': 3, 'name': 'bip'}}
    ]);
});

test('table directive: eval should not dispatch any event', async t => {
    let counter = 0;
    const tableState = {
        sort: {pointer: 'id', direction: SortDirection.DESC},
        search: {},
        filter: {},
        slice: {page: 1, size: 2}
    };
    const incrementCounter = () => counter++;
    const table = tableFactory({
        tableState
    });
    table.on(evts.DISPLAY_CHANGED, incrementCounter);
    table.on(evts.TOGGLE_SORT, incrementCounter);
    table.on(evts.PAGE_CHANGED, incrementCounter);
    table.on(evts.FILTER_CHANGED, incrementCounter);
    table.on(evts.SEARCH_CHANGED, incrementCounter);
    table.on(evts.SUMMARY_CHANGED, incrementCounter);
    table.on(evts.EXEC_CHANGED, incrementCounter);
    await table.eval();
    t.equal(counter, 0, 'counter should not have been updated');
    t.deepEqual(tableState, {
        sort: {pointer: 'id', direction: SortDirection.DESC},
        search: {},
        filter: {},
        slice: {page: 1, size: 2}
    }, 'table state should not have changed');
});

test('exec should first set the working state to true then false', async t => {
    let workingState;
    const table = tableFactory({
        data: [
            {id: 1, name: 'foo'},
            {id: 2, name: 'blah'},
            {id: 3, name: 'bip'}
        ]
    });
    table.on(evts.EXEC_CHANGED, function ({working}) {
        workingState = working;
    });
    table.exec();
    t.equal(workingState, true);
    await wait(25);
    t.equal(workingState, false);
});

test('exec should dispatch the display changed event with the new displayed value', async t => {
    let displayed;
    const tableState = {
        sort: {pointer: 'id', direction: SortDirection.DESC},
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
        {'index': 2, 'value': {'id': 3, 'name': 'bip'}},
        {'index': 1, 'value': {'id': 2, 'name': 'blah'}}
    ]);
});

test('exec should dispatch the summary changed event with the new value', async t => {
    let summary;
    const tableState = {
        sort: {pointer: 'id', direction: SortDirection.DESC},
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

    table.on(evts.SUMMARY_CHANGED, val => summary = val);
    table.exec();
    await wait(25);
    t.deepEqual(summary, {'page': 1, 'size': 1, 'filteredCount': 2});
});

test('exec should update the filteredCount property', async t => {
    let summary;
    const tableState = {
        sort: {pointer: 'id', direction: SortDirection.DESC},
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
    t.equal(table.filteredCount, 3, 'initially with the length of data array');
    table.on(evts.SUMMARY_CHANGED, val => summary = val);
    table.exec();
    await wait(25);
    t.deepEqual(summary, {'page': 1, 'size': 1, 'filteredCount': 2});
    t.equal(table.filteredCount, 2, 'filtered count should have been updated');
});

test('getTableState should return a deep copy of the tableState', t => {
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
});

test('getMatchingItems should return the whole collection of matching items regardless of pagination', async t => {
    const tableState = {
        slice: {page: 1, size: 1},
        filter: {},
        search: {},
        sort: {}
    };

    const data = [
        {value: 1},
        {value: 2},
        {value: 3},
        {value: 4}
    ];

    const table = tableFactory({data, tableState});
    table.exec();
    await wait(25);
    const evalResult = await table.eval();
    t.deepEqual(evalResult, [{index: 0, value: {value: 1}}]);
    t.deepEqual(table.getMatchingItems(), data);

    table.filter({value: [{operator: FilterOperator.GREATER_THAN, value: 2}]});
    await wait(25);
    const secondEvalResult = await table.eval();
    t.deepEqual(secondEvalResult, [{index: 2, value: {value: 3}}]);
    t.deepEqual(table.getMatchingItems(), [{value: 3}, {value: 4}]);
});
