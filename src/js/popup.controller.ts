import { MessageApi } from "./shared/messages";
import { getCurrentTab, system } from "./shared/browser";
import { ButtonResult, MessageChannelType } from "./shared/models";
import { store } from "./shared/store";

export interface ResultEventPayload {
  tabId: number;
  result: ButtonResult;
}

type ResultCallback = (payload: ResultEventPayload) => void;

class PopupController {
  LaunchOptionsPage(): Promise<any> {
    return system.runtime.openOptionsPage();
  }
  async RequestResultsForCurrentTab(): Promise<void> {
    const tab = await getCurrentTab();
    if (!tab?.id) {
      return;
    }
    return MessageApi.emitEvent("request_api", { tabId: tab.id });
  }
  ListenResults(channel: Extract<MessageChannelType, "result_from_hn" | "result_from_reddit">, cb: ResultCallback) {
    return MessageApi.onEvent<ResultEventPayload>(channel, async (payload) => {
      cb(payload);
    });
  }
  ListenResultsHn(cb: ResultCallback) {
    return this.ListenResults("result_from_hn", cb);
  }
  ListenResultsReddit(cb: ResultCallback) {
    return this.ListenResults("result_from_reddit", cb);
  }
  ListenHideWhenNoResultsChanged(cb: (value: boolean) => void) {
    store.OnStorageChanged("hideWhenNoResults", cb);
  }
  ListenIsEnabledChanged(cb: (value: boolean) => void) {
    store.OnStorageChanged("isEnabled", cb);
  }
  async GetLogoUrls() {
    return {
      reddit: system.runtime.getURL("./img/reddit.png"),
      hn: system.runtime.getURL("./img/hn.png"),
    };
  }
  async GetSubmitLinks() {
    const tab = await getCurrentTab();
    const title = encodeURIComponent(tab?.title ?? "");
    const link = encodeURIComponent(tab?.url ?? "");
    return {
      reddit: `https://reddit.com/submit?title=${title}&url=${link}`,
      hn: `https://news.ycombinator.com/submitlink?t=${title}&u=${link}`,
    };
  }
  async GetCurrentTabId(): Promise<number | null> {
    const tab = await getCurrentTab();
    return tab?.id ?? null;
  }
}

export function createPopupController() {
  return new PopupController();
}
