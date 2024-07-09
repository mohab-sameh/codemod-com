import type { Api } from "@codemod.com/workflow";
import semver from "semver";

const parsePackageKey = (
  libString: string,
): { name: string; version: string } => {
  const lastAtIndex = libString.lastIndexOf("@");

  if (lastAtIndex === -1) {
    throw new Error(
      'Invalid format. The input string must contain "@" symbol.',
    );
  }

  const name = libString.substring(0, lastAtIndex);
  const version = libString.substring(lastAtIndex + 1);

  return { name, version };
};

const getPackageVersions = async (packageName: string) => {
  try {
    const data = await fetch(`https://registry.npmjs.org/${packageName}`, {
      headers: { Accept: "application/json" },
    });

    if (data.status !== 200) {
      return null;
    }

    return await data.json();
  } catch (error) {
    console.error(`Failed to fetch data for package ${packageName}:`, error);
    return null;
  }
};

const packageVersionsCache = new Map();

const getPackageData = async (packageKey: string) => {
  console.info(`Getting data for ${packageKey}...`);

  const { version, name } = parsePackageKey(packageKey);

  let packageVersions = packageVersionsCache.get(packageKey);

  if (packageVersions === undefined) {
    packageVersions = await getPackageVersions(name);

    packageVersionsCache.set(packageKey, packageVersions);
  }

  if (!packageVersions) {
    return null;
  }

  const versionNames = Object.keys(packageVersions.versions);

  const maxSatisfyingVersion = semver.maxSatisfying(versionNames, version);

  return maxSatisfyingVersion
    ? packageVersions.versions[maxSatisfyingVersion]
    : null;
};

const isStableVersion = (version: string) => !semver.prerelease(version);

const checkCompatibility = (
  packageVersions: any,
  packageVersion: string,
  currentVersion: string,
) => {
  const versions = Object.keys(packageVersions.versions);
  const stableVersions = versions.filter(isStableVersion);
  const compatibleVersions = stableVersions.filter((version) => {
    const dependencies =
      packageVersions.versions[version].peerDependencies || {};
    if (
      dependencies.react &&
      semver.gt(version, currentVersion) &&
      semver.satisfies(packageVersion, dependencies.react)
    ) {
      return true;
    }

    return false;
  });
  return compatibleVersions.length
    ? semver.minSatisfying(compatibleVersions, "*")
    : null;
};

const buildPackageKey = (name: string, version: string) => `${name}@${version}`;

type Package = {
  name: string;
  version: string;
  // dependencies: Record<string, string>;
  // devDependencies: Record<string, string>;
  // peerDependencies: Record<string, string>;
};

type RawPackage = Package;

type Node = {
  package: Package;
  depth: number;
  parent: Set<Node> | null;
  children: Set<Node> | null;
};

function assertFulfilled<T>(
  item: PromiseSettledResult<T>,
): item is PromiseFulfilledResult<T> {
  return item.status === "fulfilled";
}

const buildNode = (node: Package): Node => {
  const { name, version, dependencies, devDependencies, peerDependencies } =
    node;

  return {
    package: {
      name,
      version,
    },
    parent: null,
    children: null,
    depth: 0,
  };
};

const buildNodesTree = async (
  rawPackage: RawPackage,
  depth = 0,
  maxDepth = DEFAULT_MAX_DEPTH,
) => {
  const parentNode = buildNode(rawPackage);

  parentNode.parent = new Set();
  parentNode.children = new Set();

  // @TODO do we need to check other kinds of dependencies?
  const dependencies = parentNode.package.peerDependencies ?? {};

  const dependenciesList = Object.keys(dependencies).map((dependency) =>
    buildPackageKey(dependency, dependencies[dependency] ?? ""),
  );

  const dependencyData = (
    await Promise.allSettled<RawPackage>(dependenciesList.map(getPackageData))
  )
    .filter(assertFulfilled)
    .map(({ value }) => value)
    .filter(Boolean);

  if (depth > maxDepth) {
    return null;
  }

  const nodes = (
    await Promise.allSettled(
      dependencyData.map((pkg) => buildNodesTree(pkg, depth + 1, maxDepth)),
    )
  )
    .filter(assertFulfilled)
    .map(({ value }) => value);

  nodes.filter(Boolean).forEach((node) => {
    node?.parent?.add(parentNode);
    parentNode?.children?.add(node);
  });

  return parentNode;
};

