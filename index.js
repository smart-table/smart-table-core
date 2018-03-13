import tableDirective from './src/table';
import filterDirective from './src/directives/filter';
import searchDirective from './src/directives/search';
import sliceDirective from './src/directives/slice';
import sortDirective from './src/directives/sort';
import summaryDirective from './src/directives/summary';
import workingIndicatorDirective from './src/directives/working-indicator';

export const search = searchDirective;
export const slice = sliceDirective;
export const summary = summaryDirective;
export const sort = sortDirective;
export const filter = filterDirective;
export const workingIndicator = workingIndicatorDirective;
export const table = tableDirective;
