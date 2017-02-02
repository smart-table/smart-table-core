import slice from '../slice';
import {curry, tap, compose, apply} from 'smart-table-operators';
import pointer from 'smart-table-json-pointer';
import sliceFactory from '../slice';
import {
  emitter,
  SUMMARY_CHANGED,
  TOGGLE_SORT,
  DISPLAY_CHANGED,
  PAGE_CHANGED,
  EXEC_CHANGED,
  FILTER_CHANGED,
  SEARCH_CHANGED,
  EXEC_ERROR
} from '../events';


function curriedPointer (path) {
  const {get, set} = pointer(path);
  return {get, set: curry(set)};
}

export default function ({
  sortFactory,
  tableState,
  data,
  filterFactory,
  searchFactory
}) {
  const table = emitter();
  const sortPointer = curriedPointer('sort');
  const slicePointer = curriedPointer('slice');
  const filterPointer = curriedPointer('filter');
  const searchPointer = curriedPointer('search');

  const safeAssign = curry((base, extension) => Object.assign({}, base, extension));
  const dispatch = curry(table.dispatch.bind(table), 2);

  const createSummary = (filtered) => {
    dispatch(SUMMARY_CHANGED, {
      page: tableState.slice.page,
      size: tableState.slice.size,
      filteredCount: filtered.length
    });
  };

  const exec = ({processingDelay = 20} = {}) => {
    table.dispatch(EXEC_CHANGED, {working: true});
    setTimeout(function () {
      try {
        const filterFunc = filterFactory(filterPointer.get(tableState));
        const searchFunc = searchFactory(searchPointer.get(tableState));
        const sortFunc = sortFactory(sortPointer.get(tableState));
        const sliceFunc = sliceFactory(slicePointer.get(tableState));
        const execFunc = compose(filterFunc, searchFunc, tap(createSummary), sortFunc, sliceFunc);
        const displayed = execFunc(data);
        table.dispatch(DISPLAY_CHANGED, displayed.map(d => {
          return {index: data.indexOf(d), value: d};
        }));
      } catch (e) {
        table.dispatch(EXEC_ERROR, e);
      } finally {
        table.dispatch(EXEC_CHANGED, {working: false});
      }
    }, processingDelay);
  };

  const tableOperation = (pter, ev) => apply(compose(
    safeAssign(pter.get(tableState)),
    tap(dispatch(ev)),
    pter.set(tableState),
    () => table.exec()
  ));

  const api = {
    sort: tableOperation(sortPointer, TOGGLE_SORT),
    slice: tableOperation(slicePointer, PAGE_CHANGED),
    filter: tableOperation(filterPointer, FILTER_CHANGED),
    search: tableOperation(searchPointer, SEARCH_CHANGED),
    exec,
    eval(state = tableState){
      return Promise.resolve()
        .then(function () {
          const sortFunc = sortFactory(sortPointer.get(state));
          const searchFunc = searchFactory(searchPointer.get(state));
          const filterFunc = filterFactory(filterPointer.get(state));
          const sliceFunc = sliceFactory(slicePointer.get(state));
          const execFunc = compose(filterFunc, searchFunc, sortFunc, sliceFunc);
          return execFunc(data).map(d => {
            return {index: data.indexOf(d), value: d}
          });
        });
    },
    onDisplayChange(fn){
      table.on(DISPLAY_CHANGED, fn);
    }
  };

  return Object.assign(table, api);
}