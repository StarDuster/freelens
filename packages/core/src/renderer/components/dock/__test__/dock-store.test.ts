/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { beforeEach, describe, expect, it } from "vitest";
import directoryForUserDataInjectable from "../../../../common/app-paths/directory-for-user-data/directory-for-user-data.injectable";
import hostedClusterIdInjectable from "../../../cluster-frame-context/hosted-cluster-id.injectable";
import { getDiForUnitTesting } from "../../../getDiForUnitTesting";
import { TabKind } from "../dock/store";
import dockStoreInjectable from "../dock/store.injectable";

import type { DockStore, DockTab } from "../dock/store";

const initialTabs: DockTab[] = [
  { id: "terminal", kind: TabKind.TERMINAL, title: "Terminal", pinned: false },
  { id: "create", kind: TabKind.CREATE_RESOURCE, title: "Create resource", pinned: false },
  { id: "edit", kind: TabKind.EDIT_RESOURCE, title: "Edit resource", pinned: false },
  { id: "install", kind: TabKind.INSTALL_CHART, title: "Install chart", pinned: false },
  { id: "logs", kind: TabKind.POD_LOGS, title: "Logs", pinned: false },
];

describe("DockStore", () => {
  let dockStore: DockStore;

  beforeEach(() => {
    const di = getDiForUnitTesting();

    di.override(hostedClusterIdInjectable, () => "some-cluster-id");
    di.override(directoryForUserDataInjectable, () => "some-directory-for-user-data");

    dockStore = di.inject(dockStoreInjectable);
  });

  it("closes tab and selects one from right", () => {
    dockStore.tabs = initialTabs;
    dockStore.closeTab(dockStore.tabs[0].id);

    expect(dockStore.selectedTabId).toBe("create");

    dockStore.selectTab("edit");
    dockStore.closeTab("edit");

    expect(dockStore.selectedTabId).toBe("install");
  });

  it("closes last tab and selects one from right", () => {
    dockStore.tabs = initialTabs;
    dockStore.selectTab("logs");
    dockStore.closeTab("logs");

    expect(dockStore.selectedTabId).toBe("install");
  });

  it("closes tab and selects the last one", () => {
    dockStore.tabs = [
      { id: "terminal", kind: TabKind.TERMINAL, title: "Terminal", pinned: false },
      { id: "create", kind: TabKind.CREATE_RESOURCE, title: "Create resource", pinned: false },
    ];
    dockStore.closeTab("terminal");

    expect(dockStore.selectedTabId).toBe("create");
  });

  it("closes dock after closing the final tab", () => {
    dockStore.tabs = [{ id: "create", kind: TabKind.CREATE_RESOURCE, title: "Create resource", pinned: false }];
    dockStore.open();
    dockStore.closeTab("create");

    expect(dockStore.tabs).toEqual([]);
    expect(dockStore.selectedTabId).toBeUndefined();
    expect(dockStore.isOpen).toBe(false);
  });

  it("closes when empty dock state is restored as open", () => {
    dockStore.tabs = [];
    dockStore.open();

    expect(dockStore.isOpen).toBe(false);
  });

  it("drops restored tabs of unknown kinds and closes the emptied dock", () => {
    dockStore.tabs = [
      { id: "foreign", kind: "ai-agent" as TabKind, title: "AI Agent", pinned: false },
      { id: "foreign-2", kind: "ai-agent" as TabKind, title: "AI Agent", pinned: false },
    ];
    dockStore.open();

    expect(dockStore.tabs).toEqual([]);
    expect(dockStore.selectedTabId).toBeUndefined();
    expect(dockStore.isOpen).toBe(false);
  });

  it("drops restored tabs of unknown kinds but keeps known tabs", () => {
    dockStore.tabs = [
      { id: "foreign", kind: "ai-agent" as TabKind, title: "AI Agent", pinned: false },
      { id: "terminal", kind: TabKind.TERMINAL, title: "Terminal", pinned: false },
    ];
    dockStore.open();

    expect(dockStore.tabs.map((tab) => tab.id)).toEqual(["terminal"]);
    expect(dockStore.selectedTabId).toBe("terminal");
    expect(dockStore.isOpen).toBe(true);
  });

  it("doesn't change selected tab if other tab closed", () => {
    dockStore.tabs = initialTabs;
    dockStore.closeTab("install");

    expect(dockStore.selectedTabId).toBe("terminal");
  });
});
