const program = require('commander');
const convert = require('./command/convert');
const convert2 = require('./command/convert2');
const collect = require('./command/collect');
const publish = require('./command/publish');
const option = require('../package.json');

module.exports = program;

program
  .version(option.version)
  .option('-c, --config <path>', 'set config path. defaults to ./i18n.config.js');

program
  .command('sync')
  .alias('s')
  .description('pick chinese words and snyc with locale conf')
  .option('-p, --publish', 'to publish the synced conf or not, defautl : false')
  .action(function(options) {
    collect(program.opts(), !!options.publish);
  })
  .on('--help', function() {
    console.log('  Examples:');
    console.log();
    console.log('  sync without publish:');
    console.log('    $ di18n sync -c ./config/prod.config.js');
    console.log('  sync and then publish:');
    console.log('    $ di18n sync -p -c ./config/prod.config.js');
    console.log();
  });

program
  .command('publish')
  .description('publish locale confs')
  .action(function() {
    publish(program.opts());
  })
  .on('--help', function() {
    console.log('  Examples:');
    console.log();
    console.log('    $ di18n publish');
    console.log();
  });


// XXX: 不表意，需要改一下
program
  .command('convert')
  .alias('c')
  .description('convert to react-intl-universal')
  .action(function() {
    convert(program.opts());
  })
  .on('--help', function() {
    console.log('  Examples:');
    console.log();
    console.log('    $ di18n convert -c ./config/prod.config.js');
    console.log();
  });

program
  .command('convert2')
  .alias('c2')
  .description('convert to intl.t')
  .action(function() {
    convert2(program.opts());
  })
  .on('--help', function() {
    console.log('  Examples:');
    console.log();
    console.log('    $ di18n convert2 -c ./config/prod.config.js');
    console.log();
  });
