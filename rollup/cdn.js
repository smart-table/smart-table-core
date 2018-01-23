import resolve from 'rollup-plugin-node-resolve';

export default {
	input: './index.js',
	output: [{
		format: 'iife',
		name:'smartTableCore',
		file: './dist/smart-table-core.js',
		sourcemap:true
	}, {
		format: 'es',
		file: './dist/smart-table-core.es.js',
		sourcemap:true
	}],
	plugins:[resolve()]
}