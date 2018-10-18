import {ProxyEmitter, proxyListener} from 'smart-table-events';
import {SmartTable, SmartTableEvents} from './table';
import {SortDirection} from 'smart-table-sort';

export {SortDirection} from 'smart-table-sort';

export interface SortConfiguration {
    pointer?: string;
    direction?: SortDirection;
}

export interface SortChangeCallback {
    (state: SortConfiguration): void;
}

interface SortProxy extends ProxyEmitter {
    onSortToggle(listener: SortChangeCallback): SortDirective;
}

export interface SortDirective extends SortProxy {

    toggle(input: string): void;

    state(): SortConfiguration;
}


const debounce = (fn: Function, time: number) => {
    let timer = null;
    return (...args) => {
        if (timer !== null) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => fn(...args), time);
    };
};

const sortListeners = proxyListener({[SmartTableEvents.TOGGLE_SORT]: 'onSortToggle'});
const directions = [SortDirection.ASC, SortDirection.DESC];

export interface SortDirectiveConfiguration<T> {
    table: SmartTable<T>;
    pointer: string;
    cycle?: boolean;
    debounceTime?: number;
}

export const sortDirective = <T>({pointer, table, cycle = false, debounceTime = 0}: SortDirectiveConfiguration<T>): SortDirective => {
    const cycleDirections = cycle === true ? [SortDirection.NONE].concat(directions) : [...directions].reverse();
    const commit = debounce(table.sort, debounceTime);
    let hit = 0;

    const proxy = <SortDirective>sortListeners({emitter: table});
    const directive = Object.assign({
        toggle() {
            hit++;
            const direction = cycleDirections[hit % cycleDirections.length];
            return commit({pointer, direction});
        },
        state() {
            return table.getTableState().sort;
        }
    }, proxy);

    directive.onSortToggle(({pointer: p}) => {
        hit = pointer !== p ? 0 : hit;
    });

    const {pointer: statePointer, direction = SortDirection.ASC} = directive.state();
    hit = statePointer === pointer ? (direction === SortDirection.ASC ? 1 : 2) : 0;
    return directive;
};
