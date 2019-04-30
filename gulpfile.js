// eslint-disable-next-line max-len
/* пути к исходным файлам (src), к готовым файлам (build), а также к тем, за изменениями которых нужно наблюдать (watch) */
const path = {
  build: {
    html: 'assets/build/',
    js: 'assets/build/js/',
    css: 'assets/build/css/',
    img: 'assets/build/img/',
    fonts: 'assets/build/fonts/',
  },
  src: {
    html: 'assets/src/*.html',
    js: 'assets/src/js/main.js',
    style: 'assets/src/style/main.scss',
    img: 'assets/src/img/**/*.*',
    fonts: 'assets/src/fonts/**/*.*',
    svg: 'assets/src/img/**/*.svg',
  },
  watch: {
    html: 'assets/src/**/*.html',
    js: 'assets/src/js/**/*.js',
    css: 'assets/src/style/**/*.scss',
    img: 'assets/src/img/**/*.*',
    fonts: 'assets/srs/fonts/**/*.*',
    svg: 'assets/src/img/**/*.svg',
  },
  clean: './assets/build/*',
};

/* настройки сервера */
const config = {
  server: {
    baseDir: './assets/build',
  },
  notify: false,
};

/* подключаем gulp и плагины */
const gulp = require('gulp'); // подключаем Gulp
const webserver = require('browser-sync'); // сервер для работы и автоматического обновления страниц
const plumber = require('gulp-plumber'); // модуль для отслеживания ошибок
const rigger = require('gulp-rigger'); // модуль для импорта содержимого одного файла в другой
const sourcemaps = require('gulp-sourcemaps'); // модуль для генерации карты исходных файлов
const sass = require('gulp-sass'); // модуль для компиляции SASS (SCSS) в CSS
// autoprefixer = require('gulp-autoprefixer'), // модуль для автоматической установки автопрефиксов
const cleanCSS = require('gulp-clean-css'); // плагин для минимизации CSS
const uglifyES = require('gulp-uglify-es').default; // модуль для минимизации JavaScript
const cache = require('gulp-cache'); // модуль для кэширования
const imagemin = require('gulp-imagemin'); // плагин для сжатия PNG, JPEG, GIF и SVG изображений
const jpegrecompress = require('imagemin-jpeg-recompress'); // плагин для сжатия jpeg
const pngquant = require('imagemin-pngquant'); // плагин для сжатия png
const rimraf = require('gulp-rimraf'); // плагин для удаления файлов и каталогов
const rename = require('gulp-rename');
const autoprefixer = require('autoprefixer');
const svgStore = require('gulp-svgstore');
const postcss = require('gulp-postcss');
const webp = require('gulp-webp');
const postHtml = require('gulp-posthtml');
const include = require('posthtml-include');
const w3cjs = require('gulp-w3cjs');
const babel = require('gulp-babel');

/* задачи */

// запуск сервера
gulp.task('webserver', () => webserver(config));

// сбор html
gulp.task('html:build', () => {
  return gulp.src(path.src.html) // выбор всех html файлов по указанному пути
    .pipe(plumber()) // отслеживание ошибок
    .pipe(w3cjs())
    .pipe(rigger())
    .pipe(gulp.dest(path.build.html)) // выкладывание готовых файлов
    .pipe(webserver.reload({ stream: true })); // перезагрузка сервера
});

// сбор стилей
gulp.task('css:build', () => {
  return gulp.src(path.src.style) // получим main.scss
    .pipe(plumber()) // для отслеживания ошибок
    .pipe(sourcemaps.init()) // инициализируем sourcemap
    .pipe(sass()) // scss -> css
    .pipe(postcss([
      autoprefixer(),
    ]))
    .pipe(gulp.dest(path.build.css))
    .pipe(rename('style.min.css'))
    .pipe(cleanCSS()) // минимизируем CSS
    .pipe(sourcemaps.write('./')) // записываем sourcemap
    .pipe(gulp.dest(path.build.css)) // выгружаем в build
    .pipe(webserver.reload({ stream: true })); // перезагрузим сервер
});

// сбор js
gulp.task('js:build', () => {
  return gulp.src(path.src.js) // получим файл main.js
    .pipe(babel())
    .pipe(plumber()) // для отслеживания ошибок
    .pipe(rigger()) // импортируем все указанные файлы в main.js
    .pipe(gulp.dest(path.build.js))
    .pipe(rename('main.min.js'))
    .on('error', (err) => {
      // eslint-disable-next-line no-console
      console.log(err);
    })
    .pipe(sourcemaps.init()) // инициализируем sourcemap
    .pipe(uglifyES()) // минимизируем js
    .pipe(sourcemaps.write('./')) //  записываем sourcemap
    .pipe(gulp.dest(path.build.js)) // положим готовый файл
    .pipe(webserver.reload({ stream: true })); // перезагрузим сервер
});

// перенос шрифтов
gulp.task('fonts:build', () => {
  return gulp.src(path.src.fonts)
    .pipe(gulp.dest(path.build.fonts));
});

// обработка картинок
gulp.task('image:build', () => {
  return gulp.src(path.src.img) // путь с исходниками картинок
    .pipe(cache(imagemin([ // сжатие изображений
      imagemin.gifsicle({ interlaced: true }),
      jpegrecompress({
        progressive: true,
        max: 90,
        min: 80,
      }),
      pngquant(),
      imagemin.svgo({ plugins: [{ removeViewBox: false }] }),
    ])))
    .pipe(gulp.dest(path.build.img)); // выгрузка готовых файлов
});

// Конвертация изображений в формат .webp
gulp.task('webp', () => gulp.src('src/img/**/*.{png,jpg}')
  .pipe(webp({ quality: 90 }))
  .pipe(gulp.dest(path.build.img)));

// Сборка SVG-спрайта
gulp.task('svg:build', () => gulp.src(path.src.svg)
  .pipe(svgStore({
    inlineSvg: true,
  }))
  .pipe(rename('sprite.svg'))
  .pipe(gulp.dest(path.build.img)));

// Вставка SVG-спрайта в HTML
gulp.task('svg:include', () => gulp.src(path.src.html)
  .pipe(postHtml([
    include(),
  ]))
  .pipe(gulp.dest(path.build.html)));

// удаление каталога build
gulp.task('clean:build', () => {
  return gulp.src(path.clean, { read: false })
    .pipe(rimraf());
});

// очистка кэша
gulp.task('cache:clear', () => {
  cache.clearAll();
});

// сборка
gulp.task('build',
  gulp.series('clean:build',
    gulp.parallel(
      'html:build',
      'css:build',
      'js:build',
      'fonts:build',
      'image:build',
      'svg:build',
      // 'svg:include',
    )
  )
);

// запуск задач при изменении файлов
gulp.task('watch', () => {
  gulp.watch(path.watch.html, gulp.series('html:build'));
  gulp.watch(path.watch.css, gulp.series('css:build'));
  gulp.watch(path.watch.js, gulp.series('js:build'));
  gulp.watch(path.watch.img, gulp.series('image:build'));
  gulp.watch(path.watch.fonts, gulp.series('fonts:build'));

  // gulp.watch(path.watch.html, gulp.series('svg:include'));
  gulp.watch(path.watch.svg, gulp.series('svg:build'));
});

// задача по умолчанию
gulp.task('default', gulp.series(
  'build',
  gulp.parallel('webserver', 'watch')
));
