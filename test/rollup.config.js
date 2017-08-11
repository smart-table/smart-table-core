import node from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs'

export default {
  entry: './test/index.js',
  dest: './test/dist/index.js',
  format: 'iife',
  plugins: [node({jsnext: true}), commonjs()],
  moduleName: 'test',
  sourceMap: true
};
