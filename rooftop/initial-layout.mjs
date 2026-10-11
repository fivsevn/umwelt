import { ITEM_CATALOG_REVISION } from "./item-catalog.mjs";

// A new arrangement starts empty. Player-authored arrangements are saved normally.
export const INITIAL_LAYOUT = {
  version: 2, roomVersion: 2, spaceVersion: 2, catalogRevision: ITEM_CATALOG_REVISION,
  scenes: { north: [], south: [], room: [] },
};
