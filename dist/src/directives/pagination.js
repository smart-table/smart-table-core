import { proxyListener } from 'smart-table-events';
const sliceListener = proxyListener({
    ["CHANGE_PAGE" /* PAGE_CHANGED */]: 'onPageChange',
    ["SUMMARY_CHANGED" /* SUMMARY_CHANGED */]: 'onSummaryChange'
});
export const paginationDirective = ({ table }) => {
    let { slice: { page: currentPage, size: currentSize } } = table.getTableState();
    let itemListLength = table.filteredCount;
    const proxy = sliceListener({ emitter: table });
    const api = {
        selectPage(p) {
            return table.slice({ page: p, size: currentSize });
        },
        selectNextPage() {
            return api.selectPage(currentPage + 1);
        },
        selectPreviousPage() {
            return api.selectPage(currentPage - 1);
        },
        changePageSize(size) {
            return table.slice({ page: 1, size });
        },
        isPreviousPageEnabled() {
            return currentPage > 1;
        },
        isNextPageEnabled() {
            return Math.ceil(itemListLength / currentSize) > currentPage;
        },
        state() {
            return Object.assign(table.getTableState().slice, { filteredCount: itemListLength });
        }
    };
    const directive = Object.assign(api, proxy);
    directive.onSummaryChange(({ page: p, size: s, filteredCount }) => {
        currentPage = p;
        currentSize = s;
        itemListLength = filteredCount;
    });
    return directive;
};
