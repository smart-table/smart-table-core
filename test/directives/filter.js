import filter from '../../src/directives/filter';
import {FILTER_CHANGED} from '../../src/events';
import {emitter} from 'smart-table-events';
import test from 'zora';

const fakeTable = () => {
	const table = emitter();
	table.filter = input => input;
	table.getTableState = () => ({
		filter: {
			woot: 'bim'
		}
	});
	return table;
};

test('filter directive should be able to register listener', (t) => {
	let counter = 0;
	const table = fakeTable();
	const fd = filter({table, pointer: 'foo'});
	fd.onFilterChange(() => counter++);
	table.dispatch(FILTER_CHANGED);
	t.equal(counter, 1, 'should have updated the counter');
});
test('filter directive should call table filter method passing the appropriate argument', t => {
	const table = fakeTable();
	const fd = filter({table, pointer: 'foo.bar', operator: 'is', type: 'number'});
	const arg = fd.filter(42);
	t.deepEqual(arg, {'foo.bar': [{value: 42, operator: 'is', type: 'number'}]});
});
test('filter directive should return the filter part of the table state', t => {
	const table = fakeTable();
	const fd = filter({table, pointer: 'foo.bar', operator: 'is', type: 'number'});
	t.deepEqual(fd.state(), {woot: 'bim'});
});
