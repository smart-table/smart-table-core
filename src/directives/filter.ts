import {proxyListener, ProxyEmitter} from 'smart-table-events';
import {FilterConfiguration, FilterOperator} from 'smart-table-filter';
import {SmartTable, SmartTableEvents} from './table';

interface FilterProxy extends ProxyEmitter {
    onFilterChange(listener: FilterChangeCallback): FilterDirective;
}

export {FilterConfiguration, FilterOperator} from 'smart-table-filter';

export interface FilterChangeCallback {
    (filterState: FilterConfiguration): void;
}

export interface FilterDirective extends FilterProxy {

    filter<K>(input: K): void;

    state(): FilterConfiguration;
}

const filterListener = proxyListener({[SmartTableEvents.FILTER_CHANGED]: 'onFilterChange'});

// todo expose and re-export from smart-table-filter
export const enum FilterType {
    BOOLEAN = 'boolean',
    NUMBER = 'number',
    DATE = 'date',
    STRING = 'string'
}

export interface FilterDirectiveConfiguration<T> {
    table: SmartTable<T>;
    pointer: string;
    operator?: FilterOperator;
    type?: FilterType;
}

export const filterDirective = <T>({table, pointer, operator = FilterOperator.INCLUDES, type = FilterType.STRING}: FilterDirectiveConfiguration<T>): FilterDirective => {
    const proxy = <FilterProxy>filterListener({emitter: table});
    return Object.assign({
        filter<K>(input: K) {
            const filterConf = {
                [pointer]: [
                    {
                        value: input,
                        operator,
                        type
                    }
                ]

            };
            return table.filter(filterConf);
        },
        state() {
            return table.getTableState().filter;
        }
    }, proxy);
};
