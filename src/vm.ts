export interface VmInfo {
  id: string
  name: string
  status: VmStatus
  baseImageName: string
  memory: number
  vcpu: number
}

export type VmStatus = "stopped" | "running"
