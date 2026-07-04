/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { Icon } from "@freelensapp/icon";
import { withInjectables } from "@ogre-tools/injectable-react";
import React from "react";
import { MenuItem } from "../menu";
import openRoleBasedGroupScaleDialogInjectable from "./scale/open.injectable";

import type { RoleBasedGroup } from "@freelensapp/kube-object";

import type { OpenRoleBasedGroupScaleDialog } from "./scale/open.injectable";
import type { KubeObjectMenuProps } from "../kube-object-menu";

export interface RoleBasedGroupMenuProps extends KubeObjectMenuProps<RoleBasedGroup> {}

interface Dependencies {
  openRoleBasedGroupScaleDialog: OpenRoleBasedGroupScaleDialog;
}

const NonInjectedRoleBasedGroupMenu = ({
  object,
  openRoleBasedGroupScaleDialog,
  toolbar,
}: Dependencies & RoleBasedGroupMenuProps) => (
  <MenuItem onClick={() => openRoleBasedGroupScaleDialog(object)}>
    <Icon material="open_with" tooltip="Scale" interactive={toolbar} />
    <span className="title">Scale</span>
  </MenuItem>
);

export const RoleBasedGroupMenu = withInjectables<Dependencies, RoleBasedGroupMenuProps>(
  NonInjectedRoleBasedGroupMenu,
  {
    getProps: (di, props) => ({
      ...props,
      openRoleBasedGroupScaleDialog: di.inject(openRoleBasedGroupScaleDialogInjectable),
    }),
  },
);
