/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { Icon } from "@freelensapp/icon";
import { withInjectables } from "@ogre-tools/injectable-react";
import React from "react";
import { MenuItem } from "../menu";
import openRoleInstanceSetScaleDialogInjectable from "./scale/open.injectable";

import type { RoleInstanceSet } from "@freelensapp/kube-object";

import type { KubeObjectMenuProps } from "../kube-object-menu";
import type { OpenRoleInstanceSetScaleDialog } from "./scale/open.injectable";

export interface RoleInstanceSetMenuProps extends KubeObjectMenuProps<RoleInstanceSet> {}

interface Dependencies {
  openRoleInstanceSetScaleDialog: OpenRoleInstanceSetScaleDialog;
}

const NonInjectedRoleInstanceSetMenu = ({
  object,
  openRoleInstanceSetScaleDialog,
  toolbar,
}: Dependencies & RoleInstanceSetMenuProps) => (
  <MenuItem onClick={() => openRoleInstanceSetScaleDialog(object)}>
    <Icon material="open_with" tooltip="Scale" interactive={toolbar} />
    <span className="title">Scale</span>
  </MenuItem>
);

export const RoleInstanceSetMenu = withInjectables<Dependencies, RoleInstanceSetMenuProps>(
  NonInjectedRoleInstanceSetMenu,
  {
    getProps: (di, props) => ({
      ...props,
      openRoleInstanceSetScaleDialog: di.inject(openRoleInstanceSetScaleDialogInjectable),
    }),
  },
);
