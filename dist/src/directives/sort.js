import { proxyListener } from 'smart-table-events';
export { SortDirection } from 'smart-table-sort';
const debounce = (fn, time) => {
    let timer = null;
    return (...args) => {
        if (timer !== null) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => fn(...args), time);
    };
};
const sortListeners = proxyListener({ ["TOGGLE_SORT" /* TOGGLE_SORT */]: 'onSortToggle' });
const directions = ["asc" /* ASC */, "desc" /* DESC */];
export const sortDirective = ({ pointer, table, cycle = false, debounceTime = 0 }) => {
    const cycleDirections = cycle === true ? ["none" /* NONE */].concat(directions) : [...directions].reverse();
    const commit = debounce(table.sort, debounceTime);
    let hit = 0;
    const proxy = sortListeners({ emitter: table });
    const directive = Object.assign({
        toggle() {
            hit++;
            const direction = cycleDirections[hit % cycleDirections.length];
            return commit({ pointer, direction });
        },
        state() {
            return table.getTableState().sort;
        }
    }, proxy);
    directive.onSortToggle(({ pointer: p }) => {
        hit = pointer !== p ? 0 : hit;
    });
    const { pointer: statePointer, direction = "asc" /* ASC */ } = directive.state();
    hit = statePointer === pointer ? (direction === "asc" /* ASC */ ? 1 : 2) : 0;
    return directive;
};
