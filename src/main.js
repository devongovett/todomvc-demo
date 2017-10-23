import Application from '@glimmer/application';
import Resolver, { ResolverConfiguration, BasicModuleRegistry } from '@glimmer/resolver';
// import moduleMap from './config/module-map';
// import resolverConfiguration from './config/resolver-configuration';

var moduleMap = {
  'helper:/glimmer-todomvc/components/eq': require('./ui/components/eq/helper').default,
  'helper:/glimmer-todomvc/components/if': require('./ui/components/if/helper').default,
  'component:/glimmer-todomvc/components/TodoItem': require('./ui/components/TodoItem/component').default,
  'template:/glimmer-todomvc/components/TodoItem': require('./ui/components/TodoItem/template'),
  'component:/glimmer-todomvc/components/todomvc-app': require('./ui/components/todomvc-app/component').default,
  'template:/glimmer-todomvc/components/todomvc-app': require('./ui/components/todomvc-app/template'),
};

var resolverConfiguration = { "app": { "name": "glimmer-todomvc", "rootName": "glimmer-todomvc" }, "types": { "application": { "definitiveCollection": "main" }, "component": { "definitiveCollection": "components" }, "helper": { "definitiveCollection": "components" }, "renderer": { "definitiveCollection": "main" }, "template": { "definitiveCollection": "components" } }, "collections": { "main": { "types": ["application", "renderer"] }, "components": { "group": "ui", "types": ["component", "template", "helper"], "defaultType": "component", "privateCollections": ["utils"] }, "styles": { "group": "ui", "unresolvable": true }, "utils": { "unresolvable": true } } };

export default class App extends Application {
  constructor() {
    let moduleRegistry = new BasicModuleRegistry(moduleMap);
    let resolver = new Resolver(resolverConfiguration, moduleRegistry);

    super({
      rootName: resolverConfiguration.app.rootName,
      resolver
    });
  }
}
