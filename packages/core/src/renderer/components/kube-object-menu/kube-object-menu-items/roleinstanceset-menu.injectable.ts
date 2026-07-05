/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { getInjectable } from "@ogre-tools/injectable";
import { computed } from "mobx";
import { RoleInstanceSetMenu } from "../../workloads-roleinstancesets/roleinstanceset-menu";
import { kubeObjectMenuItemInjectionToken } from "../kube-object-menu-item-injection-token";

import type { KubeObjectMenuItemComponent } from "../kube-object-menu-item-injection-token";

const roleInstanceSetMenuInjectable = getInjectable({
  id: "roleinstanceset-menu-kube-object-menu",

  instantiate: () => ({
    kind: "RoleInstanceSet",
    apiVersions: ["workloads.x-k8s.io/v1alpha2"],
    Component: RoleInstanceSetMenu as KubeObjectMenuItemComponent,
    enabled: computed(() => true),
    orderNumber: 53,
  }),

  injectionToken: kubeObjectMenuItemInjectionToken,
});

export default roleInstanceSetMenuInjectable;
