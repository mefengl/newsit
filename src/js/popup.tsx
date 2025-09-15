import React from "react";
import ReactDOM from "react-dom";

import { Header } from "./ui/header";
import { SettingsForm } from "./ui/settings-form";
import { PopupResults } from "./ui/popup-results";
import { createPopupController } from "./popup.controller";

const pc = createPopupController();

export function PopupWindow() {
  return (
    <div className="column">
      <Header />
      <PopupResults />
      <SettingsForm isPopupPage={true} />
      <section className="section py-1">
        <button onClick={() => pc.LaunchOptionsPage()} className="button">
          More Options
        </button>
      </section>
    </div>
  );
}

ReactDOM.render(<PopupWindow />, document.getElementById("app"));
