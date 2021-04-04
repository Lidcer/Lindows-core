import React from "react";
import { internal } from "../../services/internals/Internal";
import { ActivationWatermarkStyle } from "./activationWatermarkStyled";

export class ActivationWatermark extends React.Component {
  componentDidMount() {}
  componentWillUnmount() {}

  refresh = () => {
    this.setState({});
  };

  render() {
    if (STATIC) {
      return (
        <ActivationWatermarkStyle>
          <h1>Lindows core Demo</h1>
          <h2>You are using Demo edition of Lindows</h2>
        </ActivationWatermarkStyle>
      );
    }
    return null;
    return (
      <ActivationWatermarkStyle>
        <h1>Activate Lindows</h1>
        <h2>Go to Account manager to activate Lindows</h2>
      </ActivationWatermarkStyle>
    );
  }
}
