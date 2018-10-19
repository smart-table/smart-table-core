import test from 'zora';
import {SmartTableEvents as evts, paginationDirective as pagination} from '../../dist/bundle/module';
import {emitter} from 'smart-table-events';

const fakeTable = (slice = {}) => {
    const table = emitter();
    table.getTableState = () => ({
        slice
    });
    table.slice = input => input;
    return table;
};

test('pagination directive should be able to register listener to PAGE_CHANGED event', t => {
    let counter = 0;
    const table = fakeTable();
    const dir = pagination({table});
    dir.onPageChange(() => counter++);
    table.dispatch(evts.PAGE_CHANGED, {size: 25, page: 1});
    t.equal(counter, 1, 'should have updated the counter');
});
test('pagination directive should be able to register listener to SUMMARY_CHANGED event', t => {
    let counter = 0;
    const table = fakeTable();
    const dir = pagination({table});
    dir.onSummaryChange(() => counter++);
    table.dispatch(evts.SUMMARY_CHANGED, {size: 25, page: 1});
    t.equal(counter, 1, 'should have updated the counter');
});
test('pagination directive should call table pagination method with the given page', t => {
    const table = fakeTable({size: 25, page: 4});
    const dir = pagination({table});
    const arg = dir.selectPage(2);
    t.deepEqual(arg, {page: 2, size: 25});
});
test('pagination directive should call table pagination method with the next page arguments', t => {
    const table = fakeTable({size: 21, page: 4});
    const dir = pagination({table});
    const {page, size} = dir.selectNextPage();
    t.equal(page, 5, 'should be the next page');
    t.equal(size, 21, 'should keep the current page size');
});
test('pagination directive should call table pagination method with the previous page arguments', t => {
    const table = fakeTable({size: 26, page: 9});
    const dir = pagination({table});
    const {page, size} = dir.selectPreviousPage();
    t.equal(page, 8, 'should be the previous page');
    t.equal(size, 26, 'should keep the current page size');
});
test('pagination directive should call table pagination method with the page size, returning to page one', t => {
    const table = fakeTable();
    const dir = pagination({table, size: 100, page: 3});
    const {page, size} = dir.changePageSize(42);
    t.equal(page, 1, 'should have returned to the first page');
    t.equal(size, 42, 'should have change the page size');
});
test('pagination directive should tell whether previous page is enabled', t => {
    const table = fakeTable();
    const dir = pagination({table});
    table.dispatch(evts.SUMMARY_CHANGED, {size: 25, page: 1});
    t.equal(dir.isPreviousPageEnabled(), false);
    table.dispatch(evts.SUMMARY_CHANGED, {size: 25, page: 2});
    t.equal(dir.isPreviousPageEnabled(), true);
});
test('pagination directive should tell whether next page is enabled', t => {
    const table = fakeTable();
    const dir = pagination({table});
    table.dispatch(evts.SUMMARY_CHANGED, {size: 25, page: 3, filteredCount: 100});
    t.equal(dir.isNextPageEnabled(), true);
    table.dispatch(evts.SUMMARY_CHANGED, {size: 25, page: 2, filteredCount: 38});
    t.equal(dir.isNextPageEnabled(), false);
});
test('pagination directive should return the pagination part of the table state and the summary values', t => {
    const table = fakeTable({size: 25, page: 3, filteredCount: 100});
    const dir = pagination({table});
    table.dispatch(evts.SUMMARY_CHANGED, {size: 25, page: 3, filteredCount: 100});
    t.deepEqual(dir.state(), {size: 25, page: 3, filteredCount: 100});
});
