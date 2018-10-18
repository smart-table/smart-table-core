export default {
	input: './dist/src/index.js',
	output: [{
		format: 'es',
		file: './dist/bundle/index.mjs'
	}, {
		format: 'cjs',
		file: './dist/bundle/index.js'
	}]
}
