import mitt from "mitt";

type Events = {
  proBannerVisibilityChange: "hidden" | "visible";
  openSearchModal?: string;
  closeSearchModal?: string;
  closeSidebar?: string;
};

const emitter = mitt<Events>();

export default emitter;
