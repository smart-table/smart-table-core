import { proxyListener } from 'smart-table-events';
export { FilterOperator } from 'smart-table-filter';
const filterListener = proxyListener({ ["FILTER_CHANGED" /* FILTER_CHANGED */]: 'onFilterChange' });
// todo expose and re-export from smart-table-filter
export var FilterType;
(function (FilterType) {
    FilterType["BOOLEAN"] = "boolean";
    FilterType["NUMBER"] = "number";
    FilterType["DATE"] = "date";
    FilterType["STRING"] = "string";
})(FilterType || (FilterType = {}));
export const filterDirective = ({ table, pointer, operator = "includes" /* INCLUDES */, type = "string" /* STRING */ }) => {
    const proxy = filterListener({ emitter: table });
    return Object.assign({
        filter(input) {
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
