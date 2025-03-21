import detectIndent from "detect-indent";
import * as YAML from "yaml";
import type { PLazy } from "../PLazy.js";
import { getFileContext } from "../contexts.js";
import { FunctionExecutor, fnWrapper } from "../engineHelpers.js";

/**
 * Update the contents of a yaml file
 */
export function updateLogic<T>(
  callback: (before: T) => T | Promise<T>,
): PLazy<Helpers> & Helpers {
  return new FunctionExecutor("update")
    .helpers(helpers)
    .arguments(() => ({ callback }))
    .executor(async (next, self) => {
      const { callback } = self.getArguments();
      const file = getFileContext();
      const beforeContents = await file.contents();
      const indent = detectIndent(beforeContents).amount || 2;
      const afterContents = await callback(YAML.parse(beforeContents));
      file.setContents(YAML.stringify(afterContents, { indent }));
      await file.save({ skipFormat: true });
      await next?.();
    })
    .return((self) => self.wrappedHelpers())
    .run();
}

export const update = fnWrapper("update", updateLogic);

const helpers = {};

type Helpers = typeof helpers;
