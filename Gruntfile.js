module.exports = function (grunt) {

    require('load-grunt-tasks')(grunt);
    require('time-grunt')(grunt);

    grunt.initConfig({
        browserify: {
            options: {
                browserifyOptions: {
                    debug: true
                },
                transform: [
                    ['stringify', {
                        extensions: ['.bpmn', '.xml']
                    }],
                ],
                plugin: [
                    'esmify'
                ]
            },
            watch: {
                options: {
                    watch: true
                },
                files: {
                    'dist/index.js': ['app/*.js']
                }
            },
            app: {
                files: {
                    'dist/index.js': ['app/*.js']
                }
            }
        },
        copy: {
            diagram_js_css: {
                files: [
                    {
                        src: 'node_modules/diagram-js/assets/diagram-js.css',
                        dest: 'dist/css/diagram-js.css'
                    }
                ]
            },
            panel_css: {
                files: [
                    {
                        src: 'node_modules/bpmn-js-properties-panel/dist/assets/bpmn-js-properties-panel.css',
                        dest: 'dist/css/bpmn-js-properties-panel.css'
                    }
                ]
            },
            bpmn_js: {
                files: [
                    {
                        expand: true,
                        cwd: 'node_modules/bpmn-js/dist',
                        src: ['**/*.*', '!**/*.js'],
                        dest: 'dist/vendor/bpmn-js'
                    }
                ]
            },
            chor_js: {
                files: [
                    {
                        expand: true,
                        cwd: 'node_modules/chor-js/assets',
                        src: ['**/*.*', '!**/*.js'],
                        dest: 'dist/vendor/chor-js'
                    }
                ]
            },
            app: {
                files: [
                    {
                        expand: true,
                        cwd: 'app/',
                        src: ['**/*.*', '!**/*.js'],
                        dest: 'dist'
                    }
                ]
            }
        },
        less: {
            options: {
                dumpLineNumbers: 'comments',
                paths: [
                    'node_modules'
                ]
            },
            styles: {
                files: {
                    'dist/css/index.css': ['app/styles/index.less', 'app/styles/dividers.less', 'app/styles/dropdown.less'],
                    'dist/css/lib.css': ['app/lib/**/*.less'],
                    'dist/css/start.css': 'app/styles/start.less',
                    'dist/css/checking.css': 'app/styles/checking.less'
                }
            }
        },
        watch: {
            options: {
                livereload: true
            },

            samples: {
                files: ['app/**/*.*'],
                tasks: ['copy:app']
            },

            less: {
                files: [
                    'app/**/*.less'
                ],
                tasks: [
                    'less'
                ]
            },
        },
        connect: {
            livereload: {
                options: {
                    port: 9005,
                    livereload: true,
                    hostname: '0.0.0.0',
                    open: true,
                    base: [
                        'dist'
                    ]
                }
            },
            serve: {
                options: {
                    port: 9005,
                    livereload: false,
                    hostname: '0.0.0.0',
                    open: false,
                    keepalive: true,
                    base: [
                        'dist'
                    ]
                }
            }
        },
        shell: {
            command: 'npx tsc'
        }
    });

    // tasks

    grunt.registerTask('build', [
        'shell',
        'copy',
        'less',
        'browserify:app'
    ]);

    grunt.registerTask('serve', [
        'connect:serve'
    ]);

    grunt.registerTask('auto-build', [
        'shell',
        'copy',
        'less',
        'browserify:watch',
        'connect:livereload',
        'watch'
    ]);

    grunt.registerTask('default', [
        'build'
    ]);
};
