export const createCustomEvent = () => {
  function CustomEvent(event, params) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent("CustomEvent");
    evt.initCustomEvent(
      event,
      params.bubbles,
      params.cancelable,
      params.detail
    );
    return evt;
  }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
};

export const sendEvent = (type, val) => {
  // CustomEvent polyfill
  if (typeof window.CustomEvent !== "function") createCustomEvent();

  const eventToSend = new CustomEvent(type, { detail: val });
  document.dispatchEvent(eventToSend);
};
