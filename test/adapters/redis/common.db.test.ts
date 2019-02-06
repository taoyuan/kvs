import { Store } from "../../..";

describe("Redis adapter common features with `db` option", function() {
  require("../../common.batch")(async () => await Store.createAndWait("redis", { db: 2 }));
});
