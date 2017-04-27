const node = require('rollup-plugin-node-resolve');
module.exports = {
  entry: 'index.js',
  dest: 'dist/smart-table.js',
  format: 'umd',
  plugins: [node({jsnext: true})],
  moduleName: 'smart-table',
  sourceMap: true
};
