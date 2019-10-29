import {emitter} from 'smart-table-events';
import {searchDirective as search, SmartTableEvents as evs} from '../../dist/bundle/module';

const fakeTable = () => {
    const table = emitter();
    table.search = input => input;
    table.getTableState = () => ({search: {foo: 'bar'}});
    return table;
};

export default ({test}) => {
    test('search directive should be able to register listener', t => {
        let counter = 0;
        const table = fakeTable();
        const dir = search({table});
        dir.onSearchChange(() => counter++);
        table.dispatch(evs.SEARCH_CHANGED);
        t.equal(counter, 1, 'should have updated the counter');
    });
    test('search directive should call table search method passing the appropriate argument', t => {
        const table = fakeTable();
        const dir = search({table, scope: ['foo', 'bar.woot']});
        const arg = dir.search(42);
        t.deepEqual(arg, {value: 42, scope: ['foo', 'bar.woot']});
    });
    test('search directive should be able to pass extra options', t => {
        const table = fakeTable();
        const dir = search({table, scope: ['foo', 'bar.woot']});
        const arg = dir.search(42, {flags: 'i'});
        t.deepEqual(arg, {value: 42, scope: ['foo', 'bar.woot'], flags: 'i'});
    });
    test('search directive should return the search part of the table state', t => {
        const table = fakeTable();
        const dir = search({table, scope: ['foo']});
        t.deepEqual(dir.state(), {foo: 'bar'});
    });
}