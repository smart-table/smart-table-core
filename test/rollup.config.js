import node from 'rollup-plugin-node-resolve';

export default {
  entry: './test/index.js',
  dest: './test/dist/index.js',
  format: 'iife',
  plugins: [node({jsnext: true})],
  moduleName: 'test',
  sourceMap: true
};
