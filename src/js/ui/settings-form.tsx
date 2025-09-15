import React from "react";
import { createSettingsFormController } from "./settings-form.controller";

const sfc = createSettingsFormController();

interface SettingsFormProps {
  isPopupPage: boolean;
}

interface SettingsFormState {
  hasCurrentEnabled: boolean;
  hasAllEnabled: boolean;
  hasDebugEnabled: boolean;
  hideWhenNoResults: boolean;
  useNewRedditLinks: boolean;
  blackListAlteredStr: string;
  blackListStr: string;
}

export class SettingsForm extends React.Component<
  SettingsFormProps,
  SettingsFormState
> {
  state = {
    hasCurrentEnabled: true,
    hasAllEnabled: false,
    hasDebugEnabled: false,
    hideWhenNoResults: false,
    useNewRedditLinks: false,
    blackListAlteredStr: "",
    blackListStr: "",
  };

  constructor(props: SettingsFormProps) {
    super(props);
  }

  componentDidMount() {
    const ctx = this;
    sfc.ListenBlackListChanged(async (list) => {
      const isBlackListed = await sfc.IsCurrentUrlBlacklisted();
      const isEnabled = !isBlackListed;
      const blackListStr = list.join("\n");
      ctx.setState({
        hasCurrentEnabled: isEnabled,
        blackListAlteredStr: "",
        blackListStr: blackListStr,
      });
    });
    sfc.ListenNoResultsChanged((v) => {
      ctx.setState({ hideWhenNoResults: v });
    });
    sfc.ListenIsEnabledChanged((v) => {
      ctx.setState({ hasAllEnabled: v });
    });
    sfc.ListenUseNewRedditLinks((v) => {
      ctx.setState({ useNewRedditLinks: v });
    });
    sfc.ListenConsoleDebugChanged((v) => {
      ctx.setState({ hasDebugEnabled: v });
    });
  }

  onConsoleDebugChanged(isEnabled: boolean) {
    sfc.SetConsoleDebug(isEnabled);
    this.setState({ hasDebugEnabled: isEnabled });
  }

  onHideWhenNoResultsChanged(isEnabled: boolean) {
    sfc.SetHideWhenNoResults(isEnabled);
    this.setState({ hideWhenNoResults: isEnabled });
  }

  onCurrentEnabledChanged(isEnabled: boolean) {
    sfc.SetCurrentEnabled(isEnabled);
    this.setState({ hasCurrentEnabled: isEnabled });
  }

  onAllEnabledChanged(value: boolean) {
    sfc.SetAllEnabled(value);
    this.setState({ hasAllEnabled: value });
  }

  onUseNewRedditLinksChanged(value: boolean) {
    sfc.SetUseNewRedditLinks(value);
    this.setState({ useNewRedditLinks: value });
  }

  onSaveHosts() {
    const newHosts = this.state.blackListAlteredStr;
    const newHostArr = newHosts.split("\n");
    sfc.SetHostsArr(newHostArr);
  }

  render() {
    const {
      hasCurrentEnabled,
      hasAllEnabled,
      hasDebugEnabled,
      blackListAlteredStr,
      blackListStr,
      hideWhenNoResults,
      useNewRedditLinks,
    } = this.state;
    const { isPopupPage } = this.props;

    return (
      <div
        className="section py-1"
        style={{ overflowY: "auto", height: isPopupPage && "400px" }}
      >
        <section className="form">
          {isPopupPage && (
            <CheckBox
              value={hasCurrentEnabled}
              onChange={(e) => this.onCurrentEnabledChanged(e)}
              title="Enabled on this website"
            />
          )}
          <CheckBox
            value={hasAllEnabled}
            onChange={(e) => this.onAllEnabledChanged(e)}
            title="Run automatically on page load"
          />
          <CheckBox
            value={hasDebugEnabled}
            onChange={(e) => this.onConsoleDebugChanged(e)}
            title="Show Console Output"
          />
          <CheckBox
            value={hideWhenNoResults}
            onChange={(e) => this.onHideWhenNoResultsChanged(e)}
            title="Hide [+] When No Results"
          />
          <CheckBox
            value={useNewRedditLinks}
            onChange={(e) => this.onUseNewRedditLinksChanged(e)}
            title="Use new Reddit links"
          />
          <label className="label mb-0">Hosts Blocked</label>
          <p style={{ color: "darkgrey", fontSize: "13px" }}>
            <i>Edit which hosts are blocked</i>
          </p>
          <textarea
            style={{ width: "100%", height: isPopupPage ? "60px" : "200px" }}
            value={blackListStr}
            onChange={(e) => {
              const text = e.target.value;
              this.setState({ blackListStr: text, blackListAlteredStr: text });
            }}
          ></textarea>
          {!!blackListAlteredStr && (
            <div className="field">
              <div className="control has-text-centered pt-1">
                <button
                  onClick={(e) => this.onSaveHosts()}
                  className="button is-info"
                >
                  Save Hosts
                </button>
              </div>
            </div>
          )}
        </section>
        <section>
          <div>
            <a href="https://github.com/benwinding/newsit" title="source code link">
              Github source code
            </a>
          </div>
        </section>
      </div>
    );
  }
}

function CheckBox(props: {
  title: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  function changed(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.checked;
    props.onChange(value);
  }
  return (
    <div className="field">
      <div className="control">
        <label className="checkbox">
          <input type="checkbox" checked={props.value} onChange={changed} />
          <span className="ml-2">{props.title}</span>
        </label>
      </div>
    </div>
  );
}
