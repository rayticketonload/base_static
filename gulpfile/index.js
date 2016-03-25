var path = require('path')
var fs   = require('fs')
var gulp = require('gulp')

var folder = path.join(__dirname)

var subFolders = [];
var tasks = [];

function getFolders(dir) {
  return fs.readdirSync(dir)
            .filter(function(file) {
              return fs.statSync(path.join(dir, file)).isDirectory()
            })
}

subFolders = getFolders(folder);

function task() {
    subFolders.forEach(function(f, i) {
        gulp.task(f, require('./'+ f));
        tasks.push(f);
    })

    gulp.task('all', tasks);

}

module.exports = task;
