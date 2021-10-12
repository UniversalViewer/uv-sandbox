export interface IUVOptions {
  target: HTMLElement;
  data?: any;
}

class UV {
  public options: IUVOptions;
  public el: HTMLElement;
  private _e: any;

  constructor(options: { target: HTMLDivElement; data: any }) {
    this.options = options;
    this.options.data = Object.assign({}, this.data(), options.data);
    this.init();
    this.resize();
  }

  public init(): boolean {
    this.el = this.options.target;

    if (!this.el) {
      console.warn("element not found");
      return false;
    }

    this.el.innerHTML = "Hello World";

    // this._pubsub = new PubSub();

    return true;
  }

  public data(): Object {
    return {};
  }

  public on(name: string, callback: Function, ctx: any): void {
    var e = this._e || (this._e = {});

    (e[name] || (e[name] = [])).push({
      fn: callback,
      ctx: ctx,
    });
  }

  public fire(name: string, ...args: any[]): void {
    var data = [].slice.call(arguments, 1);
    var evtArr = ((this._e || (this._e = {}))[name] || []).slice();
    var i = 0;
    var len = evtArr.length;

    for (i; i < len; i++) {
      evtArr[i].fn.apply(evtArr[i].ctx, data);
    }
  }

  public resize(): void {}

  public set(_data: Object): void {}
}

export const init = (el: string | HTMLDivElement, data) => {
  let uv;
  let isFullScreen = false;
  const container = typeof el === "string" ? document.getElementById(el) : el;

  if (!container) {
    throw new Error("UV target element not found");
  }

  container.innerHTML = "";
  const parent = document.createElement("div");
  container.appendChild(parent);
  const uvDiv = document.createElement("div");
  parent.appendChild(uvDiv);

  const resize = () => {
    if (uv) {
      if (isFullScreen) {
        parent.style.width = window.innerWidth + "px";
        parent.style.height = window.innerHeight + "px";
      } else {
        parent.style.width = container.offsetWidth + "px";
        parent.style.height = container.offsetHeight + "px";
      }
      uv.resize();
    }
  };

  window.addEventListener("resize", function () {
    resize();
  });

  window.addEventListener("orientationchange", function () {
    setTimeout(function () {
      resize();
    }, 100);
  });

  uv = new UV({
    target: uvDiv,
    data: data,
  });

  uv.on(
    "created",
    function (_obj) {
      resize();
    },
    false
  );

  uv.on(
    "externalResourceOpened",
    function (_obj) {
      setTimeout(function () {
        resize();
      }, 100);
    },
    false
  );

  uv.on(
    "reload",
    function (data) {
      data.isReload = true;
      uv.set(data);
    },
    false
  );

  uv.on(
    "toggleFullScreen",
    function (data) {
      isFullScreen = data.isFullScreen;

      if (data.overrideFullScreen) {
        return;
      }

      if (isFullScreen) {
        const requestFullScreen = getRequestFullScreen(parent);
        if (requestFullScreen) {
          requestFullScreen.call(parent);
          resize();
        }
      } else {
        const exitFullScreen = getExitFullScreen();
        if (exitFullScreen) {
          exitFullScreen.call(document);
          setTimeout(function () {
            resize();
          }, 100);
          // firefox needs extra time when exiting a full screen embed
          setTimeout(function () {
            resize();
          }, 1000);
        }
      }
    },
    false
  );

  uv.on(
    "error",
    function (message) {
      console.error(message);
    },
    false
  );

  function fullScreenChange(e) {
    if (
      (e.type === "webkitfullscreenchange" && !document.webkitIsFullScreen) ||
      (e.type === "fullscreenchange" && !document.fullscreenElement) ||
      (e.type === "mozfullscreenchange" && !document.mozFullScreen) ||
      (e.type === "MSFullscreenChange" && document.msFullscreenElement === null)
    ) {
      uv.exitFullScreen();
    }
  }

  document.addEventListener("fullscreenchange", fullScreenChange, false);
  document.addEventListener("webkitfullscreenchange", fullScreenChange, false);
  document.addEventListener("mozfullscreenchange", fullScreenChange, false);
  document.addEventListener("MSFullscreenChange", fullScreenChange, false);

  return uv;
};

function getRequestFullScreen(elem) {
  if (elem.webkitRequestFullscreen) {
    return elem.webkitRequestFullscreen;
  }

  if (elem.mozRequestFullScreen) {
    return elem.mozRequestFullScreen;
  }

  if (elem.msRequestFullscreen) {
    return elem.msRequestFullscreen;
  }

  if (elem.requestFullscreen) {
    return elem.requestFullscreen;
  }

  return false;
}

function getExitFullScreen() {
  if (document.webkitExitFullscreen) {
    return document.webkitExitFullscreen;
  }

  if (document.msExitFullscreen) {
    return document.msExitFullscreen;
  }

  if (document.mozCancelFullScreen) {
    return document.mozCancelFullScreen;
  }

  if (document.exitFullscreen) {
    return document.exitFullscreen;
  }

  return false;
}