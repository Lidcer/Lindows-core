import React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { Main } from "./components/Main";
import { BlueScreen } from "./components/BlueScreen/BlueScreen";
import "./App.scss";
import { PopupRenderer } from "./components/Popup/popupRenderer";

export class App extends React.Component {
  render() {
    return (
      <>
        <BrowserRouter>
          <Switch>
            <Route exact path='/' component={Main} />
            <Route path='*' component={BlueScreen} />
          </Switch>
        </BrowserRouter>
        <PopupRenderer />
      </>
    );
  }
}
