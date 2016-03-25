var config = require('../../config.json')
var merge = require('merge-stream')
var gulp = require('gulp')
var concat = require('gulp-concat')

function init() {
    var merged = null;
    var pipe = null;
    var folder = config.combine.root;
    var packages = config.combine.packages;
    var maps = [];

    for(var p in packages) {

        maps = packages[p].map(function(str) {
            return folder + p +'/' + str;
        });

        pipe = gulp.src(maps)
                        .pipe(concat(p+'.all.js'))
                        .pipe(gulp.dest('./output/src/js/'+p+'/'))

        if(!!merged) {
            merged.add(pipe);
        } else {
            merged = merge(pipe);
        }


    }

    return merged;
}

module.exports = init;
