/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { getInjectable } from "@ogre-tools/injectable";
import { computed } from "mobx";
import { RoleInstanceMenu } from "../../workloads-roleinstances/roleinstance-menu";
import { kubeObjectMenuItemInjectionToken } from "../kube-object-menu-item-injection-token";

import type { KubeObjectMenuItemComponent } from "../kube-object-menu-item-injection-token";

const roleInstanceMenuInjectable = getInjectable({
  id: "roleinstance-menu-kube-object-menu",

  instantiate: () => ({
    kind: "RoleInstance",
    apiVersions: ["workloads.x-k8s.io/v1alpha2"],
    Component: RoleInstanceMenu as KubeObjectMenuItemComponent,
    enabled: computed(() => true),
    orderNumber: 52,
  }),

  injectionToken: kubeObjectMenuItemInjectionToken,
});

export default roleInstanceMenuInjectable;
