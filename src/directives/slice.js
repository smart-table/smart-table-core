import {PAGE_CHANGED, SUMMARY_CHANGED} from '../events';
import {proxyListener} from 'smart-table-events';

const sliceListener = proxyListener({[PAGE_CHANGED]: 'onPageChange', [SUMMARY_CHANGED]: 'onSummaryChange'});

export default function ({table, size, page = 1}) {

  let currentPage = page;
  let currentSize = size;
  let itemListLength;

  const directive = Object.assign({
    selectPage(p){
      return table.slice({page: p, size: currentSize});
    },
    selectNextPage(){
      return this.selectPage(currentPage + 1);
    },
    selectPreviousPage(){
      return this.selectPage(currentPage - 1);
    },
    changePageSize(size){
      return table.slice({page: 1, size});
    },
    isPreviousPageEnabled(){
      return currentPage > 1
    },
    isNextPageEnabled(){
      return Math.ceil(itemListLength / currentSize) > currentPage;
    }
  }, sliceListener({emitter: table}));

  directive.onSummaryChange(({page:p, size:s, filteredCount}) => {
    currentPage = p;
    currentSize = s;
    itemListLength = filteredCount;
  });

  return directive;
}
