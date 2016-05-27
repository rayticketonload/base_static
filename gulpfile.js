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
var config = require('./config.json')
var pkg = require('./package.json')

var nunjucks = require('nunjucks');
var path = require('path');
var through2 = require('through2');
var gulp = require('gulp');
var watch = require('gulp-watch');
var connect = require('gulp-connect')

var less = require('gulp-less');
var sourcemaps = require('gulp-sourcemaps');
var minifyCSS = require('gulp-minify-css');
var autoprefixer = require('gulp-autoprefixer');

var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var spritesmith = require('gulp.spritesmith');
var merge = require('merge-stream');

var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var del = require('del')
// 中文转ascii
var n2a = require('gulp-native2ascii');
//var liveReload = require('gulp-livereload')
//var browserSync = require('browser-sync')
//

var htmlreplace = require('gulp-html-replace')
var bannerHeader = require('gulp-header')
var concat = require('gulp-concat')
// 去掉console,alert语句
var stripDebug = require('gulp-strip-debug');
var replace = require('gulp-replace');

// 错误处理
var gutil = require( 'gulp-util' )
var plumber = require( 'gulp-plumber' );

// UMD wrapper
var umd = require('gulp-umd')

// 组件路径
var components_url = path.join(__dirname, 'bower_components');
//模板路径
var tplPath = path.join(__dirname, 'template');
//输出路径
var template_url = '/output/html';
var outPath = path.join(__dirname, template_url);
// 静态资源源文件目录
var staticPath = path.join(__dirname, 'src');
// 静态资源输出路径
var dist = '/output/src';
var distPath = path.join(__dirname, dist)

// 服务启动端口
var PORT = 8888;

var createdTime = (new Date().toLocaleDateString().split(' '))[0];
var banner = [
        '/*! ',
        '*  <%= pkg.name%> v<%= pkg.version%>',
        '*  by <%= pkg.author%>',
        '*  (c) '+ createdTime + ' www.frontpay.cn',
        '*  Licensed under <%= pkg.license %>',
        '*/',
        ''
    ].join('\n');

var umd_header = '',
    umd_footer = '';

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

// 错误处理
function errrHandler( e ){
    // 控制台发声,错误时beep一下
    gutil.beep();
    gutil.log( e );
    return this;
}

/* 路径 */
var filePaths = {
	iconfontIE7: 'bower_components/frontui-icon/fonticon/ie7/**/**',
	iconfont: 'bower_components/frontui-icon/fonticon/fonts/**/**',
	sprite: staticPath +'/images/sprite/**/*.*',
	images: [staticPath+'/images/**/**', '!'+ staticPath +'/images/sprite/**/**'],
	less: [staticPath+'/less/**/**.less', '!'+staticPath+'/less/**/_**.less'],
	js: [staticPath+'/js/**/**',  '!'+staticPath+'/js/ui/charts', '!'+staticPath+'/js/ui/charts/**/**'],
	html: [tplPath+'/**/**.html','!'+tplPath+'/_**/*.html'],
    charts: [staticPath+'/js/ui/charts/echarts.js', staticPath+'/js/ui/charts/chart/line.js', staticPath+'/js/ui/charts/theme/paywe.js', staticPath+'/js/ui/charts/payweChart.js']
};

//模板引擎
var template = nunjucks.configure(tplPath, {
    /*
     * autoescape: true,
     * watch: true
     */
});

