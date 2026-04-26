import { mkdir, readFile, readdir, rename, stat, unlink, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageMetadata, ImageRequest } from "./image"

/*
data directory structure:

$DATA_DIR/images/{id}/request.json          # create-image request for active/interrupted downloads
$DATA_DIR/images/{id}/meta.json             # metadata for the completed image
$DATA_DIR/images/{id}/image.qcow2           # downloaded base disk image
$DATA_DIR/images/{id}/image.qcow2.download  # downloaded base disk image
$DATA_DIR/vms/{id}/vm.json                  # config data for the vm
$DATA_DIR/vms/{id}/vm.xml                   # libvirt config file, derived from vm.json
$DATA_DIR/vms/{id}/disk.qcow2               # bootable disk linked to a base image in images
$DATA_DIR/vms/{id}/seed.iso                 # cloud-init seed iso
$DATA_DIR/vms/{id}/network-config           # cloud-init derived from vm.json
$DATA_DIR/vms/{id}/meta-data                # cloud-init derived from vm.json
$DATA_DIR/vms/{id}/user-data                # cloud-init derived from vm.json
*/

export class DataDir {
  private isSetup: boolean

  constructor(public readonly path: string) {
    this.isSetup = false
  }

  async listImages(): Promise<string[]> {
    await this.setup()
    const entries = await readdir(this.imagesPath(), { withFileTypes: true })
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()
  }

  async readImageMetadata(id: string): Promise<ImageMetadata | undefined> {
    await this.setup()
    return this.readJsonFile<ImageMetadata>(this.imageMetadataPath(id))
  }

  async writeImageMetadata(id: string, metadata: ImageMetadata): Promise<void> {
    await this.setup()
    await mkdir(this.imageDirPath(id), { recursive: true })
    await writeFile(this.imageMetadataPath(id), `${JSON.stringify(metadata, null, 2)}\n`)
  }

  async readImageRequest(id: string): Promise<ImageRequest | undefined> {
    await this.setup()
    return this.readJsonFile<ImageRequest>(this.imageRequestPath(id))
  }

  async writeImageRequest(id: string, request: ImageRequest): Promise<void> {
    await this.setup()
    await mkdir(this.imageDirPath(id), { recursive: true })
    await writeFile(this.imageRequestPath(id), `${JSON.stringify(request, null, 2)}\n`)
  }

  async removeImageRequest(id: string): Promise<void> {
    await this.setup()

    try {
      await unlink(this.imageRequestPath(id))
    } catch (error: unknown) {
      const code = typeof error === "object" && error !== null && "code" in error ? (error as { code?: string }).code : undefined
      if (code === "ENOENT") {
        return
      }

      throw error
    }
  }

  async getImageDownloadPath(id: string): Promise<string> {
    await this.setup()
    await mkdir(this.imageDirPath(id), { recursive: true })
    return this.imageDownloadPath(id)
  }

  async getImagePath(id: string): Promise<string> {
    await this.setup()
    await mkdir(this.imageDirPath(id), { recursive: true })
    return this.imagePath(id)
  }

  async hasImageDownload(id: string): Promise<boolean> {
    await this.setup()
    return pathExists(this.imageDownloadPath(id))
  }

  async completeImageDownload(id: string): Promise<string> {
    await this.setup()
    const downloadPath = this.imageDownloadPath(id)
    const imagePath = this.imagePath(id)
    await rename(downloadPath, imagePath)
    return imagePath
  }

  async getVmDirPath(id: string): Promise<string> {
    await this.setup()
    return join(this.vmsPath(), id)
  }

  private async setup(): Promise<void> {
    if (this.isSetup) {
      return
    }

    await mkdir(this.imagesPath(), { recursive: true })
    await mkdir(this.vmsPath(), { recursive: true })
    this.isSetup = true
  }

  private imagesPath(): string {
    return join(this.path, "images")
  }

  private vmsPath(): string {
    return join(this.path, "vms")
  }

  private imageDirPath(id: string): string {
    return join(this.imagesPath(), id)
  }

  private imageRequestPath(id: string): string {
    return join(this.imageDirPath(id), "request.json")
  }

  private imageMetadataPath(id: string): string {
    return join(this.imageDirPath(id), "meta.json")
  }

  private imageDownloadPath(id: string): string {
    return join(this.imageDirPath(id), "image.qcow2.download")
  }

  private imagePath(id: string): string {
    return join(this.imageDirPath(id), "image.qcow2")
  }

  private async readJsonFile<T>(path: string): Promise<T | undefined> {
    try {
      return JSON.parse(await readFile(path, "utf8")) as T
    } catch (error: unknown) {
      const code = typeof error === "object" && error !== null && "code" in error ? (error as { code?: string }).code : undefined
      if (code === "ENOENT") {
        return undefined
      }
      throw error
    }
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? (error as { code?: string }).code : undefined
    if (code === "ENOENT") {
      return false
    }

    throw error
  }
}
