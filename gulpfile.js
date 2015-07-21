/*!
 * 前端自动构建工具
 * paywefrontside
 * version: 0.1
 */
 
 /**
  * doc:
  *     1. _file.(html|less)文件为私有文件不产生文件到发布环境
  */

"use strict";

// 配置
var pkg = require('./config.json')

var nunjucks = require('nunjucks');
var path = require('path');
var through2 = require('through2');
var gulp = require('gulp');
var watch = require('gulp-watch');
var connect = require('gulp-connect')

var less = require('gulp-less');
var sourcemaps = require('gulp-sourcemaps');
var minifyCSS = require('gulp-minify-css');

var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var spritesmith = require('gulp.spritesmith');
var merge = require('merge-stream');

var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var del = require('del')
//var liveReload = require('gulp-livereload')
//var browserSync = require('browser-sync')

//模板路径
var tplPath = path.join(__dirname, 'template');
//输出路径
var outPath = path.join(__dirname, 'output/html');
// 静态资源源文件目录
var staticPath = path.join(__dirname, 'src');
// 静态资源输出路径
var distPath = path.join(__dirname, 'output/src')

// 服务启动端口
var PORT = 8888;

/* 启动浏览器 */
var openURL = function (url) {
    switch (process.platform) {
        case "darwin":
            exec('open ' + url);
            break;
        case "win32":
            exec('start ' + url);
            break;
        default:
            spawn('xdg-open', [url]);
    }
}

/* 启动服务 */
gulp.task('server', function () {
    connect.server({
        root: './output/',
        port: PORT
    });

    console.log('server start at: http://localhost:' + PORT + '/');

    openURL('http://localhost:' + PORT + '/');
})

/* 路径 */
var filePaths = {
	iconfont: staticPath+'/iconfont/**/**',
	sprite: staticPath +'/images/sprite/**/*.*',
	images: [staticPath+'/images/**/**', '!'+ staticPath +'/images/sprite/**/**'],
	less: [staticPath+'/less/**/**.less', '!'+staticPath+'/less/**/_**.less'],
	js: staticPath+'/js/**/**.js',
	html: [tplPath+'/**/*.html','!'+tplPath+'/_**/*.html']
};

//模板引擎
var template = nunjucks.configure(tplPath, {
    /*
     * autoescape: true,
     * watch: true
     */
});

// 输出静态模板文件
var tpl = function(){
    return through2.obj(function(file, enc, next){
        // windows环境下不用替换
        //var tplFile = file.path.replace(tplPath, '');
        var tplFile = file.path;

        template.render(tplFile, {version: pkg.ver}, function(err, html){
            if(err){
                return next(err);
            }
            file.contents = new Buffer(html);
            return next(null, file);
        });
    });   
};

/*------- 任务定义 --------- */

/* 删除旧版文件 */
gulp.task('clean', function(cb) {
	return del([distPath, outPath], cb);
})

/* 字体目录拷贝 */
gulp.task('iconfont', function(){
   return gulp.src(filePaths.iconfont)
                .pipe(gulp.dest(distPath+'/iconfont'))
                .pipe(connect.reload()) 
});

/* sprite 图片 */
gulp.task('sprite', function(cb){
	var cssName = '_sprite.css';
	var lessPath = staticPath+'/less/';

	var spriteData = gulp.src(filePaths.sprite)
						.pipe(spritesmith({
							imgPath: '../images/sprite/sprite.png?v='+pkg.ver,
					        imgName: 'sprite.png',
					        cssName: cssName
					        ,padding: 20
					      }));

	var imgPipe = spriteData.img.pipe(imagemin({ optimizationLevel: 5, use: [pngquant()] }))
				 	.pipe(gulp.dest(distPath+'/images/sprite/'));
	var cssPipe = spriteData.css.pipe(rename({extname: '.less'}))
					.pipe(gulp.dest(lessPath))

	return merge(imgPipe, cssPipe);
})

/* 图片拷贝压缩 */
gulp.task('images', function(){
    return gulp.src(filePaths.images)
                .pipe(imagemin({
                    optimizationLevel: 5,
                    progressive: true,
                    svgoPlugins: [{removeViewBox: false}],
                    use: [pngquant()]
                }))
                .pipe(gulp.dest(distPath+'/images'))
                .pipe(connect.reload())
})

/* less文件编译 */
gulp.task('less', function(){
    return gulp.src(filePaths.less)
                // 初始化sourcemap
                .pipe(sourcemaps.init())
                // 编译less
                .pipe(less())
                // 压缩css
                .pipe(minifyCSS({compatibility: 'ie7'}))
                // 生成sourcemap
                .pipe(sourcemaps.write(distPath+'/css/maps'))
                // 输出css文件
                .pipe(gulp.dest(distPath+'/css'))
                .pipe(connect.reload())
})

/* js */
gulp.task('js', function(){
    return gulp.src(filePaths.js)
                .pipe(sourcemaps.init())
                .pipe(uglify())
                .pipe(sourcemaps.write(distPath+'/js/maps'))
                .pipe(gulp.dest(distPath+'/js'))
                .pipe(connect.reload())
})

/* 编译模板 */
gulp.task('template', function(){
    gulp.src(filePaths.html)
        .pipe(tpl())
        .pipe(gulp.dest(outPath))
        .pipe(connect.reload())
});

///* 启动服务 */
//gulp.task('server', ['template'], function(){
//    connect.server({
//        root:['output'],
//        port: pkg.port || 8000
//    });
//});

/*--- watch 监听 ---*/
gulp.task('watch', function(){
	gulp.watch(filePaths.iconfont, ['iconfont']);
	gulp.watch(filePaths.images, ['images']);
	gulp.watch(filePaths.less, ['less']);
	gulp.watch(filePaths.js, ['js']);
    gulp.watch(filePaths.html, ['template']);
    gulp.watch(filePaths.sprite, ['sprite']);
	gulp.watch(distPath+'/images/sprite/**/**', ['less']);
});

/*------ 默认启动任务 ------ */
gulp.task('default', ['clean'], function(){
    gulp.start(['sprite','iconfont', 'images', 'less', 'js', 'template', 'watch', 'server']);
});

