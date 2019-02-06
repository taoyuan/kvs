import { Store } from "../../..";

describe("Memory adapter common features", function() {
  require("../../common.batch")(async () => await Store.createAndWait("memory"));
});
