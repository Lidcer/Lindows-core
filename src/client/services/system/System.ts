import { installPreInstalledApps } from "../../essential/apps";
import { installPreInstalledCommands } from "../../essential/Commands/CommandHandler";
import { Service, SystemServiceStatus } from "../internals/BaseSystemService";
import { Internal } from "../internals/Internal";
import { Network } from "./NetworkSystem";
import { Processor } from "./ProcessorSystem";
import { Registry } from "./Registry";
import { User } from "./User";

const internal = new WeakMap<System, Internal>();
const onReady = new WeakMap<System, () => void>();
export class System {
  private _processor: Service<Processor>;
  private _registry: Service<Registry>;
  private _user: Service<User>;
  private _network: Service<Network>;
  private _account: Service<Account>;
  private initialized = false;

  constructor(_internal: Internal, _onReady: () => void) {
    internal.set(this, _internal);
    onReady.set(this, _onReady);
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;
    const int = internal.get(this);
    const ready = onReady.get(this);
    this._processor = await this.initService(new Processor(int));
    this._registry = await this.initService(new Registry(int));
    this._user = await this.initService(new User(int));
    this._network = await this.initService(new Network(int));
    await installPreInstalledCommands();
    await installPreInstalledApps();

    ready();
  }

  get processor() {
    return this._processor.service;
  }
  get registry() {
    return this._registry.service;
  }
  get user() {
    return this._user.service;
  }
  get network() {
    return this._network.service;
  }
  get account() {
    return this._account.service;
  }

  // @ts-ignore
  private async initService<S extends Service>(service: S) {
    const systemInternal: Service<S> = {
      service,
      internalMethods: this.failedServiceInternals(),
    };
    try {
      const internal = systemInternal.service.init();
      systemInternal.internalMethods = internal;
      await internal.start();
    } catch (error) {
      DEV && console.error(error);
    }

    return systemInternal;
  }

  private failedServiceInternals() {
    let _status = SystemServiceStatus.Failed;
    const mockInternal: Service<any>["internalMethods"] = {
      start: () => {},
      destroy: () => {
        _status = SystemServiceStatus.Destroyed;
      },
      status: () => {
        return _status;
      },
    };
    return mockInternal;
  }
}
