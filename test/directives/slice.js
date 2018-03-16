import test from 'zora';
import slice from '../../src/directives/slice';
import {PAGE_CHANGED, SUMMARY_CHANGED} from '../../src/events';
import {emitter} from 'smart-table-events';

const fakeTable = (slice = {}) => {
	const table = emitter();
	table.getTableState = () => ({
		slice
	});
	table.slice = input => input;
	return table;
};

test('slice directive should be able to register listener to PAGE_CHANGED event', (t) => {
	let counter = 0;
	const table = fakeTable();
	const dir = slice({table});
	dir.onPageChange(() => counter++);
	table.dispatch(PAGE_CHANGED, {size: 25, page: 1});
	t.equal(counter, 1, 'should have updated the counter');
});
test('slice directive should be able to register listener to SUMMARY_CHANGED event', (t) => {
	let counter = 0;
	const table = fakeTable();
	const dir = slice({table});
	dir.onSummaryChange(() => counter++);
	table.dispatch(SUMMARY_CHANGED, {size: 25, page: 1});
	t.equal(counter, 1, 'should have updated the counter');
});
test('slice directive should call table slice method with the given page', (t) => {
	const table = fakeTable({size: 25, page: 4});
	const dir = slice({table});
	const arg = dir.selectPage(2);
	t.deepEqual(arg, {page: 2, size: 25});
});
test('slice directive should call table slice method with the next page arguments', (t) => {
	const table = fakeTable({size: 21, page: 4});
	const dir = slice({table});
	const {page, size} = dir.selectNextPage();
	t.equal(page, 5, 'should be the next page');
	t.equal(size, 21, 'should keep the current page size');
});
test('slice directive should call table slice method with the previous page arguments', (t) => {
	const table = fakeTable({size: 26, page: 9});
	const dir = slice({table});
	const {page, size} = dir.selectPreviousPage();
	t.equal(page, 8, 'should be the previous page');
	t.equal(size, 26, 'should keep the current page size');
});
test('slice directive should call table slice method with the page size, returning to page one', (t) => {
	const table = fakeTable();
	const dir = slice({table, size: 100, page: 3});
	const {page, size} = dir.changePageSize(42);
	t.equal(page, 1, 'should have returned to the first page');
	t.equal(size, 42, 'should have change the page size');
});
test('slice directive should tell whether previous page is enabled', (t) => {
	const table = fakeTable();
	const dir = slice({table});
	table.dispatch(SUMMARY_CHANGED, {size: 25, page: 1});
	t.equal(dir.isPreviousPageEnabled(), false);
	table.dispatch(SUMMARY_CHANGED, {size: 25, page: 2});
	t.equal(dir.isPreviousPageEnabled(), true);
});
test('slice directive should tell whether next page is enabled', (t) => {
	const table = fakeTable();
	const dir = slice({table});
	table.dispatch(SUMMARY_CHANGED, {size: 25, page: 3, filteredCount: 100});
	t.equal(dir.isNextPageEnabled(), true);
	table.dispatch(SUMMARY_CHANGED, {size: 25, page: 2, filteredCount: 38});
	t.equal(dir.isNextPageEnabled(), false);
});
test('slice directive should return the slice part of the table state and the summary values', t => {
	const table = fakeTable({size: 25, page: 3, filteredCount: 100});
	const dir = slice({table});
	table.dispatch(SUMMARY_CHANGED, {size: 25, page: 3, filteredCount: 100});
	t.deepEqual(dir.state(), {size: 25, page: 3, filteredCount: 100});
});
