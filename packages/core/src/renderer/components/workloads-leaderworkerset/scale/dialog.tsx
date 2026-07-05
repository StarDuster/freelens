/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import "./dialog.scss";

import { Icon } from "@freelensapp/icon";
import { leaderWorkerSetApiInjectable } from "@freelensapp/kube-api-specifics";
import { showCheckedErrorNotificationInjectable } from "@freelensapp/notifications";
import { cssNames } from "@freelensapp/utilities";
import { withInjectables } from "@ogre-tools/injectable-react";
import { computed, makeObservable, observable } from "mobx";
import { observer } from "mobx-react";
import React, { Component } from "react";
import { Dialog } from "../../dialog";
import { Slider } from "../../slider";
import { Wizard, WizardStep } from "../../wizard";
import leaderWorkerSetScaleDialogStateInjectable from "./dialog-state.injectable";

import type { LeaderWorkerSetApi } from "@freelensapp/kube-api";
import type { LeaderWorkerSet } from "@freelensapp/kube-object";
import type { ShowCheckedErrorNotification } from "@freelensapp/notifications";

import type { IObservableValue } from "mobx";

import type { DialogProps } from "../../dialog";

export interface LeaderWorkerSetScaleDialogProps extends Partial<DialogProps> {}

interface Dependencies {
  leaderWorkerSetApi: LeaderWorkerSetApi;
  state: IObservableValue<LeaderWorkerSet | undefined>;
  showCheckedErrorNotification: ShowCheckedErrorNotification;
}

@observer
class NonInjectedLeaderWorkerSetScaleDialog extends Component<LeaderWorkerSetScaleDialogProps & Dependencies> {
  @observable ready = false;
  @observable currentReplicas = 0;
  @observable desiredReplicas = 0;

  constructor(props: LeaderWorkerSetScaleDialogProps & Dependencies) {
    super(props);
    makeObservable(this);
  }

  close = () => {
    this.props.state.set(undefined);
  };

  @computed get scaleMax() {
    const { currentReplicas } = this;
    const defaultMax = 50;

    return currentReplicas <= defaultMax ? defaultMax * 2 : currentReplicas * 2;
  }

  onOpen = async (lws: LeaderWorkerSet) => {
    try {
      this.currentReplicas = await this.props.leaderWorkerSetApi.getReplicas({
        namespace: lws.getNs(),
        name: lws.getName(),
      });
      this.desiredReplicas = this.currentReplicas;
      this.ready = true;
    } catch (err) {
      this.props.showCheckedErrorNotification(err, "Failed to load LeaderWorkerSet replicas for scaling");
      this.close();
    }
  };

  onClose = () => {
    this.ready = false;
  };

  onChange = (evt: Event, value: number) => {
    this.desiredReplicas = value;
  };

  scale = async (lws: LeaderWorkerSet) => {
    const { currentReplicas, desiredReplicas, close } = this;

    try {
      if (currentReplicas !== desiredReplicas) {
        await this.props.leaderWorkerSetApi.scale(
          {
            name: lws.getName(),
            namespace: lws.getNs(),
          },
          desiredReplicas,
        );
      }
      close();
    } catch (err) {
      this.props.showCheckedErrorNotification(err, "Unknown error occurred while scaling LeaderWorkerSet");
    }
  };

  private readonly scaleMin = 0;

  desiredReplicasUp = () => {
    this.desiredReplicas = Math.min(this.scaleMax, this.desiredReplicas + 1);
  };

  desiredReplicasDown = () => {
    this.desiredReplicas = Math.max(this.scaleMin, this.desiredReplicas - 1);
  };

  renderContents(lws: LeaderWorkerSet) {
    const { currentReplicas, desiredReplicas, onChange, scaleMax } = this;
    const warning = currentReplicas < 10 && desiredReplicas > 90;

    return (
      <Wizard
        header={
          <h5>
            {"Scale LeaderWorkerSet "}
            <span>{lws.getName()}</span>
          </h5>
        }
        done={this.close}
      >
        <WizardStep
          contentClass="flex gaps column"
          next={() => this.scale(lws)}
          nextLabel="Scale"
          disabledNext={!this.ready}
        >
          <div className="current-scale" data-testid="current-scale">
            Current replica scale: {currentReplicas}
          </div>
          <div className="flex gaps align-center">
            <div className="desired-scale" data-testid="desired-scale">
              Desired number of replicas: {desiredReplicas}
            </div>
            <div className="slider-container flex align-center">
              <Slider value={desiredReplicas} max={scaleMax} onChange={onChange} />
            </div>
            <div className="plus-minus-container flex gaps">
              <Icon
                material="remove_circle_outline"
                onClick={this.desiredReplicasDown}
                data-testid="desired-replicas-down"
              />
              <Icon material="add_circle_outline" onClick={this.desiredReplicasUp} data-testid="desired-replicas-up" />
            </div>
          </div>
          {warning && (
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
    const lws = state.get();

    return (
      <Dialog
        {...dialogProps}
        isOpen={Boolean(lws)}
        className={cssNames("LeaderWorkerSetScaleDialog", className)}
        onOpen={lws && (() => this.onOpen(lws))}
        onClose={this.onClose}
        close={this.close}
      >
        {lws && this.renderContents(lws)}
      </Dialog>
    );
  }
}

export const LeaderWorkerSetScaleDialog = withInjectables<Dependencies, LeaderWorkerSetScaleDialogProps>(
  NonInjectedLeaderWorkerSetScaleDialog,
  {
    getProps: (di, props) => ({
      ...props,
      leaderWorkerSetApi: di.inject(leaderWorkerSetApiInjectable),
      state: di.inject(leaderWorkerSetScaleDialogStateInjectable),
      showCheckedErrorNotification: di.inject(showCheckedErrorNotificationInjectable),
    }),
  },
);
