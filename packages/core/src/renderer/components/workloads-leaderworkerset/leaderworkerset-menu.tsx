/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { Icon } from "@freelensapp/icon";
import { withInjectables } from "@ogre-tools/injectable-react";
import React from "react";
import { MenuItem } from "../menu";
import openLeaderWorkerSetScaleDialogInjectable from "./scale/open.injectable";

import type { LeaderWorkerSet } from "@freelensapp/kube-object";

import type { KubeObjectMenuProps } from "../kube-object-menu";
import type { OpenLeaderWorkerSetScaleDialog } from "./scale/open.injectable";

export interface LeaderWorkerSetMenuProps extends KubeObjectMenuProps<LeaderWorkerSet> {}

interface Dependencies {
  openLeaderWorkerSetScaleDialog: OpenLeaderWorkerSetScaleDialog;
}

const NonInjectedLeaderWorkerSetMenu = ({
  object,
  openLeaderWorkerSetScaleDialog,
  toolbar,
}: Dependencies & LeaderWorkerSetMenuProps) => (
  <MenuItem onClick={() => openLeaderWorkerSetScaleDialog(object)}>
    <Icon material="open_with" tooltip="Scale" interactive={toolbar} />
    <span className="title">Scale</span>
  </MenuItem>
);

export const LeaderWorkerSetMenu = withInjectables<Dependencies, LeaderWorkerSetMenuProps>(
  NonInjectedLeaderWorkerSetMenu,
  {
    getProps: (di, props) => ({
      ...props,
      openLeaderWorkerSetScaleDialog: di.inject(openLeaderWorkerSetScaleDialogInjectable),
    }),
  },
);
