const {Asset} = require('parcel-bundler');
const {preprocess, traverse} = require('@glimmer/syntax');
const {precompile, TemplateCompiler} = require('@glimmer/compiler');
const {specifierFor} = require('@glimmer/bundle-compiler');
const {Project} = require('glimmer-analyzer');
const path = require('path');
const {MUCompilerDelegate} = require('@glimmer/compiler-delegates');

const project = new Project(process.cwd());

class GlimmerAsset extends Asset {
  constructor(name, pkg, options) {
    super(name, pkg, options);
    this.type = 'gbx';

    this.delegate = new MUCompilerDelegate({
      projectPath: process.cwd(),
      outputFiles: {
        dataSegment: 'table.js',
        heapFile: 'templates.gbx'
      }
    });
  }

  parse(code) {
    return preprocess(code);
  }

  collectDependencies() {
    // this function was copied and modified from glimmer-analyzer
    // TODO: use directly instead
    let resolver = project.resolver;
    let templateSpecifier = project.specifierForPath(path.relative(process.cwd(), this.name));
    let components = new Set;
    let helpers = new Set;
    let hasComponentHelper = false;

    traverse(this.ast, {
      MustacheCommentStatement(node) {
        if (isImportComment(node)) {
          extractComponentsFromComment(node.value)
            .map(c => resolver.identify(`template:${c}`, templateSpecifier))
            .filter(Boolean)
            .map(specifier => specifier)
            .forEach(path => components.add(path));
        }
      },

      MustacheStatement(node) {
        if (isComponentHelper(node)) {
          hasComponentHelper = true;
        } else {
          let specifier = resolver.identify(specifierForHelper(node), templateSpecifier);

          if (specifier) {
            helpers.add(specifier);
          }
        }
      },

      SubExpression(node) {
        if (isComponentHelper(node)) {
          hasComponentHelper = true;
        } else {
          let specifier = resolver.identify(specifierForHelper(node), templateSpecifier);

          if (specifier) {
            helpers.add(specifier);
          }
        }
      },

      ElementNode(node) {
        let { tag } = node;
        let specifier = resolver.identify(`template:${tag}`, templateSpecifier);

        if (specifier) {
          components.add(specifier);
        }
      }
    });

    for (let specifier of [...components, ...helpers]) {
      let specifierPath = project.pathForSpecifier(specifier);
      this.addDependency('./' + path.relative(path.dirname(this.name), path.resolve(specifierPath)), {specifier});
    }

    let componentSpecifier = project.resolver.identify(`component:${templateSpecifier.split(':')[1]}`);
    if (componentSpecifier) {
      let specifierPath = project.pathForSpecifier(componentSpecifier);
      this.addDependency('./' + path.relative(path.dirname(this.name), path.resolve(specifierPath)), {specifier: componentSpecifier});
    }
  }

  templateLocatorFor(absoluteModulePath) {
    let normalizedPath = this.delegate.normalizePath(absoluteModulePath);
    return this.delegate.templateLocatorFor({ module: normalizedPath, name: 'default' });
  }

  generate() {
    let locator = this.templateLocatorFor(this.name, 'default');
    let template = TemplateCompiler.compile({meta: locator.meta}, this.ast);

    return {
      gbx: template.toJSON(),
      js: ''
    };
  }
}

function specifierForHelper({ path }) {
  return `helper:${path.original}`;
}

function isComponentHelper({ path }) {
  return path.type === 'PathExpression'
    && path.parts.length === 1
    && path.parts[0] === 'component';
}

function extractComponentsFromComment(comment) {
  return comment.trim().substr(7).split(' ');
}

function isImportComment({ value }) {
  return value.trim().substr(0, 7) === 'import ';
}

module.exports = GlimmerAsset;