const DEFAULT_MAX_DEPTH = 2;

const getDependencyTree = async (
  packageJSON: any,
  maxDepths = DEFAULT_MAX_DEPTH,
) => {
  const nodes = new Map();

  const { dependencies } = packageJSON;

  const packageKeys = Object.entries(dependencies ?? {}).map(
    ([name, version]) => buildPackageKey(name, version),
  );

  for (const packageKey of packageKeys) {
    const packageData = await getPackageData(packageKey);
    if (!packageData) {
      continue;
    }
    const treeNode = await buildNodesTree(packageData, 0, maxDepths);
    nodes.set(treeNode?.package.name, treeNode);
  }

  return nodes;
};

const getDependentPackages = async (
  dependencyTree: Map<any, any>,
  packageName: string,
) => {
  const dependents = new Set<Node>();

  function traverse(node: Node) {
    if (node.children) {
      for (const child of node.children) {
        if (child.package.name === packageName) {
          dependents.add(node);
        }
        traverse(child);
      }
    }
  }

  for (const node of dependencyTree.values()) {
    traverse(node);
  }

  return dependents;
};

type Options = {
  name: string;
  packageVersion: string;
  repo: string;
  path: string;
  depth: number;
};

type Report = { packages: Record<string, any>; target: any };

const consoleReporter = (report: Report) => {
  const { target, packages } = report;

  for (const [packageKey, packageReport] of Object.entries(packages)) {
    const { minVersion, isCompatible } = packageReport;

    if (minVersion) {
      console.log(
        `Package ${packageKey} supports ${target.name} ${target.version} starting from version ${minVersion}`,
      );
    } else {
      console.log(
        `Package ${packageKey} does not support ${target.name} ${target.version}`,
      );
    }
  }
};

export async function workflow({ git }: Api, options: Options) {
  await git.clone(options.repo, async ({ files }) => {
    // for now we cannot use external dependencies
    await files(`${options.path}/package.json`)
      .json()
      .map<any, any>(async ({ getContents }) => {
        const content = await getContents();

        console.info("Building dependency tree...");
        const dependencyTree = await getDependencyTree(content);
        console.info("Getting dependent packages...");
        const dependentPackages = await getDependentPackages(
          dependencyTree,
          options.name,
        );

        console.info(
          `Dependent packages: ${JSON.stringify(
            [...dependentPackages.values()].map(({ package: pkg }) => pkg),
            null,
            2,
          )}`,
        );

        console.info(`Getting incompatible packages...`);

        const incompatiblePackages = [...dependentPackages.values()]
          .filter(
            (pkg) =>
              !semver.satisfies(options.packageVersion, pkg.package.name),
          )
          .map((pkg) => [pkg.package.name, pkg.package.version]);

        console.info(`Incompatible packages:`, incompatiblePackages);

        const report: Report = {
          target: {
            name: options.name,
            version: options.packageVersion,
          },
          packages: {},
        };

        for (const [packageName, version] of incompatiblePackages) {
          // @TODO hardcoded
          if (
            ["react-dom", "react", "netlify-react-ui"].includes(
              packageName ?? "",
            )
          ) {
            continue;
          }

          const packageKey = buildPackageKey(packageName ?? "", version ?? "");
          console.log(`Analyzing... ${packageKey}`);

          const packageVersions = packageVersionsCache.get(packageKey);

          if (!packageVersions) {
            continue;
          }

          const minVersion = checkCompatibility(
            packageVersions,
            options.packageVersion,
            version ?? "",
          );

          report.packages[packageKey] = {
            isCompatible: false,
            minVersion,
          };
        }

        consoleReporter(report);
      });
  });
}
