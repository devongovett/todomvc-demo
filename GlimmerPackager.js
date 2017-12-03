const {Packager} = require('parcel-bundler');
const {BundleCompiler, specifierFor} = require('@glimmer/bundle-compiler');
const {CompilableTemplate} = require('@glimmer/opcode-compiler');
const {MUCompilerDelegate, MUCodeGenerator} = require('@glimmer/compiler-delegates');
const {Project} = require('glimmer-analyzer');
const path = require('path');

class GlimmerPackager extends Packager {
  start() {
    this.delegate = new MUCompilerDelegate({
      projectPath: process.cwd(),
      outputFiles: {
        dataSegment: 'table.js',
        heapFile: 'templates.gbx'
      },
      mainTemplateLocator: {
        module: './src/ui/components/todomvc-app/template.hbs',
        name: 'default'
      }
    });

    this.codegen = new MUCodeGenerator(
      this.delegate.project,
      this.delegate.outputFiles,
      this.delegate.builtins,
      this.delegate.compilation,
      this.delegate.mainTemplateLocator
    );

    this.compiler = new BundleCompiler(this.delegate);
    this.project = new Project(process.cwd());
  }

  templateLocatorFor(absoluteModulePath) {
    let normalizedPath = this.delegate.normalizePath(absoluteModulePath);
    return this.delegate.templateLocatorFor({module: normalizedPath, name: 'default'});
  }

  addAsset(asset) {
    let locator = this.templateLocatorFor(asset.name);
    let compilable = CompilableTemplate.topLevel(asset.generated.gbx, this.compiler.compileOptions(locator));
    this.compiler.addCompilableTemplate(locator, compilable);
  }

  async end() {
    let compilation = this.compiler.compile();
    let table = await this.generateExternalModuleTable(compilation.table);
    let meta = this.generateTemplateMetaData(compilation.table, compilation.symbolTables);

    let dataSegment = {
      table: table,
      heap: {
        table: compilation.heap.table,
        handle: compilation.heap.handle
      },
      pool: compilation.pool,
      prefix: meta.commonPrefix,
      meta: meta.mergedMeta,
      mainEntry: compilation.table.vmHandleByModuleLocator.get(this.delegate.mainTemplateLocator)
    };

    let json = JSON.stringify(dataSegment);
    let buf = new Buffer(4 + json.length);
    buf.writeUInt32BE(json.length, 0);
    buf.write(json, 4);

    await this.dest.write(buf);
    await this.dest.end(new Buffer(compilation.heap.buffer));
  }

  async generateExternalModuleTable(table) {
    let res = [];
    let project = this.project;
    for (let [key, locator] of table.byHandle) {
      let referrer = project.specifierForPath(path.normalize(locator.module));
      if (referrer && referrer.split(':')[0] === 'template') {
        let specifier = project.resolver.identify("component:", referrer);
        if (!specifier) {
          return null;
        }

        let module = './' + project.pathForSpecifier(specifier);
        locator = {module, name: 'default'};
      } else if (locator.kind === 'template') {
        locator = null;
      }

      if (locator) {
        let resolved = await this.bundler.resolver.resolve(locator.module, process.cwd() + '/index');
        let asset = this.bundler.loadedAssets.get(resolved.path);
        locator.module = asset.id;
        res[key] = locator;
      }
    }

    return res;
  }

  generateTemplateMetaData(table, compilerSymbolTables) {
    let specifiers = [];
    let symbolTables = this.codegen.generateSymbolTables(compilerSymbolTables);
    let map = this.codegen.generateSpecifierMap(table);

    Object.keys(map).forEach((k) => {
      if (specifiers.indexOf(k) === -1) {
        specifiers.push(k);
      }
    });

    Object.keys(symbolTables).forEach((k) => {
      if (specifiers.indexOf(k) === -1) {
        specifiers.push(k);
      }
    });

    let commonPrefix = this.codegen.commonPrefix(specifiers);
    let mergedMeta = {};

    Object.keys(map).forEach(specifier => {
      let trimmed = specifier.replace(commonPrefix, '');
      mergedMeta[trimmed] = { h: map[specifier] };
    });

    Object.keys(symbolTables).forEach(specifier => {
      let trimmed = specifier.replace(commonPrefix, '');
      if (mergedMeta[trimmed]) {
        mergedMeta[trimmed].table = symbolTables[specifier];
      } else {
        mergedMeta[trimmed] = { table: symbolTables[specifier] };
      }
    });

    return {commonPrefix, mergedMeta};
  }
}

module.exports = GlimmerPackager;