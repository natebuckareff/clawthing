import { VmInfo } from './vm'
import { ImageInfo } from './image'
import { CreateImageParams } from './create-image'
import { CreateVmParams } from './vm'

export interface Api {
  listVms(): Promise<VmInfo[]>
  listImages(): Promise<ImageInfo[]>
  createVm(params: CreateVmParams): Promise<VmInfo>
  createImage(params: CreateImageParams): Promise<ImageInfo>
}
