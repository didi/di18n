const program = require('./src');
const initFileConf = require('./src/command/initFileConf');

program
  .command('init')
  .alias('i')
  .description('init locales conf')
  .option('--vue', 'init for vue project')
  .action(function(options) {
    initFileConf(options.vue);
  })
  .on('--help', function() {
    console.log('  Examples:');
    console.log();
    console.log('    $ di18n init -c ./config/prod.config.js');
    console.log();
  });

program.command('*').action(function(cmd) {
  console.log('unknown command "%s"', cmd);
});

program.parse(process.argv);
