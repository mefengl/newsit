import { createContentController } from "./content.controller";

const controller = createContentController();

// Keep only the DOM parsing responder so the background script can
// sanitize and interpret Reddit HTML without touching the host page.
controller.ListenRequestRedditDomParse();
