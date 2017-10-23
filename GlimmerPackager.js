const Packager = require('parcel/src/packagers/Packager');
const {BundleCompiler, specifierFor} = require('@glimmer/bundle-compiler');
const {CompilableTemplate} = require('@glimmer/opcode-compiler');
const {Project} = require('glimmer-analyzer');
const path = require('path');

const BUILTINS = ['action', '/css-blocks/components/state', '/css-blocks/components/concat'];
const CAPABILITIES = {
  dynamicLayout: false,
  prepareArgs: false,
  elementHook: true,
  staticDefinitions: false,
  dynamicTag: true,
  createArgs: true,
  attributeHook: true
};

class GlimmerPackager extends Packager {
  start() {
    this.compiler = new BundleCompiler(this)
    this.project = new Project(process.cwd());
  }

  addAsset(asset) {
    let specifier = specifierFor(path.relative(process.cwd(), asset.name), 'default');
    this.compiler.addCustom(specifier, asset.generated.gbx);
  }

  hasHelperInScope(helperName, referrer) {
    if (BUILTINS.indexOf(helperName) > -1) { return true; }

    let referrerSpec = this.project.specifierForPath(referrer.module) || undefined;
    return !!this.project.resolver.identify(`helper:${helperName}`, referrerSpec);
  }

  resolveHelperSpecifier(helperName, referrer) {
    if (BUILTINS.indexOf(helperName) > -1) {
      return specifierFor('__BUILTIN__', helperName);
    }

    let referrerSpec = this.project.specifierForPath(referrer.module) || undefined;
    let resolvedSpec = this.project.resolver.identify(`helper:${helperName}`, referrerSpec);

    if (!resolvedSpec) {
      return specifierFor('__UNKNOWN__', 'default');
    }
    return this.getCompilerSpecifier(resolvedSpec);
  }

  hasComponentInScope(name, referrer) {
    return !!this.project.resolver.identify(`template:${name}`, this.project.specifierForPath(referrer.module));
  }

  resolveComponentSpecifier(name, referrer) {
    let referrerSpec = this.project.specifierForPath(referrer.module);
    let resolved = this.project.resolver.identify(`template:${name}`, referrerSpec);

    let resolvedSpecifier = this.getCompilerSpecifier(resolved);

    return resolvedSpecifier;
  }

  getCompilerSpecifier(specifier) {
    return specifierFor(this.project.pathForSpecifier(specifier), 'default');
  }

  getComponentCapabilities() {
    return CAPABILITIES;
  }

  getComponentLayout(specifier, block, options) {
    return CompilableTemplate.topLevel(block, options);
  }

  async end() {
    let res = this.compiler.compile();
    console.log(res);
    console.log(this.compiler.getSpecifierMap())
    await this.dest.end(new Buffer(res.heap.buffer));
  }
}

module.exports = GlimmerPackager;