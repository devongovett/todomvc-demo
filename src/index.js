import Application, { DOMBuilder, AsyncRenderer, BytecodeLoader } from '@glimmer/application';
import { ComponentManager, setPropertyDidChange } from '@glimmer/component';
import Resolver, { ResolverConfiguration, BasicModuleRegistry } from '@glimmer/resolver';
import './ui/components/todomvc-app/template.hbs';

// TODO: generate this somehow?
var resolverConfiguration = { "app": { "name": "glimmer-todomvc", "rootName": "glimmer-todomvc" }, "types": { "application": { "definitiveCollection": "main" }, "component": { "definitiveCollection": "components" }, "helper": { "definitiveCollection": "components" }, "renderer": { "definitiveCollection": "main" }, "template": { "definitiveCollection": "components" } }, "collections": { "main": { "types": ["application", "renderer"] }, "components": { "group": "ui", "types": ["component", "template", "helper"], "defaultType": "component", "privateCollections": ["utils"] }, "styles": { "group": "ui", "unresolvable": true }, "utils": { "unresolvable": true } } };

fetch('/dist/glimmer-todomvc.gbx')
  .then(req => req.arrayBuffer())
  .then(buf => {
    // separate data segment from bytecode
    let view = new DataView(buf);
    let dec = new TextDecoder;
    let length = view.getUint32(0);
    let json = dec.decode(new Uint8Array(buf, 4, length));
    let data = JSON.parse(json);
    let bytecode = buf.slice(4 + length);

    // resolve modules
    data.table = data.table.map(locator => {
      if (locator.kind === 'helper') {
        let type = locator.meta.factory ? 0 : 1;
        return [type, loadModule(locator)];
      } else {
        return loadModule(locator);
      }
    });

    function loadModule(locator) {
      let res = require(locator.module);
      if (locator.name === 'default') {
        return res.default || res;
      }

      return res[locator.name];
    }

    let element = document.getElementById('app');

    let app = new Application({
      builder: new DOMBuilder({ element }),
      renderer: new AsyncRenderer(),
      loader: new BytecodeLoader({ data, bytecode }),
      resolver: new Resolver(resolverConfiguration, new BasicModuleRegistry(data.meta)),
    });

    app.registerInitializer({
      initialize(registry) {
        registry.register(`component-manager:/${app.rootName}/component-managers/main`, ComponentManager);
      }
    });

    app.boot();
    app.renderComponent('todomvc-app', element, null);
  });
