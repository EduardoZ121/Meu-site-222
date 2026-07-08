import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { useBackClose } from "./useBackClose";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function Harness({ isOpen, onClose }) {
  useBackClose(isOpen, onClose);
  return null;
}

function render(container, props) {
  const root = createRoot(container);
  act(() => root.render(<Harness {...props} />));
  return {
    update: (next) => act(() => root.render(<Harness {...next} />)),
    unmount: () => act(() => root.unmount()),
  };
}

describe("useBackClose", () => {
  let container;
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    window.history.replaceState({}, "", "/base");
  });
  afterEach(() => {
    document.body.removeChild(container);
    jest.restoreAllMocks();
  });

  test("opening pushes a history marker entry", () => {
    const pushSpy = jest.spyOn(window.history, "pushState");
    const onClose = jest.fn();
    const r = render(container, { isOpen: false, onClose });

    r.update({ isOpen: true, onClose });

    expect(pushSpy).toHaveBeenCalledTimes(1);
    expect(pushSpy.mock.calls[0][0]).toMatchObject({ rpOverlay: true });
    r.unmount();
  });

  test("hardware back (popstate) closes the overlay instead of navigating away", () => {
    const onClose = jest.fn();
    const r = render(container, { isOpen: false, onClose });
    r.update({ isOpen: true, onClose });

    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    r.unmount();
  });

  test("closing by other means consumes the marker via history.back()", () => {
    const backSpy = jest.spyOn(window.history, "back").mockImplementation(() => {});
    const onClose = jest.fn();
    const r = render(container, { isOpen: false, onClose });

    // open -> pushes marker (state.rpOverlay = true is now current)
    r.update({ isOpen: true, onClose });
    // close programmatically (e.g. clicked outside / chose an item)
    r.update({ isOpen: false, onClose });

    expect(backSpy).toHaveBeenCalledTimes(1);
    r.unmount();
  });

  test("does not double-back when the close came from popstate", () => {
    const backSpy = jest.spyOn(window.history, "back").mockImplementation(() => {});
    const onClose = jest.fn();
    const r = render(container, { isOpen: false, onClose });
    r.update({ isOpen: true, onClose });

    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
    });
    // simulate parent closing overlay in response to onClose
    r.update({ isOpen: false, onClose });

    expect(backSpy).not.toHaveBeenCalled();
    r.unmount();
  });
});
