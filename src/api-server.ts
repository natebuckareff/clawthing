import { Api } from "./api"
import { CreateImage, CreateImageParams } from "./create-image"
import { DataDir } from "./data-dir"
import { ImageInfo } from "./image"
import { LoadImage } from "./load-image"
import { VmInfo } from "./vm"

export class ApiServer implements Api {
  private isSetup: boolean
  private readonly dataDir: DataDir
  private readonly vms: VmInfo[]
  private readonly images: Map<string, CreateImage | LoadImage>

  constructor(dataDirPath = "data") {
    this.isSetup = false
    this.dataDir = new DataDir(dataDirPath)
    this.vms = []
    this.images = new Map()
  }

  async listVms(): Promise<VmInfo[]> {
    await this.setup()
    return this.vms
  }

  async listImages(): Promise<ImageInfo[]> {
    await this.setup()

    const images: ImageInfo[] = []
    for (const [id, image] of this.images.entries()) {
      const completed = image instanceof CreateImage ? await image.complete() : undefined
      const resolvedImage = completed ?? image
      if (completed) {
        this.images.set(id, completed)
      }
      images.push(await resolvedImage.getInfo())
    }

    images.sort((a, b) => a.name.localeCompare(b.name))
    return images
  }

  async createImage(params: CreateImageParams): Promise<ImageInfo> {
    await this.setup()

    const createImage = new CreateImage(this.dataDir, params)
    const info = await createImage.getInfo()
    this.images.set(info.id, createImage)
    await createImage.start()
    return createImage.getInfo()
  }

  private async setup(): Promise<void> {
    if (this.isSetup) {
      return
    }

    for (const id of await this.dataDir.listImages()) {
      const loadImage = new LoadImage(this.dataDir, id)
      const activeImage = await loadImage.retryDownload()
      this.images.set(id, activeImage ?? loadImage)
    }

    this.isSetup = true
  }
}
