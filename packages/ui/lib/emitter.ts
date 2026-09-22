import mitt, { type Emitter } from "mitt";

export type SearchEvents = {
    proBannerVisibilityChange?: "hidden" | "visible";
    openSearchModal?: string;
    closeSearchModal?: string;
    closeSidebar?: string;
    [key: string]: any;
};

const emitter: Emitter<SearchEvents> = mitt<SearchEvents>();

export default emitter;
