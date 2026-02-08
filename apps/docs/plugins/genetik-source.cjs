'use strict';

const path = require('path');
const fs = require('fs');

// From apps/docs/plugins, repo root is ../../..
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const packagesDir = path.join(repoRoot, 'packages');

const PACKAGE_SRC_DIRS = [
  path.join(packagesDir, 'schema', 'src'),
  path.join(packagesDir, 'content', 'src'),
  path.join(packagesDir, 'renderer', 'src'),
  path.join(packagesDir, 'renderer-react', 'src'),
];

function isUnderPackageSrc(issuer) {
  if (!issuer) return false;
  const normalized = path.normalize(issuer);
  return PACKAGE_SRC_DIRS.some((dir) => normalized.startsWith(path.normalize(dir)));
}

/**
 * Only try .ts/.tsx when resolving from within our package source (so we don't
 * break webpack internals like webpack/hot/dev-server.js).
 */
class GenetikExtensionResolvePlugin {
  apply(resolver) {
    const target = resolver.ensureHook('resolved');
    const fs = resolver.fileSystem;
    resolver
      .getHook('resolve')
      .tapAsync('GenetikExtensionResolvePlugin', (request, resolveContext, callback) => {
        const issuer = (request.context && request.context.issuer) || (resolveContext && resolveContext.issuer);
        if (!isUnderPackageSrc(issuer)) return callback();

        const req = request.request;
        if (!req || path.isAbsolute(req)) return callback();
        const ext = path.extname(req);
        if (ext !== '.js' && ext !== '.jsx') return callback();

        const tryExts = ext === '.js' ? ['.ts', '.tsx'] : ['.tsx', '.ts'];
        const dir = request.path || (issuer && path.dirname(issuer));
        if (!dir) return callback();
        const base = path.join(dir, req.slice(0, -ext.length));

        let i = 0;
        function tryNext() {
          if (i >= tryExts.length) return callback();
          const p = base + tryExts[i++];
          fs.stat(p, (err, stat) => {
            if (!err && stat && stat.isFile()) {
              const newRequest = { ...request, path: p, request: undefined };
              return resolver.doResolve(target, newRequest, null, resolveContext, callback);
            }
            tryNext();
          });
        }
        tryNext();
      });
  }
}

/**
 * In development: resolve @genetik/* to package source so the docs app
 * compiles them and HMR works when editing packages (no dependency on dist/).
 * In production: use built dist (default resolution).
 */
module.exports = function genetikSourcePlugin() {
  return {
    name: 'genetik-source-alias',
    configureWebpack() {
      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction) return {};

      return {
        resolve: {
          alias: {
            '@genetik/schema': path.join(packagesDir, 'schema', 'src', 'index.ts'),
            '@genetik/content': path.join(packagesDir, 'content', 'src', 'index.ts'),
            '@genetik/renderer': path.join(packagesDir, 'renderer', 'src', 'index.ts'),
            '@genetik/renderer-react': path.join(packagesDir, 'renderer-react', 'src', 'index.ts'),
          },
          plugins: [new GenetikExtensionResolvePlugin()],
        },
      };
    },
  };
};
