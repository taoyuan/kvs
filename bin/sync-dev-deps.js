#!/usr/bin/env node

/**
 * This is an internal script to synchronize versions of dev-dependencies
 * from monorepo's package.json to individual example packages.
 */
'use strict';

const path = require('path');
const fs = require('fs');

const Project = require('@lerna/project');

async function syncDevDeps() {
  const project = new Project(process.cwd());
  const packages = await project.getPackages();

  const rootPath = project.rootPath;

  // Load dependencies from `packages/eslint-config/package.json`
  const eslintDeps = require(path.join(
    rootPath,
    'packages/eslint-config/package.json',
  )).dependencies;

  const buildDeps = require(path.join(
    rootPath,
    'packages/build/package.json',
  )).dependencies;

  const deps = [
    '@typescript-eslint/eslint-plugin',
    '@typescript-eslint/parser',
    'eslint-config-prettier',
    'eslint-plugin-eslint-plugin',
    'eslint-plugin-mocha',
  ];
  const masterDeps = {};

  masterDeps['eslint'] = buildDeps['eslint'];
  masterDeps['typescript'] = buildDeps['typescript'];

  for (const d of deps) {
    if (eslintDeps[d] == null) {
      console.error(
        'Dependency %s is missing in packages/build/package.json',
        d,
      );
    }
    masterDeps[d] = eslintDeps[d];
  }

  // Update typescript & eslint dependencies in individual packages
  for (const pkg of packages) {
    if (pkg.name === '@loopback/eslint-config') continue;
    const pkgFile = pkg.manifestLocation;
    updatePackageJson(pkgFile, {
      eslint: masterDeps.eslint,
      typescript: masterDeps.typescript,
    });
  }

  // Update dependencies in monorepo root
  const rootPackage = path.join(rootPath, 'package.json');
  updatePackageJson(rootPackage, masterDeps);
}

/**
 * Update package.json with given master dependencies
 * @param pkgFile - Path of `package.json`
 * @param masterDeps - Master dependencies
 */
function updatePackageJson(pkgFile, masterDeps) {
  const data = readPackageJson(pkgFile);
  const isExample = data.name.startsWith('@loopback/example-');
  const isRoot = data.name === 'loopback-next';

  let modified = false;
  for (const dep in masterDeps) {
    if (
      data.devDependencies &&
      // Force update for examples and loopback-next
      (isExample || isRoot || dep in data.devDependencies)
    ) {
      modified = modified || data.devDependencies[dep] !== masterDeps[dep];
      data.devDependencies[dep] = masterDeps[dep];
    }
    if (data.dependencies && dep in data.dependencies) {
      modified = modified || data.dependencies[dep] !== masterDeps[dep];
      data.dependencies[dep] = masterDeps[dep];
    }
  }
  if (!modified) return false;
  writePackageJson(pkgFile, data);
  return true;
}

if (require.main === module) {
  syncDevDeps().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

function readPackageJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writePackageJson(filePath, data) {
  data.dependencies = sortObjectByKeys(data.dependencies);
  data.devDependencies = sortObjectByKeys(data.devDependencies);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log('%s has been updated.', filePath);
}

/**
 * Sort an object by keys
 * @param data - An object to be sorted
 */
function sortObjectByKeys(data) {
  if (data == null) return undefined;
  if (typeof data !== 'object') return data;
  const keys = Object.keys(data).sort();
  const result = {};
  for (const k of keys) {
    result[k] = data[k];
  }
  return result;
}
