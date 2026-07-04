/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { getInjectable } from "@ogre-tools/injectable";
import { computed } from "mobx";
import { RoleBasedGroupMenu } from "../../workloads-rolebasedgroups/rolebasedgroup-menu";
import { kubeObjectMenuItemInjectionToken } from "../kube-object-menu-item-injection-token";

import type { KubeObjectMenuItemComponent } from "../kube-object-menu-item-injection-token";

const roleBasedGroupMenuInjectable = getInjectable({
  id: "rolebasedgroup-menu-kube-object-menu",

  instantiate: () => ({
    kind: "RoleBasedGroup",
    apiVersions: ["workloads.x-k8s.io/v1alpha2"],
    Component: RoleBasedGroupMenu as KubeObjectMenuItemComponent,
    enabled: computed(() => true),
    orderNumber: 51,
  }),

  injectionToken: kubeObjectMenuItemInjectionToken,
});

export default roleBasedGroupMenuInjectable;
