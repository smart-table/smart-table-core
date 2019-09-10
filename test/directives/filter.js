import {filterDirective as filter, SmartTableEvents as evs} from '../../dist/bundle/module';
import {emitter} from 'smart-table-events';
import {test} from 'zora';

const fakeTable = (initialState = {}) => {
    const table = emitter();
    table.filter = input => input;
    table.getTableState = () => initialState;
    return table;
};

test('filter directive should be able to register listener', (t) => {
    let counter = 0;
    const table = fakeTable();
    const fd = filter({table, pointer: 'foo'});
    fd.onFilterChange(() => counter++);
    table.dispatch(evs.FILTER_CHANGED);
    t.equal(counter, 1, 'should have updated the counter');
});
test('filter directive should call table filter method passing a clause argument', t => {
    const table = fakeTable();
    const fd = filter({table, pointer: 'foo.bar', operator: 'is', type: 'number'});
    const arg = fd.filter(42);
    t.deepEqual(arg, {'foo.bar': [{value: 42, operator: 'is', type: 'number'}]});
});

test('filter directive should not overwrite other part of the filter state', t => {
    const table = fakeTable({filter: {woot: [{value: 'blah'}]}});
    const fd = filter({table, pointer: 'foo.bar', operator: 'is', type: 'number'});
    const arg = fd.filter(42);
    t.deepEqual(arg, {'foo.bar': [{value: 42, operator: 'is', type: 'number'}], woot: [{value: 'blah'}]});
});

test('filter directive should reset the clauses for the prop when no argument is provided', t => {
    const table = fakeTable({
        filter: {woot: [{value: 'blah'}]}
    });
    const fd = filter({table, pointer: 'woot'});
    const arg = fd.filter();
    t.deepEqual(arg, {});
});

test('filter directive should return the filter part of the table state', t => {
    const table = fakeTable({
        filter: {woot: [{value: 'blah'}]},
        sort: {
            pointer: 'woot',
            direction: 'asc'
        }
    });
    const fd = filter({table, pointer: 'foo.bar', operator: 'is', type: 'number'});
    t.deepEqual(fd.state(), {woot: [{value: 'blah'}]});
});
