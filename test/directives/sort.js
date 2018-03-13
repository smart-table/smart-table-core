import test from 'zora';
import sort from '../../src/directives/sort';
import {TOGGLE_SORT} from '../../src/events';
import {emitter} from 'smart-table-events';

const fakeTable = () => {
	const table = emitter();
	table.sort = input => input;
	return table;
};

test('sort directive should be able to register listener', (t) => {
	let counter = 0;
	const table = fakeTable();
	const dir = sort({table, pointer: 'foo.bar'});
	dir.onSortToggle(() => counter++);
	table.dispatch(TOGGLE_SORT, {});
	t.equal(counter, 1, 'should have updated the counter');
});
test('sort directive dual state mode: sequentially change sort direction', (t) => {
	const table = fakeTable();
	const dir = sort({table, pointer: 'foo.bar'});
	const arg = dir.toggle();
	t.deepEqual(arg, {pointer: 'foo.bar', direction: 'asc'});
	const secondArg = dir.toggle();
	t.deepEqual(secondArg, {pointer: 'foo.bar', direction: 'desc'});
	const thirdArg = dir.toggle();
	t.deepEqual(thirdArg, {pointer: 'foo.bar', direction: 'asc'});
});
test('sort directive cycle mode: sequentially change sort direction', (t) => {
	const table = fakeTable();
	const dir = sort({table, pointer: 'foo.bar', cycle: true});
	const arg = dir.toggle();
	t.deepEqual(arg, {pointer: 'foo.bar', direction: 'asc'});
	const secondArg = dir.toggle();
	t.deepEqual(secondArg, {pointer: 'foo.bar', direction: 'desc'});
	const thirdArg = dir.toggle();
	t.deepEqual(thirdArg, {pointer: 'foo.bar', direction: 'none'});
	const fourthArg = dir.toggle();
	t.deepEqual(fourthArg, {pointer: 'foo.bar', direction: 'asc'});
});
test('a directive should reset when it is not concerned by the toggle', (t) => {
	const table = fakeTable();
	const dir = sort({table, pointer: 'foo.bar'});
	const arg = dir.toggle();
	t.deepEqual(arg, {pointer: 'foo.bar', direction: 'asc'});
	table.dispatch(TOGGLE_SORT, {pointer: 'woot.woot'})
	const secondArg = dir.toggle();
	t.deepEqual(secondArg, {pointer: 'foo.bar', direction: 'asc'});
});
