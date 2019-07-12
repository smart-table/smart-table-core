import pkg from '../package.json';

const main = pkg.main;
const module = pkg.module;

export default {
    input: './dist/src/index.js',
    output: [{
        format: 'es',
        file: `${main + '.mjs'}`
    }, {
        format: 'es',
        file: `${module}`
    }, {
        format: 'cjs',
        file: `${main + '.js'}`
    }],
    external: [
        'smart-table-events',
        'smart-table-filter',
        'smart-table-json-pointer',
        'smart-table-operators',
        'smart-table-search',
        'smart-table-sort'
    ],
};
