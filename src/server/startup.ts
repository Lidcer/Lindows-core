import { EventEmitter } from "events";
import { isPromise } from "../shared/Promise";
import { ensureError } from "../shared/utils";

export enum TaskStatus {
  Failed,
  Pending,
  Ok,
}
export enum ImportantLevel {
  Low,
  High,
}
export type TaskMethod = () => Promise<void> | void;
export type OnStateChange = (status: TaskStatus) => void;
interface TaskInternal {
  method: TaskMethod;
  status: TaskStatus;
  level: ImportantLevel;
  error?: Error;
  onStateChange?: (status: TaskStatus, error: Error) => void;
}

class Task {
  constructor(private getStatus: () => { status: TaskStatus; error?: Error }) {}
  get taskStatus() {
    return this.getStatus();
  }
}

class StartUp {
  private eventEmitter = new EventEmitter();
  private _init = false;
  private _ready = false;
  private tasks: TaskInternal[] = [];

  addTask(fn: TaskMethod, importantLevel?: ImportantLevel, onStateChange?: OnStateChange): Task {
    if (this._init) throw new Error("Startup has already been initialized!");

    const task: TaskInternal = {
      method: fn,
      status: TaskStatus.Pending,
      onStateChange,
      level: importantLevel && ImportantLevel.Low,
    };
    this.tasks.push(task);

    return new Task(() => {
      if (task.error) {
        return { status: task.status, error: task.error };
      }
      return { status: task.status };
    });
  }
  onReady(fn: () => void) {
    if (this._init) throw new Error("Startup already ran");
    return this.eventEmitter.on("ready", fn);
  }

  async start() {
    if (this._init) return;
    let hasError: Error;
    for (const task of this.tasks) {
      if (isPromise(task.method)) {
        try {
          await task.method();
          task.status = TaskStatus.Ok;
        } catch (error) {
          task.error = ensureError(error);
          task.status = TaskStatus.Failed;
          if (task.level === ImportantLevel.High) {
            hasError = task.error;
          }
        }
      } else {
        try {
          task.method();
        } catch (error) {
          task.error = ensureError(error);
          task.status = TaskStatus.Failed;
          if (task.level === ImportantLevel.High) {
            hasError = task.error;
          }
        }
      }
      if (task.onStateChange) {
        task.onStateChange(task.status, task.error);
      }
    }
    if (!hasError) {
      this._ready = true;
      this.eventEmitter.emit("ready");
    }
    this.eventEmitter.removeAllListeners();
    this.eventEmitter = undefined;
    if (hasError) {
      throw hasError;
    }
  }
  get ready() {
    return this._ready;
  }
}

export const startup = new StartUp();
