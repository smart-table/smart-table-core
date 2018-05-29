import test from 'zora';
import sort from '../../src/directives/sort';
import {TOGGLE_SORT} from '../../src/events';
import {emitter} from 'smart-table-events';

const fakeTable = (initialState = {}) => {
	const table = emitter();
	table.calls = [];
	table.sort = input => table.calls.push(input);
	table.getTableState = () => ({sort: initialState});
	return table;
};
const wait = time => new Promise(resolve => {
	setTimeout(() => resolve(), time);
});

test('sort directive should be able to register listener', t => {
	let counter = 0;
	const table = fakeTable();
	const dir = sort({table, pointer: 'foo.bar'});
	dir.onSortToggle(() => counter++);
	table.dispatch(TOGGLE_SORT, {});
	t.equal(counter, 1, 'should have updated the counter');
});

test('sort directive dual state mode: sequentially change sort direction', async t => {
	const table = fakeTable();
	const dir = sort({table, pointer: 'foo.bar', debounceTime: 10});
	dir.toggle();
	await wait(15);
	t.deepEqual(table.calls, [{pointer: 'foo.bar', direction: 'asc'}]);
	dir.toggle();
	await wait(15);
	t.deepEqual(table.calls, [
		{pointer: 'foo.bar', direction: 'asc'},
		{pointer: 'foo.bar', direction: 'desc'}
	]);
	dir.toggle();
	await wait(15);
	t.deepEqual(table.calls, [
		{pointer: 'foo.bar', direction: 'asc'},
		{pointer: 'foo.bar', direction: 'desc'},
		{pointer: 'foo.bar', direction: 'asc'}
	]);
});

test('sort directive dual state mode: only commit value after debounce time', async t => {
	const table = fakeTable();
	const dir = sort({table, pointer: 'foo.bar', debounceTime: 10});
	dir.toggle();
	await wait(5);
	dir.toggle();
	await wait(15);
	t.deepEqual(table.calls, [{pointer: 'foo.bar', direction: 'desc'}]);
});

test('sort directive cycle mode: sequentially change sort direction', async t => {
	const table = fakeTable();
	const dir = sort({table, pointer: 'foo.bar', cycle: true, debounceTime: 10});
	dir.toggle();
	await wait(15);
	t.deepEqual(table.calls, [{pointer: 'foo.bar', direction: 'asc'}]);
	dir.toggle();
	await wait(15);
	t.deepEqual(table.calls, [
		{pointer: 'foo.bar', direction: 'asc'},
		{pointer: 'foo.bar', direction: 'desc'}
	]);
	dir.toggle();
	await wait(15);
	t.deepEqual(table.calls, [
		{pointer: 'foo.bar', direction: 'asc'},
		{pointer: 'foo.bar', direction: 'desc'},
		{pointer: 'foo.bar', direction: 'none'},
	]);
	dir.toggle();
	await wait(15);
	t.deepEqual(table.calls, [
		{pointer: 'foo.bar', direction: 'asc'},
		{pointer: 'foo.bar', direction: 'desc'},
		{pointer: 'foo.bar', direction: 'none'},
		{pointer: 'foo.bar', direction: 'asc'}
	]);
});

test('a directive should reset when it is not concerned by the toggle', async t => {
	const table = fakeTable();
	const dir = sort({table, pointer: 'foo.bar'});
	dir.toggle();
	await wait(5);
	t.deepEqual(table.calls, [{pointer: 'foo.bar', direction: 'asc'}]);
	table.dispatch(TOGGLE_SORT, {pointer: 'woot.woot'});
	dir.toggle();
	await wait(5);
	t.deepEqual(table.calls, [
		{pointer: 'foo.bar', direction: 'asc'},
		{pointer: 'foo.bar', direction: 'asc'}
	]);
});

test('sort should return the sort state of the table state', t => {
	const table = fakeTable({pointer: 'foo.bar', direction: 'desc'});
	const dir = sort({table, pointer: 'foo'});
	t.deepEqual(dir.state(), {pointer: 'foo.bar', direction: 'desc'});
});

test('sort should init the sequence correctly depending on the initial table state - asc', async t => {
	const table = fakeTable({pointer: 'foo.bar', direction: 'asc'});
	const dir = sort({table, pointer: 'foo.bar'});
	dir.toggle();
	await wait(5);
	t.deepEqual(table.calls, [{pointer: 'foo.bar', direction: 'desc'}]);
});

test('sort should init the sequence correctly depending on the initial table state - undefined', async t => {
	const table = fakeTable({pointer: 'foo.bar'});
	const dir = sort({table, pointer: 'foo.bar'});
	dir.toggle();
	await wait(5);
	t.deepEqual(table.calls, [{pointer: 'foo.bar', direction: 'desc'}]);
});

test('sort should init the sequence correctly depending on the initial table state - desc', async t => {
	const table = fakeTable({pointer: 'foo.bar', direction: 'desc'});
	const dir = sort({table, pointer: 'foo.bar'});
	dir.toggle();
	await wait(5);
	t.deepEqual(table.calls, [{pointer: 'foo.bar', direction: 'asc'}]);
});
