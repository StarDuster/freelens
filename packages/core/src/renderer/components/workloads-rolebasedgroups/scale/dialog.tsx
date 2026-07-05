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
import roleBasedGroupScaleDialogStateInjectable from "./dialog-state.injectable";

import type { RoleBasedGroup } from "@freelensapp/kube-object";
import type { ShowCheckedErrorNotification } from "@freelensapp/notifications";

import type { IObservableValue } from "mobx";

import type { ApiManager } from "../../../../common/k8s-api/api-manager/api-manager";
import type { DialogProps } from "../../dialog";

interface RoleScaleState {
  name: string;
  currentReplicas: number;
  readyReplicas: number;
  desiredReplicas: number;
}

export interface RoleBasedGroupScaleDialogProps extends Partial<DialogProps> {}

interface Dependencies {
  apiManager: ApiManager;
  state: IObservableValue<RoleBasedGroup | undefined>;
  showCheckedErrorNotification: ShowCheckedErrorNotification;
}

@observer
class NonInjectedRoleBasedGroupScaleDialog extends Component<RoleBasedGroupScaleDialogProps & Dependencies> {
  @observable roleStates: RoleScaleState[] = [];
  @observable ready = false;

  constructor(props: RoleBasedGroupScaleDialogProps & Dependencies) {
    super(props);
    makeObservable(this);
  }

  close = () => {
    this.props.state.set(undefined);
  };

  @computed get hasChanges() {
    return this.roleStates.some((rs) => rs.desiredReplicas !== rs.currentReplicas);
  }

  @computed get hasHighScaleWarning() {
    return this.roleStates.some((rs) => rs.currentReplicas < 10 && rs.desiredReplicas > 90);
  }

  scaleMaxFor(current: number) {
    const defaultMax = 50;
    return current <= defaultMax ? defaultMax * 2 : current * 2;
  }

  onOpen = (rbg: RoleBasedGroup) => {
    try {
      const roles = rbg.getRoles() ?? [];

      if (roles.length === 0) {
        throw new Error("No roles found in this RoleBasedGroup specification.");
      }

      this.roleStates = roles.map((role) => {
        const readyReplicas = rbg.getRoleReadyReplicas(role.name);
        return {
          name: role.name,
          currentReplicas: role.replicas ?? 0,
          readyReplicas,
          desiredReplicas: role.replicas ?? 0,
        };
      });
      this.ready = true;
    } catch (err) {
      this.props.showCheckedErrorNotification(err, "Failed to load RoleBasedGroup roles for scaling");
      this.close();
    }
  };

  onClose = () => {
    this.ready = false;
    this.roleStates = [];
  };

  @action setDesiredReplicas = (index: number, value: number) => {
    const role = this.roleStates[index];
    if (role) {
      role.desiredReplicas = Math.max(0, Math.min(this.scaleMaxFor(role.currentReplicas), value));
    }
  };

  onChange = (index: number) => (evt: Event, value: number) => {
    this.setDesiredReplicas(index, value);
  };

  desiredUp = (index: number) => {
    const role = this.roleStates[index];
    if (role) {
      this.setDesiredReplicas(index, role.desiredReplicas + 1);
    }
  };

  desiredDown = (index: number) => {
    const role = this.roleStates[index];
    if (role) {
      this.setDesiredReplicas(index, role.desiredReplicas - 1);
    }
  };

  scale = async (rbg: RoleBasedGroup) => {
    const { close } = this;

    try {
      const changed = this.roleStates
        .map((rs, index) => ({ rs, index }))
        .filter(({ rs }) => rs.desiredReplicas !== rs.currentReplicas);

      if (changed.length === 0) {
        close();
        return;
      }

      // Build a JSON patch replacing spec.roles[i].replicas for each changed role.
      const jsonPatch = changed.map(({ rs, index }) => ({
        op: "replace" as const,
        path: `/spec/roles/${index}/replicas`,
        value: rs.desiredReplicas,
      }));

      const store = this.props.apiManager.getStore(rbg.selfLink);

      if (!store) {
        throw new Error(`No store found for ${rbg.selfLink}`);
      }

      await store.patch(rbg, jsonPatch, "json");
      close();
    } catch (err) {
      this.props.showCheckedErrorNotification(err, "Unknown error occurred while scaling RoleBasedGroup");
    }
  };

  renderRoleRow = (roleState: RoleScaleState, index: number) => {
    const scaleMax = this.scaleMaxFor(roleState.currentReplicas);

    return (
      <div className="role-row" key={roleState.name} data-testid={`role-row-${roleState.name}`}>
        <div className="role-name">{roleState.name}</div>
        <div className="role-current" data-testid={`role-current-${roleState.name}`}>
          Current: {roleState.currentReplicas} (ready: {roleState.readyReplicas})
        </div>
        <div className="desired-scale" data-testid={`role-desired-${roleState.name}`}>
          Desired: {roleState.desiredReplicas}
        </div>
        <div className="slider-container flex align-center">
          <Slider value={roleState.desiredReplicas} max={scaleMax} onChange={this.onChange(index)} />
        </div>
        <div className="plus-minus-container flex gaps">
          <Icon
            material="remove_circle_outline"
            onClick={() => this.desiredDown(index)}
            data-testid={`role-down-${roleState.name}`}
          />
          <Icon
            material="add_circle_outline"
            onClick={() => this.desiredUp(index)}
            data-testid={`role-up-${roleState.name}`}
          />
        </div>
      </div>
    );
  };

  renderContents(rbg: RoleBasedGroup) {
    return (
      <Wizard
        header={
          <h5>
            {"Scale RoleBasedGroup "}
            <span>{rbg.getName()}</span>
          </h5>
        }
        done={this.close}
      >
        <WizardStep
          contentClass="flex gaps column"
          next={() => this.scale(rbg)}
          nextLabel="Scale"
          disabledNext={!this.ready || !this.hasChanges}
        >
          {this.roleStates.map((rs, index) => this.renderRoleRow(rs, index))}
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
    const rbg = state.get();

    return (
      <Dialog
        {...dialogProps}
        isOpen={Boolean(rbg)}
        className={cssNames("RoleBasedGroupScaleDialog", className)}
        onOpen={rbg && (() => this.onOpen(rbg))}
        onClose={this.onClose}
        close={this.close}
      >
        {rbg && this.renderContents(rbg)}
      </Dialog>
    );
  }
}

export const RoleBasedGroupScaleDialog = withInjectables<Dependencies, RoleBasedGroupScaleDialogProps>(
  NonInjectedRoleBasedGroupScaleDialog,
  {
    getProps: (di, props) => ({
      ...props,
      apiManager: di.inject(apiManagerInjectable),
      state: di.inject(roleBasedGroupScaleDialogStateInjectable),
      showCheckedErrorNotification: di.inject(showCheckedErrorNotificationInjectable),
    }),
  },
);
