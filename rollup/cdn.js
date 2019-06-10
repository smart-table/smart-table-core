import resolve from 'rollup-plugin-node-resolve';
import pkg from '../package.json';

const name = pkg.name.replace(/-/g, '_');

export default {
    input: './dist/src/index.js',
    output: [{
        format: 'es',
        file: `./dist/bundle/${name}.js`,
        sourcemap: true
    }],
    plugins: [resolve()]
};
