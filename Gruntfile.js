module.exports = function(grunt) {
  'use strict';

  var cp = require('child_process');
  var spawn = cp.spawn;

  var path = require('path');

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    NodeBB: '../../dev/',
    pkg: grunt.file.readJSON('package.json'),
    buildPath: {
      _buildsBase: function(relative) {
        return relative ? 'builds' : __dirname + '/builds';
      },
      dev: '<%= buildPath._buildsBase() %>/dev',
      publish: '<%= buildPath._buildsBase() %>/publish',
      npm_install: '<%= NodeBB %>/node_modules/nodebb-plugin-smoothshorts',
      npm_module: '<%= buildPath.npm_install %>/node_modules/<%= pkg.name %>'
    },
    babel: {
      options: {
        presets: [ 'es2015' ]
      },
      dev: {
        files: [
          {
            expand: true,
            cwd: './',
            src: [ '**/*.js', '!Gruntfile.js', '!<%= buildPath._buildsBase(true) %>/**/**', '!node_modules/**' ],
            dest: '<%= buildPath.dev %>'
          }
        ]
      },
      publish: {
        files: [
          {
            expand: true,
            cwd: './',
            src: [ '**/*.js', '!Gruntfile.js', '!<%= buildPath._buildsBase(true) %>/**/**', '!node_modules/**' ],
            dest: '<%= buildPath.publish %>'
          }
        ]
      }
    },
    eslint: {
      options: {
        // auto-fix the mess babel produces
        // (mainly space-before-function-paren :rage:)
        fix: true,
        // max-len warnings be cluttering
        quiet: true
      },
      dev: [ '<%= buildPath.dev %>/**/*.js' ],
      publish: [ '<%= buildPath.publish %>/**/*.js' ]
    },
    clean: {
      dev: [ '<%= buildPath.dev %>/*', '!node_modules/**' ],
      publish: [ '<%= buildPath.publish %>/*', '!node_modules/**' ],
      npm: {
        options: {
          force: true
        },
        src: [ '<%= buildPath.npm_module %>/*' ]
      }
    },
    copy: {
      dev: {
        src: [
          'package.json',
          'plugin.json',
          '!node_modules/**',
          '!<%= buildPath._buildsBase(true) %>/**/**'
        ],
        dest: '<%= buildPath.dev %>/'
      },
      publish: {
        src: [
          'package.json',
          'plugin.json',
          'README.md',
          'CHANGELOG.md',
          'LICENSE',
          '!node_modules/**',
          '!<%= buildPath._buildsBase(true) %>/**/**' ],
        dest: '<%= buildPath.publish %>/'
      }
    },
    npm_install: {
      default: {
        cwd: '<%= buildPath.npm_install %>',
        packageDir: '<%= buildPath.publish %>'
      }
    }
  });

  grunt.registerMultiTask('npm_install', 'Test NPM installation', function() {
    var done = grunt.task.current.async();
    var verbose = grunt.verbose;

    var packageDir = grunt.task.current.data.packageDir;
    var cwd = grunt.task.current.data.cwd;

    var installProc = spawn('npm', [ 'i', packageDir ], { cwd: cwd });

    installProc.stdout.on('data', grunt.log.writeln);

    installProc.stderr.on('data', verbose.error);

    installProc.on('close', function(code) {
      if (code !== 0) {
        return done(new Error('NPM install failed!'));
      }
      grunt.log.ok('NPM install good.');
      done();
    });
  });

  grunt.registerTask('dev', [
    'clean:dev',
    'babel:dev',
    'eslint:dev',
    'copy:dev'
  ]);

  grunt.registerTask('publish', [
    'clean:publish',
    'babel:publish',
    'eslint:publish',
    'copy:publish'
  ]);

  grunt.registerTask('npm', [
    'clean:npm',
    'npm_install'
  ]);

  grunt.registerTask('deploy', ['publish', 'npm']);
};
