var gulp = require("gulp"),
	templateCache = require("gulp-angular-templatecache"),
	uglify = require("gulp-uglify"),
	less = require("gulp-less"),
	minifyHtml = require('gulp-minify-html'),
	concat = require("gulp-concat"),
	options = {
		css: {
			path: [
				"css/laicos-datacollector-namespaced.less"
			]
		},
		js: {
			path: [
				"controls/control.js",
				"controls.min.js"
			]
		},
		template: {
			path: [
				"controls/**/*.html",
				"!controls/import.html"
			]
		}
	}

gulp.task("build", gulp.parallel(
	gulp.series(templatize, js),
	css
))
gulp.task("css", gulp.series(css))
gulp.task("default", gulp.series("build"))

function templatize() {
	return gulp.src(options.template.path)
		.pipe(minifyHtml({
			empty: true
		}))
		.pipe(templateCache({
			filename: "controls.min.js",
			module: 'laicos.datacollector.controls',
			root: "/components/laicos-datacollector/controls/"
		}))
		.pipe(gulp.dest("./"))
}

function js() {
	return gulp.src(options.js.path)
		.pipe(uglify())
		.pipe(concat('controls.min.js'))
		.pipe(gulp.dest("./"))
}

function css() {
	return gulp.src(options.css.path)
		.pipe(less())
		.pipe(gulp.dest("./css"))
}