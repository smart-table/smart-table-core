import {ProxyEmitter, proxyListener} from 'smart-table-events';
import {SmartTable, SmartTableEvents} from './table';
import {Summary, SummaryDirective} from './summary';
import {SliceConfiguration} from '../slice';

export interface PageChangeCallback {
    (sliceState: SliceConfiguration): void;
}

interface PaginationProxy extends SummaryDirective, ProxyEmitter {
    onPageChange(listener: PageChangeCallback);
}

export interface PaginationDirective extends PaginationProxy {
    selectPage(p: number): void;

    selectNextPage(): void;

    selectPreviousPage(): void;

    isPreviousPageEnabled(): boolean;

    isNextPageEnabled(): boolean;

    changePageSize(size: number): void;

    state(): SliceConfiguration;
}

const sliceListener = proxyListener({
    [SmartTableEvents.PAGE_CHANGED]: 'onPageChange',
    [SmartTableEvents.SUMMARY_CHANGED]: 'onSummaryChange'
});

export interface PaginationDirectiveConfiguration<T> {
    table: SmartTable<T>;
}


export const paginationDirective = <T>({table}: PaginationDirectiveConfiguration<T>): PaginationDirective => {
    let {slice: {page: currentPage, size: currentSize}} = table.getTableState();
    let itemListLength = table.filteredCount;
    let pageCount = currentSize ? Math.ceil(itemListLength / currentSize) : 1;

    const proxy = <PaginationProxy>sliceListener({emitter: table});

    const api = {
        selectPage(p) {
            return table.slice({page: p, size: currentSize});
        },
        selectNextPage() {
            return api.selectPage(currentPage + 1);
        },
        selectPreviousPage() {
            return api.selectPage(currentPage - 1);
        },
        changePageSize(size) {
            return table.slice({page: 1, size});
        },
        isPreviousPageEnabled() {
            return currentPage > 1;
        },
        isNextPageEnabled() {
            return pageCount > currentPage;
        },
        state() {
            return Object.assign(table.getTableState().slice, {filteredCount: itemListLength, pageCount});
        }
    };
    const directive = Object.assign(api, proxy);

    directive.onSummaryChange(({page: p, size: s, filteredCount}: Summary) => {
        currentPage = p;
        currentSize = s;
        itemListLength = filteredCount;
        pageCount = currentSize ? Math.ceil(itemListLength / currentSize) : 1;
    });

    return directive;
};
