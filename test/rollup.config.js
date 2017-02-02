const node = require('rollup-plugin-node-resolve');
module.exports = {
  entry: './test/index.js',
  dest: './test/dist/index.js',
  format: 'iife',
  plugins: [ node({jsnext:true})],
  moduleName: 'test',
  sourceMap:true
};
