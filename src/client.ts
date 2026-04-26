export interface DeployArtifacts {
  instance: string
  localVmDir: string
  localVmXmlPath: string
  localDiskPath: string
  localSeedIsoPath: string
  localBaseImagePath: string
  remoteRoot: string
}

export class VmHostApiClient {
  constructor(
    private readonly target: string,
    private readonly dryRun: boolean,
  ) {}

  async ensureVmDirectory(artifacts: DeployArtifacts): Promise<void> {
    logMockApiCall(this.target, "ensureVmDirectory", {
      instance: artifacts.instance,
      remoteRoot: artifacts.remoteRoot,
    }, this.dryRun)
  }

  async vmExists(instance: string): Promise<boolean> {
    logMockApiCall(this.target, "vmExists", { instance }, this.dryRun)
    return false
  }

  async baseImageExists(baseImageName: string, remoteRoot: string): Promise<boolean> {
    logMockApiCall(this.target, "baseImageExists", { baseImageName, remoteRoot }, this.dryRun)
    return false
  }

  async uploadBaseImage(artifacts: DeployArtifacts): Promise<void> {
    logMockApiCall(this.target, "uploadBaseImage", {
      instance: artifacts.instance,
      localBaseImagePath: artifacts.localBaseImagePath,
      remoteRoot: artifacts.remoteRoot,
    }, this.dryRun)
  }

  async uploadVmArtifacts(artifacts: DeployArtifacts): Promise<void> {
    logMockApiCall(this.target, "uploadVmArtifacts", {
      instance: artifacts.instance,
      localVmDir: artifacts.localVmDir,
      localVmXmlPath: artifacts.localVmXmlPath,
      localDiskPath: artifacts.localDiskPath,
      localSeedIsoPath: artifacts.localSeedIsoPath,
    }, this.dryRun)
  }

  async defineAndStartVm(artifacts: DeployArtifacts): Promise<void> {
    logMockApiCall(this.target, "defineAndStartVm", {
      instance: artifacts.instance,
      localVmXmlPath: artifacts.localVmXmlPath,
    }, this.dryRun)
  }

  printDryRunSummary(artifacts: DeployArtifacts): void {
    console.log("Planned deploy API calls:")
    logMockApiCall(this.target, "ensureVmDirectory", {
      instance: artifacts.instance,
      remoteRoot: artifacts.remoteRoot,
    }, true)
    logMockApiCall(this.target, "vmExists", {
      instance: artifacts.instance,
    }, true)
    logMockApiCall(this.target, "baseImageExists", {
      baseImageName: artifacts.localBaseImagePath.split("/").at(-1) ?? artifacts.localBaseImagePath,
      remoteRoot: artifacts.remoteRoot,
    }, true)
    logMockApiCall(this.target, "uploadBaseImage", {
      instance: artifacts.instance,
      localBaseImagePath: artifacts.localBaseImagePath,
      remoteRoot: artifacts.remoteRoot,
    }, true)
    logMockApiCall(this.target, "uploadVmArtifacts", {
      instance: artifacts.instance,
      localVmDir: artifacts.localVmDir,
      localVmXmlPath: artifacts.localVmXmlPath,
      localDiskPath: artifacts.localDiskPath,
      localSeedIsoPath: artifacts.localSeedIsoPath,
    }, true)
    logMockApiCall(this.target, "defineAndStartVm", {
      instance: artifacts.instance,
      localVmXmlPath: artifacts.localVmXmlPath,
    }, true)
  }
}

function logMockApiCall(target: string, action: string, payload: Record<string, string>, dryRun: boolean) {
  const prefix = dryRun ? "[dry-run]" : "[mock-api]"
  console.log(`${prefix} ${target} ${action}`)

  for (const [key, value] of Object.entries(payload)) {
    console.log(`  ${key}: ${value}`)
  }
}
