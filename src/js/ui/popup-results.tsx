import React from "react";

import { ButtonResult } from "../shared/models";
import { BtnItem } from "./buttons";
import { createPopupController } from "../popup.controller";

const controller = createPopupController();

const LOADING_RESULT: ButtonResult = { text: "..." };

type ResultSource = "hn" | "reddit";

export function PopupResults() {
  const [redditResult, setRedditResult] = React.useState<ButtonResult>(
    LOADING_RESULT
  );
  const [hnResult, setHnResult] = React.useState<ButtonResult>(LOADING_RESULT);
  const [redditLogo, setRedditLogo] = React.useState("");
  const [hnLogo, setHnLogo] = React.useState("");
  const [redditSubmitLink, setRedditSubmitLink] = React.useState("");
  const [hnSubmitLink, setHnSubmitLink] = React.useState("");
  const [hideWhenNoResults, setHideWhenNoResults] = React.useState(false);
  const [isEnabled, setIsEnabled] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const tabIdRef = React.useRef<number | null>(null);
  const pendingRef = React.useRef<Set<ResultSource>>(new Set());
  const timeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    controller.GetCurrentTabId().then((tabId) => {
      if (!isMounted) {
        return;
      }
      tabIdRef.current = tabId;
    });

    controller.GetLogoUrls().then(({ reddit, hn }) => {
      if (!isMounted) {
        return;
      }
      setRedditLogo(reddit);
      setHnLogo(hn);
    });

    controller.GetSubmitLinks().then(({ reddit, hn }) => {
      if (!isMounted) {
        return;
      }
      setRedditSubmitLink(reddit);
      setHnSubmitLink(hn);
    });

    controller.ListenHideWhenNoResultsChanged((value) => {
      if (!isMounted) {
        return;
      }
      setHideWhenNoResults(value);
    });

    controller.ListenIsEnabledChanged((value) => {
      if (!isMounted) {
        return;
      }
      setIsEnabled(value);
    });

    return () => {
      isMounted = false;
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    const unsubscribeHn = controller.ListenResultsHn(({ tabId, result }) => {
      if (tabIdRef.current !== null && tabIdRef.current !== tabId) {
        return;
      }
      setHnResult(result ?? LOADING_RESULT);
      markSourceFinished("hn");
    });
    const unsubscribeReddit = controller.ListenResultsReddit(
      ({ tabId, result }) => {
        if (tabIdRef.current !== null && tabIdRef.current !== tabId) {
          return;
        }
        setRedditResult(result ?? LOADING_RESULT);
        markSourceFinished("reddit");
      }
    );
    return () => {
      unsubscribeHn?.();
      unsubscribeReddit?.();
    };
  }, []);

  const stopLoading = React.useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingRef.current.clear();
    setIsLoading(false);
  }, []);

  const markSourceFinished = React.useCallback(
    (source: ResultSource) => {
      pendingRef.current.delete(source);
      if (pendingRef.current.size === 0) {
        stopLoading();
      }
    },
    [stopLoading]
  );

  const startLoading = React.useCallback(() => {
    pendingRef.current = new Set<ResultSource>(["hn", "reddit"]);
    setIsLoading(true);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setIsLoading(false);
      pendingRef.current.clear();
    }, 6000);
  }, []);

  const refreshSubmitLinks = React.useCallback(async () => {
    const { reddit, hn } = await controller.GetSubmitLinks();
    setRedditSubmitLink(reddit);
    setHnSubmitLink(hn);
  }, []);

  const handleRefresh = React.useCallback(async () => {
    setErrorMessage(null);
    const tabId = await controller.GetCurrentTabId();
    tabIdRef.current = tabId;
    await refreshSubmitLinks();
    if (tabId === null) {
      setErrorMessage("No active tab detected.");
      stopLoading();
      return;
    }
    startLoading();
    try {
      await controller.RequestResultsForCurrentTab();
    } catch (err) {
      setErrorMessage("Unable to request data. Please try again.");
      stopLoading();
    }
  }, [refreshSubmitLinks, startLoading, stopLoading]);

  React.useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  const shouldShowReddit = !!redditResult?.link || !hideWhenNoResults;
  const shouldShowHn = !!hnResult?.link || !hideWhenNoResults;

  return (
    <section className="section py-2" style={{ paddingBottom: "0" }}>
      <div className="field has-text-centered">
        <button
          onClick={() => handleRefresh()}
          className={`button is-primary ${isLoading ? "is-loading" : ""}`}
          disabled={isLoading}
        >
          Refresh Results
        </button>
      </div>
      {errorMessage && (
        <p className="has-text-danger" style={{ fontSize: "0.9rem" }}>
          {errorMessage}
        </p>
      )}
      {!isEnabled && (
        <p className="has-text-warning" style={{ fontSize: "0.85rem" }}>
          Automatic fetching is disabled. Use Refresh Results to check manually.
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {shouldShowReddit && (
          <div
            style={{
              backgroundColor: "#AAAAAA",
              borderRadius: "6px",
              color: "white",
            }}
          >
            <BtnItem
              reverseLayout={true}
              title="Reddit"
              logoUrl={redditLogo}
              submitLink={redditSubmitLink}
              result={redditResult}
              sizeChanged={() => undefined}
            />
          </div>
        )}
        {shouldShowHn && (
          <div
            style={{
              backgroundColor: "#FD6F1D",
              borderRadius: "6px",
              color: "white",
            }}
          >
            <BtnItem
              reverseLayout={true}
              title="Hacker News"
              logoUrl={hnLogo}
              submitLink={hnSubmitLink}
              result={hnResult}
              sizeChanged={() => undefined}
            />
          </div>
        )}
      </div>
    </section>
  );
}
