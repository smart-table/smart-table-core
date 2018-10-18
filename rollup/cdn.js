import resolve from 'rollup-plugin-node-resolve';

export default {
    input: './dist/src/index.js',
    output: [{
        format: 'iife',
        name: 'smartTableCore',
        file: './dist/bundle/smart-table-core.js',
        sourcemap: true
    }, {
        format: 'es',
        file: './dist/bundle/smart-table-core.es.js',
        sourcemap: true
    }],
    plugins: [resolve()]
};
