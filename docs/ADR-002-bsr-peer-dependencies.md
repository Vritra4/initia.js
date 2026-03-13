# ADR-002: BSR Packages as Peer Dependencies

## Status

Superseded — Proto packages migrated from BSR `@buf/*` peer dependencies to standard npm `@initia/*` regular dependencies. See `docs/superpowers/plans/2026-03-13-migrate-buf-to-npm-proto.md`.

## Context

The SDK depends on BSR (Buf Schema Registry) packages for Proto message definitions. These packages are versioned in lockstep with chain upgrades, not with SDK code changes.

Previously all BSR packages were declared in `dependencies` with `"latest"`, meaning:
- Every `npm install` could pull a different proto version
- Users had no control over which chain schema version they used
- Any SDK release was implicitly tied to whatever BSR version `latest` resolved to

## Decision

Move BSR packages from `dependencies` to `peerDependencies`, decoupling the SDK release cycle from chain upgrade cycles.

### Required peers

| Package | Reason |
|---------|--------|
| `@buf/cosmos_cosmos-sdk.bufbuild_es` | Base Cosmos TX types |
| `@buf/initia-labs_initia.bufbuild_es` | Initia core messages |

### Optional peers

| Package | Reason |
|---------|--------|
| `@buf/cosmwasm_wasmd.bufbuild_es` | CosmWasm chains only |
| `@buf/initia-labs_minievm.bufbuild_es` | EVM rollups only |
| `@buf/initia-labs_opinit.bufbuild_es` | OPInit bridge only |

### Why `"*"` for BSR version ranges

BSR packages use prerelease-only versions (e.g., `2.11.0-20250927124054-13e1369d5e5a.1`). npm semver range operators like `^2.11.0` do not match prereleases on different `[major.minor.patch]` tuples, making `"*"` the only practical range.

## Consequences

- **SDK version is independent of chain version.** A chain upgrade only requires users to update their BSR packages, not the SDK.
- **SDK only needs a new release** when its own code has breaking changes, or when BSR introduces incompatible proto schema changes (field removal/type change).
- **Users must install BSR packages themselves.** npm will warn on missing required peers. Optional peers are silently skipped.
- **BSR registry setup required.** Users need `npm config set @buf:registry https://buf.build/gen/npm/v1` before installing BSR packages.
