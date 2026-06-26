import { redirect } from "next/navigation"
import { getInstallState } from "./service"

export async function requireInstalled() {
  const installState = await getInstallState()

  if (!installState.installed) {
    redirect("/install")
  }
}
