const Bundler = require('parcel-bundler');

const bundler = new Bundler('src/ui/index.html', {cache: false});
bundler.addAssetType('.hbs', require.resolve('./GlimmerAsset'));
bundler.addPackager('gbx', require.resolve('./GlimmerPackager'));

bundler.serve(1234);
