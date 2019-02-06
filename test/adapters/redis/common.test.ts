import { Store } from "../../..";

describe("Redis adapter common features", function() {
  require("../../common.batch")(async () => await Store.createAndWait("redis"));
});
