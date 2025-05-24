import path from 'path';
import nodeExternals from 'webpack-node-externals';

export default {
    target: 'node', // Indicates that the bundle will be used in node.js environment
    entry: './src/index.js', // Entry file of your application
    output: {
        path: path.resolve(process.cwd(), 'dist'), // Output directory
        filename: 'bundle.cjs', // Output filename
    },
    externalsPresets: { node: true }, // Indicate that all modules should be treated as externals
    externals: [nodeExternals()], // Exclude node_modules dependencies
};
