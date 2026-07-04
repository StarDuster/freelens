/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { Icon } from "@freelensapp/icon";
import { withInjectables } from "@ogre-tools/injectable-react";
import React from "react";
import { MenuItem } from "../menu";
import openRoleInstanceScaleDialogInjectable from "./scale/open.injectable";

import type { RoleInstance } from "@freelensapp/kube-object";

import type { OpenRoleInstanceScaleDialog } from "./scale/open.injectable";
import type { KubeObjectMenuProps } from "../kube-object-menu";

export interface RoleInstanceMenuProps extends KubeObjectMenuProps<RoleInstance> {}

interface Dependencies {
  openRoleInstanceScaleDialog: OpenRoleInstanceScaleDialog;
}

const NonInjectedRoleInstanceMenu = ({
  object,
  openRoleInstanceScaleDialog,
  toolbar,
}: Dependencies & RoleInstanceMenuProps) => (
  <MenuItem onClick={() => openRoleInstanceScaleDialog(object)}>
    <Icon material="open_with" tooltip="Scale" interactive={toolbar} />
    <span className="title">Scale</span>
  </MenuItem>
);

export const RoleInstanceMenu = withInjectables<Dependencies, RoleInstanceMenuProps>(NonInjectedRoleInstanceMenu, {
  getProps: (di, props) => ({
    ...props,
    openRoleInstanceScaleDialog: di.inject(openRoleInstanceScaleDialogInjectable),
  }),
});
