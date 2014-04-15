'use strict';

module.exports = function(grunt) {
  grunt.initConfig({
    commons: {
      directories: {
        all: [
          'Gruntfile.js',
          'index.js',
          'lib/**/*.js'
        ]
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: ["<%= commons.directories.all %>"]
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('lint', 'jshint');
};
