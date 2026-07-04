/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import "./dialog.scss";

import { Icon } from "@freelensapp/icon";
import { showCheckedErrorNotificationInjectable } from "@freelensapp/notifications";
import { cssNames } from "@freelensapp/utilities";
import { withInjectables } from "@ogre-tools/injectable-react";
import { action, computed, makeObservable, observable } from "mobx";
import { observer } from "mobx-react";
import React, { Component } from "react";
import apiManagerInjectable from "../../../../common/k8s-api/api-manager/manager.injectable";
import { Dialog } from "../../dialog";
import { Slider } from "../../slider";
import { Wizard, WizardStep } from "../../wizard";
import roleInstanceScaleDialogStateInjectable from "./dialog-state.injectable";

import type { ApiManager } from "../../../../common/k8s-api/api-manager/api-manager";
import type { RoleInstance } from "@freelensapp/kube-object";
import type { ShowCheckedErrorNotification } from "@freelensapp/notifications";

import type { IObservableValue } from "mobx";

import type { DialogProps } from "../../dialog";

interface ComponentScaleState {
  name: string;
  currentSize: number;
  readyReplicas: number;
  desiredSize: number;
}

export interface RoleInstanceScaleDialogProps extends Partial<DialogProps> {}

interface Dependencies {
  apiManager: ApiManager;
  state: IObservableValue<RoleInstance | undefined>;
  showCheckedErrorNotification: ShowCheckedErrorNotification;
}

@observer
class NonInjectedRoleInstanceScaleDialog extends Component<RoleInstanceScaleDialogProps & Dependencies> {
  @observable componentStates: ComponentScaleState[] = [];
  @observable ready = false;

  constructor(props: RoleInstanceScaleDialogProps & Dependencies) {
    super(props);
    makeObservable(this);
  }

  close = () => {
    this.props.state.set(undefined);
  };

  @computed get hasChanges() {
    return this.componentStates.some((cs) => cs.desiredSize !== cs.currentSize);
  }

  @computed get hasHighScaleWarning() {
    return this.componentStates.some((cs) => cs.currentSize < 10 && cs.desiredSize > 90);
  }

  scaleMaxFor(current: number) {
    const defaultMax = 50;
    return current <= defaultMax ? defaultMax * 2 : current * 2;
  }

  onOpen = (roleInstance: RoleInstance) => {
    this.componentStates = roleInstance.getComponents().map((component) => {
      const readyReplicas = roleInstance.getComponentReadyReplicas(component.name);
      return {
        name: component.name,
        currentSize: component.size ?? 0,
        readyReplicas,
        desiredSize: component.size ?? 0,
      };
    });
    this.ready = true;
  };

  onClose = () => {
    this.ready = false;
    this.componentStates = [];
  };

  @action setDesiredSize = (index: number, value: number) => {
    const component = this.componentStates[index];
    if (component) {
      component.desiredSize = Math.max(0, Math.min(this.scaleMaxFor(component.currentSize), value));
    }
  };

  onChange = (index: number) => (evt: Event, value: number) => {
    this.setDesiredSize(index, value);
  };

  desiredUp = (index: number) => {
    const component = this.componentStates[index];
    if (component) {
      this.setDesiredSize(index, component.desiredSize + 1);
    }
  };

  desiredDown = (index: number) => {
    const component = this.componentStates[index];
    if (component) {
      this.setDesiredSize(index, component.desiredSize - 1);
    }
  };

  scale = async (roleInstance: RoleInstance) => {
    const { close } = this;

    try {
      const changed = this.componentStates
        .map((cs, index) => ({ cs, index }))
        .filter(({ cs }) => cs.desiredSize !== cs.currentSize);

      if (changed.length === 0) {
        close();
        return;
      }

      // Build a JSON patch replacing spec.components[i].size for each changed component.
      const jsonPatch = changed.map(({ cs, index }) => ({
        op: "replace" as const,
        path: `/spec/components/${index}/size`,
        value: cs.desiredSize,
      }));

      const store = this.props.apiManager.getStore(roleInstance.selfLink);

      if (!store) {
        throw new Error(`No store found for ${roleInstance.selfLink}`);
      }

      await store.patch(roleInstance, jsonPatch, "json");
      close();
    } catch (err) {
      this.props.showCheckedErrorNotification(err, "Unknown error occurred while scaling RoleInstance");
    }
  };

  renderComponentRow = (componentState: ComponentScaleState, index: number) => {
    const scaleMax = this.scaleMaxFor(componentState.currentSize);

    return (
      <div className="component-row" key={componentState.name} data-testid={`component-row-${componentState.name}`}>
        <div className="component-name">{componentState.name}</div>
        <div className="component-current" data-testid={`component-current-${componentState.name}`}>
          Current: {componentState.currentSize} (ready: {componentState.readyReplicas})
        </div>
        <div className="desired-scale" data-testid={`component-desired-${componentState.name}`}>
          Desired: {componentState.desiredSize}
        </div>
        <div className="slider-container flex align-center">
          <Slider value={componentState.desiredSize} max={scaleMax} onChange={this.onChange(index)} />
        </div>
        <div className="plus-minus-container flex gaps">
          <Icon
            material="remove_circle_outline"
            onClick={() => this.desiredDown(index)}
            data-testid={`component-down-${componentState.name}`}
          />
          <Icon
            material="add_circle_outline"
            onClick={() => this.desiredUp(index)}
            data-testid={`component-up-${componentState.name}`}
          />
        </div>
      </div>
    );
  };

  renderContents(roleInstance: RoleInstance) {
    return (
      <Wizard
        header={
          <h5>
            {"Scale RoleInstance "}
            <span>{roleInstance.getName()}</span>
          </h5>
        }
        done={this.close}
      >
        <WizardStep
          contentClass="flex gaps column"
          next={() => this.scale(roleInstance)}
          nextLabel="Scale"
          disabledNext={!this.ready || !this.hasChanges}
        >
          {this.componentStates.map((cs, index) => this.renderComponentRow(cs, index))}
          {this.hasHighScaleWarning && (
            <div className="warning" data-testid="warning">
              <Icon material="warning" />
              High number of replicas may cause cluster performance issues
            </div>
          )}
        </WizardStep>
      </Wizard>
    );
  }

  render() {
    const { className, state, ...dialogProps } = this.props;
    const roleInstance = state.get();

    return (
      <Dialog
        {...dialogProps}
        isOpen={Boolean(roleInstance)}
        className={cssNames("RoleInstanceScaleDialog", className)}
        onOpen={roleInstance && (() => this.onOpen(roleInstance))}
        onClose={this.onClose}
        close={this.close}
      >
        {roleInstance && this.renderContents(roleInstance)}
      </Dialog>
    );
  }
}

export const RoleInstanceScaleDialog = withInjectables<Dependencies, RoleInstanceScaleDialogProps>(
  NonInjectedRoleInstanceScaleDialog,
  {
    getProps: (di, props) => ({
      ...props,
      apiManager: di.inject(apiManagerInjectable),
      state: di.inject(roleInstanceScaleDialogStateInjectable),
      showCheckedErrorNotification: di.inject(showCheckedErrorNotificationInjectable),
    }),
  },
);
