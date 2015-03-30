/* Variables / Environment Setup
---------------------------------------------------------------------------- */

// gulp requires
var gulp       = require('gulp'),
	pngcrush   = require('imagemin-pngcrush'),
	secrets    = require('./secrets.json'),
	plugins    = require('gulp-load-plugins')({
		pattern: ['gulp-*', 'gulp.*'],
		replaceString: /\bgulp[\-.]/
	});

// source / destination paths
var paths = {

	haml: {
		src : 'dev/haml/',
		dest: 'build/'
	},
	styles: {
		src : 'dev/styles/',
		dest: 'build/'
	},
	images: {
		src : 'dev/media/images/*.{png,jpg,gif}',
		dest: 'build/'
	}

};


/* Gulp Tasks
---------------------------------------------------------------------------- */

// Compile only main HAML files (partials are included via the main files)
gulp.task('haml', function() {

	return gulp.src(paths.haml.src + '*.haml')
		.pipe(plugins.rubyHaml())
		.pipe(gulp.dest(paths.haml.dest))
		.pipe(plugins.livereload());

});


// Compile and Output Styles
gulp.task('styles', function() {

	return plugins.rubySass(paths.styles.src + 'styles.scss', {
			sourcemap: false, // true
			style: 'expanded'
		})
		// .pipe(plugins.sourcemaps.write())
		// .pipe(plugins.concat('styles.css')) // concat with sourcemap if --dev
		.pipe(plugins.autoprefixer({
			browsers: ['last 3 version', 'ios 6', 'android 4']
		}))
		.pipe(gulp.dest(paths.styles.dest))
		.pipe(plugins.minifyCss()) // don't minify if --dev
		.pipe(plugins.rename('styles.min.css'))
		.pipe(gulp.dest(paths.styles.dest))
		.pipe(plugins.livereload());

});


// Check for changed image files and compress them
gulp.task('images', function() {

	return gulp.src(paths.images.src)
		.pipe(plugins.changed(paths.images.dest))
		.pipe(plugins.imagemin({
			optimizationLevel: 7,
			progressive: true,
			use: [pngcrush()]
		}))
		.pipe(gulp.dest(paths.images.dest));

});


// Use rsync to deploy to server (no need to exclude files since everything comes from 'build' folder)
gulp.task('deploy', function() {

	gulp.src('build/') // ['build/.htaccess', 'build/index.html', 'build/assets/**']
		.pipe(plugins.rsync({
			root: 'build',
			hostname: secrets.server.host,
			destination: secrets.server.dest,
			incremental: true,
			progress: true,
			recursive: true,
			clean: true,
			exclude: ['.DS_Store']
		}));

});


// Watch over specified files and run corresponding tasks...
// does not inject SVG... need better process for this
gulp.task('watch', ['haml', 'styles'], function() {

	plugins.livereload.listen(); // start livereload server

	// watch dev files, rebuild when changed
	gulp.watch(paths.haml.src + '**/*.haml', ['haml']);  // watch all HAML files, including partials (recursively)
	gulp.watch(paths.styles.src + '*.scss', ['styles']); // watch all SCSS files, including partials

});


// Default gulp task, should run gulp clean prior to running the default task...
gulp.task('default', ['haml', 'styles', 'images']);