// 输出静态模板文件
var tpl = function(o){
    var option = {version: config.ver, dist: dist, template_url: template_url};
    if(o && typeof o === 'object') {
        for(var i in o) {
            option[i] = o[i]
        }
    }


    return through2.obj(function(file, enc, next){
        // windows环境下不用替换
        //var tplFile = file.path.replace(tplPath, '');
        var tplFile = file.path;

        template.render(tplFile, option, function(err, html){
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
gulp.task('iconfont', ['iconfontIE7'], function(){
   return gulp.src(filePaths.iconfont)
                .pipe(gulp.dest(distPath+'/iconfont'))
                //.pipe(connect.reload())
});

gulp.task('iconfontIE7', function(){
    return gulp.src(filePaths.iconfontIE7)
        .pipe(gulp.dest(distPath+'/iconfont-ie7'))
        //.pipe(connect.reload())
});


/* sprite 图片 */
gulp.task('sprite', function(cb){
	var cssName = '_sprite.css';
	var lessPath = staticPath+'/less/';

	var spriteData = gulp.src(filePaths.sprite)
						.pipe(spritesmith({
							imgPath: '../images/sprite/sprite.png?v='+config.ver,
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
                .pipe( plumber( { errorHandler: errrHandler } ) )
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
                .pipe( plumber( { errorHandler: errrHandler } ) )
                // 初始化sourcemap
                //.pipe(sourcemaps.init())
                // 编译less
                .pipe(less())
                // 自动添加前缀
                .pipe(autoprefixer(
                        // 最新版autoprefixer
                        //{ browsers: config.browser.split(',')}
                        config.browser
                    ))
                // 压缩css
                //
                .pipe(minifyCSS({compatibility: 'ie7'}))
                .pipe(bannerHeader(banner, { pkg: pkg}))
                // 生成sourcemap
                //.pipe(sourcemaps.write(distPath+'/css/maps'))
                // 输出css文件
                .pipe(gulp.dest(distPath+'/css'))
                .pipe(connect.reload())
})

gulp.task('animated', function(){
    return gulp.src(components_url+'/animate.css/source/**/*.css')
                .pipe(rename(function(path){
                    path.basename = (path.basename.charAt(0) === '_' ? '' : '_' ) + path.basename;
                    path.extname = '.less';
                }))
                .pipe(gulp.dest(staticPath+'/less/animate'));
});

/* js */
gulp.task('js', function(){
    //banner = 'Hello <%= name %>\n';
    //console.log(bannerHeader('Hello <%= name %>\n', { name: '123' } ));
    //return;
    return gulp.src(filePaths.js)
                //.pipe(sourcemaps.init())
                //.pipe(uglify())
                //
               // .pipe(sourcemaps.write(distPath+'/js/maps'))
                //.pipe(bannerHeader(banner, { pkg: { name: '123' }}))
                //.pipe(n2a({reverse: false}))
                .pipe(gulp.dest(distPath+'/js'))
               // .pipe(connect.reload())
});

/* 合并charts  */
gulp.task('charts', function(){
    return gulp.src(filePaths.charts)
        .pipe(concat('charts.js'))
        .pipe(uglify())
        .pipe(n2a({reverse: false}))
        .pipe(bannerHeader(banner, { pkg: pkg}))
        .pipe(gulp.dest(distPath+'/js'));
});





/* 编译模板 */
gulp.task('template', function(){
    gulp.src(filePaths.html)
        .pipe( plumber( { errorHandler: errrHandler } ) )
        .pipe(tpl())
        .pipe(gulp.dest(outPath))
        .pipe(connect.reload())
});

gulp.task('replace', function(){
	gulp.src(outPath+'/**/**.html')
		.pipe(htmlreplace({
        	'ui': '../src/js/ui.js'
        }))
        .pipe(gulp.dest(outPath));
})

/* 启动服务 */
gulp.task('server', ['sprite','iconfont', 'images', 'less', 'frontui:less',  'js', 'template', 'watch', 'all', 'copyIconDemo',], function () {
    connect.server({
        root: __dirname,
        port: PORT
    });

    console.log('server start at: http://localhost:' + PORT + '/output/html');

    openURL('http://localhost:' + PORT + '/output/html');
})

/*--- watch 监听 ---*/
gulp.task('watch', function(){
	gulp.watch(filePaths.iconfont, ['iconfont']);
	gulp.watch(filePaths.images, ['images']);
	gulp.watch(filePaths.less[0], ['less']);
	gulp.watch(filePaths.js, ['js', 'all']);
    gulp.watch(filePaths.html[0], ['template']);
    gulp.watch(filePaths.sprite, ['sprite']);
	gulp.watch(distPath+'/images/sprite/**/**', ['less']);
    gulp.watch(filePaths.charts, ['charts'])
});

gulp.task('copyIconDemo', function() {
    return gulp.src(['./bower_components/frontui-icon/fonticon/**/**'], { baseClient: true})
            .pipe(gulp.dest(outPath+'/iconfont'));
})

// 更新字体任务
// ==========
var iconfontPath = './bower_components/frontui-icon/fonticon/';
gulp.task('iconfont-file', function(){
    return gulp.src(iconfontPath+'fonts/**/**')
        .pipe(gulp.dest('./src/iconfont/'))
})

gulp.task('iconfont-ie7', function(){
    return gulp.src(iconfontPath+'ie7/**/**')
        .pipe(gulp.dest('./src/iconfont-ie7/'))
})

gulp.task('iconfont-style', ['iconfont-file', 'iconfont-ie7'], function(){
    return gulp.src(iconfontPath+'style.css')
        .pipe(rename('_fonticon.less'))
        // 替换iconfont路径
        .pipe(replace(/fonts\//g, '@{iconfont-url}'))
        .pipe(gulp.dest('./src/less/'))
})

// 更新到frontui
// ------------------------
var frontui_path = config.frontui_path;
gulp.task('front:ui', function(){
    return gulp.src([staticPath+'/js/ui/**/**'])
        .pipe( plumber( { errorHandler: errrHandler } ) )
       // .pipe(sourcemaps.init())

        .pipe(concat('ui.js'))
        .pipe(stripDebug())
        .pipe(umd({
            dependencies: function(file){
                return [{
                    name: '$',
                    amd: 'jquery',
                    cjs: 'jquery',
                    global: 'jQuery'
                }]
            }
        }))
        .pipe(uglify({ mangle: false}))
        .pipe(n2a({reverse: false}))
        .pipe(bannerHeader(banner, { pkg: pkg}))
        //.pipe(sourcemaps.write(path.join(__dirname, frontui_path+'/js')))
        .pipe(gulp.dest(frontui_path+'/js'))
    // .pipe(connect.reload())
});
/* 合并charts  */
// gulp.task('frontui:charts', function(){
//     return gulp.src(filePaths.charts)
//         .pipe(concat('charts.js'))
//         .pipe(uglify())
//         .pipe(n2a({reverse: false}))
//         .pipe(bannerHeader(banner, { pkg: pkg}))
//         .pipe(gulp.dest(frontui_path+'/js'));
// });
// images
gulp.task('frontui:images', function(){
   return gulp.src(distPath+'/images/**/**')
              .pipe(gulp.dest(frontui_path+'/images'))
});
// iconfont
gulp.task('frontui:iconfont', function(){
    return gulp.src(distPath+'/iconfont/**/**')
                .pipe(gulp.dest(frontui_path+'/iconfont'));
});
// ie7
gulp.task('frontui:ie7', function(){
    return gulp.src(distPath+'/iconfont-ie7/**/**')
                .pipe(gulp.dest(frontui_path+'/iconfont-ie7'));
})
// less
gulp.task('frontui:less', function(){
    return gulp.src([staticPath+'/less/**/**', '!'+staticPath+'/less/ui.less'])
                .pipe(gulp.dest(frontui_path+'/less'));
});

// template
gulp.task('frontui:template', function(){
    return gulp.src('./template/_components/**/**.html')
            .pipe(gulp.dest(frontui_path+'/template'));
})

gulp.task('frontui:datatables-css', function() {
    return gulp.src([staticPath+'/js/datatables/**/**.css'])
            .pipe(concat('datatables.css'))
            .pipe(minifyCSS({compatibility: 'ie7'}))
            .pipe(gulp.dest(frontui_path+'/js/datatables'));
})
// gulp.task('frontui:datatables-js', function() {
//     return gulp.src([staticPath+'/js/datatables/**/**.js'])
//             .pipe(concat('datatables.js'))
//             .pipe(uglify())
//             .pipe(n2a({reverse: false}))
//             .pipe(gulp.dest(frontui_path+'/js/datatables'));
// })
//gulp.task('frontui:datatables', ['frontui:datatables-js', 'frontui:datatables-css'], function(){
gulp.task('frontui:datatables', [ 'frontui:datatables-css'], function(){
    return gulp.src([staticPath+'/js/datatables/**/**.png'])
            .pipe(gulp.dest(frontui_path+'/js/datatables'));
});

// gulp.task('frontui:uploadify', function(){
//     return gulp.src([staticPath+'/js/uploadify/**/**'])
//                 .pipe(gulp.dest(frontui_path+'/js/uploadify'));
// });

// gulp.task('frontui:validate', function(){
//     return gulp.src([staticPath+'/js/validate/jquery.validate.js', staticPath+'/js/validate/messages_zh.js'])
//                 .pipe(concat('validate.js'))
//                 .pipe(uglify())
//                 .pipe(bannerHeader(banner, { pkg: pkg}))
//                 .pipe(gulp.dest(frontui_path+'/js/validate'));
// });

// gulp.task('frontui:aloneJs', function(){
//   return gulp.src([staticPath+'/js/ui/datetimepicker.js'])
//       .pipe(uglify())
//       .pipe(bannerHeader(banner, { pkg: pkg}))
//       .pipe(gulp.dest(frontui_path+'/js/ui'));
// });
//
gulp.task('frontui:copyStatic', function() {
    return gulp.src(['./output/src/js/**/**', '!./output/src/js/**/**.js', '!./output/src/js/ui/**/**', '!./output/src/js/ui'], { baseClient: true})
                .pipe(gulp.dest(frontui_path+'/js/'));
});

gulp.task('frontui:copyJS', function() {
     //return gulp.src(['./output/src/js/datatables/**/**'])
     //       .pipe(gulp.dest(documentPath+'/src/js/datatables'));
     return gulp.src('./output/src/js/**/**.all.js', { baseClient: true})
                .pipe(rename(function(file){
                        file.basename = file.basename.replace('.all', '')
                    }))
                .pipe(uglify({mangle: false}))
                .pipe(bannerHeader(banner, { pkg: pkg}))
                .pipe(gulp.dest(frontui_path+'/js/'))
})

gulp.task('frontui:webuploader', function() {
  var root = './src/js/',
      scripts = config.bundlejs;
  scripts = scripts.map(function(s) {
    return root+s;
  })
  return gulp.src(scripts)
      .pipe(uglify({mangle: false}))
      .pipe(bannerHeader(banner, { pkg: pkg}))
      .pipe(gulp.dest(frontui_path+'/js/webuploader'))
})

gulp.task('frontui', function(){
    return gulp.start(['front:ui', 'frontui:images', 'frontui:iconfont', 'frontui:ie7', 'frontui:less', 'frontui:template', 'frontui:datatables', 'frontui:copyJS', 'frontui:copyStatic', 'frontui:webuploader']);
});


/*------ 默认启动任务 ------ */
var allTask = require('./gulpfile/')();

gulp.task('default', ['clean'], function(next){
    //return gulp.start(['sprite','iconfont', 'images', 'less', 'frontui:less',  'js', 'charts', 'template', 'watch', 'server']);
    //return gulp.start(['sprite','iconfont', 'images', 'less', 'frontui:less',  'js', 'charts', 'template', 'watch', 'server']);
    return gulp.start([ 'server']);
    //return next();
});

gulp.task('publish', ['sprite','iconfont', 'images', 'less', 'js', 'template'],  function(){
	gulp.start(['frontui', 'replace'])
})

/* 更新字体 */
gulp.task('fonticon-update', function(next){
    return gulp.start(['iconfont-style', 'iconfont-file', 'iconfont-ie7']);
    //return next();
})


/*------- 发布文档 -------*/
var documentPath = '../frontui.github.com/document';
gulp.task('document:template', function(){
    return gulp.src(filePaths.html)
        .pipe( plumber( { errorHandler: errrHandler } ) )
        .pipe(tpl({ dist: '/document/src', template_url: '/document'}))
        .pipe(replace('../../assist/', './'))
        .pipe(replace('.all.js', '.js'))
        .pipe(gulp.dest(documentPath))
})
gulp.task('document:index', ['document:template'], function(){
    return gulp.src(documentPath+'/ui_1.1.html')
            .pipe(rename('index.html'))
            .pipe(gulp.dest(documentPath))
})
gulp.task('document:static', function(){
    //return gulp.src(['./output/src/**/**', '!./output/src/js', '!./output/src/js/**/**', '!./output/src/css/maps', '!./output/src/css/maps/**/**'])
    return gulp.src(['./output/src/**/**', '!./output/src/js/**/**.js', '!./output/src/css/maps', '!./output/src/css/maps/**/**'])
            .pipe(gulp.dest(documentPath+'/src'));
})
gulp.task('document:js', ['document:prejs'], function(){
    //return gulp.src(['./output/src/js/**/**.js', '!./output/src/js/datatables/**/**'])
    return gulp.src(['./output/src/js/**.js'])
            .pipe(uglify())
            .pipe(n2a({reverse: false}))
            .pipe(bannerHeader(banner, { pkg: pkg}))
            .pipe(gulp.dest(documentPath+'/src/js'));
})

gulp.task('document:prejs', function(){
    //return gulp.src(['./output/src/js/**/**.js', '!./output/src/js/datatables/**/**'])
    return gulp.src(['./output/src/js/ui/**.js'])
        .pipe(uglify())
        .pipe(n2a({reverse: false}))
        .pipe(bannerHeader(banner, { pkg: pkg}))
        .pipe(gulp.dest(documentPath+'/src/js/ui'));
})
gulp.task('document:copy', function() {
     //return gulp.src(['./output/src/js/datatables/**/**'])
     //       .pipe(gulp.dest(documentPath+'/src/js/datatables'));
     return gulp.src(['./output/src/js/**/**.all.js'], { baseClient: true})
                .pipe(rename(function(file){
                        file.basename = file.basename.replace('.all', '')
                    }))
                .pipe(uglify({mangle: false}))
                .pipe(bannerHeader(banner, { pkg: pkg}))
                .pipe(gulp.dest(documentPath+'/src/js'))
})
gulp.task('document:icon', function(){
    return gulp.src(['./assist/**/**'])
            .pipe(gulp.dest(documentPath));
})
gulp.task('document', function(){
    return gulp.start(['document:index', 'document:static','document:js', 'document:icon', 'document:copy']);
})
