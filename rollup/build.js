export default {
	input: './index.js',
	output: [{
		format: 'es',
		file: './dist/index.mjs'
	}, {
		format: 'cjs',
		file: './dist/index.js'
	}]
}