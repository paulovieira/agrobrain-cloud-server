'use strict';

const Path = require("path");
const Webpack = require("webpack");
const BellOnBundlerErrorPlugin = require('bell-on-bundler-error-plugin');
const CompressionPlugin = require("compression-webpack-plugin");
const Validate = require('webpack-validator')

// we assume webpack will be executed from the rootDir
const rootDir = Path.join(__dirname, "../..");
const appDir = Path.join(rootDir, "plugins/dashboard/app");
const libDir = Path.join(rootDir, "public/lib");

process.env.NODE_ENV = process.env.NODE_ENV || "production";

const config = {
    entry: {
        'dashboard-app': Path.join(appDir, "index.js"),

        // "explicit vendor chunk (split your code into vendor and application);"
        // we must list here the modules that will be placed in _build/lib.js
        // more info at:
        // https://webpack.github.io/docs/list-of-plugins.html#commonschunkplugin

        'lib': [
            'jquery',
            'underscore',
            'q',
            'backbone',
            'backbone.marionette',
            'backbone.radio',
            'backbone.call',
            'backbone.syphon',
            'bootstrap.js',  // we are using an alias for bootstrap, see below
            'jquery.easypiechart.js',
            'bootstrap-checkbox-radio-switch-tags.js',

            //'nunjucks-browser'
        ],

    },

    output: {

        // path and name of the bundle; note that if the webpack server is running,
        // the bundle file won't actually be
        // created; instead, the bundle will be created in-memory only and served
        // directly to the browser (available at /public/app.js in this case)
        path: Path.join(appDir, "_build"),

        //filename: process.env.NODE_ENV === "dev" ? "app.js" : "app.[chunkhash].min.js",
        filename: process.env.NODE_ENV === "dev" ? "[name].js" : 
                                                    "[name].[chunkhash].min.js",

        // is 'chunkFilename' necessary? it was taken from this example:
        // https://github.com/webpack/webpack/tree/master/examples/chunkhash
        chunkFilename: "[chunkhash].js", 

        // In dev mode: Webpack Dev Server uses publicPath to determine the path where
        // the output files are expected to be served from
        // "to make requests to the webpack-dev-server you need to provide a full URL in the 
        // output.publicPath"

        // in production mode: public path is used internally by webpack to reference
        // resources that have not been bundled (such as fonts and images), but that
        // have been copied to the directory where the bundle is;
        publicPath: process.env.NODE_ENV === "dev" ? "http://localhost:8081/WEBPACK_DEV_SERVER/" :
                                                    "/dashboard-app/_build/"
    },

    plugins: [

        new Webpack.optimize.OccurrenceOrderPlugin(),

        new Webpack.optimize.CommonsChunkPlugin({
            names: ["lib", "manifest"]
            //name: "lib",
            //filename: "lib.js"
            //filename: process.env.NODE_ENV === "dev" ? "lib.js" : "lib.[chunkhash].min.js",
        }),
        new Webpack.DefinePlugin({
            NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'dev')
        }),
        // new webpack.ProvidePlugin({
        //     "window.xyzw": "jquery"
        // }),
        new BellOnBundlerErrorPlugin(),

    ],


    resolve: {

        // by default webpack will search first in web_modules, then in node_modules;
        
        alias: {
            // use the bundled version of bootstrap.js (instead of the individual modules)
            'bootstrap.js': 'bootstrap/dist/js/bootstrap.js',

            'jquery.easypiechart.js': 'easy-pie-chart/dist/jquery.easypiechart.js',

            'bootstrap-checkbox-radio-switch-tags.js': 'paper-kit-dashboard-pro/assets/js/bootstrap-checkbox-radio-switch-tags.js'
        }

    },


    module: {
        loaders: [
        {
            test: /\.css$/,
            loader: "style!css"
        },
        {
            test: /\.less$/,
            loader: "style!css!less"
        },

        { 
            // inline base64 URLs for images that are <= 1k; direct URLs for the others 
            // (the files will be copied to the output dir: _build)
            test: /\.(png|jpg|gif)$/,
            loader: 'url-loader',
            query: {
                limit: 1,
                name: process.env.NODE_ENV === "dev" ? 'images/[name].[ext]' : 
                                                        'images/[name].[hash].[ext]'
            }
        },
        /*
        {
            // fonts loaded in stylesheets (via "src: url('...')" ); 
            test: /\.(woff|woff2|ttf|eot|svg)$/,
            loader: 'url-loader',
            query: {
                limit: 1,
                name: process.env.NODE_ENV === "dev" ? 'fonts/[name].[ext]' :
                                                        'fonts/[name].[hash].[ext]'
            }
        },
*/
        {
            test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
            loader: 'url-loader',
            query: {
                limit: 1,
                name: 'fonts/[name].[ext]',
                // mimetype: 'application/font-woff'  

                // note: mimetype is used only if the file is included in the chunk using 
                // a data-uri, which happens if the size is <= limit
            }
        }, 

        {
            test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
            loader: 'url-loader',
            query: {
                limit: 1,
                name: 'fonts/[name].[ext]',
                mimetype: 'application/font-woff'
            }
        },

        {
            test: /\.(html|nunjucks)$/,
            loader: 'nunjucks-loader',
            query: {
                config: Path.join(__dirname, 'nunjucks.config.js')
            }
        },
        {

            // bootstrap javascript has to be imported using the imports loader; see:
            // https://github.com/webpack/imports-loader

            // note that configured a "bootstrap" alias, however the test in the
            // loader is for the actual filename/directory that the alias refer to
            test: /(bootstrap\/dist\/js\/bootstrap.js)$/,
            loader: 'imports',
            query: {
                'jQuery': 'jquery',
            }
        },

        {
            // similar to the above

            test: /(paper-kit-dashboard-pro\/assets\/js\/bootstrap-checkbox-radio-switch-tags.js)$/,
            loader: 'imports',
            query: {
                'jQuery': 'jquery'
            }
        },

        {
            // similar to the above

            test: /(chartist-plugin-threshold.js)$/,
            loader: 'imports',
            query: {
                'Chartist': 'chartist'
            }
        },

        {
            // similar to the above

            test: /(chartist-plugin-zoom.js)$/,
            loader: 'imports',
            query: {
                'Chartist': 'chartist'
            }
        },


        ]
    },

};


if (process.env.NODE_ENV === "dev") {
    /*
    config.plugins.push(
        new Webpack.SourceMapDevToolPlugin({

            // output filename of the SourceMap; if no value is provided the SourceMap 
            //is inlined            
            filename: undefined,
        })
    );
*/

}
else if (process.env.NODE_ENV === "production") {

    config.plugins.push(
/*
        // new webpack.optimize.UglifyJsPlugin({
        //     compress: {
        //         warnings: false
        //     }
        // }),

        new CompressionPlugin({
            asset: "[path].gz[query]",
            algorithm: "gzip",
            test: /\.js$/,
            //minRatio: 0.8
        })
*/
    );

}

module.exports = Validate(config);


