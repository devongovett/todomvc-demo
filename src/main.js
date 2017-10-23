import Application from '@glimmer/application';
import Resolver, { ResolverConfiguration, BasicModuleRegistry } from '@glimmer/resolver';
import moduleMap from '../module-map';
import './ui/components/todomvc-app/template.hbs';
// import resolverConfiguration from './config/resolver-configuration';

console.log(moduleMap)

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
